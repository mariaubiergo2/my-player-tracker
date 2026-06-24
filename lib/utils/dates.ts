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