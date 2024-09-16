import { Enum, SS58String } from "polkadot-api"
import { polkadotApi, DelegatableChain, polkadotPeopleApi } from "./"
import { VotingConviction } from "@polkadot-api/descriptors"
import { truncateString } from "@/utils/string"
import { getTrackInfo } from "@/actions/delegate/ChooseTracks"

export const getAddressName = async (addr: string): Promise<string> => {
  // TODO: Multichain
  const id = await polkadotPeopleApi.query.Identity.IdentityOf.getValue(addr)
  if (id == null || id[0].info.display.value == null)
    return truncateString(addr, 12)

  return typeof id[0].info.display.value === "number"
    ? id[0].info.display.value.toString()
    : id[0].info.display.value.asText()
}

export const delegate = async (
  from: SS58String,
  target: SS58String,
  conviction: VotingConviction["type"],
  amount: bigint,
  tracks: Array<number>,
  { delegate }: DelegatableChain,
) => {
  const tracksInfo = await getTrackInfo(from)

  const txs: Array<
    | ReturnType<typeof polkadotApi.tx.ConvictionVoting.remove_vote>
    | ReturnType<typeof polkadotApi.tx.ConvictionVoting.undelegate>
    | ReturnType<typeof polkadotApi.tx.ConvictionVoting.delegate>
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
          txs.push(delegate.removeVote(trackId, index))
        })
      } else txs.push(delegate.undelegate(trackId))
    }

    txs.push(delegate.delegate(trackId, Enum(conviction), target, amount))
  })

  return polkadotApi.tx.Utility.batch_all({
    calls: txs.map((tx) => tx.decodedCall),
  })
}
