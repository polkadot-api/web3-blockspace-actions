import { useStateObservable, state } from "@react-rxjs/core"
import { submitTransfer$, transferStatus$, senderChainId$ } from "./send"
import { useEffect, useState } from "react"
import * as Progress from "@radix-ui/react-progress"
import { allChains, ChainId } from "@/api"
import { of } from "rxjs"

const subscriptions = transferStatus$.subscribe()

// const finalizedBlock$ = state((chainId: ChainId | "") =>
//   chainId === "" ? of(null) : allChains[chainId].client.finalizedBlock$,
// )

export default function Submit() {
  const txStatus = useStateObservable(transferStatus$)
  const selectedChain = useStateObservable(senderChainId$)!
  //   const finalizedBlock = useStateObservable(finalizedBlock$(selectedChain))
  //   const [firstBestBlock, setFirstBestBlock] = useState<number | null>(null)

  const [isSubmitting, setSubmitting] = useState(false)
  const [isTransacting, setIsTransacting] = useState(false)

  const [progress, setProgress] = useState(2)

  useEffect(() => {
    setProgress(5)
  }, [isSubmitting])

  useEffect(() => {
    switch (txStatus?.type) {
      case "signed": {
        setProgress(25)
        setIsTransacting(true)
        break
      }
      case "broadcasted":
        setProgress(50)
        break
      case "txBestBlocksState":
        setProgress(75)
        // set micro progress per block
        break
      case "finalized":
        setProgress(100)
        break
    }
  }, [txStatus])

  return (
    <div>
      {isTransacting ? (
        <>
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
          {txStatus?.type}
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
