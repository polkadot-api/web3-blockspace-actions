import { polkadot } from "@polkadot-api/descriptors"
import { createClient } from "polkadot-api"
import { getSmProvider } from "polkadot-api/sm-provider"
import { ChainSpec } from "./chainspec"
import { smoldot } from "./client"

export const polkadotSpec = import("polkadot-api/chains/polkadot")
export const decodedPolkadotSpec = polkadotSpec.then(
  (v) => JSON.parse(v.chainSpec) as ChainSpec,
)

export const polkadotChain = polkadotSpec.then(smoldot.addChain)
export const polkadotClient = createClient(getSmProvider(polkadotChain))

export const polkadotApi = polkadotClient.getTypedApi(polkadot)
