"use client"

import { createMira, type FlagBootstrap, type Mira, type MiraOptions } from "@mirafive/sdk-browser"
import { pageviews } from "@mirafive/sdk-browser/pageviews"
import { MiraProvider as Provider } from "@mirafive/sdk-react"
import { createElement, type ReactElement, type ReactNode } from "react"

export { useFlag, useFlagConfig, useMira, useTrackOnMount } from "@mirafive/sdk-react"
export type { FlagBootstrap } from "@mirafive/sdk-browser"

export interface MiraProviderProps extends Omit<MiraOptions, "key"> {
  /** The source's website key. Default `process.env.NEXT_PUBLIC_MIRAFIVE_KEY`. */
  websiteKey?: string | undefined
  /** `flags.bootstrap()` from `flagsFor()`, so flag hooks render the same on the server and in hydration. */
  bootstrap?: FlagBootstrap | string | undefined
  children?: ReactNode
}

let client: Mira | undefined
let warned = false

/** Creates the browser client on the first render in the browser and keeps it for the page's lifetime. */
export const MiraProvider = ({
  websiteKey,
  bootstrap,
  children,
  ...options
}: MiraProviderProps): ReactElement => {
  const key = websiteKey ?? process.env.NEXT_PUBLIC_MIRAFIVE_KEY

  if (typeof window !== "undefined" && !client) {
    if (key) {
      const plugins = options.plugins ?? []

      client = createMira({
        ...options,
        key,
        plugins: plugins.some((plugin) => plugin.name === "pageviews") ? plugins : [pageviews(), ...plugins]
      })
    } else if (!warned && process.env.NODE_ENV !== "production") {
      warned = true
      // oxlint-disable-next-line no-console -- a missing key sends nothing, so say so once
      console.warn("[mirafive] no website key: set NEXT_PUBLIC_MIRAFIVE_KEY or pass websiteKey")
    }
  }

  return createElement(Provider, { client, bootstrap }, children)
}
