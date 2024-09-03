import { combineLatest, switchMap, map, catchError, EMPTY } from "rxjs"
import { state, useStateObservable } from "@react-rxjs/core"
import { ChainId } from "@/api"
import { SupportedTokens } from "@/api/allTokens"
import { formatCurrencyWithSymbol } from "@/utils/format-currency"
import {
  recipientChainId$,
  token$,
  recipient$,
  transferAmount$,
} from "./inputs"
import { selectedAccount$ } from "@/services/accounts"
import { findRoute } from "./transfers"
import { errorToast } from "@/utils/toast"

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

export const Fee: React.FC<{
  chainId: ChainId
  decimals: number
  token: SupportedTokens
}> = ({ chainId, decimals, token }) => {
  const feeEstimation = useStateObservable(feeEstimation$(chainId))
  return (
    <div>
      {formatCurrencyWithSymbol(feeEstimation, decimals, token, {
        nDecimals: 4,
      })}
    </div>
  )
}
