// app/matches/[identifier]/edit-feedback/page.tsx
import { cookies } from "next/headers"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import EditMatchForm from "@/matches/[identifier]/edit/EditMatchForm"

export default async function EditFeedbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ identifier: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { identifier } = await params
  const { returnTo } = await searchParams
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) redirect("/login")

  const payload = await verifyToken(token)
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

  if (payload.role === "TRAINER") {
    if (!returnTo) {
      redirect("/trainer/video-analysis/feedback")
    }
    const isAssigned =
      match.trainerId === payload.userId ||
      (match.player?.trainers && match.player.trainers.some((t: any) => t.id === payload.userId))
    if (!isAssigned) {
      redirect("/trainer/video-analysis/feedback")
    }
  } else {
    const isAdmin = payload.role === "ADMIN"
    if (!isAdmin) {
      redirect("/dashboard")
    }
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
        (match.player?.trainers?.[0]?.id || "")
      }
      returnTo={typeof returnTo === "string" ? returnTo : undefined}
    />
  )
}
