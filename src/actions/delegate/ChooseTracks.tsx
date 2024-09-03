import { state, useStateObservable } from "@react-rxjs/core"
import { defer, map, concat, take } from "rxjs"
import { createSignal } from "@react-rxjs/utils"
import { getTracks } from "@/api/delegation"
import { MultiSelect } from "@/components/multi-select"

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
