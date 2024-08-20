import { state, useStateObservable } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"
import { FC, useEffect } from "react"
import { Portal } from "react-portal"
import { twMerge } from "tailwind-merge"
import {
  extensionAccounts$,
  extensions$,
  selectAccount,
  selectedAccount$,
  selectedExtension$,
  selectExtension,
} from "./services/accounts"
import { truncateAddress } from "./utils/address"

const [openChange$, setAccountPickerOpen] = createSignal<boolean>()
// eslint-disable-next-line react-refresh/only-export-components
export { setAccountPickerOpen }
const pickerOpen$ = state(openChange$, false)

export const AccountSelector: React.FC = () => {
  const selectedAccount = useStateObservable(selectedAccount$)

  const buttonStyles = selectedAccount
    ? selectedAccount.name
      ? "font-bold"
      : ""
    : "font-bold bg-[#ff007b] text-white"

  return (
    <div>
      <button
        className={twMerge(
          "border border-[#ff007b] rounded-full px-4 hover:bg-gray-200",
          buttonStyles,
        )}
        onClick={() => setAccountPickerOpen(true)}
      >
        {selectedAccount
          ? (selectedAccount.name ??
            truncateAddress(selectedAccount.address, 16))
          : "Select your account"}
      </button>
      {useStateObservable(pickerOpen$) ? <AccountPickerModal /> : null}
    </div>
  )
}

const AccountPickerModal = () => {
  const close = () => setAccountPickerOpen(false)

  useEffect(() => {
    const handler = (evt: KeyboardEvent) =>
      evt.key === "Escape" ? close() : null
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  return (
    <Portal>
      <div
        className="fixed top-0 bottom-0 left-0 right-0 bg-gray-300 bg-opacity-50 flex justify-center items-center"
        onClick={close}
      >
        <div
          className="bg-white w-full max-w-screen-sm shadow p-2 min-h-40"
          onClick={(e) => e.stopPropagation()}
        >
          <ExtensionPicker />
          <AccountPicker />
        </div>
      </div>
    </Portal>
  )
}

const ExtensionPicker = () => {
  const extensions = useStateObservable(extensions$)

  return (
    <div>
      <p>Select the extension you want to connect with</p>
      {extensions.length ? (
        <ul className="flex gap-2 p-2">
          {extensions.map((extension) => (
            <ExtensionOption key={extension} extension={extension} />
          ))}
        </ul>
      ) : (
        <p className="p-2 text-slate-900">No extensions could be detected.</p>
      )}
    </div>
  )
}
const ExtensionOption: FC<{ extension: string }> = ({ extension }) => {
  const isSelected = useStateObservable(selectedExtension$) === extension

  return (
    <label className="border rounded p-2 flex gap-2">
      <input
        type="radio"
        checked={isSelected}
        onChange={() => selectExtension(extension)}
      />
      {extension}
    </label>
  )
}

const AccountPicker = () => {
  const accounts = useStateObservable(extensionAccounts$)
  const hasSelectedExtensions = useStateObservable(selectedExtension$) != null

  if (!hasSelectedExtensions) return null

  if (!accounts.length) {
    return (
      <div className="p-2">
        The selected extension is not reporting any account
      </div>
    )
  }

  return (
    <div>
      <p>Select the account</p>
      <ul className="p-2">
        {accounts.map((account) => (
          <li key={account.address}>
            <button
              className={twMerge(
                "flex flex-col border rounded px-2 py-1 my-1 w-full",
              )}
              onClick={() => {
                selectAccount(account)
                setAccountPickerOpen(false)
              }}
            >
              <span className="font-bold">{account.name}</span>
              <span>{truncateAddress(account.address, 16)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
