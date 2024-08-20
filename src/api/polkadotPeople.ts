import { polkadot_people } from "@polkadot-api/descriptors"
import { createClient } from "polkadot-api"
import { getSmProvider } from "polkadot-api/sm-provider"
import { ChainSpec } from "./chainspec"
import { addParachain } from "./client"
import { polkadotChain } from "./polkadot"

export const polkadotPeopleSpec = import("polkadot-api/chains/polkadot_people")
export const decodedPolkadotPeopleSpec = polkadotPeopleSpec.then(
  (v) => JSON.parse(v.chainSpec) as ChainSpec,
)

const chain = addParachain(polkadotChain, polkadotPeopleSpec)
export const polkadotPeopleClient = createClient(getSmProvider(chain))

export const polkadotPeopleApi =
  polkadotPeopleClient.getTypedApi(polkadot_people)
