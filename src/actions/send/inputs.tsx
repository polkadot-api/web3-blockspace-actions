import { combineLatest, map, switchMap, defer } from "rxjs"
import { useStateObservable, state } from "@react-rxjs/core"
import { getSs58AddressInfo } from "polkadot-api"
import { ChainSpec } from "@/api/chainspec"
import { routeMatch$ } from "@/router"
import { allTokens, isSupportedToken } from "@/api/allTokens"
import { SupportedTokens } from "@/api/allTokens"
import { parseCurrency } from "@/utils/currency"
import { allChains, ChainId } from "@/api"

const PATTERN = "/send/:chain/:account"

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

      try {
        let parsedValue = parseCurrency(
          amount,
          allTokens[token.toUpperCase() as SupportedTokens].decimals,
        )
        return parsedValue === null || parsedValue < 0 ? null : parsedValue
      } catch (error) {
        console.error(`Could not parse currency value: ${amount}`)
        return null
      }
    }),
  ),
  null,
)

export const recipientChainId$ = state(
  routeMatch$(PATTERN).pipe(
    map((routeData) => {
      const chainId = routeData?.params.chain

      return !!chainId && chainId in allChains ? (chainId as ChainId) : null
    }),
  ),
  null,
)

export const recipientChainData$ = state(
  recipientChainId$.pipe(
    switchMap((myKey) => {
      if (!myKey) return [null]

      return defer(() =>
        allChains[myKey as keyof typeof allChains].chainSpec.then(
          (spec) => spec as ChainSpec,
        ),
      )
    }),
  ),
  null,
)

export const token$ = state(
  combineLatest([routeMatch$(PATTERN), recipientChainData$]).pipe(
    map(([routeData, chainData]) => {
      const routeToken = routeData?.searchParams.get("token")

      if (!routeToken || !isSupportedToken(routeToken)) {
        return (
          (chainData?.properties.tokenSymbol?.toUpperCase() as SupportedTokens) ??
          null
        )
      }
      return routeToken.toUpperCase() as SupportedTokens
    }),
  ),
  null,
)

enum InputErrors {
  ChainId = "Invalid Chain Id",
  RecipientAddress = "Invalid recipient address",
  InvalidTransferAmount = "Invalid transfer amount",
  Token = "Invalid token identifier",
}

export const inputErrors$ = state(
  combineLatest([recipientChainId$, recipient$, transferAmount$, token$]).pipe(
    map(([recipientChainId, recipient, amount, token]) => {
      const errors = []
      if (!recipientChainId) errors.push(InputErrors.ChainId)
      if (!recipient) errors.push(InputErrors.RecipientAddress)
      if (!token) errors.push(InputErrors.Token)
      else {
        if (!amount) errors.push(InputErrors.InvalidTransferAmount)
      }

      return errors
    }),
  ),
  [],
)

export const InvalidInputs: React.FC = () => {
  const inputValidation = useStateObservable(inputErrors$)

  if (inputValidation.length === 0) return

  return (
    <div className="flex flex-col items-center mt-5">
      <span>Cannot fetch appropriate send transfer due to:</span>
      <ul className="list-disc items-start">
        {inputValidation.map((error) => (
          <li>{error.toString()}</li>
        ))}
      </ul>
    </div>
  )
}
