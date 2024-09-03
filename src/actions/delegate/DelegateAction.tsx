import {
  state,
  Subscribe,
  SUSPENSE,
  useStateObservable,
} from "@react-rxjs/core"
import {
  routeChain$,
  routeDelegateAccount$,
  useDelegateContext,
} from "./route-inputs"
import {
  combineLatest,
  concat,
  EMPTY,
  map,
  of,
  startWith,
  switchMap,
} from "rxjs"
import { delegate, getAddressName } from "@/api/delegation"
import { selectedAccount$ } from "@/services/accounts"
import { FeesAndSubmit } from "./FeesAndSubmit"
import {
  ConvictionInput,
  conviction$,
  convictionVotes,
} from "./ChooseConviction"
import { AmountInput, amount$, maxDelegation$ } from "./ChooseAmount"
import { parsedTrack$, SelectTracks } from "./ChooseTracks"
import { Warnings } from "./Warnings"
import { DelegateProvider } from "./route-inputs"

const delegateTx$ = state(
  combineLatest([
    selectedAccount$,
    routeDelegateAccount$,
    conviction$.pipe(map((x) => (x === SUSPENSE ? null : x))),
    amount$.pipe(map((x) => (x === SUSPENSE ? null : x))),
    parsedTrack$,
    maxDelegation$,
  ]).pipe(
    map(
      ([
        selectedAccount,
        delegateAccount,
        conviction,
        amount,
        tracks,
        maxDelegation,
      ]) => {
        return !selectedAccount ||
          !delegateAccount ||
          conviction == null ||
          amount == null
          ? null
          : ([
              selectedAccount.address,
              delegateAccount,
              conviction,
              amount,
              tracks,
              maxDelegation,
            ] as const)
      },
    ),
    switchMap((x) => {
      if (x === null) return of(null)
      const [from, target, conviction, amount, tracks, maxDelegation] = x
      if (tracks.length === 0 || amount === 0n || amount > maxDelegation)
        return of(null)

      return concat(
        of(null),
        delegate(from, target, convictionVotes[conviction], amount, tracks),
      )
    }),
  ),
  null,
)

const Delegate: React.FC = () => {
  const tx = useStateObservable(delegateTx$)
  const selectedAccount = useStateObservable(selectedAccount$)!

  const { decimals, token } = useDelegateContext()

  return (
    <FeesAndSubmit
      txCall={tx}
      account={selectedAccount}
      decimals={decimals}
      ticker={token}
    >
      Delegate
    </FeesAndSubmit>
  )
}

const delegateName$ = routeDelegateAccount$.pipeState(
  switchMap((x) => (x ? getAddressName(x) : EMPTY)),
  startWith(""),
)
delegateName$.subscribe()

export const DelegateAction = () => {
  const chainId = useStateObservable(routeChain$)
  const delegateAccount = useStateObservable(delegateName$)
  return (
    <div className="flex flex-col text-center items-center">
      <h1 className="text-lg my-5 font-semibold">
        Delegate on {chainId} to {delegateAccount}
      </h1>

      <Subscribe fallback={<div>Loading...</div>}>
        <div className="flex flex-col text-left border-[1px] border-gray-200 rounded-lg p-5">
          <DelegateProvider>
            <AmountInput />
            <ConvictionInput />
            <SelectTracks />
            <Warnings />
            <Delegate />
          </DelegateProvider>
        </div>
      </Subscribe>
    </div>
  )
}
