import { polkadot_collectives } from "@polkadot-api/descriptors"
import { createClient } from "polkadot-api"
import { getSmProvider } from "polkadot-api/sm-provider"
import { addParachain } from "./client"
import { polkadotChain } from "./polkadot"

export const polkadotCollectivesSpec = import(
  "polkadot-api/chains/polkadot_collectives"
)
export const decodedPolkadotCollectivesSpec = polkadotCollectivesSpec.then(
  (v) => JSON.parse(v.chainSpec),
)

const chain = addParachain(polkadotChain, polkadotCollectivesSpec)
const client = createClient(getSmProvider(chain))

export const polkadotCollectivesApi = client.getTypedApi(polkadot_collectives)
