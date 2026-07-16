// Normalizes a borough / council name so postcodes.io's admin_district can be
// matched against the borough names in our councillor dataset. Handles "&" vs
// "and", casing (e.g. "Kingston Upon Thames" vs "Kingston upon Thames"), and
// punctuation/spacing differences.
export function boroughKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function boroughSlug(name: string): string {
  return boroughKey(name).replace(/\s+/g, "-");
}
