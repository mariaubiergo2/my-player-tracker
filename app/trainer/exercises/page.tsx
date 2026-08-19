"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/components/LanguageProvider";
import PageContainer from "@/components/ui/PageContainer";
import { getExercises, createExercise, updateExercise, deleteExercise } from "@/actions/exercises";

interface Exercise {
  id: string;
  title: string;
  description: string | null;
  repetitions: string;
  mediaType: "IMAGE" | "VIDEO_LINK" | null;
  imageUrl: string | null;
  videoUrl: string | null;
}

export default function ExercisesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [repetitions, setRepetitions] = useState("");
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO_LINK" | "">("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== "TRAINER" && user?.role !== "ADMIN") {
        router.push("/dashboard");
      } else {
        fetchExercises();
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const fetchExercises = async () => {
    setLoading(true);
    const res = await getExercises();
    if (res.success && res.data) {
      setExercises(res.data as Exercise[]);
    }
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setEditingExercise(null);
    setTitle("");
    setDescription("");
    setRepetitions("");
    setMediaType("");
    setImageUrl("");
    setVideoUrl("");
    setErrorMsg("");
    setSuccessMsg("");
    setModalOpen(true);
  };

  const handleOpenEdit = (ex: Exercise) => {
    setEditingExercise(ex);
    setTitle(ex.title);
    setDescription(ex.description || "");
    setRepetitions(ex.repetitions);
    setMediaType(ex.mediaType || "");
    setImageUrl(ex.imageUrl || "");
    setVideoUrl(ex.videoUrl || "");
    setErrorMsg("");
    setSuccessMsg("");
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg("");
    try {
      // 1. Get upload URL
      const res = await fetch("/api/exercises/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name }),
      });

      if (!res.ok) {
        throw new Error("Error obtenint URL de pujada");
      }

      const { uploadUrl, key } = await res.json();

      // 2. PUT file binary data to upload URL
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) {
        throw new Error("Error pujant arxiu");
      }

      setImageUrl(key);
      setSuccessMsg("Imatge pujada correctament!");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error al pujar la imatge");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const payload = {
      title,
      description: description || null,
      repetitions,
      mediaType: mediaType || null,
      imageUrl: mediaType === "IMAGE" ? imageUrl : null,
      videoUrl: mediaType === "VIDEO_LINK" ? videoUrl : null,
    };

    let res;
    if (editingExercise) {
      res = await updateExercise(editingExercise.id, payload);
    } else {
      res = await createExercise(payload);
    }

    if (res.success) {
      setModalOpen(false);
      fetchExercises();
    } else {
      setErrorMsg(res.error || "Error al desar l'exercici");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("trainer_exercises.delete_confirm") || "¿Estás seguro de que quieres eliminar este ejercicio?")) return;
    const res = await deleteExercise(id);
    if (res.success) {
      fetchExercises();
    } else {
      alert(res.error === "exercise_in_use" ? "Aquest exercici està en ús en alguna sessió i no es pot eliminar." : "Error al eliminar l'exercici");
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <PageContainer className="py-10">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-primary">{t("trainer_exercises.title") || "Biblioteca d'Exercicis"}</h1>
          <p className="text-base-content/70 mt-2">
            {t("trainer_exercises.subtitle") || "Gestiona els teus exercicis de preparació física."}
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          {t("trainer_exercises.add_exercise_btn") || "+ Afegir Exercici"}
        </button>
      </div>

      {exercises.length === 0 ? (
        <div className="card bg-base-100 shadow border border-base-200 p-10 text-center">
          <p className="text-base-content/50">{t("common.none") || "No hi ha exercicis disponibles."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map((ex) => (
            <div key={ex.id} className="card bg-base-100 shadow border border-base-200 overflow-hidden flex flex-col justify-between">
              <div>
                {ex.mediaType === "IMAGE" && ex.imageUrl && (
                  <div className="relative h-48 w-full bg-base-300">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ex.imageUrl} alt={ex.title} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="card-body p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="card-title text-xl font-bold text-secondary">{ex.title}</h3>
                    <span className="badge badge-accent badge-outline font-medium">{ex.repetitions}</span>
                  </div>
                  {ex.description && <p className="text-sm text-base-content/70 line-clamp-3 mb-4">{ex.description}</p>}

                  {ex.mediaType === "VIDEO_LINK" && ex.videoUrl && (
                    <a
                      href={ex.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link link-primary text-xs flex items-center gap-1 font-medium"
                    >
                      🎥 Veure vídeo de demostració
                    </a>
                  )}
                </div>
              </div>
              <div className="card-actions justify-end p-5 bg-base-50/50 border-t border-base-100 gap-2">
                <button className="btn btn-sm btn-outline btn-secondary" onClick={() => handleOpenEdit(ex)}>
                  {t("common.edit") || "Editar"}
                </button>
                <button className="btn btn-sm btn-outline btn-error" onClick={() => handleDelete(ex.id)}>
                  {t("common.delete") || "Eliminar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* modal */}
      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-xl">
            <h3 className="font-bold text-2xl text-secondary mb-6">
              {editingExercise ? t("common.edit") || "Editar Exercici" : t("trainer_exercises.add_exercise_btn") || "Afegir Exercici"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && <div className="alert alert-error">{errorMsg}</div>}
              {successMsg && <div className="alert alert-success">{successMsg}</div>}

              <div className="form-control">
                <label className="label font-medium">{t("trainer_exercises.exercise_title") || "Títol"}</label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label font-medium">{t("common.description") || "Descripció"}</label>
                <textarea
                  className="textarea textarea-bordered h-20"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label font-medium">{t("trainer_exercises.repetitions") || "Repeticions"}</label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="ex: 3x12 o 45 segons"
                  value={repetitions}
                  onChange={(e) => setRepetitions(e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label font-medium">Tipus de Mitjà (Opcional)</label>
                <select
                  className="select select-bordered"
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value as any)}
                >
                  <option value="">{t("common.none") || "Cap"}</option>
                  <option value="IMAGE">Imatge (Pujada externa/local)</option>
                  <option value="VIDEO_LINK">Enllaç de Vídeo (YouTube, etc.)</option>
                </select>
              </div>

              {mediaType === "IMAGE" && (
                <div className="form-control border border-base-200 p-4 rounded-lg bg-base-50/50">
                  <label className="label font-medium">{t("trainer_exercises.upload_image") || "Pujar Imatge"}</label>
                  <input
                    type="file"
                    className="file-input file-input-bordered w-full"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  {uploading && <span className="loading loading-spinner loading-md mt-2"></span>}
                  {imageUrl && (
                    <div className="mt-4">
                      <p className="text-xs text-success font-semibold mb-2">Imatge llista per desar:</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl} alt="Preview" className="h-32 object-cover rounded border border-base-200" />
                    </div>
                  )}
                </div>
              )}

              {mediaType === "VIDEO_LINK" && (
                <div className="form-control">
                  <label className="label font-medium">{t("trainer_exercises.video_link") || "Enllaç de vídeo"}</label>
                  <input
                    type="url"
                    className="input input-bordered"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                </div>
              )}

              <div className="modal-action">
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
                  {t("common.cancel") || "Cancel·lar"}
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {t("common.save") || "Desar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
