"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";
import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { newAssignmentSchema } from "@/formSchemas/assignment";
import { createAssignment } from "@/server/actions/assignments";

export function AssignmentForm() {
  const form = useForm({
    resolver: yupResolver(newAssignmentSchema),
    defaultValues: {
      title: "",
      course: "",
      dueDate: "",
      description: "",
    },
  });

  async function onSubmit(values: yup.InferType<typeof newAssignmentSchema>) {
    const data = await createAssignment(values);

    if (data?.error) {
      form.setError("root", {
        message: "There was an error adding your assignment",
      });
      return;
    }

    form.reset();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {form.formState.errors.root && (
        <FieldError className="mb-4" errors={[form.formState.errors.root]} />
      )}
      <FieldGroup>
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="assignment-title">Assignment title</FieldLabel>
              <Input id="assignment-title" placeholder="e.g. Civil Rights essay" {...field} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="course"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="assignment-course">Course <span className="font-normal text-muted-foreground">(optional)</span></FieldLabel>
              <Input id="assignment-course" placeholder="e.g. U.S. History" {...field} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="dueDate"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="assignment-due-date">Due date <span className="font-normal text-muted-foreground">(optional)</span></FieldLabel>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      id="assignment-due-date"
                      variant="outline"
                      data-empty={!field.value}
                      className="w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                      aria-invalid={fieldState.invalid}
                      onBlur={field.onBlur}
                    />
                  }
                >
                  <CalendarIcon data-icon="inline-start" />
                  {field.value ? format(parseDate(field.value), "PPP") : "Pick a date"}
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value ? parseDate(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? formatDateValue(date) : "")}
                  />
                </PopoverContent>
              </Popover>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="assignment-description">Notes <span className="font-normal text-muted-foreground">(optional)</span></FieldLabel>
              <Textarea id="assignment-description" placeholder="What does this assignment ask for?" {...field} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Button type="submit" className="w-full bg-[#315943] hover:bg-[#254735]" disabled={form.formState.isSubmitting}>
          Add assignment <Plus data-icon="inline-end" />
        </Button>
      </FieldGroup>
    </form>
  );
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
