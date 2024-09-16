import { kusamaBridgeHub } from "@polkadot-api/descriptors"
import { createClient } from "polkadot-api"
import { getSmProvider } from "polkadot-api/sm-provider"
import { ChainSpec } from "./chainspec"
import { addParachain } from "./client"
import { kusamaChain } from "./kusama"

export const kusamaBridgeHubSpec = import(
  "polkadot-api/chains/ksmcc3_bridge_hub"
)
export const decodedKusamaBridgeHubSpec = kusamaBridgeHubSpec.then(
  (v) => JSON.parse(v.chainSpec) as ChainSpec,
)
const kusamaBridgeHubChain = addParachain(kusamaChain, kusamaBridgeHubSpec)
export const kusamaBridgeHubClient = createClient(
  getSmProvider(kusamaBridgeHubChain),
)

export const kusamaBridgeHubApi =
  kusamaBridgeHubClient.getTypedApi(kusamaBridgeHub)
