import { routeMatch$ } from "@/router"
import { map } from "rxjs"
import { state } from "@react-rxjs/core"
import { parseCurrency } from "../utils/currency"

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
export const token$ = state(
  routeMatch$(PATTERN).pipe(
    map((routeData) => {
      const params = new URLSearchParams(routeData?.params.account)
      return params.get("token")
    }),
  ),
  null,
)

export const recipientChainData$ = state(
  routeMatch$(PATTERN).pipe(
    map((routeData) => {
      return routeData?.params.chain
    }),
  ),
)
