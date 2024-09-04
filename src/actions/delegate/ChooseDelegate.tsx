import { useStateObservable } from "@react-rxjs/core"
import { Link } from "react-router-dom"
import { routeChain$ } from "./DelegateContext"
import { truncateString } from "@/utils/string"

import { delegateMap, SupportedChains } from "./registry"

export const ChooseDelegate = () => {
  const chainId = useStateObservable(routeChain$)

  const delegates = delegateMap[chainId as SupportedChains].sort((a, b) =>
    a.name.localeCompare(b.name),
  )
  return (
    <div className="flex flex-col text-center items-center">
      {chainId ? (
        <>
          <h1 className="text-md my-3 font-semibold">
            Step 2: Choose a delegate
          </h1>
          <div className="flex flex-col items-center">
            {delegates.map(({ address, name, shortDescription }) => (
              <Link to={address} key={name} className="flex items-center w-2/3">
                <div className="flex flex-col text-left border-[1px] border-gray-200 hover:border-pink rounded-lg px-4 py-2 mb-2 w-full">
                  <h2 className="text-lg font-semibold">{name}</h2>

                  <div className="flex flex-row justify-between gap-2">
                    Address:{" "}
                    <div className="text-right">
                      {truncateString(address, 8)}
                    </div>
                  </div>
                  <div>{shortDescription}</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <Link to="..">
          <h1 className="text-lg my-5 font-semibold">Chain not supported.</h1>
          <div className="flex flex-col text-left  border-[1px] border-gray-200 rounded-lg p-5">
            <h2 className="text-lg font-semibold">
              Click here to choose chain
            </h2>
          </div>
        </Link>
      )}
    </div>
  )
}
