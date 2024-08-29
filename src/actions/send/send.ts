import { ChainId } from "@/api/allChains"
import { selectedAccount$ } from "@/services/accounts"
import { SupportedTokens } from "@/services/balances.ts"
import { state } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"
import {
  catchError,
  combineLatest,
  filter,
  map,
  of,
  startWith,
  switchMap,
  Observable,
  withLatestFrom,
  tap,
} from "rxjs"
import {
  recipientChainId$,
  token$,
  recipient$,
  transferAmount$,
} from "./inputs"
import { errorToast, successToast } from "./toast"
import { findRoute, predefinedTransfers } from "./transfers"
import { senderChainId$ } from "./select-chain"

// TODO switching an account here will result in wrong value
export const selectedRoute$ = state(
  senderChainId$.pipe(
    filter(Boolean),
    withLatestFrom(recipientChainId$, token$),
    map(([from, to, token]) => findRoute(from, to!, token!)),
  ),
  null,
)

export const [onSubmitted$, submitTransfer$] = createSignal()

export const tx$ = state(
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

type EmittedType<T> = T extends Observable<infer U> ? U : never

export type Transaction = EmittedType<typeof transferStatus$>
