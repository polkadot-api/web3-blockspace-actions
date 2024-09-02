export const allTokens = {
  DOT: { decimals: 10 },
  USDT: { decimals: 6 },
  USDC: { decimals: 6 },
  WND: { decimals: 12 },
  ROC: { decimals: 12 },
} as const

export type SupportedTokens = keyof typeof allTokens

export function isSupportedToken(token: string): token is SupportedTokens {
  return token in allTokens
}
