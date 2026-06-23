export const toIntOrUndefined = (val: string) =>
  val.trim() === "" ? undefined : parseInt(val, 10)

export const toListOrEmpty = (val: string) =>
  val.split(",").map((s) => s.trim()).filter(Boolean)