import { allChains, ChainId } from "@/api/allChains"
import { ChainSpec } from "@/api/chainspec"
import { routeMatch$ } from "@/router"
import { selectedAccount$ } from "@/services/accounts"
import {
  Chain,
  findBalances$,
  isSupportedToken,
  SupportedTokens,
  tokenDecimals,
} from "@/services/balances.ts"
import { parseCurrency } from "@/utils/currency"
import { state } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"
import {
  catchError,
  combineLatest,
  defer,
  EMPTY,
  filter,
  map,
  materialize,
  of,
  scan,
  startWith,
  switchMap,
  withLatestFrom,
} from "rxjs"
import { findRoute, predefinedTransfers } from "./transfers"
import { toast } from "react-toastify"

const PATTERN = "/send/:chain/:account"

export const accountRoute$ = state(
  routeMatch$(PATTERN).pipe(
    map((routeData) => {
      if (!routeData || !routeData.params) return null

      const params = new URLSearchParams(routeData.params.account)

      return {
        amount: params.get("amount"),
        token: params.get("token"),
        chain: routeData.params.chain,
        recipient: routeData.params.account?.split("&")[0],
      }
    }),
  ),
)

export const recipient$ = state(
  routeMatch$(PATTERN).pipe(
    map((routeData) => {
      const address = routeData?.params.account?.split("&")[0]

      if (!address || !getSs58AddressInfo(address).isValid) return null

      return address
    }),
  ),
  null,
)

export const transferAmount$ = state(
  routeMatch$(PATTERN).pipe(
    map((routeData) => {
      const amount = routeData?.searchParams.get("amount")
      const token = routeData?.searchParams.get(
        "token",
      ) as SupportedTokens | null

      if (amount == null || token == null) return null
      return parseCurrency(
        amount,
        tokenDecimals[token.toUpperCase() as SupportedTokens],
      )
    }),
  ),
  null,
)

const recipientChainId$ = routeMatch$(PATTERN).pipe(
  map((routeData) => routeData?.params.chain as ChainId | undefined),
)

export const recipientChainData$ = state(
  recipientChainId$.pipe(
    switchMap((myKey) => {
      if (!myKey || !(myKey in allChains)) return [null]

      return defer(() =>
        allChains[myKey as keyof typeof allChains].chainSpec.then(
          (spec) => spec as ChainSpec,
        ),
      )
    }),
  ),
)

export const token$ = state(
  combineLatest([routeMatch$(PATTERN), recipientChainData$]).pipe(
    map(([routeData, chainData]) => {
      const str =
        routeData?.searchParams.get("token") ??
        chainData?.properties.tokenSymbol ??
        null

      return (str?.toUpperCase() as SupportedTokens) ?? null
    }),
  ),
  null,
)

export const balances$ = state(
  combineLatest([token$, selectedAccount$, recipientChainId$]).pipe(
    switchMap(([token, account, chainId]) => {
      if (!token || !account || !chainId || !isSupportedToken(token))
        return of([])

      // balances.filter((b) => predefinedTransfers[b.chain.id][chainId][token!]),
      return findBalances$(token as SupportedTokens, account.address).pipe(
        materialize(),
        scan(
          (state, evt) => {
            if (evt.kind === "E") {
              throw evt.error
            }
            if (evt.kind === "C") {
              return state ?? []
            }
            const result = evt.value.filter((b) =>
              findRoute(b.chain.id, chainId, token),
            )
            // More might be coming
            if (!result.length) return null
            return result
          },
          null as
            | {
                transferable: bigint
                chain: Chain
              }[]
            | null,
        ),
      )
    }),
  ),
  null,
)

export const accountsWithSufficientBalance$ = state(
  combineLatest([balances$, transferAmount$]).pipe(
    map(([balances, amount]) => {
      if (balances === null) return null
      if (amount === null) {
        console.warn(
          "Amount not set, can't calculate accounts with sufficent balance",
        )
        return []
      }
      return balances.filter((balance) => balance.transferable > amount)
    }),
  ),
  null,
)

export const [onChangeSenderChainId$, changeSenderChainId$] =
  createSignal<ChainId>()
export const senderChainId$ = state(onChangeSenderChainId$, "")

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

export const feeEstimation$ = state(
  (senderChain: ChainId) =>
    combineLatest([
      recipientChainId$,
      token$,
      recipient$,
      transferAmount$,
      selectedAccount$,
    ]).pipe(
      switchMap(
        ([
          recipientChain,
          token,
          recipient,
          transferAmount,
          selectedAccount,
        ]) => {
          if (
            !recipientChain ||
            !token ||
            !recipient ||
            !transferAmount ||
            !selectedAccount
          )
            return [null]

          const route = findRoute(
            senderChain,
            recipientChain,
            token.toUpperCase() as SupportedTokens,
          )

          return route
            ? combineLatest(
                route.map((r) =>
                  r
                    .tx(recipient, transferAmount)
                    .getEstimatedFees(selectedAccount.address),
                ),
              ).pipe(
                map((v) => v.reduce((a, b) => a + b, 0n)),
                catchError((e) => {
                  console.error(e)
                  errorToast("Error when getting estimated fees: " + e.message)
                  return EMPTY
                }),
              )
            : [null]
        },
      ),
    ),
  null,
)

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

const errorToast = (error: string) =>
  toast(error, {
    type: "error",
  })

const successToast = (message: string) =>
  toast(message, {
    type: "success",
  })

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
  ),
  null,
)

import { Observable } from "rxjs"
import { getSs58AddressInfo } from "polkadot-api"

type EmittedType<T> = T extends Observable<infer U> ? U : never

export type Transaction = EmittedType<typeof transferStatus$>
