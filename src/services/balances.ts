import { listChains } from "@/api"
import { SupportedTokens } from "@/api/allTokens"
import { maxBigint } from "@/utils/bigint"
import { combineLatest, distinctUntilChanged, from, map, startWith } from "rxjs"
import { Chain } from "@/api"

const isNotNil = <T>(v: T | null) => v != null
export const findBalances$ = (token: SupportedTokens, address: string) =>
  combineLatest(listChains.map(getBalance$(token, address))).pipe(
    map((v) => v.filter(isNotNil)),
  )

const getBalance$ =
  (token: SupportedTokens, address: string) => (chain: Chain<any>) =>
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
  chain: Chain<any>,
  token: SupportedTokens,
  address: string,
) => {
  if (token === chain.nativeToken) {
    const [account, ed] = await Promise.all([
      chain.getSystemAccount(address),
      chain.api.constants.Balances.ExistentialDeposit() as Promise<bigint>,
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
