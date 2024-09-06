import { state, useStateObservable } from "@react-rxjs/core"
import {
  routeChain$,
  routeDelegateAccount$,
  useDelegateContext,
} from "./DelegateContext"
import { combineLatest, concat, EMPTY, from, map, switchMap, take } from "rxjs"
import { createSignal, switchMapSuspended } from "@react-rxjs/utils"
import { SS58String } from "polkadot-api"
import { selectedAccount$ } from "@/services/accounts"
import { TokenInput } from "@/components/TokenInput"
import { Button } from "@/components/ui/button"
import { formatCurrencyWithSymbol } from "@/utils/format-currency"
import { polkadotApi, Chain } from "@/api"

export const getMaxDelegation = async (from: SS58String, chain: Chain<any>) => {
  const { data: account } = await chain.getSystemAccount(from)
  return account.free + account.reserved
}

export const getOptimalAmount = async (
  account: SS58String,
  at: string = "best",
): Promise<bigint | undefined> =>
  (await polkadotApi.query.Staking.Ledger.getValue(account, { at }))?.active

const [amountInput$, onAmountChange] = createSignal<bigint | null>()

export const optimalAmount$ = state((account: SS58String) =>
  from(getOptimalAmount(account)),
)

export const maxDelegation$ = (chain: Chain<any>) =>
  selectedAccount$.pipeState(
    switchMap((account) =>
      account ? getMaxDelegation(account.address, chain) : EMPTY,
    ),
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

export const AmountInput: React.FC = () => {
  const { chain } = useDelegateContext()
  const amount = useStateObservable(amount$)
  const freeBalance = useStateObservable(maxDelegation$(chain))

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
        <span className="text-destructive">
          {!!amount &&
            amount > freeBalance &&
            `Too high. Maximum is ${formatCurrencyWithSymbol(freeBalance, decimals, token, { nDecimals: 4 })}`}
        </span>
      </div>
    </>
  )
}
