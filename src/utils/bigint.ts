type BigNumber = {
  value: bigint
  precision: bigint
}

export const divideBigInt = (
  numerator: BigNumber,
  denominator: BigNumber,
  targetPrecision?: bigint,
) => {
  const precision = targetPrecision ?? numerator.precision
  return (
    (10n ** precision * (numerator.value * 10n ** denominator.precision)) /
    denominator.value /
    10n ** numerator.precision
  )
}
