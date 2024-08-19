import { state } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"
import {
  connectInjectedExtension,
  getInjectedExtensions,
  InjectedPolkadotAccount,
} from "polkadot-api/pjs-signer"
import {
  concat,
  defer,
  distinctUntilChanged,
  filter,
  finalize,
  from,
  fromEventPattern,
  interval,
  map,
  merge,
  of,
  retry,
  startWith,
  switchMap,
  take,
  takeUntil,
  timer,
} from "rxjs"

export const extensions$ = state(
  concat(
    timer(0, 100).pipe(
      map(getInjectedExtensions),
      filter((v) => v.length > 0),
      take(1),
    ),
    interval(2000).pipe(map(getInjectedExtensions)),
  ),
  [],
)

const SELECTED_EXTENSION_KEY = "selected-extension"
const [extensionSelected$, selectExtension] = createSignal<string | null>()
extensionSelected$.subscribe((v) =>
  v
    ? localStorage.setItem(SELECTED_EXTENSION_KEY, v)
    : localStorage.removeItem(SELECTED_EXTENSION_KEY),
)
export const selectedExtension$ = state(
  merge(
    defer(() => {
      const preSelectedExtension = localStorage.getItem(SELECTED_EXTENSION_KEY)

      return preSelectedExtension
        ? extensions$.pipe(
            filter((extensions) => extensions.includes(preSelectedExtension)),
            map(() => preSelectedExtension),
            take(1),
            takeUntil(extensionSelected$),
          )
        : []
    }),
    extensionSelected$,
  ),
  null,
)

export const extensionAccounts$ = state(
  selectedExtension$.pipe(
    distinctUntilChanged(),
    switchMap((extension) =>
      extension
        ? from(connectInjectedExtension(extension)).pipe(
            switchMap((extension) =>
              fromEventPattern<InjectedPolkadotAccount[]>(
                extension.subscribe,
                (_, fn) => fn(),
              ).pipe(
                startWith(extension.getAccounts()),
                finalize(extension.disconnect),
              ),
            ),
            retry({
              delay: 100,
            }),
          )
        : of([]),
    ),
  ),
  [],
)

const SELECTED_ACCOUNT_KEY = "selected-account"
const [accountSelected$, selectAccount] =
  createSignal<InjectedPolkadotAccount | null>()
accountSelected$.subscribe((v) =>
  v
    ? localStorage.setItem(SELECTED_ACCOUNT_KEY, v.address)
    : localStorage.removeItem(SELECTED_ACCOUNT_KEY),
)

export const selectedAccount$ = state(
  merge(
    defer(() => {
      const preSelectedAccount = localStorage.getItem(SELECTED_ACCOUNT_KEY)

      return preSelectedAccount
        ? extensionAccounts$.pipe(
            map((accounts) =>
              accounts.find((acc) => acc.address === preSelectedAccount),
            ),
            filter(Boolean),
            take(1),
            takeUntil(accountSelected$),
          )
        : []
    }),
    accountSelected$,
  ),
  null,
)

export { selectAccount, selectExtension }
