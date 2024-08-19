import { useStateObservable } from "@react-rxjs/core"
import { chain$, delegateAccount$ } from "./delegate"

chain$.subscribe()
delegateAccount$.subscribe()

export const DelegateAction = () => {
  console.log("delegating")
  const chainData = useStateObservable(chain$)
  const delegateAccount = useStateObservable(delegateAccount$)

  return (
    <div className="flex flex-col text-center items-center">
      <h1 className="text-lg my-5 font-semibold">Delegate</h1>
      <div className="flex flex-col text-left  border-[1px] border-gray-200 rounded-lg p-5">
        <h2 className="text-lg font-semibold">H2 INFO</h2>
        <div className="flex flex-row justify-between gap-2">
          Chain: <div className="text-right">{chainData ?? "NOT DEFINED"}</div>
        </div>
        <div className="flex flex-row justify-between gap-2">
          Delegate Account:
          <div className="text-right">{delegateAccount ?? "NOT DEFINED"}</div>
        </div>
      </div>
    </div>
  )
}
