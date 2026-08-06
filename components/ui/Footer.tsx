"use client";

import { useTranslation } from "@/components/LanguageProvider";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer footer-center bg-base-200 text-base-content/80 p-6 border-t-4 border-secondary/40 font-display tracking-wider text-xs">
      <aside>
        <p className="font-semibold">{t("footer.text")}</p>
      </aside>
    </footer>
  );
}