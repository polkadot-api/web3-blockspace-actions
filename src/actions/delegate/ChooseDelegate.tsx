import { Link } from "react-router-dom"

const SUPPORTED_DELEGATES: Array<{ address: string; name: string }> = [
  {
    name: "BIRDO",
    address: "13EyMuuDHwtq5RD6w3psCJ9WvJFZzDDion6Fd2FVAqxz1g7K",
  },
  {
    name: "ChaosDAO",
    address: "12s37eSMQPEN5cuVyBxk2UypUHntwumqBHy7sJkoKpZ1v3HV",
  },
]

export const ChooseDelegate = () => {
  return (
    <div className="flex flex-col text-center items-center">
      <h1 className="text-lg my-5 font-semibold">Choose delegate</h1>
      {SUPPORTED_DELEGATES.map(({ address, name }) => (
        <Link to={address}>
          <div className="flex flex-col text-left  border-[1px] border-gray-200 rounded-lg p-5">
            <h2 className="text-lg font-semibold">{name}</h2>
            <div className="flex flex-row justify-between gap-2">
              Address: <div className="text-right">{address}</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
