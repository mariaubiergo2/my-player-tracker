import { cookies } from "next/headers";
import { Locale, defaultLocale, getTranslations } from "./i18n";

export async function getTranslationsServer() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value as Locale) || defaultLocale;
  return getTranslations(locale);
}

export async function getCurrentLocaleServer() {
  const cookieStore = await cookies();
  return (cookieStore.get("locale")?.value as Locale) || defaultLocale;
}
