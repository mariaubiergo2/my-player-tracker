"use client";

import { useEffect, useState, useTransition, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/components/LanguageProvider";
import PageContainer from "@/components/ui/PageContainer";
import {
  getQuestionnaireById,
  updateQuestionnaire,
  defineQuestionnaire,
  duplicateQuestionnaire,
} from "@/actions/questionnaires";

interface QuestionInput {
  id: string; // db id or temp unique key
  text: string;
  type: "OPEN" | "MULTIPLE_CHOICE";
  options: string[];
}

export default function QuestionnaireDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t, locale } = useTranslation();
  const [isPending, startTransition] = useTransition();

  // Template Data
  const [template, setTemplate] = useState<any>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);

  // Editor State (for Draft mode)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuestionInput[]>([]);

  // Errors / Success
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== "TRAINER") {
        router.push("/dashboard");
      } else {
        loadTemplate();
      }
    }
  }, [isLoading, isAuthenticated, user, id]);

  const loadTemplate = async () => {
    setLoadingTemplate(true);
    try {
      const res = await getQuestionnaireById(id);
      if (res.success && res.questionnaire) {
        setTemplate(res.questionnaire);
        setTitle(res.questionnaire.title);
        setDescription(res.questionnaire.description || "");
        setQuestions(
          res.questionnaire.questions.map((q: any) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            options: q.options && q.options.length > 0 ? q.options : ["", ""],
          }))
        );
      } else {
        setErrorMessage(res.error || t("common.error"));
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(t("common.error"));
    } finally {
      setLoadingTemplate(false);
    }
  };

  // --- Dynamic editor functions ---
  const addQuestion = () => {
    const newId = `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setQuestions((prev) => [
      ...prev,
      { id: newId, text: "", type: "OPEN", options: ["", ""] },
    ]);
  };

  const removeQuestion = (qId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  const updateQuestionText = (qId: string, text: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, text } : q))
    );
  };

  const updateQuestionType = (qId: string, type: "OPEN" | "MULTIPLE_CHOICE") => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, type } : q))
    );
  };

  const addOption = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId) {
          return { ...q, options: [...q.options, ""] };
        }
        return q;
      })
    );
  };

  const removeOption = (qId: string, optionIndex: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId) {
          const nextOptions = q.options.filter((_, idx) => idx !== optionIndex);
          return { ...q, options: nextOptions };
        }
        return q;
      })
    );
  };

  const updateOptionText = (qId: string, optionIndex: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId) {
          const nextOptions = [...q.options];
          nextOptions[optionIndex] = val;
          return { ...q, options: nextOptions };
        }
        return q;
      })
    );
  };

  // --- Save Changes ---
  const handleSaveChanges = () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!title.trim()) {
      setErrorMessage(t("questionnaires.validation_title_required"));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (questions.length === 0) {
      setErrorMessage(t("questionnaires.validation_questions_required"));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setErrorMessage(`${t("questionnaires.question_text")} #${i + 1} ${t("common.required").toLowerCase()}`);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (q.type === "MULTIPLE_CHOICE") {
        const validOptions = q.options.filter((o) => o.trim());
        if (validOptions.length < 2) {
          setErrorMessage(t("questionnaires.validation_options_required"));
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
      }
    }

    startTransition(async () => {
      try {
        const res = await updateQuestionnaire(id, {
          title,
          description,
          questions: questions.map((q) => ({
            text: q.text,
            type: q.type,
            options: q.type === "MULTIPLE_CHOICE" ? q.options.filter((o) => o.trim()) : [],
          })),
        });

        if (res.success) {
          setSuccessMessage(t("common.success"));
          loadTemplate();
          setTimeout(() => setSuccessMessage(""), 3000);
        } else {
          setErrorMessage(res.error || t("common.error"));
        }
      } catch (err) {
        console.error(err);
        setErrorMessage(t("common.error"));
      }
    });
  };

  // --- Define Template ---
  const handleDefine = () => {
    setErrorMessage("");
    setSuccessMessage("");

    startTransition(async () => {
      try {
        // Save first just in case they edited things
        const saveRes = await updateQuestionnaire(id, {
          title,
          description,
          questions: questions.map((q) => ({
            text: q.text,
            type: q.type,
            options: q.type === "MULTIPLE_CHOICE" ? q.options.filter((o) => o.trim()) : [],
          })),
        });

        if (!saveRes.success) {
          setErrorMessage(saveRes.error || "Error al guardar antes de definir");
          return;
        }

        const res = await defineQuestionnaire(id);
        if (res.success) {
          setSuccessMessage("La plantilla ahora está definida y lista para enviarse.");
          loadTemplate();
          setTimeout(() => setSuccessMessage(""), 3000);
        } else {
          setErrorMessage(res.error || t("common.error"));
        }
      } catch (err) {
        console.error(err);
        setErrorMessage(t("common.error"));
      }
    });
  };

  // --- Duplicate Template ---
  const handleDuplicate = () => {
    setErrorMessage("");
    setSuccessMessage("");

    startTransition(async () => {
      try {
        const res = await duplicateQuestionnaire(id);
        if (res.success && res.data) {
          router.push(`/questionnaires/${res.data.id}`);
        } else {
          setErrorMessage(res.error || t("common.error"));
        }
      } catch (err) {
        console.error(err);
        setErrorMessage(t("common.error"));
      }
    });
  };

  if (isLoading || loadingTemplate) {
    return (
      <div className="flex justify-center items-center min-h-[55vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (user?.role !== "TRAINER" || !template) {
    return null;
  }

  const isDraft = template.status === "DRAFT";

  return (
    <PageContainer className="py-10 animate-fade-in">
      <div className="mb-8">
        <Link href="/questionnaires" className="btn btn-ghost mb-4">
          ← {t("questionnaires.back_list")}
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {template.title}
              </h1>
              {isDraft ? (
                <span className="badge badge-neutral font-semibold">{t("questionnaires.status_draft")}</span>
              ) : (
                <span className="badge badge-primary font-semibold">{t("questionnaires.status_defined")}</span>
              )}
            </div>
            <p className="text-base-content/60 mt-1">{t("questionnaires.created_at")} {new Date(template.createdAt).toLocaleDateString(locale)}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isDraft && (
              <>
                <Link href={`/questionnaires/${id}/send`} className="btn btn-primary shadow">
                  🚀 {t("questionnaires.send_to_players")}
                </Link>
                <button onClick={handleDuplicate} className="btn btn-neutral btn-outline" disabled={isPending}>
                  👯 {t("questionnaires.duplicate")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-error shadow-lg mb-6 border border-error/20">
          <span>❌ {errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success shadow-lg mb-6 border border-success/20">
          <span>✅ {successMessage}</span>
        </div>
      )}

      {isDraft ? (
        /* DRAFT EDITOR MODE */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="card bg-base-100 shadow border border-base-200">
              <div className="card-body">
                <h2 className="card-title text-xl text-primary">Información General</h2>
                <div className="form-control w-full mt-2">
                  <label className="label">
                    <span className="label-text font-semibold">{t("questionnaires.form_title")} *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-control w-full mt-4">
                  <label className="label">
                    <span className="label-text font-semibold">{t("questionnaires.form_description")}</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Preguntas</h2>
                <button type="button" onClick={addQuestion} className="btn btn-sm btn-outline btn-primary">
                  + {t("questionnaires.add_question")}
                </button>
              </div>

              {questions.map((q, qIdx) => (
                <div key={q.id} className="card bg-base-100 shadow border border-base-200">
                  <div className="card-body p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-base-content/5 pb-3">
                      <span className="font-bold text-sm text-base-content/60">Pregunta #{qIdx + 1}</span>
                      <button type="button" onClick={() => removeQuestion(q.id)} className="btn btn-xs btn-error btn-ghost text-xs">
                        {t("questionnaires.remove_question")}
                      </button>
                    </div>

                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-semibold">{t("questionnaires.question_text")}</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={q.text}
                        onChange={(e) => updateQuestionText(q.id, e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-semibold">{t("questionnaires.question_type")}</span>
                      </label>
                      <div className="flex gap-4">
                        <label className="label cursor-pointer justify-start gap-2">
                          <input
                            type="radio"
                            name={`type-${q.id}`}
                            className="radio radio-primary radio-sm"
                            checked={q.type === "OPEN"}
                            onChange={() => updateQuestionType(q.id, "OPEN")}
                          />
                          <span className="label-text">{t("questionnaires.type_open")}</span>
                        </label>
                        <label className="label cursor-pointer justify-start gap-2">
                          <input
                            type="radio"
                            name={`type-${q.id}`}
                            className="radio radio-primary radio-sm"
                            checked={q.type === "MULTIPLE_CHOICE"}
                            onChange={() => updateQuestionType(q.id, "MULTIPLE_CHOICE")}
                          />
                          <span className="label-text">{t("questionnaires.type_multiple")}</span>
                        </label>
                      </div>
                    </div>

                    {q.type === "MULTIPLE_CHOICE" && (
                      <div className="bg-base-200/50 p-4 rounded-2xl border border-base-content/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">Opciones de respuesta</span>
                          <button type="button" onClick={() => addOption(q.id)} className="btn btn-xs btn-outline btn-secondary">
                            + {t("questionnaires.add_option")}
                          </button>
                        </div>

                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex gap-2 items-center">
                            <span className="text-xs text-base-content/50 font-bold w-6">{optIdx + 1}.</span>
                            <input
                              type="text"
                              className="input input-bordered input-sm flex-1"
                              value={opt}
                              onChange={(e) => updateOptionText(q.id, optIdx, e.target.value)}
                              required
                            />
                            {q.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeOption(q.id, optIdx)}
                                className="btn btn-xs btn-error btn-square btn-outline"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card bg-base-100 shadow border border-base-200 sticky top-6">
              <div className="card-body">
                <h2 className="card-title text-xl border-b border-base-content/5 pb-2 mb-4">{t("questionnaires.actions")}</h2>
                <div className="flex flex-col gap-3">
                  <button onClick={handleSaveChanges} disabled={isPending} className="btn btn-primary w-full shadow-md">
                    {isPending ? <span className="loading loading-spinner loading-sm"></span> : "💾 Guardar Cambios"}
                  </button>
                  <button onClick={handleDefine} disabled={isPending} className="btn btn-neutral btn-outline w-full">
                    ✅ {t("questionnaires.define_template")}
                  </button>
                  <Link href="/questionnaires" className="btn btn-ghost w-full">
                    {t("common.cancel")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* DEFINED READ ONLY MODE WITH ASSIGNMENTS */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            {template.description && (
              <div className="card bg-base-100 shadow border border-base-200">
                <div className="card-body">
                  <h2 className="card-title text-base-content/50 text-xs uppercase tracking-wider">Descripción</h2>
                  <p className="text-base-content/80 mt-1 whitespace-pre-wrap">{template.description}</p>
                </div>
              </div>
            )}

            {/* Questions list */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Preguntas de la Plantilla</h2>
              {template.questions.map((q: any, qIdx: number) => (
                <div key={q.id} className="card bg-base-100 shadow border border-base-200">
                  <div className="card-body p-5">
                    <div className="flex justify-between items-center border-b border-base-content/5 pb-2 mb-3">
                      <span className="font-bold text-xs text-base-content/40">Pregunta #{qIdx + 1}</span>
                      <span className="badge badge-sm badge-neutral">
                        {q.type === "OPEN" ? t("questionnaires.type_open") : t("questionnaires.type_multiple")}
                      </span>
                    </div>

                    <p className="font-bold text-base-content/85 mb-2">{q.text}</p>

                    {q.type === "MULTIPLE_CHOICE" && (
                      <ul className="list-disc pl-5 space-y-1 text-sm text-base-content/65">
                        {q.options.map((opt: string, optIdx: number) => (
                          <li key={optIdx}>{opt}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assignments list and duplicates info */}
          <div className="space-y-6">
            <div className="card bg-base-100 shadow border border-base-200">
              <div className="card-body p-6">
                <div className="flex items-center justify-between border-b border-base-content/5 pb-3 mb-4">
                  <h3 className="font-bold text-lg">{t("questionnaires.assignments_list")}</h3>
                  <span className="badge badge-primary">{template.assignments.length}</span>
                </div>

                {template.assignments.length === 0 ? (
                  <p className="text-sm text-base-content/50 text-center py-6">
                    No has enviado esta plantilla a ningún jugador todavía.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {template.assignments.map((a: any) => {
                      const pName = `${a.player.name} ${a.player.surname}`;
                      return (
                        <div key={a.id} className="p-3 rounded-2xl bg-base-200/50 border border-base-content/5 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-sm leading-tight truncate">{pName}</p>
                            <p className="text-[10px] text-base-content/40 mt-1">
                              {new Date(a.sentAt).toLocaleDateString(locale)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            {a.status === "SENT" && <span className="badge badge-xs badge-info">{t("questionnaires.status_sent")}</span>}
                            {a.status === "RECLAIMED" && <span className="badge badge-xs badge-warning text-warning-content">{t("questionnaires.status_reclaimed")}</span>}
                            {a.status === "COMPLETED" && <span className="badge badge-xs badge-success text-success-content">{t("questionnaires.status_completed")}</span>}
                            <Link href={`/questionnaires/assignments/${a.id}`} className="text-xs text-primary hover:underline font-bold mt-1">
                              {t("questionnaires.view_answers")}
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="alert alert-info border border-info/20 shadow p-4 rounded-3xl">
              <span>💡 {t("questionnaires.template_locked")}</span>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
