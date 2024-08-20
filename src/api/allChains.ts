import { ChainDefinition, PolkadotClient, TypedApi } from "polkadot-api"
import { ChainSpec } from "./chainspec"
import { decodedPolkadotSpec, polkadotApi, polkadotClient } from "./polkadot"
import {
  decodedPolkadotAssetHubSpec,
  polkadotAssetHubApi,
  polkadotAssetHubClient,
} from "./polkadotAssetHub"
import {
  decodedPolkadotBridgeHubSpec,
  polkadotBridgeHubApi,
  polkadotBridgeHubClient,
} from "./polkadotBridgeHub"
import {
  decodedPolkadotCollectivesSpec,
  polkadotCollectivesApi,
  polkadotCollectivesClient,
} from "./polkadotCollectives"
import {
  decodedPolkadotPeopleSpec,
  polkadotPeopleApi,
  polkadotPeopleClient,
} from "./polkadotPeople"
import { decodedRococoSpec, rococoApi, rococoClient } from "./rococo"
import {
  decodedRococoAssetHubSpec,
  rococoAssetHubApi,
  rococoAssetHubClient,
} from "./rococoAssetHub"
import { decodedWestendSpec, westendApi, westendClient } from "./westend"
import { decodedWestendAssetHubSpec } from "./westendAssetHub"

export interface Chain<T extends ChainDefinition> {
  chainSpec: Promise<ChainSpec>
  api: TypedApi<T>
  client: PolkadotClient
}

export const allChains = {
  polkadot: {
    chainSpec: decodedPolkadotSpec,
    api: polkadotApi,
    client: polkadotClient,
  },
  polkadotAssetHub: {
    chainSpec: decodedPolkadotAssetHubSpec,
    api: polkadotAssetHubApi,
    client: polkadotAssetHubClient,
  },
  polkadotBridgeHub: {
    chainSpec: decodedPolkadotBridgeHubSpec,
    api: polkadotBridgeHubApi,
    client: polkadotBridgeHubClient,
  },
  polkadotCollectives: {
    chainSpec: decodedPolkadotCollectivesSpec,
    api: polkadotCollectivesApi,
    client: polkadotCollectivesClient,
  },
  polkadotPeople: {
    chainSpec: decodedPolkadotPeopleSpec,
    api: polkadotPeopleApi,
    client: polkadotPeopleClient,
  },
  rococo: {
    chainSpec: decodedRococoSpec,
    api: rococoApi,
    client: rococoClient,
  },
  rococoAssetHub: {
    chainSpec: decodedRococoAssetHubSpec,
    api: rococoAssetHubApi,
    client: rococoAssetHubClient,
  },
  westend: {
    chainSpec: decodedWestendSpec,
    api: westendApi,
    client: westendClient,
  },
  westendAssetHub: {
    chainSpec: decodedWestendAssetHubSpec,
    api: westendApi,
    client: westendClient,
  },
} satisfies Record<string, Chain<ChainDefinition>>

export type ChainId = keyof typeof allChains
export type AllChainApis = (typeof allChains)[ChainId]["api"]
