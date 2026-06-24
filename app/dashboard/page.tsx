"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { deleteMatch } from "@/actions/matches";
import type { SimpleMatch } from "@/types/match";

/**
 * Dashboard Page - Client Component with httpOnly Cookie Auth
 * Uses cookies (sent automatically) for authentication
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [matches, setMatches] = useState<SimpleMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role === "ADMIN") {
        router.push("/admin/users");
      } else if (user?.role === "TRAINER") {
        router.push("/trainer/players");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (user) {
      fetchUserMatches();
    }
  }, [user]);

  const fetchUserMatches = async () => {
    try {
      // Cookies are automatically sent with fetch
      const response = await fetch("/api/matches", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches || []);
      }
    } catch (error) {
      console.error("Failed to fetch matches:", error);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm("Are you sure you want to delete this match?")) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await deleteMatch(id, user.id);
      if (result.success) {
        setMatches(matches.filter((m) => m.id !== id));
      } else {
        alert(result.error || "Failed to delete match");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete match");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <section className="container mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-bold text-primary">Dashboard</h1>
          <p className="text-base-content/70 mt-2">
            Welcome back, {user?.name}!
          </p>
        </div>

        <Link href="/matches/create" className="btn btn-primary">
          + Create Match
        </Link>
      </div>

      {/* Stats */}
        <div className="stats shadow mb-8">
        <div className="stat">
          <div className="stat-title">Total Matches</div>
          <div className="stat-value">{matches.length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Reviewed</div>
          <div className="stat-value text-primary">
            {matches.filter((s) => s.isReviewed).length}
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">Pending</div>
          <div className="stat-value text-secondary">
            {matches.filter((s) => !s.isReviewed).length}
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Your Matches</h2>

      {loadingMatches ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card bg-base-100 border border-base-200">
              <div className="card-body">
                <div className="skeleton h-6 w-3/4"></div>
                <div className="skeleton h-4 w-full mt-2"></div>
                <div className="skeleton h-4 w-1/2 mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="hero bg-base-200 rounded-box mt-8">
          <div className="hero-content text-center">
            <div>
              <div className="text-4xl mb-4">📝</div>
              <h2 className="text-2xl font-bold">No matches yet</h2>
              <p className="py-3 text-base-content/70">
                Create your first match to start tracking player performance
                and feedback.
              </p>
              <Link href="/matches/create" className="btn btn-primary">
                Create First Match
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {matches.map((match) => (
            <div
              key={match.id}
              className="card bg-base-100 shadow-md hover:shadow-xl transition-all duration-200 border border-base-200"
            >
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <Link href={`/matches/${match.id}`} className="flex-1">
                    <h2 className="card-title text-xl hover:text-primary transition-colors">
                      {match.name}
                    </h2>

                    {match.description && (
                      <p className="text-base-content/70 mt-1">
                        {match.description}
                      </p>
                    )}
                  </Link>

                  {match.mark != null && (
                    <div className="badge badge-primary badge-lg">
                      {match.mark}/10
                    </div>
                  )}
                </div>

                <div className="divider my-2"></div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-4 text-sm text-base-content/70">
                    {match.location && <span>📍 {match.location}</span>}

                    {match.updatedAt && (
                      <span>
                        🗓️ {new Date(match.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="card-actions justify-end">
                    <Link
                      href={`/matches/${match.id}/edit`}
                      className="btn btn-ghost btn-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(match.id)}
                      className="btn btn-error btn-sm btn-outline"
                      disabled={deletingId === match.id}
                    >
                      {deletingId === match.id ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        "Delete"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}