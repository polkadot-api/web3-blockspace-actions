import * as Progress from "@radix-ui/react-progress"
import { state, useStateObservable, withDefault } from "@react-rxjs/core"
import { map, of, switchMap, withLatestFrom } from "rxjs"
import { submitTransfer$, TransactionStatus, transferStatus$ } from "./send"
import { allChains } from "@/api"
import { twMerge } from "tailwind-merge"
import { senderChainId$ } from "./select-chain"

transferStatus$.subscribe()

const finalizedBlock$ = state(
  senderChainId$.pipe(
    switchMap((chain) =>
      chain ? allChains[chain].client.finalizedBlock$ : of(null),
    ),
  ),
  null,
)

const progress$ = transferStatus$.pipeState(
  withLatestFrom(finalizedBlock$),
  switchMap(([v, finalized]) => {
    if (!v) return [null]

    if (
      v.status === TransactionStatus.BestBlock &&
      "number" in v &&
      v.number &&
      finalized
    ) {
      const start = finalized.number
      const end = v.number
      return finalizedBlock$.pipe(
        map((finalized) => ({
          ok: v.ok,
          value: v.status,
          subProgress: {
            value: finalized!.number - start,
            total: end - start,
          },
        })),
      )
    }

    return [
      {
        ok: v.ok,
        value: v.status,
      },
    ]
  }),
  withDefault(null),
)

const transactionStatusLabel: Record<TransactionStatus, string> = {
  [TransactionStatus.Signing]: "Signing",
  [TransactionStatus.Broadcasted]:
    "Broadcasting complete. Sending to best blocks",
  [TransactionStatus.BestBlock]: "In best block state: ",
  [TransactionStatus.Finalized]: "Transaction completed successfully!",
}

export default function Submit() {
  const selectedChain = useStateObservable(senderChainId$)

  const txProgress = useStateObservable(progress$)
  const isTransacting =
    txProgress && txProgress.value > TransactionStatus.Signing
  const isSigning = !!txProgress && !isTransacting
  const progress =
    (txProgress?.value ?? 0) +
    (txProgress && "subProgress" in txProgress
      ? (50 * txProgress.subProgress.value) / txProgress.subProgress.total
      : 0)

  if (!selectedChain) return null

  return (
    <div className="mb-5">
      {isTransacting ? (
        <>
          <div
            className={twMerge(
              "mb-4 text-pink font-semibold flex flex-col",
              txProgress.ok ? "" : "text-orange-500",
            )}
          >
            <span>{transactionStatusLabel[txProgress.value]}</span>
            {"subProgress" in txProgress
              ? `${txProgress.subProgress.value}/${txProgress.subProgress.total}`
              : null}
          </div>
          <Progress.Root
            value={progress}
            className="bg-pink w-[350px] h-4 relative overflow-hidden rounded-xl"
          >
            <Progress.Indicator
              className="bg-purple-600 w-full h-full"
              style={{
                transition: "transform 660ms cubic-bezier(0.65, 0, 0.35, 1)",
                transform: `translateX(-${100 - progress}%)`,
              }}
            />
          </Progress.Root>
        </>
      ) : (
        <>
          <button
            className={`rounded bg-pink p-2 text-white w-40 ${isSigning ? "opacity-50" : ""}`}
            disabled={isSigning}
            onClick={submitTransfer$}
          >
            {isSigning ? "Sign transaction" : "Send Transaction"}
          </button>
        </>
      )}
    </div>
  )
}
