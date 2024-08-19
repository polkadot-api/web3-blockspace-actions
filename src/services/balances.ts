import {
  AllChainApis,
  ChainId,
  polkadotApi,
  polkadotAssetHubApi,
  polkadotBridgeHubApi,
  polkadotCollectivesApi,
  polkadotPeopleApi,
} from "@/api"
import { combineLatest, distinctUntilChanged, from, map, startWith } from "rxjs"

export type SupportedTokens = "DOT" | "USDT" | "USDC"

const isNotNil = <T>(v: T | null) => v != null
export const findBalances$ = (token: SupportedTokens, address: string) =>
  combineLatest([
    getBalance$("polkadot", polkadotBalance(token, address)),
    getBalance$("polkadotAssetHub", assetHubBalance(token, address)),
    getBalance$("polkadotBridgeHub", bridgeHubBalance(token, address)),
    getBalance$("polkadotCollectives", collectivesBalance(token, address)),
    getBalance$("polkadotPeople", peopleBalance(token, address)),
  ]).pipe(map((v) => v.filter(isNotNil)))

const getBalance$ = (
  chain: ChainId,
  balancePromise: Promise<{
    transferable: bigint
    existentialDeposit: bigint
  } | null>,
) =>
  from(balancePromise).pipe(
    startWith(null),
    distinctUntilChanged(),
    map((v) =>
      v
        ? {
            chain,
            ...v,
          }
        : null,
    ),
  )

const getNativeBalance = async (api: AllChainApis, address: string) => {
  const [account, ed] = await Promise.all([
    api.query.System.Account.getValue(address),
    api.constants.Balances.ExistentialDeposit(),
  ])
  return {
    transferable: getTransferableBalance(account, ed),
    existentialDeposit: ed,
  }
}

const polkadotBalance = (token: SupportedTokens, address: string) =>
  token === "DOT"
    ? getNativeBalance(polkadotApi, address)
    : Promise.resolve(null)

const assetHubTokenIds = {
  USDC: 1_337,
  USDT: 1_984,
} satisfies Record<Exclude<SupportedTokens, "DOT">, number>
const assetHubBalance = async (token: SupportedTokens, address: string) => {
  if (token === "DOT") {
    return getNativeBalance(polkadotAssetHubApi, address)
  }

  const id = assetHubTokenIds[token]
  const [account, asset] = await Promise.all([
    polkadotAssetHubApi.query.Assets.Account.getValue(id, address),
    polkadotAssetHubApi.query.Assets.Asset.getValue(id),
  ])
  if (!account || !asset || account.status.type !== "Liquid") return null

  return {
    transferable: account.balance,
    existentialDeposit: asset.min_balance,
  }
}

const bridgeHubBalance = (token: SupportedTokens, address: string) =>
  token === "DOT"
    ? getNativeBalance(polkadotBridgeHubApi, address)
    : Promise.resolve(null)

const collectivesBalance = (token: SupportedTokens, address: string) =>
  token === "DOT"
    ? getNativeBalance(polkadotCollectivesApi, address)
    : Promise.resolve(null)

const peopleBalance = (token: SupportedTokens, address: string) =>
  token === "DOT"
    ? getNativeBalance(polkadotPeopleApi, address)
    : Promise.resolve(null)

function getTransferableBalance(
  account: {
    data: {
      free: bigint
      reserved: bigint
      frozen: bigint
    }
  },
  existentialDeposit: bigint,
) {
  // https://wiki.polkadot.network/docs/learn-account-balances
  // free - max(frozen - on_hold, ED)
  return (
    account.data.free -
    maxBigint(account.data.frozen - account.data.reserved, existentialDeposit)
  )
}
const maxBigint = (a: bigint, b: bigint) => (a > b ? a : b)
