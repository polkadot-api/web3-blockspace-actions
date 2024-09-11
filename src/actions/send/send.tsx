import { useState } from "react"
import clsx from "clsx"
import { AccountSelector } from "@/components/AccountSelector.tsx"
import { SupportedTokens } from "@/api/allTokens.ts"
import { truncateString } from "@/utils/string"
import { state, useStateObservable } from "@react-rxjs/core"
import { merge, filter, withLatestFrom, map } from "rxjs"
import { formatCurrencyWithSymbol } from "@/utils/format-currency.ts"
import { ChainSelector } from "./select-chain.tsx"
import { accountsWithSufficientBalance$ } from "./select-chain.tsx"
import SendSummary from "./summary.tsx"
import { InvalidInputs, inputErrors$ } from "./inputs.tsx"
import { senderChainId$ } from "./select-chain.tsx"
import { ArrowRight } from "lucide-react"
import { allTokens } from "@/api/allTokens.ts"
import Submit, { transferStatus$, TransactionStatus } from "./submit-tx.tsx"
import {
  recipient$,
  recipientChainData$,
  token$,
  transferAmount$,
  recipientChainId$,
} from "./inputs.tsx"
import { findRoute } from "./transfers.ts"

// TODO switching an account here will result in wrong value
const selectedRoute$ = state(
  senderChainId$.pipe(
    filter(Boolean),
    withLatestFrom(recipientChainId$, token$),
    map(([from, to, token]) => findRoute(from, to!, token!)),
  ),
  null,
)

state(
  merge(
    senderChainId$,
    accountsWithSufficientBalance$,
    recipient$,
    recipientChainData$,
    token$,
    transferAmount$,
  ),
).subscribe()

export default function SendAction() {
  const recipientChainData = useStateObservable(recipientChainData$)
  const recipient = useStateObservable(recipient$)
  const transferAmount = useStateObservable(transferAmount$)
  const token = useStateObservable(token$)
  const transferStatus = useStateObservable(transferStatus$)
  const inputErrors = useStateObservable(inputErrors$)

  const { decimals } = allTokens[token as SupportedTokens]

  if (inputErrors.length > 0) return <InvalidInputs />

  if (transferStatus?.status === TransactionStatus.Finalized)
    return <SendSummary />
  return (
    <div className="flex flex-col text-center items-center ">
      <h1 className="text-lg my-5 font-semibold">Send Tokens</h1>
      <div className="flex flex-col min-w-[350px] text-left  border-[1px] border-gray-200 rounded-lg p-5 mb-5">
        <h2 className="text-lg font-semibold">Recipient Details</h2>
        <div className="flex flex-row justify-between">
          Amount:{" "}
          <div className="text-right">
            {formatCurrencyWithSymbol(transferAmount, decimals, token!)}
          </div>
        </div>
        <div className="flex flex-row justify-between gap-2">
          Chain: <div className="text-right">{recipientChainData?.name}</div>
        </div>
        <div className="flex flex-row justify-between">
          Recipient:
          <div className="text-right">{truncateString(recipient ?? "")}</div>
        </div>
      </div>
      <div className="flex flex-col min-w-[350px] text-left  border-[1px] border-gray-200 rounded-lg p-5 mb-5">
        <h2 className="text-lg font-semibold mb-2">Sender Details</h2>
        <div className="flex flex-row justify-between">
          Account:
          <AccountSelector />
        </div>
        <ChainSelector decimals={decimals} token={token!} />
      </div>
      <RouteDisplay />
    </div>
  )
}

const RouteDisplay = () => {
  const route = useStateObservable(selectedRoute$)

  const [currentStep] = useState(0)

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
          <li
            key={i}
            className={clsx(
              "p-2",
              i !== currentStep && "opacity-50 pointer-events-none",
            )}
          >
            <h3 className="font-bold flex flex-row justify-center gap-1 items-center mb-2">
              <span>
                Step {i + 1}: {r.from}
              </span>
              <ArrowRight className="h-5" />
              <span>{r.to}</span>
            </h3>
            <Submit />
          </li>
        ))}
      </ol>
    </div>
  )
}
