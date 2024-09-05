import { routeMatch$ } from "@/router"
import { map } from "rxjs"
import { state, useStateObservable } from "@react-rxjs/core"
import { allChains, ChainId } from "@/api"
import { isAddressValid, isChainValid } from "./utils"
import { SS58String } from "polkadot-api"
import { useContext, createContext, PropsWithChildren } from "react"
import { allTokens, SupportedTokens } from "@/api/allTokens"

const PATTERN_CHAIN = "/delegate/:chain/*"
const PATTERN_ACCOUNT = "/delegate/:chain/:account/*"

export const routeChain$ = state(
  routeMatch$(PATTERN_CHAIN).pipe(
    map((routeData) => {
      if (!routeData?.params?.chain || !isChainValid(routeData.params.chain))
        return null
      return routeData.params.chain as ChainId
    }),
  ),
)
routeChain$.subscribe()

export const routeDelegateAccount$ = state(
  routeMatch$(PATTERN_ACCOUNT).pipe(
    map((routeData) => {
      if (
        !routeData?.params?.account ||
        !isAddressValid(routeData.params.account)
      )
        return null
      return routeData.params.account as SS58String
    }),
  ),
)
routeDelegateAccount$.subscribe()

export type DelegateContextType = {
  chainId: ChainId
  delegateAccountId: SS58String
  token: SupportedTokens
  decimals: number
}

export const DelegateContext = createContext<DelegateContextType | null>(null)

export const DelegateProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const chainId = useStateObservable(routeChain$)
  const delegateAccountId = useStateObservable(routeDelegateAccount$)
  const chain = chainId ? allChains[chainId] : null

  return !chainId || !chain || !delegateAccountId ? (
    "Invalid URL parameters. Please check"
  ) : (
    <DelegateContext.Provider
      value={{
        chainId,
        delegateAccountId,
        token: chain.nativeToken,
        decimals: allTokens[chain.nativeToken].decimals,
      }}
    >
      {children}
    </DelegateContext.Provider>
  )
}

export const useDelegateContext = () => useContext(DelegateContext)!
