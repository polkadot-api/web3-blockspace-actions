import { rococo } from "@polkadot-api/descriptors"
import { createClient } from "polkadot-api"
import { getSmProvider } from "polkadot-api/sm-provider"
import { ChainSpec } from "./chainspec"
import { smoldot } from "./client"

export const rococoSpec = import("polkadot-api/chains/rococo_v2_2")
export const decodedRococoSpec = rococoSpec.then(
  (v) => JSON.parse(v.chainSpec) as ChainSpec,
)

export const rococoChain = rococoSpec.then(smoldot.addChain)
export const rococoClient = createClient(getSmProvider(rococoChain))

export const rococoApi = rococoClient.getTypedApi(rococo)
