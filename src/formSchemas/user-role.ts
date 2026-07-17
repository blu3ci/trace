import * as yup from "yup";

export const userRoleSchema = yup.object({
  role: yup.mixed<"student" | "instructor">().oneOf(["student", "instructor"]).required("Choose how you’ll use Trace"),
}).required();
