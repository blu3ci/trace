import * as yup from "yup";

export const receiptLegitimacyAnalysisSchema = yup.object({
  submissionId: yup.string().uuid().required(),
});
