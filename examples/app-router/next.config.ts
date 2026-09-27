import type { NextConfig } from "next"

const config: NextConfig = {
  // Only because this example sits inside the SDK's own repo, next to its lockfile.
  turbopack: { root: import.meta.dirname }
}

export default config
