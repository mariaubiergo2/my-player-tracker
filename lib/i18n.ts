import ca from "../messages/ca.json";
import es from "../messages/es.json";
import en from "../messages/en.json";

export type Locale = "ca" | "es" | "en";

export const locales: Locale[] = ["ca", "es", "en"];
export const defaultLocale: Locale = "ca";

export const messages = {
  ca,
  es,
  en,
};

export function getTranslations(locale: Locale) {
  const currentMessages = messages[locale] || messages[defaultLocale];

  return function t(key: string, variables?: Record<string, string | number>) {
    const keys = key.split(".");
    let value: any = currentMessages;
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
      return value;
    }
    if (typeof value !== "string") {
      return String(value);
    }
    if (variables) {
      let result = value;
      for (const [varKey, varVal] of Object.entries(variables)) {
        result = result.replace(new RegExp(`{${varKey}}`, "g"), String(varVal));
      }
      return result;
    }
    return value;
  };
}
