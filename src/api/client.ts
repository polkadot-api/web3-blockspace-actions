import { Chain } from "polkadot-api/smoldot"
import { startFromWorker } from "polkadot-api/smoldot/from-worker"
import SmWorker from "polkadot-api/smoldot/worker?worker"

export const smoldot = startFromWorker(new SmWorker())

export const addParachain = (
  relayChain: Promise<Chain>,
  parachainSpec: Promise<{ chainSpec: string }>,
) =>
  Promise.all([relayChain, parachainSpec]).then(([relayChain, parachain]) =>
    smoldot.addChain({
      chainSpec: parachain.chainSpec,
      potentialRelayChains: [relayChain],
    }),
  )
