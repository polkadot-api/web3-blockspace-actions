import { Link } from "react-router-dom"
import { delegateMap } from "./registry"

export const ChooseChain = () => {
  return (
    <div className="flex flex-col text-center items-center">
      <h1 className="text-md my-3 font-semibold">Step 1: Select a chain</h1>
      <div className="flex flex-row gap-2">
        {Object.keys(delegateMap).map((chainId) => (
          <Link to={chainId} key={chainId}>
            <div className="flex flex-col text-left border-[1px] border-gray-200 hover:border-pink rounded-lg py-2 px-3">
              <h2 className="text-lg font-semibold">
                {chainId[0].toUpperCase() + chainId.slice(1)}
              </h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
