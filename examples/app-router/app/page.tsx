import Link from "next/link"

import { SignupButton } from "./signup-button"

export default function Home() {
  return (
    <main>
      <h1>MIRA FIVE + Next.js App Router</h1>
      <p>
        Pageviews are counted on every navigation. <Link href="/checkout">Go to checkout</Link>.
      </p>
      <SignupButton />
    </main>
  )
}
