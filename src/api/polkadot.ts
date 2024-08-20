import { polkadot } from "@polkadot-api/descriptors"
import { createClient } from "polkadot-api"
import { getSmProvider } from "polkadot-api/sm-provider"
import { smoldot } from "./client"

export const polkadotSpec = import("polkadot-api/chains/polkadot")
export const decodedPolkadotSpec = polkadotSpec.then((v) =>
  JSON.parse(v.chainSpec),
)

export const polkadotChain = polkadotSpec.then(smoldot.addChain)
const client = createClient(getSmProvider(polkadotChain))

export const polkadotApi = client.getTypedApi(polkadot)
