"use client"

import { useTrackOnMount } from "@mirafive/sdk-next"

export function Checkout() {
  useTrackOnMount("checkout_viewed")

  return (
    <main>
      <h1>Checkout</h1>
    </main>
  )
}
