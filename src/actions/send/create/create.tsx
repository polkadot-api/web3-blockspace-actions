import { useState } from "react"
import { combineLatest, map } from "rxjs"
import { state, useStateObservable } from "@react-rxjs/core"
import { useNavigate } from "react-router-dom"
import { CopyIcon, CopyCheckIcon } from "lucide-react"
import { twMerge } from "tailwind-merge"

import { formatValue } from "@/components/token-formatter"
import { tokenDecimals } from "@/services/balances"

import { SelectChain, selectedChain$ } from "./select-chain"
import { SelectCurrency, selectedCurrency$ } from "./select-currency"
import { SelectAmount, amount$ } from "./select-amount"
import { SelectRecipient, address$ } from "./select-recipient"

const generatedUrl$ = state(
  combineLatest([selectedChain$, amount$, selectedCurrency$, address$]).pipe(
    map(([chain, amount, ccy, address]) => {
      if (!chain || !amount || !ccy || !address?.isValid) return null

      return `/send/${chain}/${address.address}?amount=${formatValue(amount, tokenDecimals[ccy], false)}&token=${ccy}`
    }),
  ),
  null,
)

export default function CreateSend() {
  const selectedChain = useStateObservable(selectedChain$)
  const generatedUrl = useStateObservable(generatedUrl$)

  const navigate = useNavigate()

  if (!selectedChain) {
    return <div>Loading...</div>
  }

  const handleSubmit = (evt: React.FormEvent) => {
    evt.preventDefault()
    if (!generatedUrl) return

    navigate(generatedUrl)
  }

  return (
    <div className="flex flex-col text-center items-center ">
      <h1 className="text-lg my-5 font-semibold">Create a Send Action</h1>
      <form
        className="flex flex-col gap-2 min-w-[350px] max-w-[400px] text-left  border-[1px] border-gray-200 rounded-lg p-5 mb-5"
        onSubmit={handleSubmit}
      >
        <SelectChain />
        <SelectCurrency />
        <SelectAmount />
        <SelectRecipient />
        <Submit />
      </form>
    </div>
  )
}

const Submit = () => {
  const generatedUrl = useStateObservable(generatedUrl$)

  const [copied, setCopied] = useState(false)
  if (!generatedUrl) return null

  return (
    <div className="flex flex-col items-center gap-2 mt-2">
      <input
        className={twMerge(
          "border p-2 bg-[#ff007b] text-white font-bold cursor-pointer",
          !generatedUrl ? "opacity-50" : "",
        )}
        type="submit"
        value="Create Action"
        disabled={!generatedUrl}
      />
      <span>or</span>

      <div>
        {copied ? (
          <div className="flex flex-row gap-2 font-semibold">
            Copied to clipboard <CopyCheckIcon className="text-green-600" />
          </div>
        ) : (
          <button
            className="flex flex-row gap-2 font-semibold"
            onClick={(evt) => {
              evt.preventDefault()
              navigator.clipboard.writeText(window.location.host + generatedUrl)
              setTimeout(() => {
                setCopied(true)
              }, 200)
            }}
          >
            Copy the generated URL
            <CopyIcon />
          </button>
        )}
      </div>
    </div>
  )
}
