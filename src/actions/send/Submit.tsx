import { useStateObservable } from "@react-rxjs/core"
import { submitTransfer$, transferStatus$, senderChainId$ } from "./send"
import { useState } from "react"

const subscriptions = transferStatus$.subscribe()

export default function Submit() {
  const txStatus = useStateObservable(transferStatus$)
  const selectedChain = useStateObservable(senderChainId$)

  const [isSubmitting, setSubmitting] = useState(false)

  return (
    <button
      className={`rounded bg-pink-500 p-2 text-white w-40 ${!selectedChain || isSubmitting ? "opacity-80" : ""}`}
      disabled={!selectedChain || isSubmitting}
      onClick={() => {
        submitTransfer$()
        setSubmitting(true)
      }}
    >
      {isSubmitting ? "Sending..." : "Send Transaction"}
    </button>
  )
}
