import { allChains } from "@/api/allChains"
import { ChainSpec } from "@/api/chainspec"
import { routeMatch$ } from "@/router"
import { selectedAccount$ } from "@/services/accounts"
import {
  findBalances$,
  isSupportedToken,
  SupportedTokens,
} from "@/services/balances.ts"
import { parseCurrency } from "@/utils/currency"
import { state } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"
import { combineLatest, defer, map, of, switchMap, withLatestFrom } from "rxjs"
import { ChainId } from "@/api/allChains"
import { predefinedTransfers } from "./transfers"

const PATTERN = "/send/:chain/:account"

// todo: fetch per token
const DECIMALS = 10

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
      // todo: validate address is valid SS58 string
      return routeData?.params.account?.split("&")[0] ?? null
    }),
  ),
  null,
)

export const transferAmount$ = state(
  routeMatch$(PATTERN).pipe(
    map((routeData) => {
      const params = new URLSearchParams(routeData?.params.account)
      const amount = params.get("amount")

      if (amount === null) return null
      return parseCurrency(amount, DECIMALS)
    }),
  ),
  null,
)

export const recipientChainData$ = state(
  routeMatch$(PATTERN).pipe(
    switchMap((routeData) => {
      const myKey = routeData?.params.chain
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
      const params = new URLSearchParams(routeData?.params.account)
      const str =
        params.get("token") ?? chainData?.properties.tokenSymbol ?? null
      return str?.toUpperCase() ?? null
    }),
  ),
  null,
)

export const balances$ = state(
  combineLatest([token$, selectedAccount$]).pipe(
    switchMap(([token, account]) => {
      if (!token || !account || !isSupportedToken(token)) return of([])

      return findBalances$(token as SupportedTokens, account.address)
    }),
  ),
)

export const accountsWithSufficientBalance$ = state(
  combineLatest([balances$, transferAmount$]).pipe(
    map(([balances, amount]) => {
      if (amount === null) return []
      return balances.filter((balance) => balance.transferable > amount)
    }),
  ),
)

export const [onChangeSenderChainId$, changeSenderChainId$] =
  createSignal<ChainId>()
export const senderChainId$ = state(onChangeSenderChainId$, "")

export const [onSubmitted$, submitTransfer$] = createSignal()

export const transferStatus$ = state(
  onSubmitted$.pipe(
    withLatestFrom(
      recipient$,
      transferAmount$,
      recipientChainData$,
      token$,
      senderChainId$,
      selectedAccount$,
    ),
    switchMap(
      ([
        ,
        recipient,
        transferAmount,
        recipientChain,
        token,
        senderChain,
        selectedAccount,
      ]) => {
        if (
          !recipientChain ||
          !recipient ||
          !token ||
          !transferAmount ||
          !selectedAccount
        )
          return [null]

        const tx =
          predefinedTransfers[senderChain as ChainId][
            recipientChain.id as ChainId
          ][token.toUpperCase() as SupportedTokens]

        if (!tx) return of(null)
        return tx(recipient, transferAmount).signSubmitAndWatch(
          selectedAccount.polkadotSigner,
        )
      },
    ),
  ),
)
