# Agents working in mirafive/sdk-next

`@mirafive/sdk-next`: MIRA FIVE for Next.js, a `"use client"` provider over
`@mirafive/sdk-react` and a `/server` entry over `@mirafive/sdk-server`. Part of the MIRA
FIVE SDK family; the wire contract, flag semantics and public API live in
[mirafive/protocol](https://github.com/mirafive/protocol) (PROTOCOL.md, FLAGS.md, API.md).

## Commands

```sh
bun install --frozen-lockfile
bun run check            # format, lint, typecheck, test, build, publint, attw, size-limit
bun run test             # vitest: client (happy-dom) and server (node, mocked next/headers + after)
bun run size             # size-limit against the limits in package.json (peers external)
bun run example          # pack this repo, install examples/app-router, next build
```

## Layout

- `src/index.ts`: client entry, `"use client"` first line of `dist/index.js`.
- `src/server.ts`: `/server` entry; `next/headers` is imported lazily inside `flagsFor()` so
  the entry also loads where `next/headers` is unavailable (Pages Router, scripts).
- `examples/app-router`: a living example, built by `bun run example` from a packed tarball of this
  repo (`examples/.packs`, ignored). Not in the npm package (`files: ["dist"]`). Its
  `turbopack.root` only exists because it sits inside this repo.

## Dependencies

`@mirafive/sdk-browser`, `@mirafive/sdk-server` and `@mirafive/sdk-react` are ordinary
`^1.0.0` dependencies from npm; the example installs them from npm too and packs only this
repo. To try an unreleased sibling change, build it and `bun link` it; never commit a
`file:` path or `overrides`.

## Rules

- API.md is the contract for this package's public surface. Do not add, rename or
  remove exports without changing API.md first. The provider prop is `websiteKey` because
  React reserves `key`.
- Thin by design: no transport, no evaluator, no router hooks. Pageviews come from
  sdk-browser's `pageviews()`, which the provider adds unless `plugins` holds one.
- The secret key is read only in `src/server.ts`, which imports `server-only` (a runtime
  dependency, resolved to an empty module by Next's server bundles). Nothing in the client
  entry may import `@mirafive/sdk-server`, `next/headers` or `next/server`.
- The provider renders the `mirafive-flags` block from `bootstrap`; docs never pair it
  with `MiraFlagsScript`. Pages Router users need `transpilePackages` (unbundled,
  `server-only` throws).
- Server helpers never throw for transport reasons, and never because `after()` is
  unavailable (outside a request).
- Bundle size: client entry ≤ 1.2 kB, server entry ≤ 1 kB (min + gzip, peers external).
  No runtime dependencies besides `server-only`.
- `sideEffects: false` must stay true.
- Comments only for a non-obvious constraint, one or two lines.
- Do not run git write commands unless asked; the maintainer commits.

## Releasing

To release, bump `version` in `package.json` (and any SDK version constant), add a `## X.Y.Z — YYYY-MM-DD` section to `CHANGELOG.md`, commit, then `git tag vX.Y.Z && git push origin vX.Y.Z`. `.github/workflows/release.yml` checks both, runs `bun run check`, stages it on npm through trusted publishing (no token) and creates the GitHub release from the changelog section. The version goes live only after a maintainer approves it with 2FA on npmjs.com (`npm stage approve`). Never `npm publish` from a laptop.
