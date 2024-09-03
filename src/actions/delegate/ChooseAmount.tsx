import { state, useStateObservable } from "@react-rxjs/core"
import {
  routeChain$,
  routeDelegateAccount$,
  useDelegateContext,
} from "./route-inputs"
import { combineLatest, concat, EMPTY, from, map, switchMap, take } from "rxjs"
import { createSignal, switchMapSuspended } from "@react-rxjs/utils"
import { getMaxDelegation, getOptimalAmount } from "@/api/delegation"
import { SS58String } from "polkadot-api"
import { selectedAccount$ } from "@/services/accounts"
import { TokenInput } from "@/components/TokenInput"
import { Button } from "@/components/ui/button"

const [amountInput$, onAmountChange] = createSignal<bigint | null>()

export const optimalAmount$ = state((account: SS58String) =>
  from(getOptimalAmount(account)),
)
export const amount$ = state(
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

export const maxDelegation$ = selectedAccount$.pipeState(
  switchMap((account) => (account ? getMaxDelegation(account.address) : EMPTY)),
)

export const AmountInput: React.FC = () => {
  const amount = useStateObservable(amount$)
  const freeBalance = useStateObservable(maxDelegation$)

  const { decimals, token } = useDelegateContext()
  return (
    <>
      <h2 className="font-bold">Amount to delegate:</h2>
      <div className="flex flex-col gap-2 items-start">
        <TokenInput
          value={amount}
          onChange={onAmountChange}
          token={{
            name: token,
            decimals: decimals,
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
