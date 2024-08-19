import { polkadot_people } from "@polkadot-api/descriptors"
import { createClient } from "polkadot-api"
import { getSmProvider } from "polkadot-api/sm-provider"
import { smoldot } from "./client"

export const polkadotPeopleSpec = import("polkadot-api/chains/polkadot_people")
export const decodedPolkadotPeopleSpec = polkadotPeopleSpec.then((v) =>
  JSON.parse(v.chainSpec),
)

const chain = polkadotPeopleSpec.then(smoldot.addChain)
const client = createClient(getSmProvider(chain))

export const polkadotPeopleApi = client.getTypedApi(polkadot_people)
