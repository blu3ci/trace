"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { joinAssignmentSchema } from "@/formSchemas/assignment";
import { joinAssignment } from "@/server/actions/assignments";

export function JoinAssignmentForm() {
  const form = useForm({
    resolver: yupResolver(joinAssignmentSchema),
    defaultValues: { accessCode: "" },
  });

  async function onSubmit(values: yup.InferType<typeof joinAssignmentSchema>) {
    const data = await joinAssignment(values);

    if (data.error) {
      form.setError("root", {
        message: "We couldn’t find an assignment with that code.",
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
          name="accessCode"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="assignment-access-code">Assignment code</FieldLabel>
              <Input
                id="assignment-access-code"
                autoCapitalize="none"
                maxLength={8}
                placeholder="a1b2c3d4"
                {...field}
                aria-invalid={fieldState.invalid}
                onChange={(event) => field.onChange(event.target.value.toLowerCase().replace(/[^0-9a-f]/g, ""))}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Button type="submit" variant="outline" className="w-full" disabled={form.formState.isSubmitting}>
          Join assignment
        </Button>
      </FieldGroup>
    </form>
  );
}
