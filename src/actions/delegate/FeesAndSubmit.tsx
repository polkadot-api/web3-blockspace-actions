import React, {
  MutableRefObject,
  PropsWithChildren,
  useEffect,
  useRef,
  useState,
} from "react"
import { concat, map, of, switchMap, combineLatest } from "rxjs"
import { state, SUSPENSE, useStateObservable } from "@react-rxjs/core"
import { PolkadotSigner, Transaction } from "polkadot-api"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/utils/format-currency"
import { truncateString } from "@/utils/string"
import { routeDelegateAccount$ } from "./DelegateContext"
import { delegate } from "@/api/delegation"
import { selectedAccount$ } from "@/services/accounts"

import { FormattedToken } from "./FormattedToken"
import { conviction$, convictionVotes } from "./ChooseConviction"
import { amount$, maxDelegation$ } from "./ChooseAmount"
import { parsedTrack$ } from "./ChooseTracks"
import { useDelegateContext } from "./DelegateContext"
import { DelegatableChain } from "@/api"

const delegateTx$ = (chain: DelegatableChain) =>
  state(
    combineLatest([
      selectedAccount$,
      routeDelegateAccount$,
      conviction$.pipe(map((x) => (x === SUSPENSE ? null : x))),
      amount$.pipe(map((x) => (x === SUSPENSE ? null : x))),
      parsedTrack$,
      maxDelegation$(chain),
    ]).pipe(
      map(
        ([
          selectedAccount,
          delegateAccount,
          conviction,
          amount,
          tracks,
          maxDelegation,
        ]) => {
          return !selectedAccount ||
            !delegateAccount ||
            conviction == null ||
            amount == null
            ? null
            : ([
                selectedAccount.address,
                delegateAccount,
                conviction,
                amount,
                tracks,
                maxDelegation,
              ] as const)
        },
      ),
      switchMap((x) => {
        if (x === null) return of(null)
        const [from, target, conviction, amount, tracks, maxDelegation] = x
        if (tracks.length === 0 || amount === 0n || amount > maxDelegation)
          return of(null)

        return concat(
          of(null),
          delegate(
            from,
            target,
            convictionVotes[conviction],
            amount,
            tracks,
            chain,
          ),
        )
      }),
    ),
    null,
  )

const SubmitDialog: React.FC<
  PropsWithChildren<{
    signer: PolkadotSigner
    signSubmitAndWatch: MutableRefObject<
      Transaction<any, any, any, any>["signSubmitAndWatch"] | undefined
    >
  }>
> = ({ signer, signSubmitAndWatch, children }) => {
  const [dialogText, setDialogText] = useState<string>()
  const [openDialog, setOpenDialog] = useState<boolean>(false)
  return (
    <Dialog open={openDialog}>
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            setDialogText("Wating for the transaction to be signed")
            setOpenDialog(true)
            signSubmitAndWatch.current!(signer).subscribe({
              next: (e) => {
                switch (e.type) {
                  case "signed": {
                    setDialogText("The transaction has been signed")
                    break
                  }
                  case "broadcasted": {
                    setDialogText(
                      "The transaction has been validated and broadcasted",
                    )
                    break
                  }
                  case "txBestBlocksState": {
                    e.found
                      ? setDialogText(
                          `The transaction was found in a best block (${e.block.number}-${truncateString(e.block.hash, 16)}), ${
                            e.ok
                              ? "and it's being successful! 🎉"
                              : "but it's failing... 😞"
                          }`,
                        )
                      : e.isValid
                        ? setDialogText(
                            "The transaction has been validated and broadcasted",
                          )
                        : setDialogText(
                            "The transaction is not valid anymore in the latest known best block",
                          )
                    break
                  }
                  case "finalized": {
                    setDialogText(
                      `The transaction is in a finalized block (${e.block.number}-${truncateString(e.block.hash, 16)}), ${
                        e.ok
                          ? "and it was successful! 🎉"
                          : "but it failed... 😞"
                      }`,
                    )
                    setTimeout(() => {
                      setOpenDialog(false)
                    }, 3_000)
                  }
                }
              },
              error: (e) => {
                setDialogText("An error ocurred, please try again later.")
                console.error(e)

                setTimeout(() => {
                  setOpenDialog(false)
                }, 3_000)
              },
            })
          }}
          className="w-full"
        >
          Delegate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{children}</DialogTitle>
        <DialogDescription>{dialogText}</DialogDescription>
      </DialogContent>
    </Dialog>
  )
}

export const FeesAndSubmit: React.FC<PropsWithChildren> = ({ children }) => {
  const { chain } = useDelegateContext()
  const txCall = useStateObservable(delegateTx$(chain))
  const account = useStateObservable(selectedAccount$)!

  const { decimals, token } = useDelegateContext()

  const [fees, setFees] = useState<bigint | null>()
  const signSubmitAndWatch =
    useRef<Transaction<any, any, any, any>["signSubmitAndWatch"]>()

  useEffect(() => {
    if (!txCall) return
    let token: any = setTimeout(() => {
      signSubmitAndWatch.current = txCall.signSubmitAndWatch
      txCall.getEstimatedFees(account.address).then((fees) => {
        if (token) setFees(fees)
      })
    }, 50)

    return () => {
      signSubmitAndWatch.current = undefined
      clearTimeout(token)
      token = null
    }
  }, [txCall])

  return (
    <>
      <ul className="grid gap-3 m-1">
        <li className="flex items-center justify-between">
          <span
            className={cn(
              "text-muted-foreground",
              txCall === null ? "invisible" : "",
            )}
          >
            Estimated fees
          </span>
          <span>
            {fees ? (
              <FormattedToken ticker={token} decimals={decimals} value={fees} />
            ) : (
              txCall && "Loading"
            )}
          </span>
        </li>
      </ul>
      {txCall ? (
        <SubmitDialog
          signSubmitAndWatch={signSubmitAndWatch}
          signer={account.polkadotSigner}
        >
          {children}
        </SubmitDialog>
      ) : null}
    </>
  )
}
