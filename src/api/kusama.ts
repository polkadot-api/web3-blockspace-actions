import { kusama } from "@polkadot-api/descriptors"
import { createClient } from "polkadot-api"
import { getSmProvider } from "polkadot-api/sm-provider"
import { ChainSpec } from "./chainspec"
import { smoldot } from "./client"

export const kusamaSpec = import("polkadot-api/chains/ksmcc3")
export const decodedKusamaSpec = kusamaSpec.then(
  (v) => JSON.parse(v.chainSpec) as ChainSpec,
)

export const kusamaChain = kusamaSpec.then(smoldot.addChain)
export const kusamaClient = createClient(getSmProvider(kusamaChain))

export const kusamaApi = kusamaClient.getTypedApi(kusama)
