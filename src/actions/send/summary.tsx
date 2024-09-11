import { ChainId } from "@/api"
import { truncateString } from "@/utils/string"
import { allTokens, SupportedTokens } from "@/api/allTokens"
import { formatCurrencyWithSymbol } from "@/utils/format-currency"
import { HexString } from "polkadot-api"
import { allChains } from "@/api"

import { useStateObservable } from "@react-rxjs/core"
import { selectedAccount$ } from "@/services/accounts"
import { transferAmount$, recipient$, token$ } from "./inputs"
import { senderChainId$ } from "./select-chain"
import { TransactionStatus, transferStatus$ } from "./submit-tx"

export default function SendSummary() {
  const transferAmount = useStateObservable(transferAmount$)
  const transferStatus = useStateObservable(transferStatus$)
  const to = useStateObservable(recipient$)
  const token = useStateObservable(token$)
  const from = useStateObservable(selectedAccount$)
  const chainId = useStateObservable(senderChainId$)

  const txHash = transferStatus?.txHash
  const ok = transferStatus?.ok

  const isFinalized =
    transferStatus &&
    transferStatus.status === TransactionStatus.Finalized &&
    !!ok &&
    !!txHash

  if (!isFinalized || !token || !from || !to || !chainId) return null

  return (
    <div className="flex justify-center">
      <div className="flex flex-col items-center justify-center ">
        <h1 className="text-lg my-5 font-semibold">Transaction Details</h1>
        <div className="border-[1px] border-gray-200 rounded-lg p-5 mb-5 min-w-[250px]">
          <div className="flex flex-row justify-between gap-5">
            <div>Amount:</div>
            <div>
              {formatCurrencyWithSymbol(
                transferAmount,
                allTokens[token as SupportedTokens].decimals,
                token,
              )}
            </div>
          </div>
          <div className="flex flex-row justify-between gap-5">
            From: <div>{truncateString(from.address, 8)}</div>
          </div>
          <div className="flex flex-row justify-between gap-5">
            To: <div>{truncateString(to, 8)}</div>
          </div>
          <div className="flex flex-row justify-between gap-5">
            Extrinsic Id:{" "}
            <a
              className="underline text-pink"
              target="_blank"
              href={transactionUrl(chainId, transferStatus.txHash!)}
            >
              {truncateString(transferStatus.txHash!, 8)}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

const transactionUrl = (chainId: ChainId, txHash: HexString | undefined) => {
  return allChains[chainId as ChainId].blockExplorer + "extrinsic/" + txHash
}
