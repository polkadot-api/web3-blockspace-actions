import { Subscribe, useStateObservable } from "@react-rxjs/core"
import { routeChain$, routeDelegateAccount$ } from "./DelegateContext"
import { EMPTY, startWith, switchMap } from "rxjs"
import { getAddressName } from "@/api/delegation"
import { FeesAndSubmit } from "./FeesAndSubmit"
import { ConvictionInput } from "./ChooseConviction"
import { AmountInput } from "./ChooseAmount"
import { SelectTracks } from "./ChooseTracks"
import { Warnings } from "./Warnings"
import { DelegateProvider } from "./DelegateContext"

const delegateName$ = routeDelegateAccount$.pipeState(
  switchMap((x) => (x ? getAddressName(x) : EMPTY)),
  startWith(""),
)
delegateName$.subscribe()

export const DelegateAction = () => {
  const chainId = useStateObservable(routeChain$)
  const delegateAccount = useStateObservable(delegateName$)
  return (
    <div className="flex flex-col text-center items-center">
      <h1 className="text-lg my-5 font-semibold">
        Delegate on {chainId} to {delegateAccount}
      </h1>

      <Subscribe fallback={<div>Loading...</div>}>
        <div className="flex flex-col text-left border-[1px] border-gray-200 rounded-lg p-5">
          <DelegateProvider>
            <AmountInput />
            <ConvictionInput />
            <SelectTracks />
            <Warnings />
            <FeesAndSubmit>Delegate</FeesAndSubmit>
          </DelegateProvider>
        </div>
      </Subscribe>
    </div>
  )
}
