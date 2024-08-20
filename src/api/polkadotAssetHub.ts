import { polkadot_asset_hub } from "@polkadot-api/descriptors"
import { createClient } from "polkadot-api"
import { getSmProvider } from "polkadot-api/sm-provider"
import { addParachain } from "./client"
import { polkadotChain } from "./polkadot"

export const polkadotAssetHubSpec = import(
  "polkadot-api/chains/polkadot_asset_hub"
)
export const decodedPolkadotAssetHubSpec = polkadotAssetHubSpec.then((v) =>
  JSON.parse(v.chainSpec),
)

const chain = addParachain(polkadotChain, polkadotAssetHubSpec)
const client = createClient(getSmProvider(chain))

export const polkadotAssetHubApi = client.getTypedApi(polkadot_asset_hub)
