import * as yup from "yup";

export const receiptLegitimacyAnalysisSchema = yup.object({
  documentId: yup.string().uuid().required(),
});
