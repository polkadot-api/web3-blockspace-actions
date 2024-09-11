import { VotingConviction } from "@polkadot-api/descriptors"
import {
  state,
  StateObservable,
  useStateObservable,
  SUSPENSE,
} from "@react-rxjs/core"
import { createSignal, switchMapSuspended } from "@react-rxjs/utils"
import { combineLatest, EMPTY, concat, map, take, defer } from "rxjs"

import {
  routeChain$,
  routeDelegateAccount$,
  useDelegateContext,
} from "./DelegateContext"
import { selectedAccount$ } from "@/services/accounts"
import { optimalAmount$ } from "./ChooseAmount"
import { DelegatableChain } from "@/api"

export const convictionVotes: Array<VotingConviction["type"]> = [
  "None",
  "Locked1x",
  "Locked2x",
  "Locked3x",
  "Locked4x",
  "Locked5x",
  "Locked6x",
]

export const getTimeLocks = async (
  chain: DelegatableChain,
): Promise<string[]> => {
  const [blockTimeSeconds, lockedBlocks] = await Promise.all([
    chain.api.constants.Babe.ExpectedBlockTime() as Promise<bigint>,
    chain.api.constants.ConvictionVoting.VoteLockingPeriod() as Promise<number>,
  ]).then(([milis, locked]) => [Number(milis / 1000n), locked])

  return Array(7)
    .fill(null)
    .map((_, conviction) => {
      if (conviction === 0) return "No lock"
      const hoursToUnlock = Math.ceil(
        (blockTimeSeconds * lockedBlocks * 2 ** (conviction - 1)) / 60 / 60,
      )
      const hoursToPrint = hoursToUnlock % 24
      const daysToPrint = ((hoursToUnlock - hoursToPrint) / 24) % 7
      const weeksToPrint =
        (hoursToUnlock - hoursToPrint - daysToPrint * 24) / 24 / 7
      let returnStr = ""
      let started = false
      if (weeksToPrint) {
        started = true
        returnStr += `${weeksToPrint} week${weeksToPrint > 1 ? "s" : ""}`
      }
      if (daysToPrint) {
        if (started) returnStr += `, `
        else started = true
        returnStr += `${daysToPrint} days`
      }
      if (hoursToPrint) {
        if (started) returnStr += `, `
        else started = true
        returnStr += `${hoursToPrint} hours`
      }
      return returnStr
    })
}

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

export const convictions$ = state((chain: DelegatableChain) =>
  defer(() => getTimeLocks(chain)),
)

export const ConvictionInput: React.FC = () => {
  return (
    <>
      <h2 className="mt-4 font-bold">Conviction: </h2>
      <Convictions />
    </>
  )
}

const Convictions: React.FC = () => {
  const { chain } = useDelegateContext()

  const conviction = useStateObservable(conviction$)
  const convictions = useStateObservable(convictions$(chain))

  return convictions.map((convictionLabel, idx) => (
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
  ))
}
