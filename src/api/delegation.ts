import { Enum, SS58String } from "polkadot-api"
import { polkadotApi as api, DelegatableChain, polkadotPeopleApi } from "./"
import { MultiAddress, VotingConviction } from "@polkadot-api/descriptors"
import { truncateString } from "@/utils/string"
import { getTrackInfo } from "@/actions/delegate/ChooseTracks"

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
  chain: DelegatableChain,
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
