import { westend } from "@polkadot-api/descriptors"
import { createClient } from "polkadot-api"
import { getSmProvider } from "polkadot-api/sm-provider"
import { ChainSpec } from "./chainspec"
import { smoldot } from "./client"

export const westendSpec = import("polkadot-api/chains/westend2")
export const decodedWestendSpec = westendSpec.then(
  (v) => JSON.parse(v.chainSpec) as ChainSpec,
)

export const westendChain = westendSpec.then(smoldot.addChain)
const client = createClient(getSmProvider(westendChain))

export const westendApi = client.getTypedApi(westend)
