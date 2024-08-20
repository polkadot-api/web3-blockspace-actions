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
import { combineLatest, distinctUntilChanged, from, map, startWith } from "rxjs"

export type SupportedTokens = "DOT" | "USDT" | "USDC" | "WND" | "ROC"

export function isSupportedToken(token: string): token is SupportedTokens {
  return (["DOT", "USDT", "USDC", "WND", "ROC"] as const).includes(
    token as SupportedTokens,
  )
}

export const tokenDecimals: Record<SupportedTokens, number> = {
  DOT: 10,
  USDT: 6,
  USDC: 6,
  WND: 12,
  ROC: 12,
}

type GetAccountResult = ReturnType<
  typeof polkadotApi.query.System.Account.getValue
>
interface Chain {
  id: ChainId
  nativeToken: SupportedTokens
  getSystemAccount: (address: string) => GetAccountResult
  getED: () => Promise<bigint>
  getAssetBalance?: (
    asset: "USDT" | "USDC",
    address: string,
  ) => Promise<{ balance: bigint } | null>
}

export const chains: Chain[] = [
  {
    id: "polkadot",
    nativeToken: "DOT",
    getSystemAccount: polkadotApi.query.System.Account.getValue,
    getED: polkadotApi.constants.Balances.ExistentialDeposit,
  },
  {
    id: "polkadotAssetHub",
    nativeToken: "DOT",
    getSystemAccount: polkadotAssetHubApi.query.System.Account.getValue,
    getED: polkadotAssetHubApi.constants.Balances.ExistentialDeposit,
    getAssetBalance: async (asset, addr) => {
      const res = await polkadotAssetHubApi.query.Assets.Account.getValue(
        assetHubTokenIds[asset],
        addr,
      )
      return res?.status.type !== "Liquid" ? null : res
    },
  },
  {
    id: "polkadotBridgeHub",
    nativeToken: "DOT",
    getSystemAccount: polkadotBridgeHubApi.query.System.Account.getValue,
    getED: polkadotBridgeHubApi.constants.Balances.ExistentialDeposit,
  },
  {
    id: "polkadotCollectives",
    nativeToken: "DOT",
    getSystemAccount: polkadotCollectivesApi.query.System.Account.getValue,
    getED: polkadotCollectivesApi.constants.Balances.ExistentialDeposit,
  },
  {
    id: "polkadotPeople",
    nativeToken: "DOT",
    getSystemAccount: polkadotPeopleApi.query.System.Account.getValue,
    getED: polkadotPeopleApi.constants.Balances.ExistentialDeposit,
  },
  {
    id: "rococo",
    nativeToken: "ROC",
    getSystemAccount: rococoApi.query.System.Account.getValue,
    getED: rococoApi.constants.Balances.ExistentialDeposit,
  },
  {
    id: "rococoAssetHub",
    nativeToken: "ROC",
    getSystemAccount: rococoAssetHubApi.query.System.Account.getValue,
    getED: rococoAssetHubApi.constants.Balances.ExistentialDeposit,
  },
  {
    id: "westend",
    nativeToken: "WND",
    getSystemAccount: westendApi.query.System.Account.getValue,
    getED: westendApi.constants.Balances.ExistentialDeposit,
  },
  {
    id: "westendAssetHub",
    nativeToken: "WND",
    getSystemAccount: westendAssetHubApi.query.System.Account.getValue,
    getED: westendAssetHubApi.constants.Balances.ExistentialDeposit,
  },
]

const isNotNil = <T>(v: T | null) => v != null
export const findBalances$ = (token: SupportedTokens, address: string) =>
  combineLatest(chains.map(getBalance$(token, address))).pipe(
    map((v) => v.filter(isNotNil)),
  )

const getBalance$ =
  (token: SupportedTokens, address: string) => (chain: Chain) =>
    from(getBalance(chain, token, address)).pipe(
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

const getBalance = async (
  chain: Chain,
  token: SupportedTokens,
  address: string,
) => {
  if (token === chain.nativeToken) {
    const [account, ed] = await Promise.all([
      chain.getSystemAccount(address),
      chain.getED(),
    ])
    return {
      transferable: getTransferableBalance(account, ed),
    }
  }

  // TODO hacking, improve later lol
  if (!chain.getAssetBalance || !(token === "USDC" || token === "USDT"))
    return null
  const res = await chain.getAssetBalance(token, address)
  return (
    res && {
      transferable: res.balance,
    }
  )
}

export const assetHubTokenIds = {
  USDC: 1_337,
  USDT: 1_984,
}

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
