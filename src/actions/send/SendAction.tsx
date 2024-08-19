import { useStateObservable } from "@react-rxjs/core"
import { SS58String } from "polkadot-api"
import {
  recipient$,
  recipientChainData$,
  transferAmount$,
  token$,
} from "./send"
import { formatCurrency } from "../../utils/format-currency.ts"
import Void from "../void.tsx"
import { selectedAccount$ } from "@/services/accounts.ts"
import { AccountSelector } from "@/AccountSelector.tsx"

recipientChainData$.subscribe()
transferAmount$.subscribe()
recipient$.subscribe()
token$.subscribe()

export const SendAction = () => {
  const chainData = useStateObservable(recipientChainData$)
  const transferAmount = useStateObservable(transferAmount$)
  const recipient = useStateObservable(recipient$)
  const token = useStateObservable(token$)

  if (!chainData || !transferAmount || !recipient) return <Void />

  return (
    <div className="flex flex-col text-center items-center ">
      <h1 className="text-lg my-5 font-semibold">Send Tokens</h1>
      <div className="flex flex-col min-w-[350px] text-left  border-[1px] border-gray-200 rounded-lg p-5 mb-5">
        <h2 className="text-lg font-semibold">Recipient Details</h2>
        <div className="flex flex-row justify-between">
          Amount:{" "}
          <div className="text-right">
            {formatCurrency(transferAmount, 10)}
            {token?.toUpperCase()}
          </div>
        </div>
        <div className="flex flex-row justify-between gap-2">
          Chain: <div className="text-right">{chainData?.name}</div>
        </div>
        <div className="flex flex-row justify-between">
          Recipient:
          <div className="text-right">{truncateAddress(recipient ?? "")}</div>
        </div>
      </div>
      <div className="flex flex-col min-w-[350px] text-left  border-[1px] border-gray-200 rounded-lg p-5 mb-5">
        <h2 className="text-lg font-semibold">Sender Details</h2>
        <div className="flex flex-row justify-between">
          Sender account:
          <AccountSelector />
        </div>
      </div>
    </div>
  )
}

export const truncateAddress = (address: SS58String) => {
  if (address.length < 6) return address
  return address.slice(0, 4) + "..." + address.slice(address.length - 4)
}
