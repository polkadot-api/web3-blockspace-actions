import { useStateObservable } from "@react-rxjs/core"
import { Link } from "react-router-dom"
import { routeChain$ } from "./DelegateContext"
import { truncateString } from "@/utils/string"

const SUPPORTED_DELEGATES: Array<{ address: string; name: string }> = [
  {
    name: "BIRDO",
    address: "12s37eSMQPEN5cuVyBxk2UypUHntwumqBHy7sJkoKpZ1v3HV",
  },
  {
    name: "ChaosDAO",
    address: "13EyMuuDHwtq5RD6w3psCJ9WvJFZzDDion6Fd2FVAqxz1g7K",
  },
]

export const ChooseDelegate = () => {
  const chainId = useStateObservable(routeChain$)
  return (
    <div className="flex flex-col text-center items-center">
      {chainId ? (
        <>
          <h1 className="text-md my-3 font-semibold">
            Step 2: Choose a delegate
          </h1>
          {SUPPORTED_DELEGATES.map(({ address, name }) => (
            <Link to={address} key={name}>
              <div className="flex flex-col text-left border-[1px] border-gray-200 hover:border-pink rounded-lg px-4 py-2 mb-2">
                <h2 className="text-lg font-semibold">{name}</h2>
                <div className="flex flex-row justify-between gap-2">
                  Address:{" "}
                  <div className="text-right">{truncateString(address, 8)}</div>
                </div>
              </div>
            </Link>
          ))}
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
