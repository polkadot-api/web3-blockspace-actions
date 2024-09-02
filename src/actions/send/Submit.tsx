import {
  catchError,
  combineLatest,
  map,
  of,
  startWith,
  switchMap,
  withLatestFrom,
  tap,
} from "rxjs"
import { state, useStateObservable, withDefault } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"
import { twMerge } from "tailwind-merge"
import * as Progress from "@radix-ui/react-progress"

import { allChains } from "@/api"
import { ChainId } from "@/api/allChains"
import { selectedAccount$ } from "@/services/accounts"
import { SupportedTokens } from "@/api/allTokens"
import { EmittedType } from "@/utils/observable"
import {
  recipientChainId$,
  token$,
  recipient$,
  transferAmount$,
} from "./inputs"
import { errorToast, successToast } from "./toast"
import { predefinedTransfers } from "./transfers"
import { senderChainId$ } from "./select-chain"

export const [onSubmitted$, submitTransfer$] = createSignal()

const tx$ = state(
  combineLatest([
    recipientChainId$,
    senderChainId$,
    token$,
    recipient$,
    transferAmount$,
  ]).pipe(
    map(([recipientChain, senderChain, token, recipient, transferAmount]) => {
      if (
        !recipientChain ||
        !senderChain ||
        !token ||
        !recipient ||
        !transferAmount
      )
        return null

      const tx =
        predefinedTransfers[senderChain as ChainId][recipientChain as ChainId][
          token.toUpperCase() as SupportedTokens
        ] ?? null

      return tx ? tx(recipient, transferAmount) : null
    }),
  ),
)

export enum TransactionStatus {
  Signing = 5,
  Broadcasted = 25,
  BestBlock = 50,
  Finalized = 100,
}

export const transferStatus$ = state(
  onSubmitted$.pipe(
    withLatestFrom(tx$, selectedAccount$),
    switchMap(([, tx, selectedAccount]) => {
      if (!tx || !selectedAccount) return []

      return tx.signSubmitAndWatch(selectedAccount.polkadotSigner).pipe(
        map((v) => {
          switch (v.type) {
            case "signed":
            case "broadcasted":
              return {
                ok: true,
                status: TransactionStatus.Broadcasted,
              }
            case "txBestBlocksState":
              return {
                ok: v.found && v.ok,
                status: TransactionStatus.BestBlock,
                number: v.found ? v.block.number : null,
              }
            case "finalized":
              if (!v.ok) {
                console.log("dispatchError", v.dispatchError)
                const error =
                  v.dispatchError.type === "Module"
                    ? JSON.stringify(v.dispatchError.value)
                    : v.dispatchError.type
                errorToast("Transaction didn't succeed: " + error)
                return null
              }
              successToast("Transaction succeeded 🎉")
              return {
                ok: true,
                status: TransactionStatus.Finalized,
                txHash: v.txHash,
              }
          }
        }),
        catchError((err) => {
          errorToast("Transaction failed: " + (err.message ?? "Unknown"))

          return of(null)
        }),
        startWith({
          ok: true,
          status: TransactionStatus.Signing,
        }),
      )
    }),
    tap((status) => console.info("Transaction status: ", status)),
  ),
  null,
)

export type Transaction = EmittedType<typeof transferStatus$>

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
