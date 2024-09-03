import { VotingConviction } from "@polkadot-api/descriptors"
import {
  state,
  StateObservable,
  useStateObservable,
  SUSPENSE,
} from "@react-rxjs/core"
import { createSignal, switchMapSuspended } from "@react-rxjs/utils"
import { combineLatest, EMPTY, concat, map, take, defer } from "rxjs"

import { routeChain$, routeDelegateAccount$ } from "./DelegateContext"
import { selectedAccount$ } from "@/services/accounts"
import { optimalAmount$ } from "./ChooseAmount"
import { getTimeLocks } from "@/api/delegation"

export const convictionVotes: Array<VotingConviction["type"]> = [
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
export const conviction$: StateObservable<
  0 | 1 | 2 | 3 | 4 | 5 | 6 | SUSPENSE
> = state(
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

export const convictions$ = state(defer(getTimeLocks))

export const ConvictionInput: React.FC = () => {
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
