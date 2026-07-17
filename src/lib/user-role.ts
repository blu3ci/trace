import "server-only";

import { db } from "@/db";

export const USER_ROLES = ["student", "instructor"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export async function getUserRole(clerkUserId: string): Promise<UserRole | null> {
  const profile = await db.query.userRolesTable.findFirst({
    where: { clerkUserId },
    columns: { role: true },
  });

  return profile?.role ?? null;
}

export async function hasUserRole(clerkUserId: string, role: UserRole) {
  return (await getUserRole(clerkUserId)) === role;
}
