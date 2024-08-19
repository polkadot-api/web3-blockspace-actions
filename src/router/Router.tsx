import { unstable_HistoryRouter } from "react-router-dom"
import { history } from "./history"

const HistoryRouter = unstable_HistoryRouter

export const Router: FCC = (props) => (
  <HistoryRouter
    history={history}
    basename={import.meta.env.VITE_BASE_NAME}
    {...props}
  />
)
