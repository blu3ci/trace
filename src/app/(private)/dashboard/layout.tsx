import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <header className="fixed w-full z-1 backdrop-blur-xl">
        <nav
          className="flex items-center justify-between container mx-auto p-5"
          aria-label="Primary navigation"
        >
          <Logo />
          <div className="hidden md:flex gap-8">
            <Button
              variant={"link"}
              nativeButton={false}
              render={<Link href={"/dashboard"} />}
            >
              My Documents
            </Button>
            <Button
              variant={"link"}
              nativeButton={false}
              render={<Link href={"/dashboard/assignments"} />}
            >
              My Assignments
            </Button>
            <Button
              variant={"link"}
              nativeButton={false}
              render={<Link href={"/dashboard/assignments/instructor"} />}
            >
              Instructor Assignments
            </Button>
          </div>

          <UserButton />
        </nav>
      </header>
      <main className="mt-20">{children}</main>
    </>
  );
}
