"use client";

import { useTranslation } from "@/components/LanguageProvider";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const contactEmail = t("footer.contactEmail");

  return (
    <footer className="flex flex-col items-center text-center gap-3 bg-base-200 text-base-content p-10 border-t-4 border-secondary/40">
      {/* Marca */}
      <p className="font-display text-lg tracking-[0.2em] uppercase text-base-content">
        ⚽ {t("footer.brand")}
      </p>

      {/* Eslogan */}
      <p className="font-serif italic text-sm text-base-content/70 max-w-*">
        {t("footer.slogan")}
      </p>

      {/* Contacto */}
      <p className="font-mono text-xs text-base-content/60">
        {t("footer.contact")}{" "}
        <a href={"mailto:" + contactEmail} className="link link-hover link-secondary">
          {contactEmail}
        </a>
      </p>

      {/* Copyright */}
      <p className="font-sans text-[11px] tracking-wide text-base-content/40">
        {t("footer.copyright", { year })}
      </p>
    </footer>
  );
}