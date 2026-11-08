"use client";
import { MiraProvider as ReactProvider, type MiraProviderProps } from "@mirafive/react";
/**
 * `@mirafive/next`: MIRA FIVE for Next.js (App Router and Pages Router).
 *
 * ```tsx
 * // app/layout.tsx
 * import { MiraProvider } from "@mirafive/next";
 *
 * <MiraProvider>{children}</MiraProvider> // reads NEXT_PUBLIC_MIRAFIVE_KEY
 * ```
 *
 * Pageviews on client-side navigation are captured on their own. Server code uses
 * `@mirafive/next/server`.
 */
import { createElement, type ReactElement } from "react";

export {
  useIdentify,
  useMira,
  useTrackOnMount,
  type EventMap,
  type Mira,
  type MiraOptions,
} from "@mirafive/react";

export type { MiraProviderProps } from "@mirafive/react";

/**
 * The browser client for the whole app. Defaults come from the environment, which Next.js
 * inlines at build time: `NEXT_PUBLIC_MIRAFIVE_KEY` (the project's public key) and
 * `NEXT_PUBLIC_MIRAFIVE_HOST` (optional, the ingest origin).
 */
export function MiraProvider({ publicKey, host, ...props }: MiraProviderProps): ReactElement {
  return createElement(ReactProvider, {
    ...props,
    publicKey: publicKey ?? process.env.NEXT_PUBLIC_MIRAFIVE_KEY,
    host: host ?? (process.env.NEXT_PUBLIC_MIRAFIVE_HOST || undefined),
  });
}
