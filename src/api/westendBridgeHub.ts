console.log("here")
import westendBridgeHub from "@polkadot-api/descriptors"

console.log("Westend brigge hub", westendBridgeHub)
import { ChainSpec } from "./chainspec"
import { addParachain } from "./client"
import { westendChain } from "./westend"
import { createClient } from "polkadot-api"
import { getSmProvider } from "polkadot-api/sm-provider"

const westendBridgeHubSpec = import("polkadot-api/chains/westend2_bridge_hub")
export const decodedWestendBridgeHubSpec = westendBridgeHubSpec.then(
  (v) => JSON.parse(v.chainSpec) as ChainSpec,
)

const westendBridgeHubChain = addParachain(westendChain, westendBridgeHubSpec)
export const westendBridgeHubClient = createClient(
  getSmProvider(westendBridgeHubChain),
)

export const westendBridgeHubApi = westendBridgeHubClient.getTypedApi(
  westendBridgeHub.westendBridgeHub,
)
