"use client"

import { useState, useEffect, useRef } from "react"
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
  email?: string
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

interface MatchParticipant {
  id: string
  name: string
  surname: string
  email?: string
  avatarUrl: string | null
}

export default function MatchFeedbackThread({
  matchId,
  currentUserId,
  currentUserRole,
  matchPlayerId,
  matchTrainerId,
  readOnly = false,
}: MatchFeedbackThreadProps) {
  const { t, locale } = useTranslation()
  const [messages, setMessages] = useState<FeedbackMessage[]>([])
  const [newContent, setNewContent] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Loaded metadata for email headers
  const [matchName, setMatchName] = useState("")
  const [matchPlayer, setMatchPlayer] = useState<MatchParticipant | null>(null)
  const [matchTrainer, setMatchTrainer] = useState<MatchParticipant | null>(null)
  const [currentUserEmail, setCurrentUserEmail] = useState("")
  const [currentUserName, setCurrentUserName] = useState("")
  const [attachments, setAttachments] = useState<{ id: string; name: string; dataUrl: string }[]>([])
  const [disclaimerChecked, setDisclaimerChecked] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        setMatchName(res.matchName || "")
        setMatchPlayer(res.matchPlayer as any || null)
        setMatchTrainer(res.matchTrainer as any || null)
        setCurrentUserEmail(res.currentUserEmail || "")
        setCurrentUserName(res.currentUserName || "")
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
    if (!newContent.trim() && attachments.length === 0) return
    if (!disclaimerChecked) return

    setIsSubmitting(true)
    setError("")

    let finalContent = newContent.trim()
    if (attachments.length > 0) {
      finalContent += "\n\n" + attachments.map((att) => `![${att.name}](${att.dataUrl})`).join("\n")
    }

    try {
      const res = await createFeedbackMessage(matchId, finalContent)
      if (res.success && res.message) {
        // Append email from state since backend might not return it in this call structure
        const enrichedMessage = {
          ...res.message,
          author: {
            ...res.message.author,
            email: currentUserEmail,
          }
        }
        setMessages((prev) => [...prev, enrichedMessage as any])
        setNewContent("")
        setAttachments([])
        setDisclaimerChecked(false)
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
  const isAuthorizedPlayer = (currentUserRole === "PLAYER" || currentUserRole === "GOAL_KEEPER") && currentUserId === matchPlayerId
  const isAuthorizedTrainer = currentUserRole === "TRAINER"
  const isAuthorizedAdmin = currentUserRole === "ADMIN"
  const canWrite = !readOnly && (isAuthorizedPlayer || isAuthorizedTrainer || isAuthorizedAdmin)

  const getRoleBadge = (role: string) => {
    const roleLower = role.toLowerCase()
    if (roleLower === "player" || roleLower === "goal_keeper") {
      return (
        <span className="badge badge-primary badge-xs px-1.5 py-0.5 rounded text-[10px] font-semibold">
          {t("feedback_thread.role_" + roleLower)}
        </span>
      )
    }
    if (roleLower === "trainer") {
      return (
        <span className="badge badge-secondary badge-xs px-1.5 py-0.5 rounded text-white text-[10px] font-semibold">
          {t("feedback_thread.role_trainer")}
        </span>
      )
    }
    return (
      <span className="badge badge-neutral badge-xs px-1.5 py-0.5 rounded text-[10px] font-semibold">
        {t("feedback_thread.role_admin")}
      </span>
    )
  }

  // Helper to determine recipient information of each email
  const getRecipientInfo = (msg: FeedbackMessage) => {
    const msgRoleLower = msg.authorRole.toLowerCase()
    if (msgRoleLower === "player" || msgRoleLower === "goal_keeper") {
      return t("feedback_thread.role_trainer")
    } else {
      if (matchPlayer) {
        return `${matchPlayer.name} ${matchPlayer.surname}`
      }
      return t("feedback_thread.role_player")
    }
  }

  // Render markdown images inline within text body
  const renderMessageBody = (content: string) => {
    if (!content) return null
    // Match ![alt](data:image/... or http://...)
    const regex = /!\[(.*?)\]\((data:image\/[a-zA-Z+.-]+;base64,[a-zA-Z0-9+/=]+|https?:\/\/[^\s)]+)\)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = regex.exec(content)) !== null) {
      const textBefore = content.substring(lastIndex, match.index)
      if (textBefore) {
        parts.push(
          <span key={`txt-${lastIndex}`} className="whitespace-pre-wrap">
            {textBefore}
          </span>
        )
      }
      const alt = match[1]
      const url = match[2]
      parts.push(
        <span key={`img-${match.index}`} className="block my-3">
          <img
            src={url}
            alt={alt || "Image"}
            className="max-w-full md:max-w-xl rounded-lg shadow-sm border border-base-200 hover:scale-[1.005] hover:shadow-md transition-all duration-200 cursor-pointer"
            onClick={() => window.open(url, "_blank")}
          />
        </span>
      )
      lastIndex = regex.lastIndex
    }

    const textAfter = content.substring(lastIndex)
    if (textAfter) {
      parts.push(
        <span key={`txt-${lastIndex}`} className="whitespace-pre-wrap">
          {textAfter}
        </span>
      )
    }

    return parts.length > 0 ? parts : <span>{content}</span>
  }

  // Handle uploading image and converting to base64
  const insertImageFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64Url = event.target?.result as string
      if (!base64Url) return

      const newAttachment = {
        id: Math.random().toString(36).substring(2, 9),
        name: file.name || "imagen.png",
        dataUrl: base64Url,
      }
      setAttachments((prev) => [...prev, newAttachment])
    }
    reader.readAsDataURL(file)
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      insertImageFile(files[0])
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Paste image handler
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          e.preventDefault()
          insertImageFile(file)
        }
      }
    }
  }

  // Drag and drop image handlers
  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.indexOf("image") !== -1) {
        e.preventDefault()
        insertImageFile(file)
      }
    }
  }

  // Determine composer recipient details
  let composeRecipientText = ""
  const userRoleLower = currentUserRole.toLowerCase()
  if (userRoleLower === "player" || userRoleLower === "goal_keeper") {
    composeRecipientText = t("feedback_thread.role_trainer")
  } else {
    composeRecipientText = matchPlayer
      ? `${matchPlayer.name} ${matchPlayer.surname}`
      : t("feedback_thread.role_player")
  }

  const composeSenderText = `${currentUserName || t("feedback_thread.role_" + currentUserRole.toLowerCase())}`
  const composeSubjectText = `Feedback ${matchName || "Partido #" + matchId}`

  return (
    <div className="card bg-base-100 shadow-lg border border-base-200 w-full overflow-hidden">
      <div className="card-body p-6 space-y-6">
        
        {/* Title and Disclaimer */}
        <div className="border-b border-base-200 pb-4">
          <h2 className="card-title text-xl font-bold flex items-center gap-2 text-base-content">
            ✉️ {t("feedback_thread.title")}
          </h2>
          <p className="text-xs text-base-content/60 mt-1.5 bg-base-200/50 p-2 rounded border border-base-200/70">
            ℹ️ {t("feedback_thread.disclaimer")}
          </p>
        </div>

        {error && (
          <div role="alert" className="alert alert-error text-sm py-2">
            <span>{error}</span>
          </div>
        )}

        {/* Email Inbox List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-base-content/50 text-sm border-2 border-dashed border-base-200 rounded-lg">
            📭 {t("feedback_thread.no_messages")}
          </div>
        ) : (
          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
            {messages.map((msg) => {
              const isOwnMessage = msg.authorId === currentUserId
              const authorName = `${msg.author.name} ${msg.author.surname}`
              const formattedTime = new Date(msg.createdAt).toLocaleString(undefined, {
                weekday: "short",
                year: "numeric",
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
                  } w-full`}
                >
                  {/* Avatar */}
                  <div className="avatar placeholder flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-base-300 text-base-content flex items-center justify-center font-bold text-xs overflow-hidden shadow-inner border border-base-200">
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

                  {/* Speech Bubble Container */}
                  <div className={`max-w-[85%] sm:max-w-[75%] ${isOwnMessage ? "text-right" : "text-left"}`}>
                    <div
                      className={`card text-left shadow-sm border transition-all overflow-hidden ${
                        isOwnMessage
                          ? "bg-primary/[0.03] border-primary/20 rounded-2xl rounded-tr-none"
                          : "bg-base-200/50 border-base-300 rounded-2xl rounded-tl-none"
                      }`}
                    >
                      {/* Email Headers Inside Bubble */}
                      <div className={`px-4 py-2.5 text-[11px] text-base-content/75 border-b border-base-200 ${
                        isOwnMessage ? "bg-primary/[0.03]" : "bg-base-200/30"
                      } space-y-1`}>
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <div className="space-y-0.5">
                            <div>
                              <span className="font-bold text-base-content">{t("feedback_thread.from")}:</span>{" "}
                              <span className="text-base-content/90">
                                {authorName}
                              </span>{" "}
                              {getRoleBadge(msg.authorRole)}
                            </div>
                            <div>
                              <span className="font-bold text-base-content">{t("feedback_thread.to")}:</span>{" "}
                              <span className="text-base-content/90">{getRecipientInfo(msg)}</span>
                            </div>
                          </div>
                          <div className="text-[10px] text-base-content/40 font-mono">
                            {formattedTime}
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-base-200/40 italic text-base-content/80">
                          <span className="font-bold not-italic text-base-content">{t("feedback_thread.subject")}:</span> Re: Feedback - {matchName || "Partido #" + matchId}
                        </div>
                      </div>

                      {/* Email Body */}
                      <div className="p-4 text-sm leading-relaxed text-base-content whitespace-pre-wrap font-sans bg-base-100/60">
                        {renderMessageBody(msg.content)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Email Composer (Form) */}
        {canWrite && (
          <div className="card bg-base-50 border border-base-200 p-4 space-y-4">
            <h3 className="text-sm font-bold text-base-content border-b border-base-200 pb-2 flex items-center gap-1.5">
              ✏️ {t("feedback_thread.compose_title")}
            </h3>

            {/* Read-Only Mail Headers */}
            <div className="text-xs space-y-2 bg-base-100 p-3 rounded-lg border border-base-200">
              <div className="grid grid-cols-[80px_1fr] gap-1 items-center">
                <span className="font-bold text-base-content">{t("feedback_thread.from")}:</span>
                <div className="flex items-center gap-2">
                  <span className="text-base-content/80 font-medium">{composeSenderText}</span>
                  {getRoleBadge(currentUserRole)}
                </div>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-1 items-center">
                <span className="font-bold text-base-content">{t("feedback_thread.to")}:</span>
                <span className="text-base-content/80 font-medium">{composeRecipientText}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-1 items-center border-t border-base-200/40 pt-1.5">
                <span className="font-bold text-base-content">{t("feedback_thread.subject")}:</span>
                <span className="text-base-content/90 font-semibold italic">{composeSubjectText}</span>
              </div>
            </div>

            <form onSubmit={handleSend} className="space-y-3">
              {/* Toolbar */}
              <div className="flex items-center justify-between bg-base-200/60 px-3 py-1.5 rounded-t-lg border-t border-x border-base-200">
                <div className="flex items-center gap-2">
                  {/* File Upload Hidden Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="btn btn-ghost btn-xs flex items-center gap-1 text-base-content/70 hover:text-primary hover:bg-base-200"
                    title={t("feedback_thread.attach_image")}
                  >
                    {/* Inline Image Attachment SVG */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                      />
                    </svg>
                    <span className="text-[11px] font-semibold">{t("feedback_thread.attach_image")}</span>
                  </button>

                  <div className="h-4 w-[1px] bg-base-300 self-center"></div>

                </div>
                <span className="text-[10px] text-base-content/40 hidden sm:inline">
                  {t("feedback_thread.image_helper")}
                </span>
              </div>

              {/* Textarea Editor Box */}
              <textarea
                ref={textareaRef}
                placeholder={t("feedback_thread.placeholder")}
                className="textarea textarea-bordered w-full min-h-[160px] h-[160px] max-h-[300px] resize-y rounded-t-none leading-relaxed text-sm focus:outline-none focus:border-primary border-t-0 bg-base-100"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                onPaste={handlePaste}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                disabled={isSubmitting}
                spellCheck={true}
                lang={locale}
              />

              {/* Attachments List */}
              {attachments.length > 0 && (
                <div className="space-y-2 bg-base-100 p-3 rounded-lg border border-base-200">
                  <span className="text-xs font-bold text-base-content/70 block">
                    📎 {t("feedback_thread.attachments")} ({attachments.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {attachments.map((att) => (
                      <div key={att.id} className="relative group border border-base-200 rounded-lg overflow-hidden bg-base-50 p-1.5 flex items-center gap-2 pr-8">
                        <img src={att.dataUrl} alt={att.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        <span className="text-[10px] text-base-content/85 truncate font-mono block w-full" title={att.name}>
                          {att.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(att.id)}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 btn btn-circle btn-ghost btn-xs text-error opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                          title={t("feedback_thread.remove_attachment")}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Real-time Draft Preview if text content has files or words */}
              {(newContent.trim() || attachments.length > 0) && (
                <div className="border border-dashed border-base-300 rounded-lg p-4 bg-base-100/50 space-y-2 mt-2">
                  <h4 className="text-xs font-bold text-base-content/60 flex items-center gap-1.5">
                    👀 {t("feedback_thread.preview")}
                  </h4>
                  <div className="text-xs text-base-content/40 italic mb-1.5">
                    {t("feedback_thread.subject")}: {composeSubjectText}
                  </div>
                  <div className="text-sm leading-relaxed text-base-content whitespace-pre-wrap font-sans border-t border-base-200/50 pt-2">
                    {renderMessageBody(newContent)}
                    {attachments.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-base-200 border-dashed space-y-2">
                        <div className="text-xs text-base-content/50 font-bold">📎 {t("feedback_thread.attachments")}</div>
                        <div className="flex flex-wrap gap-3">
                          {attachments.map((att) => (
                            <img
                              key={att.id}
                              src={att.dataUrl}
                              alt={att.name}
                              className="max-w-[120px] max-h-[80px] rounded border border-base-200 shadow-sm"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Disclaimer + Send Button */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-base-content/70">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs checkbox-secondary"
                    checked={disclaimerChecked}
                    onChange={(e) => setDisclaimerChecked(e.target.checked)}
                  />
                  <span>{t("feedback_thread.spellcheck_disclaimer")}</span>
                </label>

                <button
                  type="submit"
                  className="btn btn-primary btn-sm px-6 font-semibold flex items-center gap-1.5 text-white self-end sm:self-auto"
                  disabled={
                    isSubmitting ||
                    (!newContent.trim() && attachments.length === 0) ||
                    !disclaimerChecked
                  }
                >
                  {isSubmitting ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                        />
                      </svg>
                      {t("feedback_thread.send")}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
