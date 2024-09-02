import { map } from "rxjs"
import { useStateObservable, state } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"
import { TokenInput } from "@/components/TokenInput"
import { selectedCurrency$ } from "./select-currency"
import { abs } from "@/utils/bigint"
import { allTokens, SupportedTokens } from "@/api/allTokens"
const [amountChanged$, setAmount] = createSignal<bigint | null>()
export const amount$ = state(
  amountChanged$.pipe(map((amt) => (amt ? abs(amt) : amt))),
  null,
)

export const SelectAmount: React.FC = () => {
  const amount = useStateObservable(amount$)
  const selectedCurrency = useStateObservable(selectedCurrency$)
  const { decimals } = allTokens[selectedCurrency as SupportedTokens]

  return (
    <label className="flex flex-row items-center justify-between gap-2">
      <span>Amount:</span>
      {selectedCurrency ? (
        <TokenInput
          token={{
            name: selectedCurrency,
            decimals,
          }}
          value={amount}
          onChange={setAmount}
        />
      ) : null}
    </label>
  )
}
