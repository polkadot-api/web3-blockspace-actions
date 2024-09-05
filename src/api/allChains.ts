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
import {
  decodedWestendAssetHubSpec,
  westendAssetHubApi,
  westendAssetHubClient,
} from "./westendAssetHub"
import {
  decodedWestendBridgeHubSpec,
  westendBridgeHubApi,
  westendBridgeHubClient,
} from "./westendBridgeHub"
import { SupportedTokens } from "./allTokens"
import { decodedKusamaSpec, kusamaApi, kusamaClient } from "./kusama"
import { SS58String } from "polkadot-api"

export const assetHubTokenIds = {
  USDC: 1_337,
  USDT: 1_984,
}

type GetAccountResult = ReturnType<
  typeof polkadotApi.query.System.Account.getValue
>

export interface Chain<T extends ChainDefinition> {
  chainSpec: Promise<ChainSpec>
  nativeToken: SupportedTokens
  supportedTokens: SupportedTokens[]
  getSystemAccount: (address: string) => GetAccountResult
  getED: () => Promise<bigint>
  getAssetBalance?: (
    asset: "USDT" | "USDC",
    address: string,
  ) => Promise<{ balance: bigint } | null>
  api: TypedApi<T>
  client: PolkadotClient
  blockExplorer: String
}

export type ChainId =
  | "polkadot"
  | "polkadotAssetHub"
  | "polkadotBridgeHub"
  | "polkadotCollectives"
  | "polkadotPeople"
  | "rococo"
  | "rococoAssetHub"
  | "westend"
  | "westendAssetHub"
  | "westendBridgeHub"
  | "kusama"

export const allChains = {
  polkadot: {
    nativeToken: "DOT",
    supportedTokens: [],
    getSystemAccount: polkadotApi.query.System.Account.getValue,
    getED: polkadotApi.constants.Balances.ExistentialDeposit,
    chainSpec: decodedPolkadotSpec,
    api: polkadotApi,
    client: polkadotClient,
    blockExplorer: "https://polkadot.subscan.io/",
  },
  polkadotAssetHub: {
    nativeToken: "DOT",
    supportedTokens: ["USDC", "USDT"],
    getSystemAccount: polkadotAssetHubApi.query.System.Account.getValue,
    getED: polkadotAssetHubApi.constants.Balances.ExistentialDeposit,
    getAssetBalance: async (asset: "USDC" | "USDT", addr: SS58String) => {
      const res = await polkadotAssetHubApi.query.Assets.Account.getValue(
        assetHubTokenIds[asset],
        addr,
      )
      return res?.status.type !== "Liquid" ? null : res
    },
    chainSpec: decodedPolkadotAssetHubSpec,
    api: polkadotAssetHubApi,
    client: polkadotAssetHubClient,
    blockExplorer: "https://assethub-polkadot.subscan.io/",
  },
  polkadotBridgeHub: {
    nativeToken: "DOT",
    supportedTokens: [],
    getSystemAccount: polkadotBridgeHubApi.query.System.Account.getValue,
    getED: polkadotBridgeHubApi.constants.Balances.ExistentialDeposit,
    chainSpec: decodedPolkadotBridgeHubSpec,
    api: polkadotBridgeHubApi,
    client: polkadotBridgeHubClient,
    blockExplorer: "https://bridgehub-polkadot.subscan.io/",
  },
  polkadotCollectives: {
    nativeToken: "DOT",
    supportedTokens: [],
    getSystemAccount: polkadotCollectivesApi.query.System.Account.getValue,
    getED: polkadotCollectivesApi.constants.Balances.ExistentialDeposit,
    chainSpec: decodedPolkadotCollectivesSpec,
    api: polkadotCollectivesApi,
    client: polkadotCollectivesClient,
    blockExplorer: "https://collectives-polkadot.subscan.io/",
  },
  polkadotPeople: {
    nativeToken: "DOT",
    supportedTokens: [],
    getSystemAccount: polkadotPeopleApi.query.System.Account.getValue,
    getED: polkadotPeopleApi.constants.Balances.ExistentialDeposit,
    chainSpec: decodedPolkadotPeopleSpec,
    api: polkadotPeopleApi,
    client: polkadotPeopleClient,
    blockExplorer: "https://people-polkadot.subscan.io/",
  },
  rococo: {
    nativeToken: "ROC",
    supportedTokens: [],
    getSystemAccount: rococoApi.query.System.Account.getValue,
    getED: rococoApi.constants.Balances.ExistentialDeposit,
    chainSpec: decodedRococoSpec,
    api: rococoApi,
    client: rococoClient,
    blockExplorer: "https://rococo.subscan.io/",
  },
  rococoAssetHub: {
    nativeToken: "ROC",
    supportedTokens: ["WND"],
    getSystemAccount: rococoAssetHubApi.query.System.Account.getValue,
    getED: rococoAssetHubApi.constants.Balances.ExistentialDeposit,
    chainSpec: decodedRococoAssetHubSpec,
    api: rococoAssetHubApi,
    client: rococoAssetHubClient,
    blockExplorer: "https://assethub-rococo.subscan.io/",
  },
  westend: {
    nativeToken: "WND",
    supportedTokens: [],
    getSystemAccount: westendApi.query.System.Account.getValue,
    getED: westendApi.constants.Balances.ExistentialDeposit,
    chainSpec: decodedWestendSpec,
    api: westendApi,
    client: westendClient,
    blockExplorer: "https://westend.stg.subscan.io/",
  },
  westendAssetHub: {
    nativeToken: "WND",
    supportedTokens: ["ROC"],
    getSystemAccount: westendAssetHubApi.query.System.Account.getValue,
    getED: westendAssetHubApi.constants.Balances.ExistentialDeposit,
    chainSpec: decodedWestendAssetHubSpec,
    api: westendAssetHubApi,
    client: westendAssetHubClient,
    blockExplorer: "https://assethub-westend.subscan.io/",
  },
  westendBridgeHub: {
    nativeToken: "WND",
    supportedTokens: [],
    getSystemAccount: westendBridgeHubApi.query.System.Account.getValue,
    getED: westendBridgeHubApi.constants.Balances.ExistentialDeposit,
    chainSpec: decodedWestendBridgeHubSpec,
    api: westendBridgeHubApi,
    client: westendBridgeHubClient,
    blockExplorer: "https://bridgehub-westend.subscan.io/",
  },
  kusama: {
    nativeToken: "KSM",
    supportedTokens: [],
    getSystemAccount: kusamaApi.query.System.Account.getValue,
    getED: kusamaApi.constants.Balances.ExistentialDeposit,
    chainSpec: decodedKusamaSpec,
    api: kusamaApi,
    client: kusamaClient,
    blockExplorer: "https://kusama.subscan.io/",
  },
} satisfies Record<ChainId, Chain<ChainDefinition>>

export type AllChainApis = (typeof allChains)[ChainId]["api"]

export const listChains = Object.entries(allChains)
  .map(([key, value]) => ({
    id: key,
    ...value,
  }))
  .sort()
