import { map } from "rxjs"
import { state, useStateObservable } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"
import { getSs58AddressInfo } from "polkadot-api"

const [addressChanged$, setAddress] = createSignal<string>()

export const address$ = state(
  addressChanged$.pipe(
    map((address) => ({ ...getSs58AddressInfo(address ?? ""), address })),
  ),
  { address: "", isValid: false },
)

export const SelectRecipient: React.FC = () => {
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
