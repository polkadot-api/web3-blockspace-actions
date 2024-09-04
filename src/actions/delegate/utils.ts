import { getSs58AddressInfo } from "polkadot-api"
import { delegateMap } from "./registry"

export const isChainValid = (chainId: string) => chainId in delegateMap

export const isAddressValid = (addr: string) => {
  try {
    return getSs58AddressInfo(addr).isValid
  } catch {
    return false
  }
}
