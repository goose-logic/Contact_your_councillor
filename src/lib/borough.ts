// Normalizes a council name so postcodes.io's admin_district / admin_county can
// be matched against the council names in our dataset. Handles "&" vs "and",
// "City of" / "County of" prefixes/suffixes (e.g. "Bristol, City of" -> bristol,
// "County Durham" -> durham), periods ("St. Helens"), casing and punctuation.
export function councilKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\./g, "")
    .replace(/\bcity of\b/g, "")
    .replace(/\bcounty of\b/g, "")
    .replace(/\bcounty\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

// Normalizes a ward / electoral-division name for matching against
// postcodes.io's admin_ward (district wards) and ced (county divisions).
export function wardKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\./g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function councilSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Postcodes.io occasionally uses a different spelling from our dataset. Map the
// normalized postcodes.io key to the normalized dataset key here. Extend as live
// testing surfaces mismatches.
const COUNCIL_ALIASES: Record<string, string> = {
  // e.g. "comhairle nan eilean siar": "na h eileanan siar",
};

export function resolveCouncilKey(name: string): string {
  const key = councilKey(name);
  return COUNCIL_ALIASES[key] ?? key;
}
