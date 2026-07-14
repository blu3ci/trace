import * as yup from "yup";

const title = yup
  .string()
  .trim()
  .required("Document title is required")
  .max(255, "Document title must be at most 255 characters");

export const newDocumentSchema = yup
  .object({
    title,
  })
  .required();

export const updateDocumentTitleSchema = yup
  .object({
    title,
  })
  .required();
