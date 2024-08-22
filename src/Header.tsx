import { Link } from "react-router-dom"
import { AccountSelector } from "./AccountSelector"

export const Header = () => {
  return (
    <div className="flex justify-between">
      <Link
        className="text-pink border-[1px] font-semibold border-pink rounded-xl px-3 hover:bg-pink hover:text-white"
        to="/"
      >
        Home
      </Link>
      <AccountSelector />
    </div>
  )
}
