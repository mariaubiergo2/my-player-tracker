"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getProfile, updateProfile } from "@/actions/users";
import { useTranslation } from "@/components/LanguageProvider";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuth();
  const { t } = useTranslation();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
    birthDate: "",
    avatarUrl: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Set page title for SEO
  useEffect(() => {
    document.title = `${t("profile_page.title")} | Agent Matches`;
  }, [t]);

  // Client-side authentication check
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else {
        fetchProfile();
      }
    }
  }, [isLoading, isAuthenticated, router]);

  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const res = await getProfile();
      if (res.success && res.user) {
        setFormData({
          name: res.user.name,
          surname: res.user.surname,
          email: res.user.email,
          phone: res.user.phone || "",
          birthDate: res.user.birthDate || "",
          avatarUrl: res.user.avatarUrl || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setErrorMessage(res.error || t("profile_page.loading_profile"));
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(t("profile_page.loading_profile"));
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    // Validate passwords if user wants to change password
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setErrorMessage(t("profile_page.error_current_password"));
        setSaveLoading(false);
        return;
      }
      if (formData.newPassword.length < 6) {
        setErrorMessage(t("profile_page.error_length"));
        setSaveLoading(false);
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setErrorMessage(t("profile_page.error_match"));
        setSaveLoading(false);
        return;
      }
    }

    try {
      const res = await updateProfile({
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        phone: formData.phone || null,
        birthDate: formData.birthDate || null,
        avatarUrl: formData.avatarUrl || null,
        currentPassword: formData.newPassword ? formData.currentPassword : undefined,
        newPassword: formData.newPassword ? formData.newPassword : undefined,
      });

      if (res.success) {
        setSuccessMessage(t("profile_page.success_update"));
        // Clear password fields
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        // Refresh auth state context to update Header immediately
        await checkAuth();
      } else {
        setErrorMessage(res.error || t("common.error"));
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(t("common.error"));
    } finally {
      setSaveLoading(false);
    }
  };

  if (isLoading || loadingProfile) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-base-content/60 font-medium">{t("profile_page.loading_profile")}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <section className="container mx-auto px-6 py-10 max-w-4xl" id="profile-edit-section">
      {/* Title */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {t("profile_page.title")}
        </h1>
        <p className="text-base-content/70 mt-2">
          {t("profile_page.subtitle")}
        </p>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="alert alert-success shadow-lg mb-6 border border-success/20" id="success-notification">
          <div>
            <span>✅ {successMessage}</span>
          </div>
        </div>
      )}
      {errorMessage && (
        <div className="alert alert-error shadow-lg mb-6 border border-error/20" id="error-notification">
          <div>
            <span>❌ {errorMessage}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8" id="profile-edit-form">
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Avatar Preview & Role */}
          <div className="card bg-base-100 shadow-xl border border-base-200 lg:col-span-1">
            <div className="card-body items-center text-center">
              <h3 className="card-title text-lg font-bold text-base-content/80 mb-2">{t("profile_page.photo_title")}</h3>
              
              {/* Avatar Image Frame */}
              <div className="avatar placeholder mb-4">
                <div className="bg-primary text-primary-content rounded-full w-28 h-28 flex items-center justify-center border-4 border-primary/20 shadow-inner overflow-hidden">
                  {formData.avatarUrl ? (
                    <img
                      src={formData.avatarUrl}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-3xl font-bold">
                      {formData.name.charAt(0).toUpperCase()}
                      {formData.surname.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Readonly Role */}
              <div className="badge badge-lg bg-base-200 text-base-content font-bold border border-base-300 px-4 py-3">
                {t("profile_page.role_label")}: {user?.role}
              </div>
              <p className="text-xs text-base-content/50 mt-3 max-w-xs leading-relaxed">
                {t("profile_page.role_note")}
              </p>
            </div>
          </div>

          {/* Right Column: Personal Information Form */}
          <div className="card bg-base-100 shadow-xl border border-base-200 lg:col-span-2">
            <div className="card-body">
              <h3 className="card-title text-xl font-bold text-primary mb-4 border-b border-base-200 pb-2">
                {t("profile_page.details_title")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">{t("profile_page.first_name")}</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="input-first-name"
                    required
                    className="input input-bordered w-full"
                    placeholder="First Name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Surname */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">{t("profile_page.surname")}</span>
                  </label>
                  <input
                    type="text"
                    name="surname"
                    id="input-surname"
                    required
                    className="input input-bordered w-full"
                    placeholder="Surname"
                    value={formData.surname}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text font-semibold">{t("profile_page.email")}</span>
                </label>
                <input
                  type="email"
                  name="email"
                  id="input-email"
                  required
                  className="input input-bordered w-full"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              {/* Avatar URL */}
              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text font-semibold">{t("profile_page.avatar_url")}</span>
                </label>
                <input
                  type="url"
                  name="avatarUrl"
                  id="input-avatar-url"
                  className="input input-bordered w-full"
                  placeholder="https://example.com/avatar.jpg"
                  value={formData.avatarUrl}
                  onChange={handleInputChange}
                />
                <span className="label-text-alt text-base-content/50 mt-1">
                  {t("profile_page.avatar_help")}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Phone */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">{t("profile_page.phone")}</span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    id="input-phone"
                    className="input input-bordered w-full"
                    placeholder="+34 600 000 000"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Birth Date */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">{t("profile_page.birth_date")}</span>
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    id="input-birth-date"
                    className="input input-bordered w-full"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section (Change Password) */}
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body">
            <h3 className="card-title text-xl font-bold text-primary mb-4 border-b border-base-200 pb-2">
              {t("profile_page.security_title")}
            </h3>
            <p className="text-sm text-base-content/60 mb-4">
              {t("profile_page.security_note")}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Current Password */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">{t("profile_page.current_password")}</span>
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  id="input-current-password"
                  className="input input-bordered w-full"
                  placeholder="••••••••"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                />
              </div>

              {/* New Password */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">{t("profile_page.new_password")}</span>
                </label>
                <input
                  type="password"
                  name="newPassword"
                  id="input-new-password"
                  className="input input-bordered w-full"
                  placeholder="••••••••"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                />
              </div>

              {/* Confirm New Password */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">{t("profile_page.confirm_new_password")}</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="input-confirm-password"
                  className="input input-bordered w-full"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            id="btn-cancel"
            onClick={() => router.push("/dashboard")}
            className="btn btn-ghost"
            disabled={saveLoading}
          >
            {t("profile_page.cancel_btn")}
          </button>
          <button
            type="submit"
            id="btn-save-profile"
            className="btn btn-primary px-8 shadow-md hover:scale-105 active:scale-95 transition-all"
            disabled={saveLoading}
          >
            {saveLoading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              t("profile_page.save_btn")
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

