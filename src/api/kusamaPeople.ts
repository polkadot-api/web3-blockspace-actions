import { kusamaPeople } from "@polkadot-api/descriptors"
import { createClient } from "polkadot-api"
import { getSmProvider } from "polkadot-api/sm-provider"
import { ChainSpec } from "./chainspec"
import { addParachain } from "./client"
import { kusamaChain } from "./kusama"

export const kusamaPeopleSpec = import("polkadot-api/chains/ksmcc3_people")
export const decodedKusamaPeopleSpec = kusamaPeopleSpec.then(
  (v) => JSON.parse(v.chainSpec) as ChainSpec,
)

const kusamaPeopleChain = addParachain(kusamaChain, kusamaPeopleSpec)
export const kusamaPeopleClient = createClient(getSmProvider(kusamaPeopleChain))

export const kusamaPeopleApi = kusamaPeopleClient.getTypedApi(kusamaPeople)
