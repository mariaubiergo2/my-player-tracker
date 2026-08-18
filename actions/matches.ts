// app/actions/matches.ts
"use server"

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MatchType, Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import Mux from "@mux/mux-node";
import { canEditMatchField } from "@/lib/permissions";
import { createMatchSchema, updateMatchSchema, UpdateMatchInput } from "@/lib/validations/matches";


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
export async function createMatch(prevState: unknown, formData: FormData) {
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
    select: {
      trainers: { select: { id: true } }
    }
  });

  if (!playerUser) {
    return { message: `Player with ID "${playerId}" does not exist in the database.` };
  }

  // Auto-resolve trainerId
  if (isPlayer) {
    trainerId = playerUser.trainers[0]?.id || null;
  } else if (isTrainer) {
    trainerId = currentUser.userId;
  } else if (isAdmin) {
    trainerId = playerUser.trainers[0]?.id || null;
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
    const rawData = {
      name: name ? String(name) : "",
      description: description ? String(description) : null,
      location: location ? String(location) : null,
      isHome: isHome === "on" || isHome === "true",
      matchUrl: matchUrl ? String(matchUrl) : null,
      kitColor: kitColor ? String(kitColor) : null,
      shirtNumber: shirtNumber ? String(shirtNumber) : null,
      position: position ? String(position) : null,
      minutesPlayed: minutesPlayed ? String(minutesPlayed) : null,
      date: date ? new Date(date as string) : new Date(),
      startTime: startTime ? String(startTime) : null,
      endTime: endTime ? String(endTime) : null,
      opponent: opponent ? String(opponent) : null,
      category: category ? String(category) : null,
      leaguePosition: leaguePosition ? String(leaguePosition) : null,
      matchType: parsedMatchType,
      competitionType: competitionType ? String(competitionType) : null,
      comment: comment ? String(comment) : null,
      trainerFeedback: trainerFeedback ? String(trainerFeedback) : null,
      playerReflection: playerReflection ? String(playerReflection) : null,
      mark: parsedMark,
      intensity: parsedIntensity,
      attitude: parsedAttitude,
      performance: parsedPerformance,
      goals: parsedGoals,
      assists: parsedAssists,
      strengths: parsedStrengths,
      weaknesses: parsedWeaknesses,
      improvementAreas: parsedImprovementAreas,
      offensiveActionsOwnHalf: offensiveActionsOwnHalf ? String(offensiveActionsOwnHalf) : null,
      offensiveActionsOpponentHalf: offensiveActionsOpponentHalf ? String(offensiveActionsOpponentHalf) : null,
      defensiveActionsOwnHalf: defensiveActionsOwnHalf ? String(defensiveActionsOwnHalf) : null,
      defensiveActionsOpponentHalf: defensiveActionsOpponentHalf ? String(defensiveActionsOpponentHalf) : null,
      isReviewed: parsedIsReviewed,
      reviewedAt: parsedReviewedAt,
      playerId: playerId as string,
      trainerId: trainerId,
      teamId: resolvedTeamId,
    };

    const validation = createMatchSchema.safeParse(rawData);
    if (!validation.success) {
      return { message: "Invalid match data: " + validation.error.message };
    }
    const validatedData = validation.data;

    const finalData = {} as Prisma.MatchUncheckedCreateInput;
    for (const key of Object.keys(validatedData)) {
      const val = validatedData[key as keyof typeof validatedData];
      if (val !== undefined && canEditMatchField(currentUser.role, key)) {
        (finalData as any)[key] = val;
      }
    }

    // Enforce relationship fields
    finalData.playerId = validatedData.playerId;
    finalData.trainerId = validatedData.trainerId;
    finalData.teamId = validatedData.teamId;

    // Create the record in DB
    const createdMatch = await prisma.match.create({
      data: finalData,
    });

    // Notify all trainers of the player if match was created by player
    if (isPlayer && playerUser?.trainers) {
      const trainersToNotify = playerUser.trainers.map((t) => t.id);
      if (createdMatch.trainerId && !trainersToNotify.includes(createdMatch.trainerId)) {
        trainersToNotify.push(createdMatch.trainerId);
      }
      for (const tId of trainersToNotify) {
        await prisma.notification.create({
          data: {
            recipientId: tId,
            type: "MATCH_CREATED",
            matchId: createdMatch.id,
          },
        });
      }
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
export async function updateMatch(matchId: string, updates: UpdateMatchInput) {
  try {
    const validation = updateMatchSchema.safeParse(updates);
    if (!validation.success) {
      return { success: false, error: "Invalid updates payload: " + validation.error.message };
    }
    const validatedUpdates = validation.data;

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player: {
          include: {
            trainers: true,
          },
        },
      },
    });

    if (!match) {
      return { success: false, error: "Match not found" };
    }

    const isPlayer = match.playerId === currentUser.userId;
    const isTrainer =
      match.trainerId === currentUser.userId ||
      (match.player?.trainers && match.player.trainers.some((t: { id: string }) => t.id === currentUser.userId));
    const isAdmin = currentUser.role === "ADMIN";

    if (!isPlayer && !isTrainer && !isAdmin) {
      return { success: false, error: "Unauthorized to edit this match" };
    }

    if (currentUser.role === "PLAYER" || currentUser.role === "GOAL_KEEPER") {
      const kitColor = validatedUpdates.kitColor;
      const shirtNumber = validatedUpdates.shirtNumber;
      const position = validatedUpdates.position;
      const matchUrl = validatedUpdates.matchUrl;

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
          ca: "Els camps Vestimenta, Dorsal, Posició i Enllaç/URL son obligatoris per als jugadores.",
          en: "Clothing, Shirt Number, Position, and Match URL are required for players."
        };
        return { success: false, error: errorsMap[locale] || errorsMap.ca };
      }
    }

    // Filter updates based on permissions
    const data: Prisma.MatchUpdateInput = {};
    for (const key of Object.keys(validatedUpdates)) {
      if (canEditMatchField(currentUser.role, key)) {
        const val = validatedUpdates[key as keyof typeof validatedUpdates];
        (data as any)[key] = val;
      }
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data,
    });

    // Notify all trainers of the player if updated by player
    const isEditingPlayer = currentUser.role === "PLAYER" || currentUser.role === "GOAL_KEEPER";
    if (isEditingPlayer && match.player?.trainers) {
      const trainersToNotify = match.player.trainers.map((t: { id: string }) => t.id);
      if (match.trainerId && !trainersToNotify.includes(match.trainerId)) {
        trainersToNotify.push(match.trainerId);
      }
      for (const tId of trainersToNotify) {
        await prisma.notification.create({
          data: {
            recipientId: tId,
            type: "MATCH_UPDATED",
            matchId: match.id,
          },
        });
      }
    }

    // Notify player if updated by trainer
    const isEditingTrainer = currentUser.role === "TRAINER";
    if (isEditingTrainer && match.playerId) {
      await prisma.notification.create({
        data: {
          recipientId: match.playerId,
          type: "MATCH_UPDATED_BY_TRAINER",
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
export async function deleteMatch(id: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        player: {
          include: {
            trainers: true,
          },
        },
      },
    });

    if (!match) {
      return { success: false, error: "Match not found" };
    }

    const isPlayer = match.playerId === currentUser.userId;
    const isTrainer =
      match.trainerId === currentUser.userId ||
      (match.player?.trainers && match.player.trainers.some((t: { id: string }) => t.id === currentUser.userId));
    const isAdmin = currentUser.role === "ADMIN";

    if (!isPlayer && !isTrainer && !isAdmin) {
      return { success: false, error: "Unauthorized to delete this match" };
    }

    await prisma.match.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    revalidatePath("/matches");

    return { success: true };
  } catch (error) {
    console.error("Delete match error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete match in database" };
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
        where: {
          role: { in: ["PLAYER", "GOAL_KEEPER"] },
          trainers: {
            some: {
              id: currentUser.userId,
            },
          },
        },
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

