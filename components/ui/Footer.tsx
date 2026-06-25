"use client";

import { useTranslation } from "@/components/LanguageProvider";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer footer-center bg-base-200 text-base-content p-4">
      <aside>
        <p>{t("footer.text")}</p>
      </aside>
    </footer>
  );
}