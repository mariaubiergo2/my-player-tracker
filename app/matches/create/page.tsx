// app/matches/create/page.tsx
"use client"

import Link from "next/link"
import { useActionState } from "react"
import { createMatch } from "@/app/actions/matches"

const initialState = {
  message: "",
}

export default function NewMatchPage() {
  const [state, formAction, pending] = useActionState(
    createMatch,
    initialState
  )

  return (
    <section className="container mx-auto px-6 py-10">
      <div className="mb-10">
        <Link href="/matches" className="btn btn-ghost mb-4">
          ← Back to Matches
        </Link>

        <h1 className="text-4xl font-bold text-primary">
          Create Match
        </h1>

        <p className="text-base-content/70 mt-2">
          Register a new football match and prepare feedback for the player.
        </p>
      </div>

      <form action={formAction} className="space-y-8">
        {/* Match details */}
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h2 className="card-title">Match Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Match name"
                className="input input-bordered w-full"
                name="name"
              />

              <input
                placeholder="Opponent"
                className="input input-bordered w-full"
                name="opponent"
              />

              <input
                placeholder="Location"
                className="input input-bordered w-full"
                name="location"
              />

              <input
                placeholder="Match type"
                className="input input-bordered w-full"
                name="matchType"
              />

              <input
                placeholder="Status"
                className="input input-bordered w-full"
                name="status"
              />

              <input
                placeholder="Date"
                type="date"
                className="input input-bordered w-full"
                name="date"
              />

              <input
                placeholder="Start time"
                type="time"
                className="input input-bordered w-full"
                name="startTime"
              />

              <input
                placeholder="End time"
                type="time"
                className="input input-bordered w-full"
                name="endTime"
              />

              <textarea
                placeholder="Description"
                className="textarea textarea-bordered w-full md:col-span-2"
                name="description"
              />
            </div>
          </div>
        </div>

        {/* People */}
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h2 className="card-title">People & Team</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                placeholder="Player"
                className="input input-bordered w-full"
                name="playerId"
              />

              <input
                placeholder="Trainer"
                className="input input-bordered w-full"
                name="trainerId"
              />

              <input
                placeholder="Team"
                className="input input-bordered w-full"
                name="teamId"
              />
            </div>
          </div>
        </div>

        {/* Performance */}
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h2 className="card-title">Performance</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                placeholder="Mark"
                className="input input-bordered w-full"
                name="mark"
              />

              <input
                placeholder="Intensity"
                className="input input-bordered w-full"
                name="intensity"
              />

              <input
                placeholder="Attitude"
                className="input input-bordered w-full"
                name="attitude"
              />

              <input
                placeholder="Performance"
                className="input input-bordered w-full"
                name="performance"
              />

              <input
                placeholder="Goals"
                className="input input-bordered w-full"
                name="goals"
              />

              <input
                placeholder="Assists"
                className="input input-bordered w-full"
                name="assists"
              />

              <input
                placeholder="Minutes played"
                className="input input-bordered w-full"
                name="minutesPlayed"
              />
            </div>
          </div>
        </div>

        {/* Feedback */}
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h2 className="card-title">Feedback</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <textarea
                placeholder="Comment"
                className="textarea textarea-bordered w-full"
                name="comment"
              />

              <textarea
                placeholder="Trainer feedback"
                className="textarea textarea-bordered w-full"
                name="trainerFeedback"
              />

              <textarea
                placeholder="Player reflection"
                className="textarea textarea-bordered w-full"
                name="playerReflection"
              />

              <textarea
                placeholder="Strengths"
                className="textarea textarea-bordered w-full"
                name="strengths"
              />

              <textarea
                placeholder="Weaknesses"
                className="textarea textarea-bordered w-full"
                name="weaknesses"
              />

              <textarea
                placeholder="Improvement areas"
                className="textarea textarea-bordered w-full"
                name="improvementAreas"
              />
            </div>
          </div>
        </div>

        {/* Review */}
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h2 className="card-title">Review Status</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  name="isReviewed"
                  type="checkbox"
                  className="checkbox checkbox-primary"
                />
                <span className="label-text">Reviewed</span>
              </label>

              <input
                placeholder="Reviewed at"
                name="reviewedAt"
                type="datetime-local"
                className="input input-bordered w-full"
              />
            </div>
          </div>
        </div>

        {state?.message && (
          <div role="alert" className="alert alert-error">
            <span>{state.message}</span>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/matches" className="btn btn-ghost">
            Cancel
          </Link>

          <button
            disabled={pending}
            className="btn btn-primary"
            type="submit"
          >
            {pending ? "Creating..." : "Create Match"}
          </button>
        </div>
      </form>
    </section>
  )
}