export const truncateAddress = (address: string, length = 8) => {
  if (address.length < length) return address
  return (
    address.slice(0, length / 2) +
    "…" +
    address.slice(address.length - length / 2)
  )
}
