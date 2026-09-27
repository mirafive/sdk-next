"use client"

import { flags } from "@mirafive/sdk-browser/flags"
import { MiraProvider } from "@mirafive/sdk-next"
import type { ReactNode } from "react"

// Plugins are functions, so they are chosen here, in a client component, not in the server layout.
export function Providers({ bootstrap, children }: { bootstrap: string; children: ReactNode }) {
  return (
    <MiraProvider bootstrap={bootstrap} plugins={[flags()]}>
      {children}
    </MiraProvider>
  )
}
