import { SupportedTokens } from "@/services/balances"
import { useStateObservable } from "@react-rxjs/core"
import { accountsWithSufficientBalance$ } from "./send"
import { senderChainId$, changeSenderChainId$, feeEstimation$ } from "./send"
import * as RadioGroup from "@radix-ui/react-radio-group"
import { ChainId } from "@/api"
import { formatCurrencyWithSymbol } from "@/utils/format-currency"
import clsx from "clsx"

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

const Fee: React.FC<{
  chainId: ChainId
  decimals: number
  token: SupportedTokens
}> = ({ chainId, decimals, token }) => {
  const feeEstimation = useStateObservable(feeEstimation$(chainId))
  return (
    <div>
      {formatCurrencyWithSymbol(feeEstimation, decimals, token, {
        nDecimals: 4,
      })}
    </div>
  )
}
