export const decimalSeparatorRegex = ",|."
const parsingRegex = new RegExp(`^(-)?(\\d*)(${decimalSeparatorRegex}(\\d+))?$`)

export const parseCurrency = (
  value: string,
  precision: number,
): bigint | null => {
  if (!value) return null
  const parts = parsingRegex.exec(value)
  if (!parts)
    throw new Error(`Error parsing unnexpected currency value: ${value}`)

  const [, minus, intPartStr, , decimalPartStr] = parts

  const precisionMultiplier = 10n ** BigInt(precision)
  const intPart = BigInt(intPartStr) * precisionMultiplier
  const decPart = decimalPartStr
    ? BigInt(
        (decimalPartStr.length > precision
          ? decimalPartStr.substring(0, precision)
          : decimalPartStr
        ).padEnd(precision, "0"),
      )
    : 0n

  const result = intPart + decPart

  return minus ? 0n - result : result
}
