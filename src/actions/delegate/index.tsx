import { Route, Routes } from "react-router-dom"
import { DelegateAction } from "./DelegateAction"

export default function Delegate() {
  return (
    <Routes>
      <Route path=":chain/*" element={<DelegateAction />} />
    </Routes>
  )
}
