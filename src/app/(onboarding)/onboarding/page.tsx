import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getUserRole } from "@/lib/user-role";
import { RoleSelectionForm } from "./role-selection-form";

export default async function OnboardingPage() {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();
  if (await getUserRole(userId)) redirect("/dashboard");

  return <RoleSelectionForm />;
}
