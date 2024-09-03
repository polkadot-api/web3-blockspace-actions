import { formatCurrency } from "@/utils/format-currency"

export const FormattedToken: React.FC<{
  ticker: string
  decimals: number
  value: bigint | null
}> = ({ ticker, decimals, value }) => {
  return (
    <>
      {value === null
        ? "Loading..."
        : formatCurrency(value, decimals, {
            nDecimals: 4,
          }) +
          " " +
          ticker}
    </>
  )
}
