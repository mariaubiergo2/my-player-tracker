// app/actions/matches.ts
"use server"

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MatchType } from "@prisma/client";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import Mux from "@mux/mux-node";
import { canEditMatchField } from "@/lib/permissions";


// 1. GET ALL MATCHES of a trainer
export async function getAllMatchesByTrainer(trainerId: string) {
  try {
    return await prisma.match.findMany({
      where: { trainerId },
      orderBy: { date: "desc" },
    });
  } catch (error) {
    console.error("Get matches by trainer error:", error);
    return [];
  }
}

// 2. GET SINGLE MATCH (for the detail page)
export async function getMatchById(matchId: string) {
  try {
    return await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        video: true,
      },
    });
  } catch (error) {
    console.error("Get match by id error:", error);
    return null;
  }
}

// 3. CREATE MATCH
export async function createMatch(prevState: any, formData: FormData) {
  const name = formData.get('name');
  const description = formData.get('description');
  const location = formData.get('location');
  const isHome = formData.get('isHome');
  const matchUrl = formData.get('matchUrl');
  const kitColor = formData.get('kitColor');
  const shirtNumber = formData.get('shirtNumber');
  const position = formData.get('position');
  const minutesPlayed = formData.get('minutesPlayed');
  const date = formData.get('date');
  const startTime = formData.get('startTime');
  const endTime = formData.get('endTime');
  const opponent = formData.get('opponent');
  const category = formData.get('category');
  const leaguePosition = formData.get('leaguePosition');
  const matchType = formData.get('matchType');
  const competitionType = formData.get('competitionType');
  
  let playerId = formData.get('playerId');
  let trainerId = formData.get('trainerId') as string | null;
  
  const comment = formData.get('comment');
  const trainerFeedback = formData.get('trainerFeedback');
  const playerReflection = formData.get('playerReflection');
  const mark = formData.get('mark');
  const intensity = formData.get('intensity');
  const attitude = formData.get('attitude');
  const performance = formData.get('performance');
  const goals = formData.get('goals');
  const assists = formData.get('assists');
  const strengths = formData.get('strengths');
  const weaknesses = formData.get('weaknesses');
  const improvementAreas = formData.get('improvementAreas');
  const offensiveActionsOwnHalf = formData.get('offensiveActionsOwnHalf');
  const offensiveActionsOpponentHalf = formData.get('offensiveActionsOpponentHalf');
  const defensiveActionsOwnHalf = formData.get('defensiveActionsOwnHalf');
  const defensiveActionsOpponentHalf = formData.get('defensiveActionsOpponentHalf');
  const isReviewed = formData.get('isReviewed');
  const reviewedAt = formData.get('reviewedAt');

  // Check current user role and session
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { message: 'Unauthorized' };
  }

  const isPlayer = currentUser.role === "PLAYER" || currentUser.role === "GOAL_KEEPER";
  const isTrainer = currentUser.role === "TRAINER";
  const isAdmin = currentUser.role === "ADMIN";

  // Auto-resolve playerId
  if (isPlayer) {
    playerId = currentUser.userId;
  }

  if (!playerId) {
    return { message: 'Player is required' };
  }

  // Verify player exists in PostgreSQL
  const playerUser = await prisma.user.findUnique({
    where: { id: playerId as string },
    select: { trainerId: true }
  });

  if (!playerUser) {
    return { message: `Player with ID "${playerId}" does not exist in the database.` };
  }

  // Auto-resolve trainerId
  if (isPlayer) {
    trainerId = playerUser.trainerId || null;
  } else if (isTrainer) {
    trainerId = currentUser.userId;
  } else if (isAdmin) {
    trainerId = playerUser.trainerId || null;
  }

  if (!name || !date) {
    return { message: 'Missing required fields: name and date are required' };
  }

  if (isPlayer) {
    if (!kitColor || !shirtNumber || !position || !matchUrl) {
      const cookieStore = await cookies();
      const locale = (cookieStore.get("locale")?.value || "ca") as "ca" | "es" | "en";
      const errorsMap = {
        es: "Los campos Vestimenta, Dorsal, Posición y Enlace/URL son obligatorios para los jugadores.",
        ca: "Els camps Vestimenta, Dorsal, Posició i Enllaç/URL són obligatoris per als jugadors.",
        en: "Clothing, Shirt Number, Position, and Match URL are required for players."
      };
      return { message: errorsMap[locale] || errorsMap.ca };
    }
  }

  let redirectTarget = '/dashboard';

  try {
    // Auto-resolve teamId: query player's last match to copy teamId automatically
    let resolvedTeamId = "team_default";
    const lastMatch = await prisma.match.findFirst({
      where: { playerId: playerId as string },
      orderBy: { createdAt: "desc" },
      select: { teamId: true }
    });
    if (lastMatch?.teamId) {
      resolvedTeamId = lastMatch.teamId;
    }

    // 2. Parse enum fields
    const parsedMatchType = matchType && ["FRIENDLY", "LEAGUE", "CUP", "TRAINING"].includes(String(matchType).toUpperCase())
      ? (String(matchType).toUpperCase() as MatchType)
      : null;

    // 3. Parse numbers & arrays
    const parsedMark = mark ? parseInt(mark as string, 10) : null;
    const parsedIntensity = intensity ? parseInt(intensity as string, 10) : null;
    const parsedAttitude = attitude ? parseInt(attitude as string, 10) : null;
    const parsedPerformance = performance ? parseInt(performance as string, 10) : null;

    const parsedGoals = goals ? parseInt(goals as string, 10) : null;
    const parsedAssists = assists ? parseInt(assists as string, 10) : null;

    const parsedStrengths = strengths ? String(strengths).split(',').map((s) => s.trim()).filter(Boolean) : [];
    const parsedWeaknesses = weaknesses ? String(weaknesses).split(',').map((s) => s.trim()).filter(Boolean) : [];
    const parsedImprovementAreas = improvementAreas ? String(improvementAreas).split(',').map((s) => s.trim()).filter(Boolean) : [];

    // 5. Parse review boolean and reviewedAt date
    const parsedIsReviewed = isReviewed === "on" || isReviewed === "true";
    const parsedReviewedAt = reviewedAt ? new Date(reviewedAt as string) : null;

    // 6. Map and filter fields allowed for this user role
    const rawData: any = {
      name: name ? String(name) : undefined,
      description: description ? String(description) : undefined,
      location: location ? String(location) : undefined,
      isHome: isHome === "on" || isHome === "true",
      matchUrl: matchUrl ? String(matchUrl) : undefined,
      kitColor: kitColor ? String(kitColor) : undefined,
      shirtNumber: shirtNumber ? String(shirtNumber) : undefined,
      position: position ? String(position) : undefined,
      minutesPlayed: minutesPlayed ? String(minutesPlayed) : undefined,
      date: date ? new Date(date as string) : undefined,
      startTime: startTime ? String(startTime) : undefined,
      endTime: endTime ? String(endTime) : undefined,
      opponent: opponent ? String(opponent) : undefined,
      category: category ? String(category) : undefined,
      leaguePosition: leaguePosition ? String(leaguePosition) : undefined,
      matchType: parsedMatchType,
      competitionType: competitionType ? String(competitionType) : undefined,
      comment: comment ? String(comment) : undefined,
      trainerFeedback: trainerFeedback ? String(trainerFeedback) : undefined,
      playerReflection: playerReflection ? String(playerReflection) : undefined,
      mark: parsedMark ?? undefined,
      intensity: parsedIntensity ?? undefined,
      attitude: parsedAttitude ?? undefined,
      performance: parsedPerformance ?? undefined,
      goals: parsedGoals ?? undefined,
      assists: parsedAssists ?? undefined,
      strengths: parsedStrengths,
      weaknesses: parsedWeaknesses,
      improvementAreas: parsedImprovementAreas,
      offensiveActionsOwnHalf: offensiveActionsOwnHalf ? String(offensiveActionsOwnHalf) : undefined,
      offensiveActionsOpponentHalf: offensiveActionsOpponentHalf ? String(offensiveActionsOpponentHalf) : undefined,
      defensiveActionsOwnHalf: defensiveActionsOwnHalf ? String(defensiveActionsOwnHalf) : undefined,
      defensiveActionsOpponentHalf: defensiveActionsOpponentHalf ? String(defensiveActionsOpponentHalf) : undefined,
      isReviewed: parsedIsReviewed,
      reviewedAt: parsedReviewedAt ?? undefined,
    };

    const finalData: any = {};
    for (const key of Object.keys(rawData)) {
      if (rawData[key] !== undefined && canEditMatchField(currentUser.role, key)) {
        finalData[key] = rawData[key];
      }
    }

    // Enforce relationship fields
    finalData.playerId = playerId as string;
    finalData.trainerId = trainerId;
    finalData.teamId = resolvedTeamId;

    // Create the record in DB
    const createdMatch = await prisma.match.create({
      data: finalData,
    });

    // Notify trainer if match was created by player
    if (isPlayer && createdMatch.trainerId) {
      await prisma.notification.create({
        data: {
          recipientId: createdMatch.trainerId,
          type: "MATCH_CREATED",
          matchId: createdMatch.id,
        },
      });
    }

    // 7. Check for uploaded video file
    const videoFile = formData.get("videoFile") as File | null;
    if (videoFile && videoFile.size > 0) {
      if (process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET) {
        try {
          const muxClient = new Mux({
            tokenId: process.env.MUX_TOKEN_ID,
            tokenSecret: process.env.MUX_TOKEN_SECRET,
          });

          // Create Mux Direct Upload
          const upload = await muxClient.video.uploads.create({
            new_asset_settings: {
              playback_policy: ["public"],
              passthrough: createdMatch.id,
            },
            cors_origin: "*",
          });

          // Upload the file bytes directly to Mux
          if (!upload.url) {
            throw new Error("Mux did not return an upload URL");
          }
          const fileBuffer = Buffer.from(await videoFile.arrayBuffer());
          await fetch(upload.url, {
            method: "PUT",
            body: fileBuffer,
            headers: {
              "Content-Type": videoFile.type || "application/octet-stream",
            },
          });

          // Create the Video database record
          await prisma.video.create({
            data: {
              matchId: createdMatch.id,
              muxUploadId: upload.id,
              status: "uploading",
              title: videoFile.name || `Video for Match: ${createdMatch.name}`,
            },
          });
        } catch (uploadError) {
          console.error("Mux Video upload failed in createMatch Action:", uploadError);
        }
      } else {
        // Mux credentials not configured. Save video file locally to public/uploads!
        console.warn("Mux credentials not configured. Saving video file locally.");
        try {
          const fs = require("fs");
          const path = require("path");

          const uploadDir = path.join(process.cwd(), "public", "uploads");
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          const fileName = `match_${createdMatch.id}_video.mp4`;
          const filePath = path.join(uploadDir, fileName);
          const fileBuffer = Buffer.from(await videoFile.arrayBuffer());
          fs.writeFileSync(filePath, fileBuffer);

          const localVideoUrl = `/uploads/${fileName}`;
          const mockUploadId = `mock_upload_${Date.now()}`;

          await prisma.video.create({
            data: {
              matchId: createdMatch.id,
              muxUploadId: mockUploadId,
              muxAssetId: `local_asset_${Date.now()}`,
              muxPlaybackId: localVideoUrl,
              status: "ready", // immediately ready!
              duration: 0,
              title: videoFile.name || `Local: ${videoFile.name}`,
            },
          });
        } catch (localErr) {
          console.error("Failed to save local video during match creation:", localErr);
        }
      }
    }

    // Determine where to redirect based on auth token cookie presence
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (token) {
      redirectTarget = '/dashboard';
    }

  } catch (error) {
    console.error("Create match error:", error);
    return { message: error instanceof Error ? error.message : "Failed to create match in database" };
  }

  // 7. Revalidate and redirect (outside try/catch to work correctly in Next.js)
  revalidatePath("/dashboard");
  redirect(redirectTarget);

  return { message: "Success" };
}

// 4. UPDATE MATCH
export async function updateMatch(matchId: string, updates: any) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player: true,
      },
    });

    if (!match) {
      return { success: false, error: "Match not found" };
    }

    const isPlayer = match.playerId === currentUser.userId;
    const isTrainer = match.trainerId === currentUser.userId || match.player.trainerId === currentUser.userId;
    const isAdmin = currentUser.role === "ADMIN";

    if (!isPlayer && !isTrainer && !isAdmin) {
      return { success: false, error: "Unauthorized to edit this match" };
    }

    if (currentUser.role === "PLAYER" || currentUser.role === "GOAL_KEEPER") {
      const kitColor = updates.kitColor;
      const shirtNumber = updates.shirtNumber;
      const position = updates.position;
      const matchUrl = updates.matchUrl;

      if (
        (kitColor !== undefined && !kitColor) ||
        (shirtNumber !== undefined && !shirtNumber) ||
        (position !== undefined && !position) ||
        (matchUrl !== undefined && !matchUrl)
      ) {
        const cookieStore = await cookies();
        const locale = (cookieStore.get("locale")?.value || "ca") as "ca" | "es" | "en";
        const errorsMap = {
          es: "Los campos Vestimenta, Dorsal, Posición y Enlace/URL son obligatorios para los jugadores.",
          ca: "Els camps Vestimenta, Dorsal, Posició i Enllaç/URL són obligatoris per als jugadors.",
          en: "Clothing, Shirt Number, Position, and Match URL are required for players."
        };
        return { success: false, error: errorsMap[locale] || errorsMap.ca };
      }
    }

    // Filter updates based on permissions
    const data: any = {};
    for (const key of Object.keys(updates)) {
      if (canEditMatchField(currentUser.role, key)) {
        data[key] = updates[key];
      }
    }

    // Parse enums
    if (data.matchType) {
      data.matchType = ["FRIENDLY", "LEAGUE", "CUP", "TRAINING"].includes(String(data.matchType).toUpperCase())
        ? (String(data.matchType).toUpperCase() as MatchType)
        : null;
    }

    // Parse dates
    if (data.date) {
      data.date = new Date(data.date);
    }
    if (data.reviewedAt) {
      data.reviewedAt = new Date(data.reviewedAt);
    }

    // minutesPlayed is string
    if (data.minutesPlayed !== undefined) {
      data.minutesPlayed = data.minutesPlayed ? String(data.minutesPlayed) : null;
    }

    // goals and assists are nullable integers
    if (data.goals !== undefined) {
      data.goals = data.goals !== null && data.goals !== "" ? parseInt(String(data.goals), 10) : null;
    }
    if (data.assists !== undefined) {
      data.assists = data.assists !== null && data.assists !== "" ? parseInt(String(data.assists), 10) : null;
    }

    // Parse arrays
    if (data.strengths) {
      data.strengths = Array.isArray(data.strengths) ? data.strengths : String(data.strengths).split(",").map(s => s.trim()).filter(Boolean);
    }
    if (data.weaknesses) {
      data.weaknesses = Array.isArray(data.weaknesses) ? data.weaknesses : String(data.weaknesses).split(",").map(s => s.trim()).filter(Boolean);
    }
    if (data.improvementAreas) {
      data.improvementAreas = Array.isArray(data.improvementAreas) ? data.improvementAreas : String(data.improvementAreas).split(",").map(s => s.trim()).filter(Boolean);
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data,
    });

    // Notify trainer if updated by player
    const isEditingPlayer = currentUser.role === "PLAYER" || currentUser.role === "GOAL_KEEPER";
    const targetTrainerId = match.trainerId || match.player.trainerId;
    if (isEditingPlayer && targetTrainerId) {
      await prisma.notification.create({
        data: {
          recipientId: targetTrainerId,
          type: "MATCH_UPDATED",
          matchId: match.id,
        },
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/matches");
    revalidatePath(`/matches/${matchId}`);

    return { success: true, match: updated };
  } catch (error) {
    console.error("Update match error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update match in database" };
  }
}

// 5. DELETE MATCH
export async function deleteMatch(id: string, userId: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id },
    });

    if (!match) {
      return { error: "Match not found" };
    }

    const isPlayer = match.playerId === userId;
    const isTrainer = match.trainerId === userId;

    if (!isPlayer && !isTrainer) {
      return { error: "Unauthorized to delete this match" };
    }

    await prisma.match.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    revalidatePath("/matches");

    return { success: true };
  } catch (error) {
    console.error("Delete match error:", error);
    return { error: error instanceof Error ? error.message : "Failed to delete match in database" };
  }
}

// 6. GET SELECTABLE PLAYERS (for creating matches)
export async function getSelectablePlayers() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    if (currentUser.role === "ADMIN") {
      const players = await prisma.user.findMany({
        where: { role: { in: ["PLAYER", "GOAL_KEEPER"] } },
        select: { id: true, name: true, surname: true, email: true },
        orderBy: { name: "asc" },
      });
      return { success: true, players };
    } else if (currentUser.role === "TRAINER") {
      const players = await prisma.user.findMany({
        where: { role: { in: ["PLAYER", "GOAL_KEEPER"] }, trainerId: currentUser.userId },
        select: { id: true, name: true, surname: true },
        orderBy: { name: "asc" },
      });
      return { success: true, players };
    }

    return { success: true, players: [] };
  } catch (error) {
    console.error("getSelectablePlayers error:", error);
    return { success: false, error: "Failed to get players" };
  }
}

