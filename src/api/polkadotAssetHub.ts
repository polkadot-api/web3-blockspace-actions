import { polkadot } from "@polkadot-api/descriptors"
import { createClient } from "polkadot-api"
import { getSmProvider } from "polkadot-api/sm-provider"
import { smoldot } from "./client"

export const polkadotAssetHubSpec = import(
  "polkadot-api/chains/polkadot_asset_hub"
)
export const decodedPolkadotAssetHubSpec = polkadotAssetHubSpec.then((v) =>
  JSON.parse(v.chainSpec),
)

const chain = polkadotAssetHubSpec.then(smoldot.addChain)
const client = createClient(getSmProvider(chain))

export const polkadotAssetHubApi = client.getTypedApi(polkadot)
