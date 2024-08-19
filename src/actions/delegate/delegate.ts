import { routeMatch$ } from "@/router"
import { map } from "rxjs"
import { state } from "@react-rxjs/core"

const PATTERN_CHAIN = "/delegate/:chain/*"
const PATTERN_ACCOUNT = "/delegate/:chain/:account/*"

export const chain$ = state(
  routeMatch$(PATTERN_CHAIN).pipe(
    map((routeData) => routeData?.params?.chain ?? null),
  ),
  null,
)

export const delegateAccount$ = state(
  routeMatch$(PATTERN_ACCOUNT).pipe(
    map((routeData) => routeData?.params?.account ?? null),
  ),
  null,
)
