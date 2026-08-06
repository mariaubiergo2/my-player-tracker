"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/components/LanguageProvider";
import { useTheme } from "@/components/ThemeProvider";
import NotificationBell from "./NotificationBell";

export default function Header() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const { locale, setLocale, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="navbar border-b border-secondary/20 shadow-lg relative">
      {/* Capa de fondo de césped con overflow contenido para no cortar los dropdowns */}
      <div className="absolute inset-0 grass-bg overflow-hidden pointer-events-none">
        <div className="grass-sweep"></div>
      </div>
      <div className="navbar-start z-10">
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
                    <li><Link href="/trainer/my-players">{t("header.my_players")}</Link></li>
                    <li><Link href="/trainer/players">{t("header.all_players")}</Link></li>
                  </>
                )}
                {(user?.role === "PLAYER" || user?.role === "GOAL_KEEPER") && (
                  <>
                    <li><Link href="/dashboard">{t("header.dashboard")}</Link></li>
                    <li><Link href="/dashboard/physical">{t("header.physical_prep")}</Link></li>
                    <li><Link href="/dashboard/nutrition">{t("header.nutrition")}</Link></li>
                  </>
                )}
              </>
            )}
          </ul>
        </div>
        <Link href="/about" className="btn btn-ghost text-xl tracking-wide font-display flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={theme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"}
            alt="Logo"
            className="h-8 w-auto transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span>{t("header.brand")}</span>
        </Link>
      </div>
      <div className="navbar-center hidden lg:flex z-10">
        <ul className="menu menu-horizontal px-1">
          {isAuthenticated && (
            <>
              {user?.role === "ADMIN" && (
                <li><Link href="/admin/users">{t("header.users")}</Link></li>
              )}
              {user?.role === "TRAINER" && (
                <>
                  <li><Link href="/trainer/my-players">{t("header.my_players")}</Link></li>
                  <li><Link href="/trainer/players">{t("header.all_players")}</Link></li>
                </>
              )}
              {(user?.role === "PLAYER" || user?.role === "GOAL_KEEPER") && (
                <>
                  <li><Link href="/dashboard">{t("header.dashboard")}</Link></li>
                  <li><Link href="/dashboard/physical">{t("header.physical_prep")}</Link></li>
                  <li><Link href="/dashboard/nutrition">{t("header.nutrition")}</Link></li>
                </>
              )}
            </>
          )}
        </ul>
      </div>
      <div className="navbar-end flex gap-2 z-10">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label={theme === "dark" ? t("header.theme_light") : t("header.theme_dark")}
          className="btn btn-ghost btn-sm flex items-center gap-1.5 border border-base-content/10 bg-base-100/50 hover:bg-base-200"
        >
          {theme === "dark" ? (
            <>
              <span className="text-sm">☀️</span>
              <span className="text-xs font-normal font-sans hidden sm:inline">{t("header.theme_light_short")}</span>
            </>
          ) : (
            <>
              <span className="text-sm">🌙</span>
              <span className="text-xs font-normal font-sans hidden sm:inline">{t("header.theme_dark_short")}</span>
            </>
          )}
        </button>

        {/* Notification Bell Dropdown */}
        <NotificationBell />

        {/* Language Selector Dropdown */}
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-sm flex items-center gap-1.5 border border-base-content/10 bg-base-100/50 hover:bg-base-200"
          >
            <span>🌐</span>
            <span className="uppercase text-xs font-normal font-sans">{locale}</span>
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
              {/* Identity Header */}
              <li className="menu-title border-b border-base-content/10 pb-1.5 mb-1.5">
                {user?.name} ({user?.role})
              </li>

              {/* Navigation Items by Role */}
              {user?.role === "ADMIN" && (
                <li><Link href="/admin/users">{t("header.users")}</Link></li>
              )}

              {user?.role === "TRAINER" && (
                <>
                  <li><Link href="/trainer/my-players">{t("header.my_players")}</Link></li>
                  <li><Link href="/notifications">{t("header.notifications")}</Link></li>
                  <li><Link href="/trainer/players">{t("header.all_players")}</Link></li>
                </>
              )}

              {(user?.role === "PLAYER" || user?.role === "GOAL_KEEPER") && (
                <>
                  <li><Link href="/dashboard">{t("header.dashboard")}</Link></li>
                  <li><Link href="/notifications">{t("header.notifications")}</Link></li>
                  <li><Link href="/dashboard/physical">{t("header.physical_prep")}</Link></li>
                  <li><Link href="/dashboard/nutrition">{t("header.nutrition")}</Link></li>
                </>
              )}

              {/* Account Configuration Section */}
              {(user?.role === "PLAYER" || user?.role === "GOAL_KEEPER" || user?.role === "TRAINER" || user?.role === "ADMIN") && (
                <>
                  <div className="divider my-1"></div>
                  <li>
                    <Link href="/profile">{t("header.edit_profile")}</Link>
                  </li>
                </>
              )}

              {/* Logout/Exit Section */}
              <div className="divider my-1"></div>
              <li>
                <button
                  onClick={logout}
                  className="text-error hover:bg-error/10 hover:text-error"
                >
                  {t("header.logout")}
                </button>
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