export type PostcodeLookupResult =
  | { ok: true; postcode: string; ward: string; district: string }
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
  if (!result?.admin_ward || !result?.admin_district) {
    return { ok: false, error: "Couldn't determine a ward for that postcode." };
  }

  return {
    ok: true,
    postcode: result.postcode,
    ward: result.admin_ward,
    district: result.admin_district,
  };
}
