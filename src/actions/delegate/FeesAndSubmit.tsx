import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PolkadotSigner, Transaction } from "polkadot-api"
import React, {
  MutableRefObject,
  PropsWithChildren,
  useEffect,
  useRef,
  useState,
} from "react"
import { cn, formatCurrency, shortStr } from "@/lib/utils"
import { InjectedPolkadotAccount } from "polkadot-api/pjs-signer"

const FormattedToken: React.FC<{
  ticker: string
  decimals: number
  value: bigint | null
}> = ({ ticker, decimals, value }) => {
  return (
    <>
      {value === null
        ? "Loading..."
        : formatCurrency(value, decimals, {
            nDecimals: 4,
          }) +
          " " +
          ticker}
    </>
  )
}

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
                          `The transaction was found in a best block (${e.block.number}-${shortStr(8, e.block.hash)}), ${
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
                      `The transaction is in a finalized block (${e.block.number}-${shortStr(8, e.block.hash)}), ${
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

export const FeesAndSubmit: React.FC<
  PropsWithChildren<{
    txCall: Transaction<any, any, any, any> | null
    account: InjectedPolkadotAccount
    decimals: number
    ticker: string
  }>
> = ({ decimals, ticker, account, txCall, children }) => {
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
              <FormattedToken
                ticker={ticker}
                decimals={decimals}
                value={fees}
              />
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
