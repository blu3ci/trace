"use client";

import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { newDocumentSchema } from "@/formSchemas/document";
import Link from "next/link";
import { createDocument } from "@/server/actions/documents";
import { FilePlus } from "lucide-react";

export default function NewDocumentPage() {
  const form = useForm({
    resolver: yupResolver(newDocumentSchema),
    defaultValues: {
      title: "Untitled Document",
    },
  });

  async function onSubmit(values: yup.InferType<typeof newDocumentSchema>) {
    const data = await createDocument(values);

    if (data?.error) {
      form.setError("root", {
        message: "There was an error creating your document",
      });
    }
  }

  return (
    <div className="flex flex-row items-center justify-center h-screen">
      <Card className="sm:w-md w-full mx-2">
        <CardHeader className="flex justify-between items-center">
          <div>
            <CardTitle>New Document</CardTitle>
            <CardDescription>Create a new document.</CardDescription>
          </div>
          <div className="bg-black p-4 rounded">
            <FilePlus className="text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <form id="new-document-form" onSubmit={form.handleSubmit(onSubmit)}>
            {form.formState.errors.root && (
              <div className="text-destructive text-sm">
                {form.formState.errors.root.message}
              </div>
            )}
            <FieldGroup>
              <Controller
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="title">Document Title</FieldLabel>
                    <Input
                      id="title"
                      {...field}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <Field orientation="horizontal">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              render={<Link href="/dashboard" />}
              nativeButton={false}
            >
              Cancel
            </Button>
            <Button type="submit" form="new-document-form">
              Create
            </Button>
          </Field>
        </CardFooter>
      </Card>
    </div>
  );
}
