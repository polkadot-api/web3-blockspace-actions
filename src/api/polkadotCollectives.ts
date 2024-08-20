import { polkadot_collectives } from "@polkadot-api/descriptors"
import { createClient } from "polkadot-api"
import { getSmProvider } from "polkadot-api/sm-provider"
import { ChainSpec } from "./chainspec"
import { addParachain } from "./client"
import { polkadotChain } from "./polkadot"

export const polkadotCollectivesSpec = import(
  "polkadot-api/chains/polkadot_collectives"
)
export const decodedPolkadotCollectivesSpec = polkadotCollectivesSpec.then(
  (v) => JSON.parse(v.chainSpec) as ChainSpec,
)

const chain = addParachain(polkadotChain, polkadotCollectivesSpec)
export const polkadotCollectivesClient = createClient(getSmProvider(chain))

export const polkadotCollectivesApi =
  polkadotCollectivesClient.getTypedApi(polkadot_collectives)
