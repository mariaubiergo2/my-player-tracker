"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/components/LanguageProvider";
import PageContainer from "@/components/ui/PageContainer";
import { createQuestionnaire } from "@/actions/questionnaires";
import { QuestionType, QuestionnaireStatus, QuestionnaireType } from "@prisma/client";

interface LocalQuestion {
  text: string;
  type: QuestionType;
  options: string[];
}

export default function CreateQuestionnairePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();

  // Form states
  const [title, setTitle] = useState("");
  const [type, setType] = useState<QuestionnaireType>("ANALYSIS_VIDEO");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<LocalQuestion[]>([
    { text: "", type: QuestionType.OPEN, options: ["", ""] },
  ]);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isTrainer = user?.role === "TRAINER";
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!isTrainer && !isAdmin) {
        router.push("/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, user, router, isTrainer, isAdmin]);

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { text: "", type: QuestionType.OPEN, options: ["", ""] },
    ]);
  };

  const handleRemoveQuestion = (qIndex: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== qIndex));
  };

  const handleQuestionTextChange = (qIndex: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, text } : q))
    );
  };

  const handleQuestionTypeChange = (qIndex: number, type: QuestionType) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i === qIndex) {
          // If changing to MULTIPLE_CHOICE, initialize with 2 empty options if not present
          const options = type === QuestionType.MULTIPLE_CHOICE ? ["", ""] : [];
          return { ...q, type, options };
        }
        return q;
      })
    );
  };

  const handleAddOption = (qIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i === qIndex) {
          return { ...q, options: [...q.options, ""] };
        }
        return q;
      })
    );
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i === qIndex) {
          return { ...q, options: q.options.filter((_, oi) => oi !== optIndex) };
        }
        return q;
      })
    );
  };

  const handleOptionTextChange = (qIndex: number, optIndex: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i === qIndex) {
          const newOptions = [...q.options];
          newOptions[optIndex] = text;
          return { ...q, options: newOptions };
        }
        return q;
      })
    );
  };

  const handleSubmit = (status: QuestionnaireStatus) => {
    setErrorMessage("");
    setSuccessMessage("");

    // Validate inputs
    if (!title || title.trim() === "") {
      setErrorMessage(t("questionnaires.validation_title_required"));
      window.scrollTo(0, 0);
      return;
    }
    if (questions.length === 0) {
      setErrorMessage(t("questionnaires.validation_questions_required"));
      window.scrollTo(0, 0);
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text || q.text.trim() === "") {
        setErrorMessage(`${t("questionnaires.question_text")} #${i + 1} is empty`);
        window.scrollTo(0, 0);
        return;
      }
      if (q.type === QuestionType.MULTIPLE_CHOICE) {
        const filledOptions = q.options.filter((opt) => opt && opt.trim() !== "");
        if (filledOptions.length < 2) {
          setErrorMessage(t("questionnaires.validation_options_required"));
          window.scrollTo(0, 0);
          return;
        }
      }
    }

    startTransition(async () => {
      // Filter out empty options for multiple choice questions
      const cleanedQuestions = questions.map((q) => ({
        text: q.text.trim(),
        type: q.type,
        options: q.type === QuestionType.MULTIPLE_CHOICE ? q.options.filter((opt) => opt.trim() !== "") : [],
      }));

      const res = await createQuestionnaire({
        title: title.trim(),
        description: description.trim() || undefined,
        questions: cleanedQuestions,
        status,
        type,
      });

      if (res.success) {
        setSuccessMessage(t("common.success"));
        router.push("/questionnaires");
      } else {
        setErrorMessage(res.error ? t(`questionnaires.${res.error}`) || res.error : t("common.error"));
        window.scrollTo(0, 0);
      }
    });
  };

  if (isLoading || !isTrainer && !isAdmin) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <PageContainer className="py-8" maxWidthClassName="max-w-3xl">
      {/* Back link */}
      <Link href="/questionnaires" className="btn btn-ghost btn-sm mb-6">
        ← {t("questionnaires.back_list")}
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-base-content">
          {t("questionnaires.create_title")}
        </h1>
        <p className="text-base-content/70 mt-2">
          {t("questionnaires.create_subtitle")}
        </p>
      </div>

      {/* Alert Banners */}
      {successMessage && (
        <div className="alert alert-success shadow-lg mb-6 border border-success/20 animate-fade-in">
          <div><span>✅ {successMessage}</span></div>
        </div>
      )}
      {errorMessage && (
        <div className="alert alert-error shadow-lg mb-6 border border-error/20 animate-fade-in">
          <div><span>❌ {errorMessage}</span></div>
        </div>
      )}

      {/* Questionnaire Template Form */}
      <div className="space-y-6">
        <div className="card bg-base-100 shadow border border-base-200 p-6 space-y-4">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-bold text-base-content">{t("questionnaires.form_title")} *</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Evaluación Mensual de Objetivos"
              className="input input-bordered w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-bold text-base-content">Tipus de Qüestionari *</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={type}
              onChange={(e) => setType(e.target.value as QuestionnaireType)}
            >
              <option value="ANALYSIS_VIDEO">Anàlisi de Vídeo</option>
              <option value="PHYSICAL">Preparació Física</option>
              <option value="NUTRITION">Nutrició</option>
            </select>
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-bold text-base-content">{t("questionnaires.form_description")}</span>
            </label>
            <textarea
              placeholder="e.g. Describe brevemente los objetivos de este cuestionario..."
              className="textarea textarea-bordered w-full min-h-[5rem]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Questions Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-base-content">Preguntas</h2>

          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="card bg-base-100 shadow border border-base-200 p-6 relative space-y-4 hover:border-base-300 transition-colors"
            >
              {/* Remove question button */}
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(qIndex)}
                  className="btn btn-ghost btn-circle btn-sm text-error absolute right-4 top-4 hover:bg-error/10"
                  title={t("questionnaires.remove_question")}
                >
                  ✕
                </button>
              )}

              <span className="badge badge-neutral text-xs font-bold">Pregunta #{qIndex + 1}</span>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Question text */}
                <div className="form-control md:col-span-2">
                  <label className="label py-1">
                    <span className="label-text text-xs font-bold">{t("questionnaires.question_text")} *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ¿Cuáles son tus objetivos principales esta semana?"
                    className="input input-bordered input-sm w-full"
                    value={q.text}
                    onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                  />
                </div>

                {/* Question type */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs font-bold">{t("questionnaires.question_type")}</span>
                  </label>
                  <select
                    className="select select-bordered select-sm w-full font-medium"
                    value={q.type}
                    onChange={(e) => handleQuestionTypeChange(qIndex, e.target.value as QuestionType)}
                  >
                    <option value={QuestionType.OPEN}>{t("questionnaires.type_open")}</option>
                    <option value={QuestionType.MULTIPLE_CHOICE}>{t("questionnaires.type_multiple")}</option>
                  </select>
                </div>
              </div>

              {/* Multiple Choice Options Builder */}
              {q.type === QuestionType.MULTIPLE_CHOICE && (
                <div className="bg-base-200/50 p-4 rounded-xl border border-base-200 space-y-3 mt-2">
                  <label className="label py-0">
                    <span className="label-text text-xs font-bold">Opciones disponibles *</span>
                  </label>

                  {q.options.map((opt, optIndex) => (
                    <div key={optIndex} className="flex gap-2 items-center">
                      <span className="text-xs font-semibold text-base-content/40 w-4">{optIndex + 1}.</span>
                      <input
                        type="text"
                        required
                        placeholder={`Opción #${optIndex + 1}`}
                        className="input input-bordered input-sm flex-1"
                        value={opt}
                        onChange={(e) => handleOptionTextChange(qIndex, optIndex, e.target.value)}
                      />
                      {q.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(qIndex, optIndex)}
                          className="btn btn-ghost btn-circle btn-xs text-error hover:bg-error/10"
                          title={t("questionnaires.remove_option")}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => handleAddOption(qIndex)}
                    className="btn btn-ghost btn-xs text-primary mt-2"
                  >
                    + {t("questionnaires.add_option")}
                  </button>
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddQuestion}
            className="btn btn-outline btn-neutral w-full mt-2"
          >
            + {t("questionnaires.add_question")}
          </button>
        </div>

        {/* Submit Actions */}
        <div className="flex gap-4 justify-end mt-8 border-t border-base-200 pt-6">
          <Link href="/questionnaires" className={`btn btn-ghost ${isPending ? "pointer-events-none opacity-50" : ""}`}>
            {t("common.cancel")}
          </Link>
          <button
            type="button"
            onClick={() => handleSubmit(QuestionnaireStatus.DRAFT)}
            className="btn btn-outline btn-primary"
            disabled={isPending}
          >
            {isPending ? <span className="loading loading-spinner loading-sm"></span> : t("questionnaires.save_draft")}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(QuestionnaireStatus.DEFINED)}
            className="btn btn-primary"
            disabled={isPending}
          >
            {isPending ? <span className="loading loading-spinner loading-sm"></span> : t("questionnaires.save_define")}
          </button>
        </div>
      </div>
    </PageContainer>
  );
}
