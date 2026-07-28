"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/components/LanguageProvider"
import { getFeedbackMessages, createFeedbackMessage } from "@/actions/feedback"

interface MatchFeedbackThreadProps {
  matchId: string
  currentUserId: string
  currentUserRole: string
  matchPlayerId: string
  matchTrainerId: string
  readOnly?: boolean
}

interface MessageAuthor {
  name: string
  surname: string
  avatarUrl: string | null
}

interface FeedbackMessage {
  id: string
  matchId: string
  authorId: string
  authorRole: string
  content: string
  createdAt: Date | string
  author: MessageAuthor
}

export default function MatchFeedbackThread({
  matchId,
  currentUserId,
  currentUserRole,
  matchPlayerId,
  matchTrainerId,
  readOnly = false,
}: MatchFeedbackThreadProps) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<FeedbackMessage[]>([])
  const [newContent, setNewContent] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchMessages()
  }, [matchId])

  const fetchMessages = async () => {
    setIsLoading(true)
    setError("")
    try {
      const res = await getFeedbackMessages(matchId)
      if (res.success && res.messages) {
        setMessages(res.messages as any)
      } else {
        setError(res.error || t("common.error"))
      }
    } catch (err) {
      console.error(err)
      setError(t("common.error"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newContent.trim()) return

    setIsSubmitting(true)
    setError("")
    try {
      const res = await createFeedbackMessage(matchId, newContent)
      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message as any])
        setNewContent("")
      } else {
        setError(res.error || t("common.error"))
      }
    } catch (err) {
      console.error(err)
      setError(t("common.error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Permission checks for writing
  const isAuthorizedPlayer = currentUserRole === "PLAYER" && currentUserId === matchPlayerId
  const isAuthorizedTrainer = currentUserRole === "TRAINER" && currentUserId === matchTrainerId
  const isAuthorizedAdmin = currentUserRole === "ADMIN"
  const canWrite = !readOnly && (isAuthorizedPlayer || isAuthorizedTrainer || isAuthorizedAdmin)

  const getRoleBadge = (role: string) => {
    const roleLower = role.toLowerCase()
    if (roleLower === "player") {
      return (
        <span className="badge badge-primary badge-sm font-semibold">
          {t("feedback_thread.role_player")}
        </span>
      )
    }
    if (roleLower === "trainer") {
      return (
        <span className="badge badge-secondary badge-sm font-semibold text-white">
          {t("feedback_thread.role_trainer")}
        </span>
      )
    }
    return (
      <span className="badge badge-accent badge-sm font-semibold">
        {t("feedback_thread.role_admin")}
      </span>
    )
  }

  return (
    <div className="card bg-base-100 shadow-md border border-base-200 w-full overflow-hidden">
      <div className="card-body p-6">
        <h2 className="card-title text-xl font-bold border-b border-base-200 pb-3 mb-4">
          💬 {t("feedback_thread.title")}
        </h2>

        {error && (
          <div role="alert" className="alert alert-error mb-4 text-sm py-2">
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-base-content/50 text-sm">
            {t("feedback_thread.no_messages")}
          </div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 mb-4 scrollbar-thin">
            {messages.map((msg) => {
              const isOwnMessage = msg.authorId === currentUserId
              const authorName = `${msg.author.name} ${msg.author.surname}`
              const formattedTime = new Date(msg.createdAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 items-start ${
                    isOwnMessage ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div className="avatar placeholder flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-base-300 text-base-content flex items-center justify-center font-bold text-sm overflow-hidden shadow-inner border border-base-200">
                      {msg.author.avatarUrl ? (
                        <img
                          src={msg.author.avatarUrl}
                          alt={authorName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>
                          {msg.author.name.charAt(0).toUpperCase()}
                          {msg.author.surname.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Message Bubble Container */}
                  <div className={`max-w-[75%] ${isOwnMessage ? "text-right" : "text-left"}`}>
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap justify-start">
                      <span className="text-xs font-bold text-base-content/80">
                        {authorName}
                      </span>
                      {getRoleBadge(msg.authorRole)}
                      <span className="text-[10px] text-base-content/40 ml-1">
                        {formattedTime}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                        isOwnMessage
                          ? "bg-primary text-primary-content rounded-tr-none"
                          : "bg-base-200 text-base-content rounded-tl-none"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Input message form */}
        {canWrite && (
          <form onSubmit={handleSend} className="flex gap-2 items-end border-t border-base-200 pt-4">
            <textarea
              placeholder={t("feedback_thread.placeholder")}
              className="textarea textarea-bordered flex-1 min-h-[44px] h-[44px] max-h-[120px] resize-none leading-relaxed text-sm focus:outline-none focus:border-primary"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(e)
                }
              }}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              className="btn btn-primary btn-md h-[44px] min-h-[44px] font-semibold"
              disabled={isSubmitting || !newContent.trim()}
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                t("feedback_thread.send")
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
