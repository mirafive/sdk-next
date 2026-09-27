import { flagsFor } from "@mirafive/sdk-next/server"
import type { ReactNode } from "react"

import { Providers } from "./providers"

export const metadata = { title: "MIRA FIVE + Next.js" }

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Your own pseudonymous user id, when someone is signed in.
  const flags = await flagsFor({ userId: undefined })

  return (
    <html lang="en">
      <body>
        {/* Renders the mirafive-flags block and hands the same answers to the flag hooks. */}
        <Providers bootstrap={flags.bootstrap()}>{children}</Providers>
      </body>
    </html>
  )
}
