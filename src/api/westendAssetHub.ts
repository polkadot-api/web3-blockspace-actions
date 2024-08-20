import { westendAssetHub } from "@polkadot-api/descriptors"
import { createClient } from "polkadot-api"
import { getSmProvider } from "polkadot-api/sm-provider"
import { ChainSpec } from "./chainspec"
import { addParachain } from "./client"
import { westendChain } from "./westend"

export const westendAssetHubSpec = import(
  "polkadot-api/chains/westend2_asset_hub"
)
export const decodedWestendAssetHubSpec = westendAssetHubSpec.then(
  (v) => JSON.parse(v.chainSpec) as ChainSpec,
)

const westendAssetHubChain = addParachain(westendChain, westendAssetHubSpec)
export const westendAssetHubClient = createClient(
  getSmProvider(westendAssetHubChain),
)

export const westendAssetHubApi =
  westendAssetHubClient.getTypedApi(westendAssetHub)
