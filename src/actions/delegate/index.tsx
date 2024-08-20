import { Route, Routes, Navigate } from "react-router-dom"
import { DelegateAction } from "./DelegateAction"
import { ChooseDelegate } from "./ChooseDelegate"
import { ChooseChain } from "./ChooseChain"

export default function Delegate() {
  return (
    <Routes>
      <Route path=":chain/:account" element={<DelegateAction />} />
      <Route path=":chain/:account/*" element={<Navigate to="." replace />} />
      <Route path=":chain" element={<ChooseDelegate />} />
      <Route path="" element={<ChooseChain />} />
    </Routes>
  )
}
