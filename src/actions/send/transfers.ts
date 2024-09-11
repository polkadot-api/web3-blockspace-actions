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
import { westendBridgeHubApi } from "@/api/westendBridgeHub"
import { assetHubTokenIds } from "@/services/balances"
import { SupportedTokens } from "@/api/allTokens"
import {
  MultiAddress,
  XcmV3Junction,
  XcmV3JunctionNetworkId,
  XcmV3Junctions,
  XcmV3MultiassetFungibility,
  XcmV3WeightLimit,
  XcmVersionedAssets,
  XcmVersionedLocation,
} from "@polkadot-api/descriptors"
import { AccountId, Binary, Enum, Transaction } from "polkadot-api"

type TxFn = (
  dest: string,
  value: bigint,
) => Transaction<object, string, string, unknown>
type ChainPredefinedTransfers = {
  [K in ChainId]: {
    [K in SupportedTokens]?: TxFn
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
  westendBridgeHub: createValue(),
  kusama: createValue(),
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
type TransferForeignAssetFnParams = Parameters<
  typeof polkadotAssetHubApi.tx.ForeignAssets.transfer_keep_alive
>
type ReserveTransferFnParams = Parameters<
  typeof polkadotAssetHubApi.tx.PolkadotXcm.reserve_transfer_assets
>
type UnknownTransaction = Transaction<object, string, string, unknown>
interface Chain {
  id: ChainId
  transfer: (...args: TransferFnParams) => UnknownTransaction
  teleport: (...args: TeleportFnParams) => UnknownTransaction
  assets?: Array<
    { token: SupportedTokens } & (
      | {
          id: number
        }
      | {
          parents: number
          interior: XcmV3Junctions
        }
    )
  >
  transferAsset?: (...args: TransferAssetFnParams) => UnknownTransaction
  transferForeignAsset?: (
    ...args: TransferForeignAssetFnParams
  ) => UnknownTransaction
  bridges?: Array<Bridge>
  reserveTransfer?: (...args: ReserveTransferFnParams) => UnknownTransaction
}
interface Bridge {
  chain: ChainId
  interior: XcmV3Junctions
  fromRelay?: ChainId
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assets: Partial<Record<SupportedTokens, { parents: number; interior: any }>>
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
        bridges: [
          {
            chain: "westendAssetHub",
            fromRelay: "rococo",
            interior: XcmV3Junctions.X2([
              XcmV3Junction.GlobalConsensus(XcmV3JunctionNetworkId.Westend()),
              XcmV3Junction.Parachain(1000),
            ]),
            assets: {
              WND: {
                parents: 2,
                interior: XcmV3Junctions.X1(
                  XcmV3Junction.GlobalConsensus(
                    XcmV3JunctionNetworkId.Westend(),
                  ),
                ),
              },
              ROC: {
                parents: 1,
                interior: XcmV3Junctions.Here(),
              },
            },
          },
        ],
        reserveTransfer:
          rococoAssetHubApi.tx.PolkadotXcm.reserve_transfer_assets,
        assets: [
          {
            token: "WND",
            parents: 2,
            interior: XcmV3Junctions.X1(
              XcmV3Junction.GlobalConsensus(XcmV3JunctionNetworkId.Westend()),
            ),
          },
        ],
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
        bridges: [
          {
            chain: "rococoAssetHub",
            fromRelay: "westend",
            interior: XcmV3Junctions.X2([
              XcmV3Junction.GlobalConsensus(XcmV3JunctionNetworkId.Rococo()),
              XcmV3Junction.Parachain(1000),
            ]),
            assets: {
              WND: {
                parents: 1,
                interior: XcmV3Junctions.Here(),
              },
              ROC: {
                parents: 2,
                interior: XcmV3Junctions.X1(
                  XcmV3Junction.GlobalConsensus(
                    XcmV3JunctionNetworkId.Rococo(),
                  ),
                ),
              },
            },
          },
        ],
        reserveTransfer:
          westendAssetHubApi.tx.PolkadotXcm.reserve_transfer_assets,
        assets: [
          {
            token: "ROC",
            parents: 2,
            interior: XcmV3Junctions.X1(
              XcmV3Junction.GlobalConsensus(XcmV3JunctionNetworkId.Rococo()),
            ),
          },
        ],
      },

      {
        id: "westendBridgeHub",
        parachainId: 1002,
        transfer: westendBridgeHubApi.tx.Balances.transfer_keep_alive,
        teleport: westendBridgeHubApi.tx.PolkadotXcm.teleport_assets,
        bridges: [],
        reserveTransfer:
          westendBridgeHubApi.tx.PolkadotXcm.reserve_transfer_assets,
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
      assets: nativeAsset(parents, value),
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
      assets: nativeAsset(1, value),
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
  chain.bridges?.forEach((bridge) => addBridge(chain.id, bridge))

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
            "id" in asset
              ? parachain.transferAsset!({
                  id: asset.id,
                  target: MultiAddress.Id(dest),
                  amount,
                })
              : // TODO guard
                parachain.transferForeignAsset!({
                  id: asset,
                  amount,
                  target: MultiAddress.Id(dest),
                })
        })
    })

    parachain.bridges?.forEach((bridge) => addBridge(parachain.id, bridge))
  })
})

function addBridge(from: ChainId, bridge: Bridge) {
  const destId = bridge.chain
  const relayChain = chains.find(
    (c) => c.id === bridge.fromRelay || c.id === from,
  )
  if (!relayChain) return
  const chain = bridge.fromRelay
    ? relayChain.parachains.find((c) => c.id === from)
    : relayChain
  if (!chain?.reserveTransfer) return

  const isFromParachain = Boolean(bridge.fromRelay)

  Object.entries(bridge.assets).forEach(([token, assetId]) => {
    predefinedTransfers[from][destId][token as SupportedTokens] = (
      dest,
      value,
    ) =>
      chain.reserveTransfer!({
        dest: XcmVersionedLocation.V3({
          parents: isFromParachain ? 2 : 1,
          interior: bridge.interior,
        }),
        beneficiary: destToBeneficiary(dest),
        assets: XcmVersionedAssets.V4([
          {
            id: assetId,
            fun: XcmV3MultiassetFungibility.Fungible(value),
          },
        ]),
        fee_asset_item: 0,
      })
  })
}

export type Route = Array<{
  from: ChainId
  to: ChainId
  tx: TxFn
}>
type Exploring = {
  position: ChainId
  route: Route
  visited: Set<ChainId>
}
const routeCache: Record<string, Route> = {}
const routeKey = (from: ChainId, to: ChainId, token: SupportedTokens) =>
  `${from}-${to}-${token}`
export function findRoute(
  from: ChainId,
  to: ChainId,
  token: SupportedTokens,
): Route | null {
  // Direct shortcuts
  if (from === to) {
    return token in predefinedTransfers[from][to]
      ? [
          {
            from,
            to,
            tx: predefinedTransfers[from][to][token]!,
          },
        ]
      : null
  }

  const key = routeKey(from, to, token)
  if (routeCache[key]) return routeCache[key]

  let exploring: Array<Exploring> = [
    {
      position: from,
      route: [],
      visited: new Set(),
    },
  ]

  // BFS to find the shortest amount of steps
  while (exploring.length) {
    const newExploring: Array<Exploring> = []

    for (const exp of exploring) {
      if (exp.position === to) {
        return exp.route
      }
      const newVisited = new Set(exp.visited)
      newVisited.add(exp.position)

      const destinations = Object.keys(predefinedTransfers[exp.position])
        .map((dest) => dest as ChainId)
        .filter(
          (dest) =>
            !exp.visited.has(dest) &&
            token in predefinedTransfers[exp.position][dest],
        )
      destinations.forEach((dest) =>
        newExploring.push({
          position: dest,
          route: [
            ...exp.route,
            {
              from: exp.position,
              to: dest,
              tx: predefinedTransfers[exp.position][dest][token]!,
            },
          ],
          visited: newVisited,
        }),
      )
    }

    exploring = newExploring
  }

  return null
}
