import { useStateObservable } from "@react-rxjs/core"
import { SS58String } from "polkadot-api"
import {
  recipient$,
  recipientChainData$,
  transferAmount$,
  token$,
} from "./send"
import { formatCurrency } from "../utils/format-currency.ts"

recipientChainData$.subscribe()
transferAmount$.subscribe()
recipient$.subscribe()

export const SendAction = () => {
  const chainData = useStateObservable(recipientChainData$)
  const transferAmount = useStateObservable(transferAmount$)
  const recipient = useStateObservable(recipient$)
  const token = useStateObservable(token$)

  return (
    <div className="flex flex-col text-center items-center ">
      <h1 className="text-lg my-5 font-semibold">Send Tokens</h1>
      <div className="flex flex-col text-left  border-[1px] border-gray-200 rounded-lg p-5">
        <h2 className="text-lg font-semibold">Transfer Information</h2>
        <div className="flex flex-row justify-between">
          Amount:{" "}
          <div className="text-right">
            {formatCurrency(transferAmount, 10)}
            {token?.toUpperCase()}
          </div>
        </div>
        <div className="flex flex-row justify-between gap-2">
          Chain: <div className="text-right">{chainData}</div>
        </div>
        <div className="flex flex-row justify-between">
          Recipient:
          <div className="text-right">{truncateAddress(recipient ?? "")}</div>
        </div>
      </div>
    </div>
  )
}

export const truncateAddress = (address: SS58String) => {
  if (address.length < 6) return address
  return address.slice(0, 3) + "..." + address.slice(address.length - 3)
}
