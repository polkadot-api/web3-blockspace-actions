import {
  ChainId,
  polkadotApi,
  polkadotAssetHubApi,
  polkadotBridgeHubApi,
  polkadotCollectivesApi,
  polkadotPeopleApi,
} from "@/api"
import { rococoApi } from "@/api/rococo"
import { rococoAssetHubApi } from "@/api/rococoAssetHub"
import { westendApi } from "@/api/westend"
import { westendAssetHubApi } from "@/api/westendAssetHub"
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

const createChainMap = <T>(createValue: () => T): Record<ChainId, T> => ({
  polkadot: createValue(),
  polkadotAssetHub: createValue(),
  polkadotBridgeHub: createValue(),
  polkadotCollectives: createValue(),
  polkadotPeople: createValue(),
  rococo: createValue(),
  rococoAssetHub: createValue(),
  westend: createValue(),
  westendAssetHub: createValue(),
})

export const predefinedTransfers: PredefinedTransfers = createChainMap(() =>
  createChainMap(() => ({})),
)

// This object is filled with the configuration below
type TransferFnParams = Parameters<
  typeof polkadotApi.tx.Balances.transfer_keep_alive
>
type TeleportFnParams = Parameters<
  typeof polkadotApi.tx.XcmPallet.limited_teleport_assets
>
type TransferAssetFnParams = Parameters<
  typeof polkadotAssetHubApi.tx.Assets.transfer_keep_alive
>
type UnknownTransaction = Transaction<object, string, string, unknown>
interface Chain {
  id: ChainId
  transfer: (...args: TransferFnParams) => UnknownTransaction
  teleport: (...args: TeleportFnParams) => UnknownTransaction
  assets?: { token: SupportedTokens; id: number }[]
  transferAsset?: (...args: TransferAssetFnParams) => UnknownTransaction
}
interface Parachain extends Chain {
  parachainId: number
}
interface RelayChain extends Chain {
  parachains: Parachain[]
  nativeToken: SupportedTokens
}
const chains: RelayChain[] = [
  {
    id: "polkadot",
    nativeToken: "DOT",
    transfer: polkadotApi.tx.Balances.transfer_keep_alive,
    teleport: polkadotApi.tx.XcmPallet.teleport_assets,
    parachains: [
      {
        id: "polkadotAssetHub",
        parachainId: 1000,
        transfer: polkadotAssetHubApi.tx.Balances.transfer_keep_alive,
        teleport: polkadotAssetHubApi.tx.PolkadotXcm.teleport_assets,
        assets: [
          { token: "USDC", id: assetHubTokenIds.USDC },
          { token: "USDT", id: assetHubTokenIds.USDT },
        ],
        transferAsset: polkadotAssetHubApi.tx.Assets.transfer_keep_alive,
      },
      {
        id: "polkadotBridgeHub",
        parachainId: 1002,
        transfer: polkadotBridgeHubApi.tx.Balances.transfer_keep_alive,
        teleport: polkadotBridgeHubApi.tx.PolkadotXcm.teleport_assets,
      },
      {
        id: "polkadotCollectives",
        parachainId: 1001,
        transfer: polkadotCollectivesApi.tx.Balances.transfer_keep_alive,
        teleport: polkadotCollectivesApi.tx.PolkadotXcm.teleport_assets,
      },
      {
        id: "polkadotPeople",
        parachainId: 1004,
        transfer: polkadotPeopleApi.tx.Balances.transfer_keep_alive,
        teleport: polkadotPeopleApi.tx.PolkadotXcm.teleport_assets,
      },
    ],
  },
  {
    id: "rococo",
    nativeToken: "ROC",
    transfer: rococoApi.tx.Balances.transfer_keep_alive,
    teleport: rococoApi.tx.XcmPallet.teleport_assets,
    parachains: [
      {
        id: "rococoAssetHub",
        parachainId: 1000,
        transfer: rococoAssetHubApi.tx.Balances.transfer_keep_alive,
        teleport: rococoAssetHubApi.tx.PolkadotXcm.teleport_assets,
      },
    ],
  },
  {
    id: "westend",
    nativeToken: "WND",
    transfer: westendApi.tx.Balances.transfer_keep_alive,
    teleport: westendApi.tx.XcmPallet.teleport_assets,
    parachains: [
      {
        id: "westendAssetHub",
        parachainId: 1000,
        transfer: westendAssetHubApi.tx.Balances.transfer_keep_alive,
        teleport: westendAssetHubApi.tx.PolkadotXcm.teleport_assets,
      },
    ],
  },
]

const nativeTokenTransfer =
  (transfer: Chain["transfer"]) => (dest: string, value: bigint) =>
    transfer({ dest: MultiAddress.Id(dest), value })

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
  (teleport: Chain["teleport"], parachain: number, parents: number) =>
  (dest: string, value: bigint) =>
    teleport({
      assets: nativeAsset(0, value),
      dest: XcmVersionedLocation.V4({
        parents,
        interior: Enum("X1", [XcmV3Junction.Parachain(parachain)]),
      }),
      beneficiary: destToBeneficiary(dest),
      fee_asset_item: 0,
      weight_limit: XcmV3WeightLimit.Unlimited(),
    })

const nativeTokenToRelayChain =
  (teleport: Chain["teleport"]) => (dest: string, value: bigint) =>
    teleport({
      assets: nativeAsset(0, value),
      dest: XcmVersionedLocation.V4({
        parents: 1,
        interior: Enum("Here"),
      }),
      beneficiary: destToBeneficiary(dest),
      fee_asset_item: 0,
      weight_limit: XcmV3WeightLimit.Unlimited(),
    })

// At the moment assuming there are no bridges between chains.
chains.forEach((chain) => {
  const nativeToken = chain.nativeToken

  // relay <-> relay
  predefinedTransfers[chain.id][chain.id][nativeToken] = nativeTokenTransfer(
    chain.transfer,
  )
  chain.parachains.forEach((parachain) => {
    // relay <-> parachain
    predefinedTransfers[chain.id][parachain.id][nativeToken] =
      nativeTokenToParachain(chain.teleport, parachain.parachainId, 0)
    predefinedTransfers[parachain.id][chain.id][nativeToken] =
      nativeTokenToRelayChain(parachain.teleport)

    // parachain <-> parachain
    const parachainAssets = parachain.assets ?? []
    chain.parachains.forEach((destParachain) => {
      predefinedTransfers[parachain.id][destParachain.id][nativeToken] =
        parachain.id === destParachain.id
          ? nativeTokenTransfer(parachain.transfer)
          : nativeTokenToParachain(
              parachain.teleport,
              destParachain.parachainId,
              1,
            )

      if (!destParachain.assets || !parachain.transferAsset) return
      parachainAssets
        .filter((asset) =>
          destParachain.assets!.find((a) => a.token === asset.token),
        )
        .forEach((asset) => {
          predefinedTransfers[parachain.id][destParachain.id][asset.token] = (
            dest,
            amount,
          ) =>
            parachain.transferAsset!({
              id: asset.id,
              target: MultiAddress.Id(dest),
              amount,
            })
        })
    })
  })
})
