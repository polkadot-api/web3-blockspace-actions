import { polkadot_bridge_hub } from "@polkadot-api/descriptors"
import { createClient } from "polkadot-api"
import { getSmProvider } from "polkadot-api/sm-provider"
import { ChainSpec } from "./chainspec"
import { addParachain } from "./client"
import { polkadotChain } from "./polkadot"

export const polkadotBridgeHubSpec = import(
  "polkadot-api/chains/polkadot_bridge_hub"
)
export const decodedPolkadotBridgeHubSpec = polkadotBridgeHubSpec.then(
  (v) => JSON.parse(v.chainSpec) as ChainSpec,
)

const chain = addParachain(polkadotChain, polkadotBridgeHubSpec)
export const polkadotBridgeHubClient = createClient(getSmProvider(chain))

export const polkadotBridgeHubApi =
  polkadotBridgeHubClient.getTypedApi(polkadot_bridge_hub)
