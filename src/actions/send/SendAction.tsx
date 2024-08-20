import { AccountSelector } from "@/AccountSelector.tsx"
import { ChainId } from "@/api/allChains.ts"
import { SupportedTokens, tokenDecimals } from "@/services/balances.ts"
import { truncateAddress } from "@/utils/address.ts"
import { Field, Label, Radio, RadioGroup } from "@headlessui/react"
import { state, useStateObservable } from "@react-rxjs/core"
import { merge } from "rxjs"
import { formatCurrencyWithSymbol } from "../../utils/format-currency.ts"

import {
  accountsWithSufficientBalance$,
  changeSenderChainId$,
  feeEstimation$,
  recipient$,
  recipientChainData$,
  selectedRoute$,
  senderChainId$,
  token$,
  transferAmount$,
} from "./send"
import Submit from "./Submit"

state(
  merge(
    accountsWithSufficientBalance$,
    recipient$,
    recipientChainData$,
    senderChainId$,
    token$,
    transferAmount$,
  ),
).subscribe()

export default function SendAction() {
  const recipientChainData = useStateObservable(recipientChainData$)
  const transferAmount = useStateObservable(transferAmount$)
  const recipient = useStateObservable(recipient$)
  const token = useStateObservable(token$)

  if (!recipientChainData) return "No valid recipient chain"
  if (!transferAmount) return "Specify Transfer Amount"
  if (!recipient) return "No valid recipient"
  if (!token) return "No valid token"

  const decimals = tokenDecimals[token as SupportedTokens]

  return (
    <div className="flex flex-col text-center items-center ">
      <h1 className="text-lg my-5 font-semibold">Send Tokens</h1>
      <div className="flex flex-col min-w-[350px] text-left  border-[1px] border-gray-200 rounded-lg p-5 mb-5">
        <h2 className="text-lg font-semibold">Recipient Details</h2>
        <div className="flex flex-row justify-between">
          Amount:{" "}
          <div className="text-right">
            {formatCurrencyWithSymbol(transferAmount, decimals, token)}
          </div>
        </div>
        <div className="flex flex-row justify-between gap-2">
          Chain: <div className="text-right">{recipientChainData?.name}</div>
        </div>
        <div className="flex flex-row justify-between">
          Recipient:
          <div className="text-right">{truncateAddress(recipient ?? "")}</div>
        </div>
      </div>
      <div className="flex flex-col min-w-[350px] text-left  border-[1px] border-gray-200 rounded-lg p-5 mb-5">
        <h2 className="text-lg font-semibold">Sender Details</h2>
        <div className="flex flex-row justify-between">
          Account:
          <AccountSelector />
        </div>
        <div className="font-semibold mt-2">Select a chain</div>
        <ChainSelector decimals={decimals} token={token} />
      </div>
      <RouteDisplay />
    </div>
  )
}

const ChainSelector: React.FC<{ decimals: number; token: SupportedTokens }> = ({
  decimals,
  token,
}) => {
  const balances = useStateObservable(accountsWithSufficientBalance$)
  const selectedChain = useStateObservable(senderChainId$)

  if (balances == null) {
    return <div className="max-w-[300px]">Loading balances...</div>
  }

  if (balances.length === 0)
    return (
      <div className="max-w-[300px]">
        The selected address doesn't have suitable accounts with sufficient
        balance.
      </div>
    )
  return (
    <>
      <RadioGroup
        value={selectedChain}
        onChange={(chainId: ChainId) => changeSenderChainId$(chainId)}
        aria-label="Sender chain"
      >
        {balances.map((balance) => (
          <Field key={balance.chain.id} className="flex items-center gap-2">
            <Radio
              value={balance.chain.id}
              className="group flex size-5 items-center justify-center rounded-full border bg-white data-[checked]:bg-blue-400"
            >
              <span className="invisible size-2 rounded-full bg-white group-data-[checked]:visible" />
            </Radio>
            <Label>
              <div className="flex flex-row gap-5 items-start pt-5">
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
            </Label>
          </Field>
        ))}
      </RadioGroup>
    </>
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

const RouteDisplay = () => {
  const route = useStateObservable(selectedRoute$)

  // TODO placeholder
  if (!route) return <Submit />

  if (route.length === 1) {
    return <Submit />
  }

  return (
    <div>
      <p>Sending from the selected chain requires multiple steps.</p>
      <p>Proceed one-by-one:</p>
      <ol>
        {route.map((r, i) => (
          <li key={i} className="p-2">
            <h3 className="font-bold">
              {r.from} ➡️ {r.to}
            </h3>
            <Submit />
          </li>
        ))}
      </ol>
    </div>
  )
}
