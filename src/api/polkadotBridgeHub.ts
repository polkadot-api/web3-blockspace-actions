import { polkadot } from "@polkadot-api/descriptors"
import { createClient } from "polkadot-api"
import { getSmProvider } from "polkadot-api/sm-provider"
import { smoldot } from "./client"

export const polkadotBridgeHubSpec = import(
  "polkadot-api/chains/polkadot_bridge_hub"
)
export const decodedPolkadotBridgeHubSpec = polkadotBridgeHubSpec.then((v) =>
  JSON.parse(v.chainSpec),
)

const chain = polkadotBridgeHubSpec.then(smoldot.addChain)
const client = createClient(getSmProvider(chain))

export const polkadotBridgeHubApi = client.getTypedApi(polkadot)
