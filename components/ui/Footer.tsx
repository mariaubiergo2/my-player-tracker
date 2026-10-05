"use client";

import { useTranslation } from "@/components/LanguageProvider";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const contactEmail = t("footer.contactEmail");

  return (
    <footer className="flex flex-col items-center text-center gap-3 bg-base-200 text-base-content p-8 border-t border-base-content/10 font-sans">
      {/* Marca */}
      <img
        src="/brand/logo/nexa-monogram-on-dark.svg"
        alt="NEXA"
        className="h-6 w-auto opacity-80 hover:opacity-100 transition-opacity"
      />

      {/* Eslogan */}
      <p className="font-sans text-sm text-base-content/50 w-full max-w-3xl text-balance leading-relaxed">
        {t("footer.slogan")}
      </p>

      {/* Contacto */}
      <p className="font-mono text-xs text-base-content/60">
        {t("footer.contact")}{" "}
        <a href={"mailto:" + contactEmail} className="link link-hover hover:text-primary transition-colors">
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
