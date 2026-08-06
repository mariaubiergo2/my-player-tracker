"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/components/LanguageProvider";
import PageContainer from "@/components/ui/PageContainer";
import { createQuestionnaire, defineQuestionnaire } from "@/actions/questionnaires";

interface QuestionInput {
  id: string; // temp unique key
  text: string;
  type: "OPEN" | "MULTIPLE_CHOICE";
  options: string[];
}

export default function CreateQuestionnairePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuestionInput[]>([
    { id: "q-initial-1", text: "", type: "OPEN", options: ["", ""] },
  ]);

  // Errors / Success
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== "TRAINER") {
        router.push("/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, user]);

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

  const handleSubmit = (shouldDefine: boolean) => {
    setErrorMessage("");

    // Validation
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

    // Question-specific validation
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
        const res = await createQuestionnaire({
          title,
          description,
          questions: questions.map((q) => ({
            text: q.text,
            type: q.type,
            options: q.type === "MULTIPLE_CHOICE" ? q.options.filter((o) => o.trim()) : [],
          })),
        });

        if (res.success && res.data) {
          if (shouldDefine) {
            const defineRes = await defineQuestionnaire(res.data.id);
            if (defineRes.success) {
              router.push(`/questionnaires/${res.data.id}`);
            } else {
              setErrorMessage(defineRes.error || "Plantilla creada pero falló al definir.");
            }
          } else {
            router.push("/questionnaires");
          }
        } else {
          setErrorMessage(res.error || t("common.error"));
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch (err) {
        console.error(err);
        setErrorMessage(t("common.error"));
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (user?.role !== "TRAINER") {
    return null;
  }

  return (
    <PageContainer className="py-10 animate-fade-in">
      <div className="mb-10">
        <Link href="/questionnaires" className="btn btn-ghost mb-4">
          ← {t("questionnaires.back_list")}
        </Link>

        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {t("questionnaires.create_title")}
        </h1>
        <p className="text-base-content/70 mt-2">
          {t("questionnaires.create_subtitle")}
        </p>
      </div>

      {errorMessage && (
        <div className="alert alert-error shadow-lg mb-6 border border-error/20">
          <span>❌ {errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Description Card */}
          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h2 className="card-title text-xl text-primary">Información General</h2>
              <div className="form-control w-full mt-2">
                <label className="label">
                  <span className="label-text font-semibold">{t("questionnaires.form_title")} *</span>
                </label>
                <input
                  type="text"
                  placeholder={t("questionnaires.form_title")}
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
                  placeholder={t("questionnaires.form_description")}
                  className="textarea textarea-bordered w-full"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Dynamic Questions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Preguntas</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="btn btn-sm btn-outline btn-primary"
              >
                + {t("questionnaires.add_question")}
              </button>
            </div>

            {questions.map((q, qIdx) => (
              <div key={q.id} className="card bg-base-100 shadow border border-base-200 relative">
                <div className="card-body p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-base-content/5 pb-3">
                    <span className="font-bold text-sm text-base-content/60">Pregunta #{qIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(q.id)}
                      className="btn btn-xs btn-error btn-ghost text-xs"
                    >
                      {t("questionnaires.remove_question")}
                    </button>
                  </div>

                  {/* Question Text */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">{t("questionnaires.question_text")}</span>
                    </label>
                    <input
                      type="text"
                      placeholder="ej. ¿Cuáles son tus objetivos personales para esta temporada?"
                      className="input input-bordered w-full"
                      value={q.text}
                      onChange={(e) => updateQuestionText(q.id, e.target.value)}
                      required
                    />
                  </div>

                  {/* Question Type */}
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

                  {/* Options */}
                  {q.type === "MULTIPLE_CHOICE" && (
                    <div className="bg-base-200/50 p-4 rounded-2xl border border-base-content/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">Opciones de respuesta</span>
                        <button
                          type="button"
                          onClick={() => addOption(q.id)}
                          className="btn btn-xs btn-outline btn-secondary"
                        >
                          + {t("questionnaires.add_option")}
                        </button>
                      </div>

                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex gap-2 items-center">
                          <span className="text-xs text-base-content/50 font-bold w-6">{optIdx + 1}.</span>
                          <input
                            type="text"
                            placeholder="Escribe una opción..."
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
                              title={t("questionnaires.remove_option")}
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

            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={addQuestion}
                className="btn btn-neutral btn-outline w-full max-w-xs"
              >
                + {t("questionnaires.add_question")}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-md border border-base-200 sticky top-6">
            <div className="card-body">
              <h2 className="card-title text-xl border-b border-base-content/5 pb-2 mb-4">{t("questionnaires.actions")}</h2>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={isPending}
                  className="btn btn-primary w-full shadow-md"
                >
                  {isPending ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    "💾 " + t("questionnaires.save_define")
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={isPending}
                  className="btn btn-neutral btn-outline w-full"
                >
                  💾 {t("questionnaires.save_draft")}
                </button>

                <Link href="/questionnaires" className="btn btn-ghost w-full">
                  {t("common.cancel")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
