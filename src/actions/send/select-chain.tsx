import clsx from "clsx"
import { combineLatest, switchMap, materialize, scan, of, map } from "rxjs"
import { useStateObservable, state } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"
import * as RadioGroup from "@radix-ui/react-radio-group"

// Todo: duplicate Chain type in api and in balances
import { SupportedTokens, findBalances$, Chain } from "@/services/balances"
import { selectedAccount$ } from "@/services/accounts"
import { token$, recipientChainId$, transferAmount$ } from "./inputs"
import { formatCurrencyWithSymbol } from "@/utils/format-currency"
import { Fee } from "./fee"
import { isSupportedToken } from "@/services/balances"
import { findRoute } from "./transfers"
import { ChainId } from "@/api"

export const [onChangeSenderChainId$, changeSenderChainId$] =
  createSignal<ChainId>()
export const senderChainId$ = state(onChangeSenderChainId$, "")

export const balances$ = state(
  combineLatest([token$, selectedAccount$, recipientChainId$]).pipe(
    switchMap(([token, account, chainId]) => {
      if (!token || !account || !chainId || !isSupportedToken(token))
        return of([])

      // balances.filter((b) => predefinedTransfers[b.chain.id][chainId][token!]),
      return findBalances$(token as SupportedTokens, account.address).pipe(
        materialize(),
        scan(
          (state, evt) => {
            if (evt.kind === "E") {
              throw evt.error
            }
            if (evt.kind === "C") {
              return state ?? []
            }
            const result = evt.value.filter((b) =>
              findRoute(b.chain.id, chainId, token),
            )
            // More might be coming
            if (!result.length) return null
            return result
          },
          null as
            | {
                transferable: bigint
                chain: Chain
              }[]
            | null,
        ),
      )
    }),
  ),
  null,
)

export const accountsWithSufficientBalance$ = state(
  combineLatest([balances$, transferAmount$]).pipe(
    map(([balances, amount]) => {
      if (balances === null) return null
      if (amount === null) {
        console.warn(
          "Amount not set, can't calculate accounts with sufficent balance",
        )
        return []
      }
      return balances.filter((balance) => balance.transferable > amount)
    }),
  ),
  null,
)

export const ChainSelector: React.FC<{
  decimals: number
  token: SupportedTokens
}> = ({ decimals, token }) => {
  const balances = useStateObservable(accountsWithSufficientBalance$)
  const selectedChain = useStateObservable(senderChainId$)

  if (balances == null) {
    return <div className="max-w-[300px]">Loading balances...</div>
  }

  if (balances.length === 0)
    return (
      <div className="max-w-[300px] text-destructive mt-3 text-sm">
        The selected address doesn't have any suitable accounts with sufficient
        balance. Please choose a different address.
      </div>
    )

  return (
    <div className="mt-5">
      <div className="font-semibold ">Select a chain</div>
      <RadioGroup.Root
        aria-label="Sender chain"
        defaultValue={""}
        onValueChange={changeSenderChainId$}
      >
        <div className="mt-3 space-y-3">
          {balances.map((balance) => (
            <div key={balance.chain.id} className="flex items-center">
              <RadioGroup.Item
                id={balance.chain.id}
                value={balance.chain.id}
                className={clsx(
                  "peer relative w-4 h-4 rounded-full",
                  "border border-transparent text-white",
                  selectedChain === balance.chain.id
                    ? "bg-pink"
                    : "bg-gray-700",
                  "focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800",
                )}
              >
                <RadioGroup.Indicator className="absolute inset-0 flex items-center justify-center leading-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </RadioGroup.Indicator>
              </RadioGroup.Item>
              <label
                htmlFor={balance.chain.id}
                className="flex flex-row justify-between w-full gap-2 pt-5 ml-2  text-sm font-medium text-gray-700 dark:text-gray-400"
              >
                <h3 className="font-semibold">{balance.chain.id}</h3>
                <div className="flex flex-col">
                  <div className="flex flex-row justify-between">
                    <div>Balance: </div>
                    <div className="text-right ml-2">
                      {formatCurrencyWithSymbol(
                        balance.transferable,
                        decimals,
                        token,
                        {
                          nDecimals: 4,
                        },
                      )}
                    </div>
                  </div>
                  <div className="flex flex-row justify-between">
                    <div className="mr-2">Estimated fee:</div>{" "}
                    <Fee
                      chainId={balance.chain.id}
                      decimals={decimals}
                      token={token}
                    />
                  </div>
                </div>
              </label>
            </div>
          ))}
        </div>
      </RadioGroup.Root>
    </div>
  )
}
