import { Suspense } from "react"
import { Route, Routes } from "react-router-dom"
import { Send, Void } from "./actions"
import { Header } from "./Header"

function App() {
  return (
    <div className="shadow max-w-screen-md m-auto p-2">
      <Header />
      <Suspense fallback="Loading">
        <Routes>
          <Route path="/" element={<Void />} />
          <Route path="/send/*" element={<Send />} />
          <Route path="*" element="Not found" />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App
