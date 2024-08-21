import {
  state,
  StateObservable,
  Subscribe,
  SUSPENSE,
  useStateObservable,
} from "@react-rxjs/core"
import { routeChain$, routeDelegateAccount$ } from "./delegate"
import {
  combineLatest,
  concat,
  defer,
  EMPTY,
  from,
  map,
  of,
  startWith,
  switchMap,
  take,
} from "rxjs"
import { createSignal, switchMapSuspended } from "@react-rxjs/utils"
import {
  delegate,
  getAddressName,
  getMaxDelegation,
  getOptimalAmount,
  getTimeLocks,
  getTrackInfo,
  getTracks,
} from "@/api/delegation"
import { SS58String } from "polkadot-api"
import { selectedAccount$ } from "@/services/accounts"
import { TokenInput } from "@/components/TokenInput"
import { VotingConviction } from "@polkadot-api/descriptors"
import { MultiSelect } from "@/components/multi-select"
import { FeesAndSubmit } from "./FeesAndSubmit"
import { shortStr } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const [amountInput$, onAmountChange] = createSignal<bigint | null>()

const optimalAmount$ = state((account: SS58String) =>
  from(getOptimalAmount(account)),
)
const amount$ = state(
  combineLatest([routeChain$, routeDelegateAccount$, selectedAccount$]).pipe(
    switchMapSuspended(([, , account]) => {
      if (!account) return EMPTY
      return concat(
        optimalAmount$(account.address).pipe(
          map((optimalAmount) => optimalAmount ?? 0n),
          take(1),
        ),
        amountInput$,
      )
    }),
  ),
)

const maxDelegation$ = selectedAccount$.pipeState(
  switchMap((account) => (account ? getMaxDelegation(account.address) : EMPTY)),
)

const AmountInput: React.FC = () => {
  const amount = useStateObservable(amount$)
  const freeBalance = useStateObservable(maxDelegation$)
  return (
    <>
      <h2 className="font-bold">Amount to delegate:</h2>
      <div>
        <TokenInput
          value={amount}
          onChange={onAmountChange}
          token={{
            name: "DOT",
            decimals: 10,
          }}
        />
        <Button
          onClick={() => {
            onAmountChange(freeBalance)
          }}
        >
          Max
        </Button>
      </div>
    </>
  )
}

const convictionVotes: Array<VotingConviction["type"]> = [
  "None",
  "Locked1x",
  "Locked2x",
  "Locked3x",
  "Locked4x",
  "Locked5x",
  "Locked6x",
]

const [convictionInput$, onConvictionInputChanges] = createSignal<
  0 | 1 | 2 | 3 | 4 | 5 | 6
>()
const conviction$: StateObservable<0 | 1 | 2 | 3 | 4 | 5 | 6 | SUSPENSE> =
  state(
    combineLatest([routeChain$, routeDelegateAccount$, selectedAccount$]).pipe(
      switchMapSuspended(([, , account]) => {
        if (!account) return EMPTY
        return concat(
          optimalAmount$(account.address).pipe(
            map((optimalAmount) => (optimalAmount ? 3 : 0)),
            take(1),
          ),
          convictionInput$,
        )
      }),
    ),
  )

const convictions$ = state(defer(getTimeLocks))
const ConvictionInput: React.FC = () => {
  const convictions = useStateObservable(convictions$)
  const conviction = useStateObservable(conviction$)
  return (
    <>
      <h2 className="mt-4 font-bold">Conviction: </h2>
      {convictions.map((convictionLabel, idx) => (
        <label key={idx}>
          <input
            onChange={(e) => {
              onConvictionInputChanges(parseInt(e.target.value.slice(1)) as 0)
            }}
            checked={conviction === idx}
            type="radio"
            value={"x" + idx}
            name="conviction"
          />
          {idx > 0
            ? ` x${idx} voting power (${convictionLabel} lock)`
            : " x0.1 voting power (no lock)"}
        </label>
      ))}
    </>
  )
}

const tracks$ = state(
  defer(getTracks).pipe(
    map((x) => Object.entries(x).map(([value, label]) => ({ value, label }))),
  ),
)
const [selectedTrackInput$, onChangeSelectedTrack] =
  createSignal<Array<string>>()

const SelectTracks: React.FC = () => {
  const tracks = useStateObservable(tracks$)
  return (
    <>
      <h2 className="mt-4 font-bold">Tracks to delegate:</h2>
      <MultiSelect
        options={tracks}
        onValueChange={onChangeSelectedTrack}
        defaultValue={tracks.map((x) => x.value)}
        placeholder="Select tracks"
        variant="inverted"
        animation={2}
        maxCount={3}
      />
    </>
  )
}

const delegateInput$ = state(
  combineLatest([
    selectedAccount$,
    routeDelegateAccount$,
    conviction$.pipe(map((x) => (x === SUSPENSE ? null : x))),
    amount$.pipe(map((x) => (x === SUSPENSE ? null : x))),
    concat(
      tracks$.pipe(
        map((x) => x.map((y) => y.value)),
        take(1),
      ),
      selectedTrackInput$,
    ).pipe(map((x) => x.map((y) => parseInt(y, 10)))),
  ]).pipe(
    map(([selectedAccount, delegateAccount, conviction, amount, tracks]) => {
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
          ] as const)
    }),
    switchMap((x) => {
      if (x === null) return of(null)
      const [from, target, conviction, amount, tracks] = x
      return concat(
        of(null),
        delegate(from, target, convictionVotes[conviction], amount, tracks),
      )
    }),
  ),
  null,
)

const Delegate: React.FC = () => {
  const tx = useStateObservable(delegateInput$)
  const selectedAccount = useStateObservable(selectedAccount$)!
  return (
    <FeesAndSubmit
      txCall={tx}
      account={selectedAccount}
      decimals={10}
      ticker="DOT"
    >
      Delegate
    </FeesAndSubmit>
  )
}

const warnings$ = selectedAccount$.pipeState(
  switchMap((account) => (account ? getTrackInfo(account.address) : of({}))),
  map((record) => {
    const undelegations: Record<string, number[]> = {}
    const votesRemoved: Array<number> = []
    Object.entries(record).forEach(([trackId, action]) => {
      if (action.type === "Casting") {
        votesRemoved.push(...action.referendums)
      } else {
        const arr = undelegations[action.target] ?? []
        arr.push(Number(trackId))
        undelegations[action.target] = arr
      }
    })

    Object.values(undelegations).forEach((x) => x.sort((a, b) => a - b))
    votesRemoved.sort((a, b) => a - b)

    return { undelegations, votesRemoved }
  }),
)

const Warnings: React.FC = () => {
  const { undelegations, votesRemoved } = useStateObservable(warnings$)
  return (
    <>
      {Object.keys(undelegations).length > 0 || votesRemoved.length > 0 ? (
        <h2 className="mt-4 font-bold">Warnings: </h2>
      ) : null}
      {Object.entries(undelegations).map(([address, tracks]) => (
        <div>
          You will stop delegating to {shortStr(4, address)} on the following
          tracks: {tracks.join(", ")}.
        </div>
      ))}
      {votesRemoved.length > 0 ? (
        <div>
          Your votes on the following referendas will be removed:{" "}
          {votesRemoved.join(", ")}.
        </div>
      ) : null}
    </>
  )
}

const delegateName$ = routeDelegateAccount$.pipeState(
  switchMap((x) => (x ? getAddressName(x) : EMPTY)),
  startWith(""),
)
delegateName$.subscribe()

export const DelegateAction = () => {
  const chainData = useStateObservable(routeChain$)
  const delegateAccount = useStateObservable(delegateName$)
  return (
    <div className="flex flex-col text-center items-center">
      <h1 className="text-lg my-5 font-semibold">
        Delegate on {chainData} to {delegateAccount}
      </h1>
      <div className="flex flex-col text-left  border-[1px] border-gray-200 rounded-lg p-5">
        <Subscribe fallback={<div>Loading...</div>}>
          <AmountInput />
          <ConvictionInput />
          <SelectTracks />
          <Warnings />
          <Delegate />
        </Subscribe>
      </div>
    </div>
  )
}
