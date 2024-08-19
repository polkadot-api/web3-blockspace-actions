export interface ChainSpec {
  name: string
  id: string
  properties: {
    ss58Format: number
    tokenDecimals: number
    tokenSymbol: string
  }
}
