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
  blockExplorer: String
}

export const allChains = {
  polkadot: {
    chainSpec: decodedPolkadotSpec,
    api: polkadotApi,
    client: polkadotClient,
    blockExplorer: "https://www.subscan.io/",
  },
  polkadotAssetHub: {
    chainSpec: decodedPolkadotAssetHubSpec,
    api: polkadotAssetHubApi,
    client: polkadotAssetHubClient,
    blockExplorer: "https://assethub-polkadot.subscan.io/",
  },
  polkadotBridgeHub: {
    chainSpec: decodedPolkadotBridgeHubSpec,
    api: polkadotBridgeHubApi,
    client: polkadotBridgeHubClient,
    blockExplorer: "https://bridgehub-polkadot.subscan.io/",
  },
  polkadotCollectives: {
    chainSpec: decodedPolkadotCollectivesSpec,
    api: polkadotCollectivesApi,
    client: polkadotCollectivesClient,
    blockExplorer: "https://collectives-polkadot.subscan.io/",
  },
  polkadotPeople: {
    chainSpec: decodedPolkadotPeopleSpec,
    api: polkadotPeopleApi,
    client: polkadotPeopleClient,
    blockExplorer: "https://people-polkadot.subscan.io/",
  },
  rococo: {
    chainSpec: decodedRococoSpec,
    api: rococoApi,
    client: rococoClient,
    blockExplorer: "https://rococo.subscan.io/",
  },
  rococoAssetHub: {
    chainSpec: decodedRococoAssetHubSpec,
    api: rococoAssetHubApi,
    client: rococoAssetHubClient,
    blockExplorer: "https://assethub-rococo.subscan.io/",
  },
  westend: {
    chainSpec: decodedWestendSpec,
    api: westendApi,
    client: westendClient,
    blockExplorer: "https://westend.stg.subscan.io/",
  },
  westendAssetHub: {
    chainSpec: decodedWestendAssetHubSpec,
    api: westendApi,
    client: westendClient,
    blockExplorer: "https://assethub-westend.subscan.io/",
  },
} satisfies Record<string, Chain<ChainDefinition>>

export type ChainId = keyof typeof allChains
export type AllChainApis = (typeof allChains)[ChainId]["api"]
