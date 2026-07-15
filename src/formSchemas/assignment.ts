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
      .matches(/^\d{6}$/, "Enter the six-digit assignment code"),
  })
  .required();
