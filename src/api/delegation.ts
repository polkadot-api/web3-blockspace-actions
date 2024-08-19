import { SS58String } from "polkadot-api"
import { polkadotApi as paseoApi } from "./"
import { MultiAddress, VotingConviction } from "@polkadot-api/descriptors"

export const getOptimalAmount = async (
  account: SS58String,
  at: string = "best",
) => (await paseoApi.query.Staking.Ledger.getValue(account, { at }))?.active

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

export const getTracks = async (): Promise<Record<number, string>> =>
  Object.fromEntries(
    (await paseoApi.constants.Referenda.Tracks()).map(([trackId, { name }]) => [
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
    await paseoApi.query.ConvictionVoting.VotingFor.getEntries(address)

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
    | ReturnType<typeof paseoApi.tx.ConvictionVoting.remove_vote>
    | ReturnType<typeof paseoApi.tx.ConvictionVoting.undelegate>
    | ReturnType<typeof paseoApi.tx.ConvictionVoting.delegate>
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
            paseoApi.tx.ConvictionVoting.remove_vote({
              class: trackId,
              index,
            }),
          )
        })
      } else
        txs.push(
          paseoApi.tx.ConvictionVoting.undelegate({
            class: trackId,
          }),
        )
    }

    txs.push(
      paseoApi.tx.ConvictionVoting.delegate({
        class: trackId,
        conviction,
        to: MultiAddress.Id(target),
        balance: amount,
      }),
    )
  })

  return paseoApi.tx.Utility.batch_all({
    calls: txs.map((tx) => tx.decodedCall),
  })
}
