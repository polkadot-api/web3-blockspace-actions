import { TransactionStatus, Transaction } from "./send"
import { ChainId } from "@/api"
import { truncateString } from "@/utils/address"
import { SupportedTokens } from "@/services/balances"
import { formatCurrencyWithSymbol } from "@/utils/format-currency"
import { SS58String } from "polkadot-api"
type BlockExplorers = {
  [key in ChainId]: string
}
const blockExplorer: BlockExplorers = {
  polkadot: "https://www.subscan.io/extrinsic/",
  polkadotAssetHub: "",
  polkadotBridgeHub: "",
  polkadotCollectives: "",
  polkadotPeople: "",
  rococo: "",
  rococoAssetHub: "",
  westend: "https://westend.stg.subscan.io/extrinsic/",
  westendAssetHub: "",
}

export default function SendSummary({
  transferAmount,
  decimals,
  currency,
  chainId,
  transferStatus,
  from,
  to,
}: {
  transferAmount: bigint
  decimals: number
  currency: SupportedTokens
  chainId: ChainId
  transferStatus: Transaction
  from: SS58String
  to: SS58String
}) {
  if (
    transferStatus?.status !== TransactionStatus.Finalized ||
    !transferStatus?.ok ||
    !("txHash" in transferStatus)
  )
    return null
  return (
    <div className="flex justify-center">
      <div className="flex flex-col items-center justify-center border-[1px] border-gray-200 rounded-lg p-5 mb-5 w-fit">
        <h1 className="text-lg mb-5 font-semibold">Transaction Details</h1>
        <div>
          <div className="flex flex-row justify-between gap-5">
            <div>Amount:</div>
            <div>
              {formatCurrencyWithSymbol(transferAmount, decimals, currency)}
            </div>
          </div>
          <div className="flex flex-row justify-between gap-5">
            From: <div>{truncateString(from, 8)}</div>
          </div>
          <div className="flex flex-row justify-between gap-5">
            To: <div>{truncateString(to, 8)}</div>
          </div>
          <div className="flex flex-row justify-between gap-5">
            Extrinsic Id:{" "}
            <a
              className="underline text-pink"
              target="_blank"
              href={blockExplorer[chainId as ChainId] + transferStatus.txHash}
            >
              {truncateString(transferStatus.txHash!, 8)}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
