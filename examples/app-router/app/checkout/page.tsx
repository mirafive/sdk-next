import { mira } from "@mirafive/sdk-next/server"

import { Checkout } from "./checkout"

export default function CheckoutPage() {
  // Buffered on the server, sent after the response by after().
  mira().track("checkout_rendered")

  return <Checkout />
}
