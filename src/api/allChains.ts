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
import { decodedRococoSpec, rococoApi } from "./rococo"
import { decodedRococoAssetHubSpec, rococoAssetHubApi } from "./rococoAssetHub"
import { decodedWestendSpec, westendApi } from "./westend"
import { decodedWestendAssetHubSpec } from "./westendAssetHub"

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
  rococo: {
    chainSpec: decodedRococoSpec,
    api: rococoApi,
  },
  rococoAssetHub: {
    chainSpec: decodedRococoAssetHubSpec,
    api: rococoAssetHubApi,
  },
  westend: {
    chainSpec: decodedWestendSpec,
    api: westendApi,
  },
  westendAssetHub: {
    chainSpec: decodedWestendAssetHubSpec,
    api: westendApi,
  },
} satisfies Record<string, Chain<ChainDefinition>>

export type ChainId = keyof typeof allChains
export type AllChainApis = (typeof allChains)[ChainId]["api"]
