import { useState } from "react"
import { combineLatest, filter, map, merge, scan, take } from "rxjs"
import { state, useStateObservable, withDefault } from "@react-rxjs/core"
import { createSignal, mergeWithKey } from "@react-rxjs/utils"
import { useNavigate } from "react-router-dom"
import { CopyIcon, CopyCheckIcon } from "lucide-react"
import { twMerge } from "tailwind-merge"
import { getSs58AddressInfo } from "polkadot-api"

import { allChains, ChainId } from "@/api"
import { formatValue } from "@/components/token-formatter"
import { TokenInput } from "@/components/TokenInput"
import { chains, SupportedTokens, tokenDecimals } from "@/services/balances"
import { abs } from "@/utils/bigint"

const chains$ = state(
  combineLatest(
    Object.entries(allChains).map(([id, chain]) =>
      chain.chainSpec.then((spec) => ({ id, name: spec.name })),
    ),
  ).pipe(map((v) => v.filter(Boolean))),
  [],
)

// todo: move to chain definition
const chainCurrencies: Partial<Record<ChainId, SupportedTokens[]>> = {
  polkadotAssetHub: ["USDC", "USDT"],
  rococoAssetHub: ["WND"],
  westendAssetHub: ["ROC"],
}

const [chainSelected$, selectChain] = createSignal<ChainId | null>()
const selectedChain$ = state(
  merge(
    chains$.pipe(
      filter((v) => v.length > 0),
      take(1),
      map((v) => v[0].id as ChainId),
    ),
    chainSelected$,
  ),
  null,
)
const supportedCurrencies$ = selectedChain$.pipeState(
  map((v): SupportedTokens[] => {
    const nativeToken = chains.find((c) => c.id === v)?.nativeToken ?? "DOT"

    return [nativeToken, ...((v ? chainCurrencies[v] : null) ?? [])]
  }),
  withDefault([] as SupportedTokens[]),
)
const [currencySelected$, selectCurrency] = createSignal<SupportedTokens>()
const selectedCurrency$ = state(
  mergeWithKey({
    currencies: supportedCurrencies$,
    selection: currencySelected$,
  }).pipe(
    scan(
      (selected, evt): SupportedTokens =>
        evt.type === "selection"
          ? evt.payload
          : evt.payload.includes(selected)
            ? selected
            : evt.payload[0],
      "" as SupportedTokens,
    ),
  ),
  null,
)

const [amountChanged$, setAmount] = createSignal<bigint | null>()
const amount$ = state(
  amountChanged$.pipe(map((amt) => (amt ? abs(amt) : amt))),
  null,
)

const [addressChanged$, setAddress] = createSignal<string>()

const address$ = state(
  addressChanged$.pipe(
    map((address) => ({ ...getSs58AddressInfo(address ?? ""), address })),
  ),
  { address: "", isValid: false },
)

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

const SelectChain: React.FC = () => {
  const selectedChain = useStateObservable(selectedChain$)
  const chains = useStateObservable(chains$)

  return (
    <label className="flex flex-row justify-between items-center gap-2">
      <span>Chain:</span>
      <select
        className="border p-2 rounded flex-1"
        value={selectedChain ?? ""}
        onChange={(evt) => selectChain(evt.target.value as ChainId)}
      >
        {chains.map((chain) => (
          <option key={chain.id} value={chain.id}>
            {chain.name}
          </option>
        ))}
      </select>
    </label>
  )
}

const SelectCurrency: React.FC = () => {
  const currencies = useStateObservable(supportedCurrencies$)
  const selectedCurrency = useStateObservable(selectedCurrency$)

  return (
    <label className="flex flex-row justify-between items-center gap-2">
      <span>Currency:</span>
      <select
        className="border p-2 rounded flex-1"
        value={selectedCurrency ?? ""}
        onChange={(evt) => selectCurrency(evt.target.value as SupportedTokens)}
        disabled={currencies.length <= 1}
      >
        {currencies.map((currency) => (
          <option key={currency} value={currency}>
            {currency}
          </option>
        ))}
      </select>
    </label>
  )
}

const SelectAmount: React.FC = () => {
  const amount = useStateObservable(amount$)
  const selectedCurrency = useStateObservable(selectedCurrency$)

  return (
    <label className="flex flex-row items-center justify-between gap-2">
      <span>Amount:</span>
      {selectedCurrency ? (
        <TokenInput
          token={{
            name: selectedCurrency,
            decimals: tokenDecimals[selectedCurrency],
          }}
          value={amount}
          onChange={setAmount}
        />
      ) : null}
    </label>
  )
}

const SelectRecipient: React.FC = () => {
  const address = useStateObservable(address$)
  return (
    <div>
      <label className="flex flex-row items-center justify-between gap-2">
        <span>Recipient:</span>
        <input
          type="text"
          className="p-2 border rounded flex-1"
          placeholder="Enter address..."
          value={address.address}
          onChange={(evt) => setAddress(evt.target.value)}
        />
      </label>
      {address.address !== "" && !address.isValid ? (
        <span className="text-destructive">Invalid address.</span>
      ) : null}
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
