type LoadingKind = "workspace" | "editor" | "settings" | "receipt" | "comparison" | "submissions";

export function PageLoading({
  label = "Loading your workspace",
  kind = "workspace",
}: {
  label?: string;
  kind?: LoadingKind;
}) {
  return (
    <div className="container mx-auto max-w-6xl animate-pulse px-5 py-8 sm:px-8 sm:py-10" aria-live="polite" aria-label={label}>
      {kind === "editor" ? <EditorSkeleton /> : kind === "receipt" ? <ReceiptSkeleton /> : kind === "comparison" ? <ComparisonSkeleton /> : kind === "settings" ? <SettingsSkeleton /> : kind === "submissions" ? <SubmissionsSkeleton /> : <WorkspaceSkeleton />}
      <span className="sr-only">{label}</span>
    </div>
  );
}

function Line({ className = "" }: { className?: string }) { return <div className={`rounded bg-[#e1e7e1] ${className}`} />; }

function WorkspaceSkeleton() {
  return <><Line className="h-4 w-28" /><Line className="mt-4 h-10 w-64 max-w-full bg-[#d8e1d9]" /><Line className="mt-3 h-5 w-full max-w-lg" /><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-52 rounded-xl border border-[#e2e8e3] bg-white" />)}</div></>;
}

function EditorSkeleton() {
  return <div className="mx-auto max-w-4xl"><div className="flex items-center justify-between"><Line className="h-8 w-28" /><Line className="h-8 w-24" /></div><Line className="mt-8 h-10 w-80 max-w-full bg-[#d8e1d9]" /><div className="mt-8 rounded-xl border border-[#e2e8e3] bg-white p-6 sm:p-10"><Line className="h-5 w-full" /><Line className="mt-4 h-5 w-[92%]" /><Line className="mt-4 h-5 w-[76%]" /><Line className="mt-10 h-5 w-full" /><Line className="mt-4 h-5 w-[84%]" /></div></div>;
}

function ReceiptSkeleton() {
  return <><Line className="h-8 w-20" /><Line className="mt-8 h-4 w-28" /><Line className="mt-3 h-10 w-80 max-w-full bg-[#d8e1d9]" /><div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-28 rounded-xl border border-[#e2e8e3] bg-white" />)}</div><div className="mt-8 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]"><div className="h-80 rounded-xl border border-[#e2e8e3] bg-white" /><div className="h-96 rounded-xl border border-[#e2e8e3] bg-white" /></div></>;
}

function ComparisonSkeleton() {
  return <><Line className="h-8 w-24" /><Line className="mt-8 h-10 w-96 max-w-full bg-[#d8e1d9]" /><div className="mt-8 grid gap-4 lg:grid-cols-2">{[0, 1].map((item) => <div key={item} className="h-[28rem] rounded-xl border border-[#e2e8e3] bg-white" />)}</div></>;
}

function SettingsSkeleton() {
  return <div className="mx-auto max-w-xl"><Line className="h-4 w-24" /><Line className="mt-4 h-10 w-64 bg-[#d8e1d9]" /><div className="mt-8 rounded-xl border border-[#e2e8e3] bg-white p-6"><Line className="h-4 w-24" /><Line className="mt-3 h-10 w-full" /><Line className="mt-7 h-4 w-32" /><Line className="mt-3 h-10 w-full" /><Line className="mt-8 h-9 w-36 bg-[#d8e1d9]" /></div></div>;
}

function SubmissionsSkeleton() {
  return <><Line className="h-8 w-52" /><Line className="mt-4 h-10 w-80 max-w-full bg-[#d8e1d9]" /><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-24 rounded-xl border border-[#e2e8e3] bg-white" />)}</div><div className="mt-8 grid gap-6 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-72 rounded-xl border border-[#e2e8e3] bg-white" />)}</div></>;
}
