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
    include: {
      player: {
        include: {
          trainers: true,
        },
      },
    },
  })

  if (!match) notFound()

  const isPlayer = match.playerId === payload.userId
  const isTrainer =
    match.trainerId === payload.userId ||
    (match.player?.trainers && match.player.trainers.some((t: any) => t.id === payload.userId))
  const isAdmin = payload.role === "ADMIN"

  if (!isPlayer && !isTrainer && !isAdmin) {
    redirect("/dashboard")
  }

  // Omit the player relation from the object passed to EditMatchForm to avoid typescript compilation issues if it expects only CompleteMatch or similar
  const { player, ...matchData } = match

  return (
    <EditMatchForm
      match={matchData as any}
      currentUserRole={payload.role}
      currentUserId={payload.userId}
      matchTrainerId={
        match.trainerId ||
        (payload.role === "TRAINER" &&
        match.player?.trainers?.some((t: any) => t.id === payload.userId)
          ? payload.userId
          : match.player?.trainers?.[0]?.id || "")
      }
    />
  )
}