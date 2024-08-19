import { ChainDefinition, TypedApi } from "polkadot-api"
import { ChainSpec } from "./chainspec"
import { decodedPolkadotSpec, polkadotApi } from "./polkadot"
import {
  decodedPolkadotAssetHubSpec,
  polkadotAssetHubApi,
} from "./polkadotAssetHub"
import {
  decodedPolkadotBridgeHubSpec,
  polkadotBridgeHubApi,
} from "./polkadotBridgeHub"
import {
  decodedPolkadotCollectivesSpec,
  polkadotCollectivesApi,
} from "./polkadotCollectives"
import { decodedPolkadotPeopleSpec, polkadotPeopleApi } from "./polkadotPeople"

export interface Chain<T extends ChainDefinition> {
  chainSpec: Promise<ChainSpec>
  api: TypedApi<T>
}

export const allChains = {
  polkadot: {
    chainSpec: decodedPolkadotSpec,
    api: polkadotApi,
  },
  polkadotAssetHub: {
    chainSpec: decodedPolkadotAssetHubSpec,
    api: polkadotAssetHubApi,
  },
  polkadotBridgeHub: {
    chainSpec: decodedPolkadotBridgeHubSpec,
    api: polkadotBridgeHubApi,
  },
  polkadotCollectives: {
    chainSpec: decodedPolkadotCollectivesSpec,
    api: polkadotCollectivesApi,
  },
  polkadotPeople: {
    chainSpec: decodedPolkadotPeopleSpec,
    api: polkadotPeopleApi,
  },
} satisfies Record<string, Chain<ChainDefinition>>
