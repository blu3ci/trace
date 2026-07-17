import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { BookOpen, ClipboardList, FileText } from "lucide-react";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <header className="fixed z-10 w-full border-b border-transparent bg-[#fbfaf7]/80 backdrop-blur-xl">
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

          <div className="flex items-center gap-1"><Button className="hidden md:inline-flex" variant="link" nativeButton={false} render={<Link href="/dashboard/how-it-works" />}>How Trace works</Button><UserButton /></div>
        </nav>
        <nav className="container mx-auto flex gap-1 overflow-x-auto px-5 pb-3 sm:px-8 md:hidden" aria-label="Workspace navigation">
          <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/dashboard" />}><FileText /> Documents</Button>
          <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/dashboard/assignments" />}><ClipboardList /> Assignments</Button>
          <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/dashboard/how-it-works" />}><BookOpen /> How it works</Button>
        </nav>
      </header>
      <main className="mt-32 md:mt-20">{children}</main>
    </>
  );
}
