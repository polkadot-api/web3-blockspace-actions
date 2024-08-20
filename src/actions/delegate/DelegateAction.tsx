import {
  state,
  StateObservable,
  Subscribe,
  SUSPENSE,
  useStateObservable,
} from "@react-rxjs/core"
import { routeChain$, routeDelegateAccount$ } from "./delegate"
import { combineLatest, concat, defer, EMPTY, from, map, take } from "rxjs"
import { createSignal, switchMapSuspended } from "@react-rxjs/utils"
import { getOptimalAmount, getTracks } from "@/api/delegation"
import { SS58String } from "polkadot-api"
import { selectedAccount$ } from "@/services/accounts"
import { TokenInput } from "@/components/TokenInput"
import { VotingConviction } from "@polkadot-api/descriptors"
import { MultiSelect } from "@/components/multi-select"
import { useState } from "react"

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

const AmountInput: React.FC = () => {
  const amount = useStateObservable(amount$)
  return (
    <TokenInput
      value={amount}
      onChange={onAmountChange}
      token={{
        name: "DOT",
        decimals: 10,
      }}
    />
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

const frameworksList = [
  { value: "react", label: "React" },
  { value: "angular", label: "Angular" },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "Svelte" },
  { value: "ember", label: "Ember" },
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

const ConvictionInput: React.FC = () => {
  const conviction = useStateObservable(conviction$)
  return (
    <>
      {Array(7)
        .fill(null)
        .map((_, idx) => (
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
            {idx === 0 ? "None" : "x" + idx}
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

const SelectTracks: React.FC = () => {
  const tracks = useStateObservable(tracks$)
}

export const DelegateAction = () => {
  const chainData = useStateObservable(routeChain$)
  const delegateAccount = useStateObservable(routeDelegateAccount$)
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([
    "react",
    "angular",
  ])

  return (
    <div className="flex flex-col text-center items-center">
      <h1 className="text-lg my-5 font-semibold">Delegate</h1>
      <div className="flex flex-col text-left  border-[1px] border-gray-200 rounded-lg p-5">
        <h2 className="text-lg font-semibold">H2 INFO</h2>
        <div className="flex flex-row justify-between gap-2">
          Chain: <div className="text-right">{chainData ?? "NOT DEFINED"}</div>
        </div>
        <div className="flex flex-row justify-between gap-2">
          Delegate Account:
          <div className="text-right">{delegateAccount ?? "NOT DEFINED"}</div>
        </div>
        <Subscribe fallback={<div>Loading...</div>}>
          <AmountInput />
          <ConvictionInput />
          <MultiSelect
            options={frameworksList}
            onValueChange={setSelectedFrameworks}
            defaultValue={selectedFrameworks}
            placeholder="Select tracks"
            variant="inverted"
            animation={2}
            maxCount={3}
          />
        </Subscribe>
      </div>
    </div>
  )
}
