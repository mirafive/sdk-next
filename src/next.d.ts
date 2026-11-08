// The one Next.js API this package uses, so it type-checks without installing Next.js. In an app,
// the real `next` types apply.
declare module "next/server" {
  export function after(task: Promise<unknown> | (() => unknown)): void;
}
