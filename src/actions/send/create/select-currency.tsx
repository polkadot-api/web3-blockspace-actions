import { map, scan } from "rxjs"
import { state, withDefault, useStateObservable } from "@react-rxjs/core"
import { createSignal, mergeWithKey } from "@react-rxjs/utils"
import { SupportedTokens } from "@/api/allTokens"
import { selectedChain$ } from "./select-chain"
import {} from "@react-rxjs/core"
import { allChains } from "@/api"

const supportedCurrencies$ = selectedChain$.pipeState(
  map((chainId): SupportedTokens[] => {
    const chain = chainId && allChains[chainId]
    const nativeToken = (chain && chain.nativeToken) ?? "DOT"
    const supportedTokens = (chain && chain.supportedTokens) ?? []

    return [nativeToken, ...((chainId ? supportedTokens : null) ?? [])]
  }),
  withDefault([] as SupportedTokens[]),
)
const [currencySelected$, selectCurrency] = createSignal<SupportedTokens>()
export const selectedCurrency$ = state(
  mergeWithKey({
    currencies: supportedCurrencies$,
    selection: currencySelected$,
  }).pipe(
    scan(
      (selected, evt): SupportedTokens =>
        evt.type === "selection"
          ? evt.payload
          : evt.payload.includes(selected)
            ? selected
            : evt.payload[0],
      "" as SupportedTokens,
    ),
  ),
  null,
)

export const SelectCurrency: React.FC = () => {
  const currencies = useStateObservable(supportedCurrencies$)
  const selectedCurrency = useStateObservable(selectedCurrency$)

  return (
    <label className="flex flex-row justify-between items-center gap-2">
      <span>Currency:</span>
      <select
        className="border p-2 rounded flex-1"
        value={selectedCurrency ?? ""}
        onChange={(evt) => selectCurrency(evt.target.value as SupportedTokens)}
        disabled={currencies.length <= 1}
      >
        {currencies.map((currency) => (
          <option key={currency} value={currency}>
            {currency}
          </option>
        ))}
      </select>
    </label>
  )
}
