import { state } from "@react-rxjs/core"
import {
  BrowserHistory,
  createBrowserHistory,
  matchPath,
  PathPattern,
} from "@remix-run/router"
import type { Listener, Update } from "@remix-run/router/dist/history"
import { defer, fromEventPattern, map, merge, of, share } from "rxjs"

const _history = createBrowserHistory({
  v5Compat: true,
})

// react-router has moved away from `history`, and made their own version in their repo
// in this version they have added multiple features, but removed the ability of having more than one listener
// it's important to have a shared event then (and even pass the shared version to react-router)
export const historyUpdate$ = fromEventPattern<Update>(
  (handler) => _history.listen(handler),
  (_, r) => r(),
).pipe(share())

export const history = new Proxy(_history, {
  get(target, p: keyof BrowserHistory) {
    if (p === "listen") {
      return (listener: Listener) => {
        const subscription = historyUpdate$.subscribe(listener)
        return () => subscription.unsubscribe()
      }
    }
    return target[p]
  },
})

export const location$ = state(
  merge(
    defer(() => of(_history.location)),
    historyUpdate$.pipe(map((v) => v.location)),
  ),
)

export const routeMatch$ = (pattern: PathPattern | string) =>
  location$.pipe(
    map((v) => {
      const match = matchPath(pattern, v.pathname)
      return match
        ? {
            ...v,
            params: match.params,
            searchParams: new URLSearchParams(v.search),
          }
        : null
    }),
  )
