export function toDateInput(value: Date | string | null) {
  if (!value) return ""
  return new Date(value).toISOString().slice(0, 10)
}

export function toDateTimeInput(value: Date | string | null) {
  if (!value) return ""
  const d = new Date(value)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

export function formatRelativeTime(date: Date | string, locale: string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const isEs = locale === "es";
  const isCa = locale === "ca";

  if (diffMins < 1) {
    if (isEs) return "ahora mismo";
    if (isCa) return "ara mateix";
    return "just now";
  }
  if (diffMins < 60) {
    if (isEs) return `hace ${diffMins} min`;
    if (isCa) return `fa ${diffMins} min`;
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    if (isEs) return `hace ${diffHours} h`;
    if (isCa) return `fa ${diffHours} h`;
    return `${diffHours}h ago`;
  }
  if (isEs) return `hace ${diffDays} d`;
  if (isCa) return `fa ${diffDays} d`;
  return `${diffDays}d ago`;
}