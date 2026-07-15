import { auth } from "@clerk/nextjs/server";
import { CalendarDays, ClipboardList, Plus, Tag } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db";
import { AssignmentForm } from "./assignment-form";

export const revalidate = 0;

export default async function AssignmentsPage() {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  const assignments = await db.query.assignmentsTable.findMany({
    where: { clerkUserId: userId },
    orderBy: ({ dueDate, createdAt }, { asc, desc }) => [asc(dueDate), desc(createdAt)],
  });
  const today = new Date().toISOString().slice(0, 10);
  const upcomingCount = assignments.filter((assignment) => assignment.dueDate && assignment.dueDate >= today).length;

  return (
    <div className="container mx-auto max-w-6xl px-5 pb-12 sm:px-8">
      <div className="flex flex-col gap-2 py-8 sm:py-10">
        <p className="text-sm font-semibold tracking-[0.12em] text-[#567160] uppercase">Planning space</p>
        <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">My Assignments</h1>
        <p className="max-w-xl text-[#65716a]">Keep the work you need to do alongside the documents where you do it.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.76fr_1.24fr]">
        <Card className="h-fit border-[#dbe3dc] bg-[#f7faf7]">
          <CardHeader>
            <div className="flex items-center gap-2 text-[#315943]">
              <Plus className="size-4" />
              <CardTitle>New assignment</CardTitle>
            </div>
            <CardDescription>Add the work you want to keep visible in Trace.</CardDescription>
          </CardHeader>
          <CardContent>
            <AssignmentForm />
          </CardContent>
        </Card>

        <section aria-label="Assignments" className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-[#e3e7e3] bg-white px-5 py-4">
            <div>
              <p className="font-semibold">Your workload</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {assignments.length === 0 ? "No assignments yet" : `${assignments.length} tracked · ${upcomingCount} upcoming`}
              </p>
            </div>
            <span className="grid size-10 place-items-center rounded-full bg-[#e5f1e8] text-[#315943]"><ClipboardList className="size-5" /></span>
          </div>

          {assignments.length === 0 ? (
            <Card className="border-dashed border-[#cfd8d0] bg-[#fbfcfa] py-14 text-center">
              <CardContent className="flex flex-col items-center">
                <span className="grid size-12 place-items-center rounded-full bg-[#e9f0e9] text-[#567160]"><ClipboardList className="size-6" /></span>
                <CardTitle className="mt-4">Nothing due yet</CardTitle>
                <CardDescription className="mt-2 max-w-sm">Add an assignment to create a simple, personal view of the work ahead.</CardDescription>
              </CardContent>
            </Card>
          ) : (
            assignments.map((assignment) => {
              const isOverdue = assignment.dueDate ? assignment.dueDate < today : false;
              return (
                <Card key={assignment.id} className="border-[#e0e5e0] transition-shadow hover:shadow-sm">
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        {assignment.course && <CardDescription className="mt-1 flex items-center gap-1.5"><Tag className="size-3" /> {assignment.course}</CardDescription>}
                      </div>
                      {assignment.dueDate ? (
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${isOverdue ? "bg-[#fbe9e7] text-[#9b332a]" : "bg-[#e5f1e8] text-[#315943]"}`}>
                          <CalendarDays className="size-3.5" /> {isOverdue ? "Overdue" : `Due ${formatDate(assignment.dueDate)}`}
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#f0f1ef] px-2.5 py-1 text-xs font-medium text-[#69756d]">No due date</span>
                      )}
                    </div>
                  </CardHeader>
                  {assignment.description && <CardContent><p className="whitespace-pre-wrap leading-6 text-[#607067]">{assignment.description}</p></CardContent>}
                </Card>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(`${value}T00:00:00`));
}
