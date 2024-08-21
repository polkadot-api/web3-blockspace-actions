import { getSs58AddressInfo } from "polkadot-api"

export const SUPPORTED_CHAINS = ["polkadot"]

export const isChainValid = (chain: string) => SUPPORTED_CHAINS.includes(chain)

export const isAddressValid = (addr: string) => {
  try {
    return getSs58AddressInfo(addr).isValid
  } catch {
    return false
  }
}
