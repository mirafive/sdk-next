"use client"

import { useFlag, useFlagConfig, useTrackOnMount } from "@mirafive/sdk-next"

export function Checkout() {
  const newCheckout = useFlag("new-checkout", false)
  const { max } = useFlagConfig("limits", { max: 1 })

  useTrackOnMount("checkout_viewed", { variant: String(newCheckout) })

  return (
    <main>
      <h1>{newCheckout === true ? "New checkout" : "Checkout"}</h1>
      <p>Up to {max} items.</p>
    </main>
  )
}
