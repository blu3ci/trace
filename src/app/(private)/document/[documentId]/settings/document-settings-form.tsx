"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardList, Trash2 } from "lucide-react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateDocumentTitle,
  deleteDocument,
  attachDocumentToAssignment,
} from "@/server/actions/documents";
import { updateDocumentTitleSchema } from "@/formSchemas/document";
import { attachDocumentToAssignmentSchema } from "@/formSchemas/assignment";

export function DocumentSettingsForm({
  documentId,
  title,
  isSubmitted,
  isAttachedToAssignment,
  attachedAssignmentTitle,
  availableAssignments,
}: {
  documentId: string;
  title: string;
  isSubmitted: boolean;
  isAttachedToAssignment: boolean;
  attachedAssignmentTitle?: string;
  availableAssignments: Array<{ id: string; label: string }>;
}) {
  const router = useRouter();
  const form = useForm({
    resolver: yupResolver(updateDocumentTitleSchema),
    defaultValues: { title },
  });
  const assignmentForm = useForm({
    resolver: yupResolver(attachDocumentToAssignmentSchema),
    defaultValues: { assignmentId: "", documentId },
  });

  async function onSubmit(
    values: yup.InferType<typeof updateDocumentTitleSchema>,
  ) {
    const result = await updateDocumentTitle(documentId, values);

    if (result?.error) {
      form.setError("root", {
        message: result.message ?? "There was an error updating this document.",
      });
      return;
    }

    router.push("/dashboard");
  }

  async function onDelete() {
    const result = await deleteDocument(documentId);

    if (result?.error) {
      form.setError("root", {
        message: result.message ?? "There was an error deleting this document.",
      });
    }
  }

  async function onAttachToAssignment(
    values: yup.InferType<typeof attachDocumentToAssignmentSchema>,
  ) {
    const result = await attachDocumentToAssignment(documentId, values.assignmentId);
    if (result.error) {
      assignmentForm.setError("root", {
        message: result.message ?? "This document could not be attached. It may already be assigned.",
      });
      return;
    }

    router.push(`/document/${documentId}`);
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
          {!isSubmitted && (
            <section className="mt-8 border-t pt-6">
              <div className="flex items-start gap-2">
                <ClipboardList className="mt-0.5 size-4 text-[#567160]" />
                <div>
                  <h2 className="font-medium">Submit to an assignment</h2>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">Use this existing draft for an assignment you&apos;ve joined.</p>
                </div>
              </div>
              {isAttachedToAssignment ? (
                <div className="mt-4 rounded-lg border border-[#bfd0c2] bg-[#f7faf7] px-3 py-3 text-sm text-[#315943]">
                  <p>This document is attached to {attachedAssignmentTitle ? <span className="font-medium">{attachedAssignmentTitle}</span> : "an assignment"}.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" nativeButton={false} render={<Link href={`/document/${documentId}`} />}>Open document</Button>
                    <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/dashboard/assignments" />}>My assignments</Button>
                  </div>
                </div>
              ) : availableAssignments.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Join an assignment first, then return here to use this draft for it.</p>
              ) : (
                <form className="mt-4" onSubmit={assignmentForm.handleSubmit(onAttachToAssignment)}>
                  <FieldGroup>
                    <Controller
                      name="assignmentId"
                      control={assignmentForm.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="assignment">Assignment</FieldLabel>
                          <Select
                            items={availableAssignments.map((assignment) => ({ label: assignment.label, value: assignment.id }))}
                            value={field.value}
                            onValueChange={(value) => field.onChange(value ?? "")}
                          >
                            <SelectTrigger id="assignment" className="w-full" aria-invalid={fieldState.invalid}>
                              <SelectValue placeholder="Choose an assignment" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableAssignments.map((assignment) => <SelectItem key={assignment.id} value={assignment.id}>{assignment.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                    {assignmentForm.formState.errors.root && <FieldError errors={[assignmentForm.formState.errors.root]} />}
                    <Button type="submit" disabled={assignmentForm.formState.isSubmitting}>Use this document</Button>
                  </FieldGroup>
                </form>
              )}
            </section>
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
