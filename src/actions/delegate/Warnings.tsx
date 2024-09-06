import { useStateObservable } from "@react-rxjs/core"
import { map, of, switchMap } from "rxjs"
import { getTrackInfo } from "./ChooseTracks"
import { selectedAccount$ } from "@/services/accounts"
import { truncateString } from "@/utils/string"

const warnings$ = selectedAccount$.pipeState(
  switchMap((account) => (account ? getTrackInfo(account.address) : of({}))),
  map((record) => {
    const undelegations: Record<string, number[]> = {}
    const votesRemoved: Array<number> = []
    Object.entries(record).forEach(([trackId, action]) => {
      if (action.type === "Casting") {
        votesRemoved.push(...action.referendums)
      } else {
        const arr = undelegations[action.target] ?? []
        arr.push(Number(trackId))
        undelegations[action.target] = arr
      }
    })

    Object.values(undelegations).forEach((x) => x.sort((a, b) => a - b))
    votesRemoved.sort((a, b) => a - b)

    return { undelegations, votesRemoved }
  }),
)

export const Warnings: React.FC = () => {
  const { undelegations, votesRemoved } = useStateObservable(warnings$)
  return (
    <>
      {Object.keys(undelegations).length > 0 || votesRemoved.length > 0 ? (
        <h2 className="mt-4 font-bold text-destructive">Warnings: </h2>
      ) : null}
      {Object.entries(undelegations).map(([address, tracks]) => (
        <div>
          You will stop delegating to {truncateString(address, 8)} on the
          following tracks: {tracks.join(", ")}.
        </div>
      ))}
      {votesRemoved.length > 0 ? (
        <div>
          Your votes on the following referendas will be removed:{" "}
          {votesRemoved.join(", ")}.
        </div>
      ) : null}
    </>
  )
}
