"use server";

import "server-only";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { userRolesTable } from "@/db/schema";
import { userRoleSchema } from "@/formSchemas/user-role";
import { getUserRole } from "@/lib/user-role";
import * as yup from "yup";

export async function chooseUserRole(
  unsafeData: yup.InferType<typeof userRoleSchema>,
): Promise<{ error: boolean; message?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: true, message: "Sign in again before choosing a role." };

  try {
    const { role } = await userRoleSchema.validate(unsafeData);
    if (await getUserRole(userId)) return { error: true, message: "Your trace role has already been selected." };
    await db.insert(userRolesTable).values({ clerkUserId: userId, role }).onConflictDoNothing();
    if ((await getUserRole(userId)) !== role) return { error: true, message: "We couldn’t save your role. Please try again." };
  } catch {
    return { error: true, message: "Choose whether you’ll use trace as a student or instructor." };
  }

  return { error: false };
}
