# Changelog

## 0.5.0 — unreleased

First release on the v1 protocol, written from scratch over `@mirafive/sdk-react`,
`@mirafive/sdk-browser` and `@mirafive/sdk-server` 0.5.

- Client entry (`"use client"`, 0.45 kB): `<MiraProvider>` creates the browser client once,
  from `websiteKey` or `NEXT_PUBLIC_MIRAFIVE_KEY`, adds `pageviews()` unless `plugins` has
  one, and passes a flag `bootstrap` to the hooks; re-exports `useMira`, `useFlag`,
  `useFlagConfig` and `useTrackOnMount`.
- `/server` (0.56 kB): `mira()` (process-wide client from `MIRAFIVE_SECRET_KEY`, flushed
  with `after()`), `flagsFor(unit)` (reads `Sec-GPC`/`DNT` through `next/headers` into
  `optedOut`, exposures handed to `after()`), `<MiraFlagsScript>`.
- `examples/app-router`, built with `next build` against packed tarballs.
- No router hooks and no `Suspense` boundary: `pageviews()` counts every navigation.
