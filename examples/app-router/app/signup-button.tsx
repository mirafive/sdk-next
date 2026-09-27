"use client"

import { useMira } from "@mirafive/sdk-next"

export function SignupButton() {
  const mira = useMira()

  return (
    <button type="button" onClick={() => mira.track("signup_clicked", { plan: "pro" })}>
      Sign up
    </button>
  )
}
