import * as Progress from "@radix-ui/react-progress"
import { useStateObservable } from "@react-rxjs/core"
import { useEffect, useState } from "react"
import { senderChainId$, submitTransfer$, transferStatus$ } from "./send"
import { state } from "@react-rxjs/core"
import { allChains, ChainId } from "@/api"
import { of, merge } from "rxjs"

const finalizedBlock$ = state(
  (chainId: ChainId | "") =>
    chainId === "" ? of(null) : allChains[chainId].client.finalizedBlock$,
  null,
)

const subscriptions = state(merge(transferStatus$)).subscribe()

export default function Submit() {
  const txStatus = useStateObservable(transferStatus$)
  const selectedChain = useStateObservable(senderChainId$)!
  const finalizedBlock = useStateObservable(finalizedBlock$(selectedChain))

  const [isSubmitting, setSubmitting] = useState(false)
  const [isTransacting, setIsTransacting] = useState(false)
  const [statusLabel, setStatusLabel] = useState("")

  const [progress, setProgress] = useState(2)

  useEffect(() => {
    setProgress(5)
  }, [isSubmitting])

  useEffect(() => {
    switch (txStatus?.type) {
      case "signed": {
        setProgress(25)
        setIsTransacting(true)
        setStatusLabel("Transaction Signed successfully. Broadcasting...")
        break
      }
      case "broadcasted":
        setProgress(50)
        setStatusLabel("Broadcasting complete. Sending to best blocks")
        break
      case "txBestBlocksState":
        setProgress(75)
        setStatusLabel("In best blocks state: ")
        // set micro progress per block
        break
      case "finalized":
        setProgress(100)
        setStatusLabel("Transaction completed successfully!")

        // setTimeout(() => )
        break
    }
  }, [txStatus])

  return (
    <div className="mb-5">
      {isTransacting ? (
        <>
          <div className="mb-4 text-pink font-semibold flex flex-col">
            <span>{statusLabel}</span>
            {txStatus?.type === "txBestBlocksState" && txStatus.found === true
              ? `${finalizedBlock?.number}/${txStatus.block.number}`
              : null}
          </div>
          <Progress.Root
            value={progress}
            className="bg-pink w-[350px] h-4 relative overflow-hidden rounded-xl"
          >
            <Progress.Indicator
              className="bg-purple-600 w-full h-full"
              style={{
                transition: "transform 660ms cubic-bezier(0.65, 0, 0.35, 1)",
                transform: `translateX(-${100 - progress}%)`,
              }}
            />
          </Progress.Root>
        </>
      ) : (
        <>
          <button
            className={`rounded mb-10 bg-pink p-2 text-white w-40 ${!selectedChain || isSubmitting ? "opacity-80" : ""}`}
            disabled={!selectedChain || isSubmitting}
            onClick={() => {
              submitTransfer$()
              setSubmitting(true)
            }}
          >
            {isSubmitting ? "Sign transaction" : "Send Transaction"}
          </button>
        </>
      )}
    </div>
  )
}
