import { SS58String } from "polkadot-api"
import { polkadotApi as api } from "./"
import { MultiAddress, VotingConviction } from "@polkadot-api/descriptors"

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

export const getTimeLock = async (
  conviction: 0 | 1 | 2 | 3 | 4 | 5 | 6,
): Promise<string> => {
  if (conviction === 0) return "No lock"
  const [blockTimeSeconds, lockedBlocks] = await Promise.all([
    paseoApi.constants.Babe.ExpectedBlockTime(),
    paseoApi.constants.ConvictionVoting.VoteLockingPeriod(),
  ]).then(([milis, locked]) => [Number(milis / 1000n), locked])
  console.log(lockedBlocks)
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
    returnStr += `${weeksToPrint} weeks`
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

const getTrackInfo = async (
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

export const delegate = async (
  from: SS58String,
  target: SS58String,
  conviction: VotingConviction,
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
        conviction.type === trackInfo.conviction.type &&
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
        conviction,
        to: MultiAddress.Id(target),
        balance: amount,
      }),
    )
  })

  return api.tx.Utility.batch_all({
    calls: txs.map((tx) => tx.decodedCall),
  })
}
