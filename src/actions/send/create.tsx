import { allChains, ChainId } from "@/api"
import { formatValue } from "@/components/token-formatter"
import { TokenInput } from "@/components/TokenInput"
import { chains, SupportedTokens, tokenDecimals } from "@/services/balances"
import { state, useStateObservable, withDefault } from "@react-rxjs/core"
import { createSignal, mergeWithKey } from "@react-rxjs/utils"
import { useNavigate } from "react-router-dom"
import { combineLatest, filter, map, merge, scan, take } from "rxjs"
import { twMerge } from "tailwind-merge"

const chains$ = state(
  combineLatest(
    Object.entries(allChains).map(([id, chain]) =>
      chain.chainSpec.then((spec) => ({ id, name: spec.name })),
    ),
  ).pipe(map((v) => v.filter(Boolean))),
  [],
)
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
const amount$ = state(amountChanged$, null)

const [addressChanged$, setAddress] = createSignal<string>()
const address$ = state(addressChanged$, null)

export default function CreateSend() {
  const chains = useStateObservable(chains$)
  const selectedChain = useStateObservable(selectedChain$)
  const currencies = useStateObservable(supportedCurrencies$)
  const selectedCurrency = useStateObservable(selectedCurrency$)
  const amount = useStateObservable(amount$)
  const address = useStateObservable(address$)
  const navigate = useNavigate()

  if (!selectedChain) {
    return "Loading..."
  }

  const disabled = !selectedCurrency || !amount || !address
  const handleSubmit = (evt: React.FormEvent) => {
    evt.preventDefault()
    if (disabled) return

    navigate(
      `/send/${selectedChain}/${address}?amount=${formatValue(amount, tokenDecimals[selectedCurrency], false)}&token=${selectedCurrency}`,
    )
  }

  const generatedUrl =
    !disabled &&
    `/send/${selectedChain}/${address}?amount=${formatValue(amount, tokenDecimals[selectedCurrency], false)}&token=${selectedCurrency}`

  return (
    <div className="flex flex-col text-center items-center ">
      <h1 className="text-lg my-5 font-semibold">Create Send Action</h1>
      <form
        className="flex flex-col gap-2 min-w-[350px] max-w-[400px] text-left  border-[1px] border-gray-200 rounded-lg p-5 mb-5"
        onSubmit={handleSubmit}
      >
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

        <label className="flex flex-row justify-between items-center gap-2">
          <span>Currency:</span>
          <select
            className="border p-2 rounded flex-1"
            value={selectedCurrency ?? ""}
            onChange={(evt) =>
              selectCurrency(evt.target.value as SupportedTokens)
            }
            disabled={currencies.length <= 1}
          >
            {currencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </label>

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
        <label className="flex flex-row items-center justify-between gap-2">
          <span>Recipient:</span>
          <input
            type="text"
            className="p-2 border rounded flex-1"
            placeholder="Enter address..."
            value={address ?? ""}
            onChange={(evt) => setAddress(evt.target.value)}
          />
        </label>
        <input
          className={twMerge(
            "border p-2 bg-[#ff007b] text-white font-bold cursor-pointer",
            disabled ? "opacity-50" : "",
          )}
          type="submit"
          value="Create Action"
          disabled={disabled}
        />
      </form>
    </div>
  )
}
