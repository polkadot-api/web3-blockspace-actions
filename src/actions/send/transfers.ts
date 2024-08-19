import {
  AllChainApis,
  ChainId,
  polkadotApi,
  polkadotAssetHubApi,
  polkadotBridgeHubApi,
  polkadotCollectivesApi,
} from "@/api"
import { assetHubTokenIds, SupportedTokens } from "@/services/balances"
import {
  MultiAddress,
  XcmV3Junction,
  XcmV3MultiassetFungibility,
  XcmV3WeightLimit,
  XcmVersionedAssets,
  XcmVersionedLocation,
} from "@polkadot-api/descriptors"
import { AccountId, Binary, Enum, Transaction } from "polkadot-api"

type ChainPredefinedTransfers = {
  [K in ChainId]: {
    [K in SupportedTokens]?: (
      dest: string,
      value: bigint,
    ) => Transaction<object, string, string, unknown>
  }
}

type PredefinedTransfers = {
  [K in ChainId]: ChainPredefinedTransfers
}

const nativeTokenTransfer =
  (api: AllChainApis) => (dest: string, value: bigint) =>
    api.tx.Balances.transfer_keep_alive({ dest: MultiAddress.Id(dest), value })

const nativeAsset = (parents: number, amount: bigint) =>
  XcmVersionedAssets.V4([
    {
      id: {
        parents,
        interior: Enum("Here"),
      },
      fun: XcmV3MultiassetFungibility.Fungible(amount),
    },
  ])

const destToBeneficiary = (dest: string) =>
  XcmVersionedLocation.V4({
    parents: 0,
    interior: Enum("X1", [
      XcmV3Junction.AccountId32({
        id: Binary.fromBytes(encodeAccount(dest)),
        network: undefined,
      }),
    ]),
  })

const encodeAccount = AccountId().enc

type TeleportFnParams = Parameters<
  typeof polkadotApi.tx.XcmPallet.limited_teleport_assets
>
const nativeTokenToParachain =
  <R>(
    fn: (...args: TeleportFnParams) => R,
    parachain: number,
    parents: number,
  ) =>
  (dest: string, value: bigint) =>
    fn({
      assets: nativeAsset(0, value),
      dest: XcmVersionedLocation.V4({
        parents,
        interior: Enum("X1", [XcmV3Junction.Parachain(parachain)]),
      }),
      beneficiary: destToBeneficiary(dest),
      fee_asset_item: 0,
      weight_limit: XcmV3WeightLimit.Unlimited(),
    })

const ParachainIds = {
  polkadotAssetHub: 1000,
  polkadotBridgeHub: 1002,
  polkadotCollectives: 1001,
  polkadotPeople: 1004,
}

const polkadot: ChainPredefinedTransfers = {
  polkadot: {
    DOT: nativeTokenTransfer(polkadotApi),
  },
  polkadotAssetHub: {
    DOT: nativeTokenToParachain(
      polkadotApi.tx.XcmPallet.limited_teleport_assets,
      ParachainIds.polkadotAssetHub,
      0,
    ),
  },
  polkadotBridgeHub: {
    DOT: nativeTokenToParachain(
      polkadotApi.tx.XcmPallet.limited_teleport_assets,
      ParachainIds.polkadotBridgeHub,
      0,
    ),
  },
  polkadotCollectives: {
    DOT: nativeTokenToParachain(
      polkadotApi.tx.XcmPallet.limited_teleport_assets,
      ParachainIds.polkadotCollectives,
      0,
    ),
  },
  polkadotPeople: {
    DOT: nativeTokenToParachain(
      polkadotApi.tx.XcmPallet.limited_teleport_assets,
      ParachainIds.polkadotPeople,
      0,
    ),
  },
}

const nativeTokenToRelayChain =
  <R>(fn: (...args: TeleportFnParams) => R) =>
  (dest: string, value: bigint) =>
    fn({
      assets: nativeAsset(0, value),
      dest: XcmVersionedLocation.V4({
        parents: 1,
        interior: Enum("Here"),
      }),
      beneficiary: destToBeneficiary(dest),
      fee_asset_item: 0,
      weight_limit: XcmV3WeightLimit.Unlimited(),
    })

const polkadotAssetHub: ChainPredefinedTransfers = {
  polkadot: {
    DOT: nativeTokenToRelayChain(
      polkadotAssetHubApi.tx.PolkadotXcm.limited_teleport_assets,
    ),
  },
  polkadotAssetHub: {
    DOT: nativeTokenTransfer(polkadotAssetHubApi),
    USDC: (dest, amount) =>
      polkadotAssetHubApi.tx.Assets.transfer_keep_alive({
        id: assetHubTokenIds.USDC,
        target: MultiAddress.Id(dest),
        amount,
      }),
    USDT: (dest, amount) =>
      polkadotAssetHubApi.tx.Assets.transfer_keep_alive({
        id: assetHubTokenIds.USDT,
        target: MultiAddress.Id(dest),
        amount,
      }),
  },
  polkadotBridgeHub: {
    DOT: nativeTokenToParachain(
      polkadotAssetHubApi.tx.PolkadotXcm.limited_teleport_assets,
      ParachainIds.polkadotBridgeHub,
      1,
    ),
  },
  polkadotCollectives: {
    DOT: nativeTokenToParachain(
      polkadotAssetHubApi.tx.PolkadotXcm.limited_teleport_assets,
      ParachainIds.polkadotCollectives,
      1,
    ),
  },
  polkadotPeople: {
    DOT: nativeTokenToParachain(
      polkadotAssetHubApi.tx.PolkadotXcm.limited_teleport_assets,
      ParachainIds.polkadotPeople,
      1,
    ),
  },
}

const polkadotBridgeHub: ChainPredefinedTransfers = {
  polkadot: {
    DOT: nativeTokenToRelayChain(
      polkadotBridgeHubApi.tx.PolkadotXcm.limited_teleport_assets,
    ),
  },
  polkadotAssetHub: {
    DOT: nativeTokenToParachain(
      polkadotBridgeHubApi.tx.PolkadotXcm.limited_teleport_assets,
      ParachainIds.polkadotAssetHub,
      1,
    ),
  },
  polkadotBridgeHub: {
    DOT: nativeTokenTransfer(polkadotBridgeHubApi),
  },
  polkadotCollectives: {
    DOT: nativeTokenToParachain(
      polkadotBridgeHubApi.tx.PolkadotXcm.limited_teleport_assets,
      ParachainIds.polkadotCollectives,
      1,
    ),
  },
  polkadotPeople: {
    DOT: nativeTokenToParachain(
      polkadotBridgeHubApi.tx.PolkadotXcm.limited_teleport_assets,
      ParachainIds.polkadotPeople,
      1,
    ),
  },
}

const polkadotCollectives: ChainPredefinedTransfers = {
  polkadot: {
    DOT: nativeTokenToRelayChain(
      polkadotCollectivesApi.tx.PolkadotXcm.limited_teleport_assets,
    ),
  },
  polkadotAssetHub: {
    DOT: nativeTokenToParachain(
      polkadotCollectivesApi.tx.PolkadotXcm.limited_teleport_assets,
      ParachainIds.polkadotAssetHub,
      1,
    ),
  },
  polkadotBridgeHub: {
    DOT: nativeTokenToParachain(
      polkadotCollectivesApi.tx.PolkadotXcm.limited_teleport_assets,
      ParachainIds.polkadotBridgeHub,
      1,
    ),
  },
  polkadotCollectives: {
    DOT: nativeTokenTransfer(polkadotCollectivesApi),
  },
  polkadotPeople: {
    DOT: nativeTokenToParachain(
      polkadotCollectivesApi.tx.PolkadotXcm.limited_teleport_assets,
      ParachainIds.polkadotPeople,
      1,
    ),
  },
}

const polkadotPeople: ChainPredefinedTransfers = {
  polkadot: {
    DOT: nativeTokenToRelayChain(
      polkadotCollectivesApi.tx.PolkadotXcm.limited_teleport_assets,
    ),
  },
  polkadotAssetHub: {
    DOT: nativeTokenToParachain(
      polkadotCollectivesApi.tx.PolkadotXcm.limited_teleport_assets,
      ParachainIds.polkadotAssetHub,
      1,
    ),
  },
  polkadotBridgeHub: {
    DOT: nativeTokenToParachain(
      polkadotCollectivesApi.tx.PolkadotXcm.limited_teleport_assets,
      ParachainIds.polkadotBridgeHub,
      1,
    ),
  },
  polkadotCollectives: {
    DOT: nativeTokenToParachain(
      polkadotCollectivesApi.tx.PolkadotXcm.limited_teleport_assets,
      ParachainIds.polkadotCollectives,
      1,
    ),
  },
  polkadotPeople: {
    DOT: nativeTokenTransfer(polkadotCollectivesApi),
  },
}

export const predefinedTransfers: PredefinedTransfers = {
  polkadot,
  polkadotAssetHub,
  polkadotBridgeHub,
  polkadotCollectives,
  polkadotPeople,
}
