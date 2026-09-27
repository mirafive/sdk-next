import { flagsFor, MiraFlagsScript } from "@mirafive/sdk-next/server"
import type { ReactNode } from "react"

import { Providers } from "./providers"

export const metadata = { title: "MIRA FIVE + Next.js" }

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Your own pseudonymous user id, when someone is signed in.
  const flags = await flagsFor({ userId: undefined })
  const bootstrap = flags.bootstrap()

  return (
    <html lang="en">
      <body>
        <MiraFlagsScript flags={bootstrap} />
        <Providers bootstrap={bootstrap}>{children}</Providers>
      </body>
    </html>
  )
}
