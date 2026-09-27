# Changelog

## 1.0.0 — unreleased

First release on the v1 protocol, written from scratch over `@mirafive/sdk-react`,
`@mirafive/sdk-browser` and `@mirafive/sdk-server` 1.0.

- Client entry (`"use client"`): `<MiraProvider>` creates the browser client once, from
  `websiteKey` or `NEXT_PUBLIC_MIRAFIVE_KEY`, adds `pageviews()` unless `plugins` has one,
  renders the flag `bootstrap` as the `mirafive-flags` block and passes it to the hooks;
  warns about a missing key in every build and about a changed plugin set in development;
  re-exports `useMira`, `useFlag`, `useFlagConfig` and `useTrackOnMount`.
- `/server` (imports `server-only`): `mira()` (process-wide client from `MIRAFIVE_SECRET_KEY`, flushed
  with `after()`), `flagsFor(unit)` (reads `Sec-GPC`/`DNT` through `next/headers` into
  `optedOut`, exposures handed to `after()`), `<MiraFlagsScript>`.
- `examples/app-router`, built with `next build` against packed tarballs.
- No router hooks and no `Suspense` boundary: `pageviews()` counts every navigation.
