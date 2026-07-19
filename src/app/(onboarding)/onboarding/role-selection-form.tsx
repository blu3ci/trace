"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { GraduationCap, Presentation, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import * as yup from "yup";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { userRoleSchema } from "@/formSchemas/user-role";
import { chooseUserRole } from "@/server/actions/user-role";

const roles = [
  { value: "student" as const, icon: GraduationCap, title: "I’m a student", text: "Write, submit assignments, and share your writing receipts." },
  { value: "instructor" as const, icon: Presentation, title: "I’m an instructor", text: "Create assignments and review submitted writing receipts." },
];

export function RoleSelectionForm() {
  const router = useRouter();
  const form = useForm({ resolver: yupResolver(userRoleSchema), defaultValues: { role: undefined } });

  async function onSubmit(values: yup.InferType<typeof userRoleSchema>) {
    const result = await chooseUserRole(values);
    if (result.error) {
      form.setError("root", { message: result.message ?? "We couldn’t save your role." });
      return;
    }
    router.push("/dashboard");
  }

  return <main className="min-h-screen bg-[#fbfaf7] px-5 py-6 text-[#1d2521] sm:px-8"><div className="mx-auto max-w-3xl"><Logo /><section className="mt-16 rounded-2xl border border-[#dbe3dc] bg-white p-6 shadow-sm sm:mt-20 sm:p-10"><p className="flex items-center gap-2 text-sm font-semibold tracking-[0.12em] text-[#567160] uppercase"><Sparkles className="size-4" /> Welcome to trace</p><h1 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">How will you use trace?</h1><p className="mt-3 max-w-xl leading-7 text-[#65716a]">Choose one role for this account. Students and instructors have separate workspaces so assignment access stays clear and secure.</p><form className="mt-8" onSubmit={form.handleSubmit(onSubmit)}><Controller name="role" control={form.control} render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><div className="grid gap-4 sm:grid-cols-2">{roles.map(({ value, icon: Icon, title, text }) => <button key={value} type="button" onClick={() => field.onChange(value)} className={`rounded-xl border p-5 text-left transition-colors ${field.value === value ? "border-[#315943] bg-[#edf5ee] ring-2 ring-[#b9d9c1]" : "border-[#dbe3dc] hover:border-[#9ab3a0] hover:bg-[#f7faf7]"}`}><Icon className="size-6 text-[#315943]" /><p className="mt-5 font-semibold">{title}</p><p className="mt-2 text-sm leading-6 text-[#607067]">{text}</p></button>)}</div>{fieldState.invalid && <FieldError className="mt-4" errors={[fieldState.error]} />}</Field>} />{form.formState.errors.root && <FieldError className="mt-4" errors={[form.formState.errors.root]} />}<FieldGroup className="mt-8"><Button type="submit" className="w-full bg-[#315943] hover:bg-[#254735]" disabled={form.formState.isSubmitting}>Continue</Button></FieldGroup></form></section></div></main>;
}
