import { polkadot_bridge_hub } from "@polkadot-api/descriptors"
import { createClient } from "polkadot-api"
import { getSmProvider } from "polkadot-api/sm-provider"
import { addParachain } from "./client"
import { polkadotChain } from "./polkadot"

export const polkadotBridgeHubSpec = import(
  "polkadot-api/chains/polkadot_bridge_hub"
)
export const decodedPolkadotBridgeHubSpec = polkadotBridgeHubSpec.then((v) =>
  JSON.parse(v.chainSpec),
)

const chain = addParachain(polkadotChain, polkadotBridgeHubSpec)
const client = createClient(getSmProvider(chain))

export const polkadotBridgeHubApi = client.getTypedApi(polkadot_bridge_hub)
