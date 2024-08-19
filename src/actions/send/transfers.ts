import { AllChainApis, ChainId, polkadotApi } from "@/api"
import { SupportedTokens } from "@/services/balances"
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

const nativeTokenToParachain =
  (parachain: number) => (dest: string, value: bigint) =>
    polkadotApi.tx.XcmPallet.limited_teleport_assets({
      assets: nativeAsset(0, value),
      dest: XcmVersionedLocation.V4({
        parents: 0,
        interior: Enum("X1", [XcmV3Junction.Parachain(parachain)]),
      }),
      beneficiary: destToBeneficiary(dest),
      fee_asset_item: 0,
      weight_limit: XcmV3WeightLimit.Unlimited(),
    })

const polkadot: ChainPredefinedTransfers = {
  polkadot: {
    DOT: nativeTokenTransfer(polkadotApi),
  },
  polkadotAssetHub: {
    DOT: nativeTokenToParachain(1000),
  },
  polkadotBridgeHub: {
    DOT: nativeTokenToParachain(1002),
  },
  polkadotCollectives: {
    DOT: nativeTokenToParachain(1001),
  },
  polkadotPeople: {
    DOT: nativeTokenToParachain(1004),
  },
}

export const predefinedTransfers: PredefinedTransfers = {
  polkadot: polkadot,
  polkadotAssetHub: polkadot,
  polkadotBridgeHub: polkadot,
  polkadotCollectives: polkadot,
  polkadotPeople: polkadot,
}
