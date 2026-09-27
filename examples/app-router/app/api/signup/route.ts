import { mira } from "@mirafive/sdk-next/server"

export async function POST(request: Request) {
  const { userId } = (await request.json()) as { userId: string }

  mira().track("signup", { userId, properties: { plan: "pro" } })

  return Response.json({ ok: true })
}
