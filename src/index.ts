"use client"

import { createMira, type Mira, type MiraOptions } from "@mirafive/sdk-browser"
import { pageviews } from "@mirafive/sdk-browser/pageviews"
import { MiraProvider as Provider } from "@mirafive/sdk-react"
import { createElement, type ReactElement, type ReactNode } from "react"

export { useMira, useTrackOnMount } from "@mirafive/sdk-react"

export interface MiraProviderProps extends Omit<MiraOptions, "key"> {
  /** The source's website key. Default `process.env.NEXT_PUBLIC_MIRAFIVE_KEY`. */
  websiteKey?: string | undefined
  children?: ReactNode
}

let client: Mira | undefined
let created: string | undefined
const warned = new Set<string>()

const warn = (message: string): void => {
  if (!warned.has(message)) {
    warned.add(message)
    // oxlint-disable-next-line no-console -- configuration mistakes, reported once each
    console.warn("[mirafive] " + message)
  }
}

/** Creates the browser client on the first render in the browser and keeps it for the page's lifetime. */
export const MiraProvider = ({ websiteKey, children, ...options }: MiraProviderProps): ReactElement => {
  const key = websiteKey ?? process.env.NEXT_PUBLIC_MIRAFIVE_KEY

  if (typeof window !== "undefined") {
    const plugins = options.plugins ?? []
    const given = plugins.map((plugin) => plugin.name)
    const names = (given.includes("pageviews") ? given : ["pageviews", ...given]).join()

    if (client) {
      if (names !== created && process.env.NODE_ENV !== "production") {
        warn(`plugins changed to ${names} after the client was created with ${created}; the first set stays`)
      }
    } else if (key) {
      created = names
      client = createMira({
        ...options,
        key,
        plugins: given.includes("pageviews") ? plugins : [pageviews(), ...plugins]
      })
    } else {
      warn("no website key: set NEXT_PUBLIC_MIRAFIVE_KEY or pass websiteKey")
    }
  }

  return createElement(Provider, { client }, children)
}
