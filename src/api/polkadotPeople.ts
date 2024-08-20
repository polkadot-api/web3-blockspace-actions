import { polkadot_people } from "@polkadot-api/descriptors"
import { createClient } from "polkadot-api"
import { getSmProvider } from "polkadot-api/sm-provider"
import { addParachain } from "./client"
import { polkadotChain } from "./polkadot"

export const polkadotPeopleSpec = import("polkadot-api/chains/polkadot_people")
export const decodedPolkadotPeopleSpec = polkadotPeopleSpec.then((v) =>
  JSON.parse(v.chainSpec),
)

const chain = addParachain(polkadotChain, polkadotPeopleSpec)
const client = createClient(getSmProvider(chain))

export const polkadotPeopleApi = client.getTypedApi(polkadot_people)
