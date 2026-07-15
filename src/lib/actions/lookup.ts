"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { lookupPostcode } from "@/lib/postcodes";

export type LookupState = { message?: string } | undefined;

export async function lookupAddress(_prevState: LookupState, formData: FormData): Promise<LookupState> {
  const postcode = String(formData.get("postcode") ?? "");
  const result = await lookupPostcode(postcode);

  if (!result.ok) {
    return { message: result.error };
  }

  const ward = await prisma.ward.findFirst({
    where: { name: { equals: result.ward, mode: "insensitive" } },
    include: { council: true },
  });

  if (!ward) {
    return {
      message: `We don't have demo data for ${result.ward} (${result.district}) yet. This MVP currently only covers our pilot borough.`,
    };
  }

  redirect(`/wards/${ward.id}`);
}
