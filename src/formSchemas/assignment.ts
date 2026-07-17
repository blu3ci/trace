import * as yup from "yup";

export const newAssignmentSchema = yup
  .object({
    title: yup
      .string()
      .trim()
      .required("Assignment title is required")
      .max(255, "Assignment title must be at most 255 characters"),
    course: yup
      .string()
      .trim()
      .max(120, "Course must be at most 120 characters"),
    dueDate: yup
      .string()
      .matches(
        /^(?:|\d{4}-\d{2}-\d{2})$/,
        "Due date must be a valid date",
      )
      .test("valid-date", "Due date must be a valid date", (value) => {
        if (!value) return true;

        const [year, month, day] = value.split("-").map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));

        return (
          date.getUTCFullYear() === year &&
          date.getUTCMonth() === month - 1 &&
          date.getUTCDate() === day
        );
      }),
    description: yup
      .string()
      .trim()
      .max(2000, "Notes must be at most 2000 characters"),
  })
  .required();

export const joinAssignmentSchema = yup
  .object({
    accessCode: yup
      .string()
      .trim()
      .lowercase()
      .matches(/^(?:[0-9a-f]{8}|\d{6})$/, "Enter a valid assignment code"),
  })
  .required();

export const assignmentSubmissionSchema = yup
  .object({
    assignmentId: yup.string().uuid().required(),
  })
  .required();

export const updateAssignmentSchema = newAssignmentSchema
  .concat(assignmentSubmissionSchema)
  .required();

export const attachDocumentToAssignmentSchema = assignmentSubmissionSchema
  .concat(
    yup.object({
      documentId: yup.string().uuid().required(),
    }),
  )
  .required();
