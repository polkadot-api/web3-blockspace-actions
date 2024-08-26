import { Link } from "react-router-dom"
import { SUPPORTED_CHAINS } from "./utils"

export const ChooseChain = () => {
  return (
    <div className="flex flex-col text-center items-center">
      <h1 className="text-md my-3 font-semibold">Step 1: Select a chain</h1>
      {SUPPORTED_CHAINS.map((c) => (
        <Link to={c}>
          <div className="flex flex-col text-left border-[1px] border-gray-200 hover:border-pink rounded-lg py-2 px-3">
            <h2 className="text-lg font-semibold">
              {c[0].toUpperCase() + c.slice(1)}
            </h2>
          </div>
        </Link>
      ))}
    </div>
  )
}
