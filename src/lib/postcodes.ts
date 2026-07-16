export type PostcodeLookupResult =
  | {
      ok: true;
      postcode: string;
      district: string; // admin_district (borough / district / unitary)
      county: string | null; // admin_county (upper tier, two-tier areas only)
      ward: string | null; // admin_ward (district ward)
      division: string | null; // ced (county electoral division, two-tier areas)
    }
  | { ok: false; error: string };

export async function lookupPostcode(rawPostcode: string): Promise<PostcodeLookupResult> {
  const postcode = rawPostcode.trim();
  if (!postcode) return { ok: false, error: "Enter a postcode." };

  const res = await fetch(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`,
    { cache: "no-store" }
  );

  if (res.status === 404) {
    return { ok: false, error: "That postcode wasn't recognized. Double check it and try again." };
  }
  if (!res.ok) {
    return { ok: false, error: "Postcode lookup is temporarily unavailable. Try again shortly." };
  }

  const data = await res.json();
  const result = data?.result;
  if (!result?.admin_district) {
    return { ok: false, error: "Couldn't determine a council for that postcode." };
  }

  return {
    ok: true,
    postcode: result.postcode,
    district: result.admin_district,
    county: result.admin_county || null,
    ward: result.admin_ward || null,
    division: result.ced || null,
  };
}
