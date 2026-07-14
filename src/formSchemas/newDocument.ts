import * as yup from "yup"

export const newDocumentSchema = yup.object({
  title: yup.string().required("Document title is required"),
}).required()