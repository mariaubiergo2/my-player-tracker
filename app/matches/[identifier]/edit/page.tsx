// app/matches/[id]/edit/page.tsx
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import EditMatchForm from "@/matches/[identifier]/edit/EditMatchForm"

export default async function EditMatchPage({
  params,
}: {
  params: Promise<{ identifier: string }>
}) {
  const { identifier } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) redirect("/login")

  const payload = verifyToken(token)
  if (!payload) redirect("/login")

  const match = await prisma.match.findUnique({
    where: { id: identifier },
  })

  if (!match) notFound()

  if (match.playerId !== payload.userId && match.trainerId !== payload.userId) {
    redirect("/dashboard")
  }

  return <EditMatchForm match={match} currentUserRole={payload.role} />
}