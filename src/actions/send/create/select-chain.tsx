import { combineLatest, map, merge, filter, take } from "rxjs"
import { useStateObservable, state } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"

import { allChains, ChainId } from "@/api"

const chains$ = state(
  combineLatest(
    Object.entries(allChains).map(([id, chain]) =>
      chain.chainSpec.then((spec) => ({ id, name: spec.name })),
    ),
  ).pipe(map((v) => v.filter(Boolean))),
  [],
)

const [chainSelected$, selectChain] = createSignal<ChainId | null>()
export const selectedChain$ = state(
  merge(
    chains$.pipe(
      filter((v) => v.length > 0),
      take(1),
      map((v) => v[0].id as ChainId),
    ),
    chainSelected$,
  ),
  null,
)

export const SelectChain: React.FC = () => {
  const selectedChain = useStateObservable(selectedChain$)
  const chains = useStateObservable(chains$)

  return (
    <label className="flex flex-row justify-between items-center gap-2">
      <span>Chain:</span>
      <select
        className="border p-2 rounded flex-1"
        value={selectedChain ?? ""}
        onChange={(evt) => selectChain(evt.target.value as ChainId)}
      >
        {chains.map((chain) => (
          <option key={chain.id} value={chain.id}>
            {chain.name}
          </option>
        ))}
      </select>
    </label>
  )
}
