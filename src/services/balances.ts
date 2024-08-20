import {
  ChainId,
  polkadotApi,
  polkadotAssetHubApi,
  polkadotBridgeHubApi,
  polkadotCollectivesApi,
  polkadotPeopleApi,
} from "@/api"
import { combineLatest, distinctUntilChanged, from, map, startWith } from "rxjs"

export type SupportedTokens = "DOT" | "USDT" | "USDC"

// Assuming DOT is the native token
type GetAccountResult = ReturnType<
  typeof polkadotApi.query.System.Account.getValue
>
interface Chain {
  id: ChainId
  getSystemAccount: (address: string) => GetAccountResult
  getED: () => Promise<bigint>
  getAssetBalance?: (
    asset: Exclude<SupportedTokens, "DOT">,
    address: string,
  ) => Promise<{ balance: bigint } | null>
}

const chains: Chain[] = [
  {
    id: "polkadot",
    getSystemAccount: polkadotApi.query.System.Account.getValue,
    getED: polkadotApi.constants.Balances.ExistentialDeposit,
  },
  {
    id: "polkadotAssetHub",
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
    getSystemAccount: polkadotBridgeHubApi.query.System.Account.getValue,
    getED: polkadotBridgeHubApi.constants.Balances.ExistentialDeposit,
  },
  {
    id: "polkadotCollectives",
    getSystemAccount: polkadotCollectivesApi.query.System.Account.getValue,
    getED: polkadotCollectivesApi.constants.Balances.ExistentialDeposit,
  },
  {
    id: "polkadotPeople",
    getSystemAccount: polkadotPeopleApi.query.System.Account.getValue,
    getED: polkadotPeopleApi.constants.Balances.ExistentialDeposit,
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
  if (token === "DOT") {
    const [account, ed] = await Promise.all([
      chain.getSystemAccount(address),
      chain.getED(),
    ])
    return {
      transferable: getTransferableBalance(account, ed),
    }
  }

  if (!chain.getAssetBalance) return null
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
} satisfies Record<Exclude<SupportedTokens, "DOT">, number>

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
