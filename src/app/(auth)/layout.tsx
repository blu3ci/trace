import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (userId != null) redirect("/");

  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      {children}
    </div>
  );
}
