"use server";

import { redirect } from "next/navigation";

export type LookupState = { message?: string } | undefined;

export async function lookupAddress(_prevState: LookupState, formData: FormData): Promise<LookupState> {
  const postcode = String(formData.get("postcode") ?? "").trim();
  if (!postcode) return { message: "Enter a postcode." };
  redirect(`/find?postcode=${encodeURIComponent(postcode)}`);
}
