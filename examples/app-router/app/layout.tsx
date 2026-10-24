import { MiraProvider } from "@mirafive/sdk-next"
import type { ReactNode } from "react"

export const metadata = { title: "MIRA FIVE + Next.js" }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MiraProvider>{children}</MiraProvider>
      </body>
    </html>
  )
}
