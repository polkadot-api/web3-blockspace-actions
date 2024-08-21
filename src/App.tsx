import { Suspense } from "react"
import { Link, Route, Routes } from "react-router-dom"
import { CreateSend, Delegate, Send } from "./actions"
import { Header } from "./Header"

function App() {
  return (
    <div className="shadow max-w-screen-md m-auto p-2">
      <Header />
      <Suspense fallback="Loading">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/createAction/send" element={<CreateSend />} />
          <Route path="/send/*" element={<Send />} />
          <Route path="/delegate/*" element={<Delegate />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </div>
  )
}

const LandingPage = () => (
  <div className="p-2 leading-loose">
    <h1 className="text-center font-bold text-2xl text-[#ff007b]">
      PAPI Actions
    </h1>
    <p className="text-slate-800">
      Create intents to simplify common actions for users.
    </p>
    <p className="">Select the action you want to create:</p>
    <ul className="px-2">
      <li>
        <Link className="text-[#ff007b]" to="/createAction/send">
          Send
        </Link>
        : Action to send tokens to a predefined address.
      </li>
      <li>
        <Link className="text-[#ff007b]" to="/delegate">
          Delegate
        </Link>
        : Action to set up vote delegation.
      </li>
    </ul>
  </div>
)

const NotFoundPage = () => (
  <div className="p-2 leading-loose">
    <h1 className="text-center font-bold text-2xl text-[#ff007b]">
      PAPI Actions
    </h1>
    <p className="text-center">Action not found</p>
    <p className="text-slate-800">Nothing to see here, move along</p>
  </div>
)

export default App
