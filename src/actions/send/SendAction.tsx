import { AccountSelector } from "@/AccountSelector.tsx"
import { truncateAddress } from "@/utils/address.ts"
import { state, useStateObservable } from "@react-rxjs/core"
import { merge } from "rxjs"
import { formatCurrency } from "../../utils/format-currency.ts"
import { RadioGroup, Field, Radio, Label } from "@headlessui/react"
import {
  accountsWithSufficientBalance$,
  changeSenderChainId$,
  feeEstimation$,
  recipient$,
  recipientChainData$,
  senderChainId$,
  submitTransfer$,
  token$,
  transferAmount$,
  transferStatus$,
} from "./send"
import { ChainId } from "@/api/allChains.ts"

const subscriptions = state(
  merge(
    accountsWithSufficientBalance$,
    recipient$,
    recipientChainData$,
    senderChainId$,
    token$,
    transferAmount$,
    transferStatus$,
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

  return (
    <div className="flex flex-col text-center items-center ">
      <h1 className="text-lg my-5 font-semibold">Send Tokens</h1>
      <div className="flex flex-col min-w-[350px] text-left  border-[1px] border-gray-200 rounded-lg p-5 mb-5">
        <h2 className="text-lg font-semibold">Recipient Details</h2>
        <div className="flex flex-row justify-between">
          Amount:{" "}
          <div className="text-right">
            {formatCurrency(transferAmount, 10)}
            {token}
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
        <div className="font-semibold">Select a chain</div>
        <ChainSelector />
      </div>
      <button
        className="rounded bg-pink-500 p-2 text-white"
        onClick={() => submitTransfer$()}
      >
        Send Transaction
      </button>
    </div>
  )
}

const ChainSelector: React.FC = () => {
  const balances = useStateObservable(accountsWithSufficientBalance$)
  const selectedChain = useStateObservable(senderChainId$)

  if (balances.length === 0)
    return "This account does not have sufficient balance for this transfer."
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
                      {formatCurrency(balance.transferable, 10, {
                        nDecimals: 4,
                      })}
                    </div>
                  </div>
                  <div className="flex flex-row justify-between">
                    <div className="mr-2">Estimated fee:</div>{" "}
                    <Fee chainId={balance.chain.id} />
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

const Fee: React.FC<{ chainId: ChainId }> = ({ chainId }) => {
  const feeEstimation = useStateObservable(feeEstimation$(chainId))
  return <div>{formatCurrency(feeEstimation, 10, { nDecimals: 4 })}</div>
}
