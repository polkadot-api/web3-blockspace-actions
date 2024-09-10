import clsx from "clsx"
import { PropsWithChildren, useEffect } from "react"
import { combineLatest, switchMap, materialize, scan, of, map } from "rxjs"
import { useStateObservable, state } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"
import { CheckCircleIcon } from "lucide-react"

import { ChainId, Chain } from "@/api"
import { SupportedTokens, isSupportedToken } from "@/api/allTokens"
import { selectedAccount$ } from "@/services/accounts"
import { findBalances$ } from "@/services/balances"
import { formatCurrencyWithSymbol } from "@/utils/format-currency"
import { token$, recipientChainId$, transferAmount$ } from "./inputs"
import { Fee } from "./fee"
import { findRoute } from "./transfers"
import { ChainDefinition } from "polkadot-api"

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
                chain: Chain<ChainDefinition>
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

export const [onChangeSenderChainId$, changeSenderChainId$] =
  createSignal<ChainId>()
export const senderChainId$ = state(onChangeSenderChainId$, "")

export const ChainSelector: React.FC<{
  decimals: number
  token: SupportedTokens
}> = ({ decimals, token }) => {
  const balances = useStateObservable(accountsWithSufficientBalance$)
  const selectedChain = useStateObservable(senderChainId$)

  useEffect(() => {
    if (balances && balances.length > 0)
      changeSenderChainId$(balances[0].chain.id)
  }, [balances])

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

      <div className="flex flex-col gap-1 mt-3">
        {balances.map((balance, i) => {
          return (
            <SelectableCard
              key={i}
              val={balance.chain.id}
              onSelected={changeSenderChainId$}
              isSelected={balance.chain.id === selectedChain}
              disabled={balances.length === 1}
            >
              <div className="flex flex-row justify-between w-full gap-2  text-sm font-medium">
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
              </div>
            </SelectableCard>
          )
        })}
      </div>
    </div>
  )
}

const SelectableCard: React.FC<
  PropsWithChildren<{
    val: ChainId
    onSelected: (val: ChainId) => void
    isSelected: boolean
    disabled: boolean
  }>
> = ({ val, onSelected, isSelected, children, disabled }) => {
  return (
    <button
      className={clsx(
        "flex flex-row items-center",
        "py-1 px-2 text-gray-700",
        "border border-1 rounded-lg",
        isSelected ? "border-pink border-1" : "border-gray-700",
        disabled ? "" : "hover:bg-gray-100",
      )}
      disabled={disabled}
      value={val}
      onClick={(evt) => {
        evt.preventDefault()
        onSelected(val)
      }}
    >
      {children}
      <div className="ml-3 w-6">
        {isSelected && <CheckCircleIcon className="text-pink w-5 h-5" />}
      </div>
    </button>
  )
}
