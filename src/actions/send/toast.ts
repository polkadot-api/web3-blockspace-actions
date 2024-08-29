import { toast } from "react-toastify"

export const errorToast = (error: string) =>
  toast(error, {
    type: "error",
  })

export const successToast = (message: string) =>
  toast(message, {
    type: "success",
  })
