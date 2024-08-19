import { Route, Routes } from "react-router-dom"
import { SendAction } from "./SendAction"

export default function Send() {
  return (
    <Routes>
      <Route path=":chain/:account" element={<SendAction />} />
    </Routes>
  )
}
