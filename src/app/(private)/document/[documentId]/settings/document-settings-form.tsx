"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import {
  updateDocumentTitle,
  deleteDocument,
} from "@/server/actions/documents";
import { updateDocumentTitleSchema } from "@/formSchemas/document";
import { redirect } from "next/navigation";

export function DocumentSettingsForm({
  documentId,
  title,
  isSubmitted,
}: {
  documentId: string;
  title: string;
  isSubmitted: boolean;
}) {
  const form = useForm({
    resolver: yupResolver(updateDocumentTitleSchema),
    defaultValues: { title },
  });

  async function onSubmit(
    values: yup.InferType<typeof updateDocumentTitleSchema>,
  ) {
    const result = await updateDocumentTitle(documentId, values);

    if (result?.error) {
      form.setError("root", {
        message: "There was an error updating this document.",
      });
    }

    redirect("/dashboard")
  }

  async function onDelete() {
    const result = await deleteDocument(documentId);

    if (result?.error) {
      form.setError("root", {
        message: "There was an error deleting this document.",
      });
    }
  }

  return (
    <div className="container mx-auto flex min-h-screen max-w-xl items-center px-5 py-10">
      <Card className="w-full">
        <CardHeader>
          <Button
            className="-ml-2 mb-3 w-fit text-muted-foreground"
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href={`/dashboard`} />}
          >
            <ArrowLeft /> Back
          </Button>
          <CardTitle>Document settings</CardTitle>
          <CardDescription>
            Update the title or permanently delete this document.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <p className="rounded-lg border border-[#bfd0c2] bg-[#f7faf7] px-3 py-2 text-sm text-[#315943]">
              Submitted documents are locked and can’t be renamed or deleted.
            </p>
          ) : (
            <form
              id="document-settings-form"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FieldGroup>
                <Controller
                  name="title"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="document-title">
                        Document title
                      </FieldLabel>
                      <Input
                        id="document-title"
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
          )}
          {form.formState.errors.root && (
            <FieldError
              className="mt-4"
              errors={[form.formState.errors.root]}
            />
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-between gap-3">
          <AlertDialog>
            <AlertDialogTrigger
              disabled={isSubmitted || form.formState.isSubmitting}
              render={<Button variant="destructive" />}
            >
              <Trash2 /> Delete document
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this document?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the document and its revision
                  history. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={form.formState.isSubmitting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={onDelete}
                  disabled={form.formState.isSubmitting}
                >
                  Delete document
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            type="submit"
            form="document-settings-form"
            disabled={isSubmitted || form.formState.isSubmitting}
          >
            Save changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
