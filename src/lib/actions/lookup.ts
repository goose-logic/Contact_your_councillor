"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { lookupPostcode } from "@/lib/postcodes";
import { boroughKey } from "@/lib/borough";

export type LookupState = { message?: string } | undefined;

export async function lookupAddress(_prevState: LookupState, formData: FormData): Promise<LookupState> {
  const postcode = String(formData.get("postcode") ?? "");
  const result = await lookupPostcode(postcode);

  if (!result.ok) {
    return { message: result.error };
  }

  const council = await prisma.council.findFirst({
    where: { matchKey: boroughKey(result.district) },
  });

  if (!council) {
    return {
      message: `We found your area (${result.district}) but don't have its councillors loaded yet. This pilot currently covers the 32 London boroughs and the City of London.`,
    };
  }

  redirect(`/councils/${council.slug}?ward=${encodeURIComponent(result.ward)}`);
}
