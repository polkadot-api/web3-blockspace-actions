import { kusamaAssetHub } from "@polkadot-api/descriptors"
import { createClient } from "polkadot-api"
import { getSmProvider } from "polkadot-api/sm-provider"
import { ChainSpec } from "./chainspec"
import { addParachain } from "./client"
import { kusamaChain } from "./kusama"

export const kusamaAssetHubSpec = import("polkadot-api/chains/ksmcc3_asset_hub")
export const decodedKusamaAssetHubSpec = kusamaAssetHubSpec.then(
  (v) => JSON.parse(v.chainSpec) as ChainSpec,
)

const kusamaAssetHubChain = addParachain(kusamaChain, kusamaAssetHubSpec)
export const kusamaAssetHubClient = createClient(
  getSmProvider(kusamaAssetHubChain),
)

export const kusamaAssetHubApi =
  kusamaAssetHubClient.getTypedApi(kusamaAssetHub)
