import { state, useStateObservable } from "@react-rxjs/core"
import { defer, map, concat, take } from "rxjs"
import { createSignal } from "@react-rxjs/utils"
import { MultiSelect } from "@/components/multi-select"
import { polkadotApi as api } from "@/api"
import { SS58String } from "polkadot-api"
import { VotingConviction } from "@polkadot-api/descriptors"

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

const tracks$ = state(
  defer(getTracks).pipe(
    map((x) => Object.entries(x).map(([value, label]) => ({ value, label }))),
  ),
)
const [selectedTrackInput$, onChangeSelectedTrack] =
  createSignal<Array<string>>()

export const parsedTrack$ = concat(
  tracks$.pipe(
    map((tracks) => tracks.map((track) => track.value)),
    take(1),
  ),
  selectedTrackInput$,
).pipe(map((x) => x.map((y) => parseInt(y, 10))))

export const SelectTracks: React.FC = () => {
  const tracks = useStateObservable(tracks$)
  return (
    <>
      <h2 className="mt-4 font-bold">Tracks to delegate:</h2>
      <MultiSelect
        options={tracks}
        onValueChange={onChangeSelectedTrack}
        defaultValue={tracks.map((x) => x.value)}
        placeholder="Select tracks"
        variant="inverted"
        animation={2}
        maxCount={3}
      />
    </>
  )
}
