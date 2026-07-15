"use server";

import bcrypt from "bcryptjs";
import * as z from "zod";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";

const SignupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export type SignupState = {
  errors?: { name?: string[]; email?: string[]; password?: string[] };
  message?: string;
} | undefined;

export async function signupCitizen(_prevState: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = SignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return { message: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, email: normalizedEmail, passwordHash, role: "CITIZEN" },
  });

  await signIn("credentials", {
    email: normalizedEmail,
    password,
    redirectTo: "/dashboard",
  });
}

export async function loginAction(_prevState: SignupState, formData: FormData): Promise<SignupState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const callbackUrl = formData.get("callbackUrl");

  if (typeof email !== "string" || typeof password !== "string") {
    return { message: "Enter your email and password." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: typeof callbackUrl === "string" && callbackUrl ? callbackUrl : "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Invalid email or password." };
    }
    throw error;
  }
}
