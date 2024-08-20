import { rococoAssetHub } from "@polkadot-api/descriptors"
import { createClient } from "polkadot-api"
import { getSmProvider } from "polkadot-api/sm-provider"
import { ChainSpec } from "./chainspec"
import { addParachain } from "./client"
import { rococoChain } from "./rococo"

export const rococoAssetHubSpec = import(
  "polkadot-api/chains/rococo_v2_2_asset_hub"
)
export const decodedRococoAssetHubSpec = rococoAssetHubSpec.then(
  (v) => JSON.parse(v.chainSpec) as ChainSpec,
)

const rococoAssetHubChain = addParachain(rococoChain, rococoAssetHubSpec)
const client = createClient(getSmProvider(rococoAssetHubChain))

export const rococoAssetHubApi = client.getTypedApi(rococoAssetHub)
