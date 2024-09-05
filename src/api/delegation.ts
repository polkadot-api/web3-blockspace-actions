import { Enum, SS58String } from "polkadot-api"
import { allChains, polkadotApi as api, ChainId, polkadotPeopleApi } from "./"
import { MultiAddress, VotingConviction } from "@polkadot-api/descriptors"
import { truncateString } from "@/utils/string"

export const getOptimalAmount = async (
  account: SS58String,
  at: string = "best",
): Promise<bigint | undefined> =>
  (await api.query.Staking.Ledger.getValue(account, { at }))?.active

interface Casting {
  type: "Casting"
  referendums: Array<number>
}

interface Delegating {
  type: "Delegating"
  target: SS58String
  amount: bigint
  conviction: VotingConviction
}

export const getTimeLocks = async (): Promise<string[]> => {
  // TODO: Generalise for all chains
  const [blockTimeSeconds, lockedBlocks] = await Promise.all([
    api.constants.Babe.ExpectedBlockTime(),
    api.constants.ConvictionVoting.VoteLockingPeriod(),
  ]).then(([milis, locked]) => [Number(milis / 1000n), locked])

  return Array(7)
    .fill(null)
    .map((_, conviction) => {
      if (conviction === 0) return "No lock"
      const hoursToUnlock = Math.ceil(
        (blockTimeSeconds * lockedBlocks * 2 ** (conviction - 1)) / 60 / 60,
      )
      const hoursToPrint = hoursToUnlock % 24
      const daysToPrint = ((hoursToUnlock - hoursToPrint) / 24) % 7
      const weeksToPrint =
        (hoursToUnlock - hoursToPrint - daysToPrint * 24) / 24 / 7
      let returnStr = ""
      let started = false
      if (weeksToPrint) {
        started = true
        returnStr += `${weeksToPrint} week${weeksToPrint > 1 ? "s" : ""}`
      }
      if (daysToPrint) {
        if (started) returnStr += `, `
        else started = true
        returnStr += `${daysToPrint} days`
      }
      if (hoursToPrint) {
        if (started) returnStr += `, `
        else started = true
        returnStr += `${hoursToPrint} hours`
      }
      return returnStr
    })
}

export const getTracks = async (): Promise<Record<number, string>> =>
  Object.fromEntries(
    (await api.constants.Referenda.Tracks()).map(([trackId, { name }]) => [
      trackId,
      name
        .split("_")
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(" "),
    ]),
  )

export const getTrackInfo = async (
  address: SS58String,
): Promise<Record<number, Casting | Delegating>> => {
  const convictionVoting =
    await api.query.ConvictionVoting.VotingFor.getEntries(address)

  return Object.fromEntries(
    convictionVoting
      .filter(
        ({ value: convictionVote }) =>
          convictionVote.type === "Delegating" ||
          convictionVote.value.votes.length > 0,
      )
      .map(({ keyArgs: [, votingClass], value: { type, value } }) => [
        votingClass,
        type === "Casting"
          ? {
              type: "Casting",
              referendums: value.votes.map(([refId]) => refId),
            }
          : {
              type: "Delegating",
              target: value.target,
              amount: value.balance,
              conviction: value.conviction,
            },
      ]),
  )
}

export const getAddressName = async (addr: string): Promise<string> => {
  // TODO: Multichain
  const id = await polkadotPeopleApi.query.Identity.IdentityOf.getValue(addr)
  if (id == null || id[0].info.display.value == null)
    return truncateString(addr, 12)
  return id[0].info.display.value.asText()
}

export const delegate = async (
  from: SS58String,
  target: SS58String,
  conviction: VotingConviction["type"],
  amount: bigint,
  tracks: Array<number>,
) => {
  const tracksInfo = await getTrackInfo(from)

  const txs: Array<
    | ReturnType<typeof api.tx.ConvictionVoting.remove_vote>
    | ReturnType<typeof api.tx.ConvictionVoting.undelegate>
    | ReturnType<typeof api.tx.ConvictionVoting.delegate>
  > = []
  tracks.forEach((trackId) => {
    const trackInfo = tracksInfo[trackId]

    if (trackInfo) {
      if (
        trackInfo.type === "Delegating" &&
        trackInfo.target === target &&
        conviction === trackInfo.conviction.type &&
        amount === trackInfo.amount
      )
        return

      if (trackInfo.type === "Casting") {
        trackInfo.referendums.forEach((index) => {
          txs.push(
            api.tx.ConvictionVoting.remove_vote({
              class: trackId,
              index,
            }),
          )
        })
      } else
        txs.push(
          api.tx.ConvictionVoting.undelegate({
            class: trackId,
          }),
        )
    }

    txs.push(
      api.tx.ConvictionVoting.delegate({
        class: trackId,
        conviction: Enum(conviction),
        to: MultiAddress.Id(target),
        balance: amount,
      }),
    )
  })

  return api.tx.Utility.batch_all({
    calls: txs.map((tx) => tx.decodedCall),
  })
}

export const getMaxDelegation = async (from: SS58String) => {
  const { data: account } = await api.query.System.Account.getValue(from)
  return account.free + account.reserved
}
