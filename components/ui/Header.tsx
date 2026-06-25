"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/components/LanguageProvider";

export default function Header() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className="navbar bg-base-200 shadow-lg">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
          >
            {isAuthenticated && (
              <>
                {user?.role === "ADMIN" && (
                  <li><Link href="/admin/users">{t("header.users")}</Link></li>
                )}
                {user?.role === "TRAINER" && (
                  <>
                    <li><Link href="/trainer/players">{t("header.all_players")}</Link></li>
                    <li><Link href="/trainer/my-players">{t("header.my_players")}</Link></li>
                  </>
                )}
                {user?.role === "PLAYER" && (
                  <li><Link href="/dashboard">{t("header.dashboard")}</Link></li>
                )}
              </>
            )}
          </ul>
        </div>
        <Link href="/about" className="btn btn-ghost text-xl">
          {t("header.brand")}
        </Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          {isAuthenticated && (
            <>
              {user?.role === "ADMIN" && (
                <li><Link href="/admin/users">{t("header.users")}</Link></li>
              )}
              {user?.role === "TRAINER" && (
                <>
                  <li><Link href="/trainer/players">{t("header.all_players")}</Link></li>
                  <li><Link href="/trainer/my-players">{t("header.my_players")}</Link></li>
                </>
              )}
              {user?.role === "PLAYER" && (
                <li><Link href="/dashboard">{t("header.dashboard")}</Link></li>
              )}
            </>
          )}
        </ul>
      </div>
      <div className="navbar-end flex gap-2">
        {/* Language Selector Dropdown */}
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-sm flex items-center gap-1.5 border border-base-content/10 bg-base-100/50 hover:bg-base-200"
          >
            <span>🌐</span>
            <span className="uppercase text-xs font-bold">{locale}</span>
            <span className="text-[10px] opacity-60">▼</span>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[10] mt-3 w-32 p-2 shadow-2xl border border-base-content/10"
          >
            <li>
              <button
                onClick={() => setLocale("ca")}
                className={locale === "ca" ? "active font-bold" : ""}
              >
                Català
              </button>
            </li>
            <li>
              <button
                onClick={() => setLocale("es")}
                className={locale === "es" ? "active font-bold" : ""}
              >
                Español
              </button>
            </li>
            <li>
              <button
                onClick={() => setLocale("en")}
                className={locale === "en" ? "active font-bold" : ""}
              >
                English
              </button>
            </li>
          </ul>
        </div>

        {isLoading ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : isAuthenticated ? (
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className={`btn btn-ghost btn-circle avatar ${user?.avatarUrl ? "" : "placeholder"}`}
            >
              <div className="bg-primary text-primary-content w-10 rounded-full flex items-center justify-center overflow-hidden">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name || "User avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
            >
              <li className="menu-title">{user?.name} ({user?.role})</li>
              {user?.role === "ADMIN" && (
                <li><Link href="/admin/users">{t("header.users")}</Link></li>
              )}
              {user?.role === "TRAINER" && (
                <>
                  <li><Link href="/trainer/players">{t("header.all_players")}</Link></li>
                  <li><Link href="/trainer/my-players">{t("header.my_players")}</Link></li>
                </>
              )}
              {user?.role === "PLAYER" && (
                <li><Link href="/dashboard">{t("header.dashboard")}</Link></li>
              )}
              {user?.role !== "ADMIN" && (
                <li>
                  <Link href="/matches/create">{t("header.create_match")}</Link>
                </li>
              )}
              {(user?.role === "PLAYER" || user?.role === "TRAINER") && (
                <li>
                  <Link href="/profile">{t("header.edit_profile")}</Link>
                </li>
              )}
              <li>
                <button onClick={logout}>{t("header.logout")}</button>
              </li>
            </ul>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link href="/login" className="btn btn-ghost btn-sm">
              {t("header.login")}
            </Link>
            <Link href="/register" className="btn btn-primary btn-sm">
              {t("header.signup")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}