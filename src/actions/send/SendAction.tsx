import { useMatch } from "react-router-dom"

const PATTERN = "/send/:chain/:account"

export const SendAction = () => {
  return <div>{"Send it " + JSON.stringify(useMatch(PATTERN)?.params)}</div>
}
