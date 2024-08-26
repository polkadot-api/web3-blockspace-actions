export const truncateString = (str: string, length = 8) => {
  if (str.length < length) return str
  return str.slice(0, length / 2) + "…" + str.slice(str.length - length / 2)
}
