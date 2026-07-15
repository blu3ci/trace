import { defineRelations } from "drizzle-orm";

import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  documentsTable: {
    assignmentSubmission: r.one.assignmentSubmissionsTable({
      from: r.documentsTable.id,
      to: r.assignmentSubmissionsTable.documentId,
    }),
  },
  assignmentsTable: {
    members: r.many.assignmentMembersTable({
      from: r.assignmentsTable.id,
      to: r.assignmentMembersTable.assignmentId,
    }),
    submissions: r.many.assignmentSubmissionsTable({
      from: r.assignmentsTable.id,
      to: r.assignmentSubmissionsTable.assignmentId,
    }),
  },
  assignmentMembersTable: {
    assignment: r.one.assignmentsTable({
      from: r.assignmentMembersTable.assignmentId,
      to: r.assignmentsTable.id,
    }),
  },
  assignmentSubmissionsTable: {
    assignment: r.one.assignmentsTable({
      from: r.assignmentSubmissionsTable.assignmentId,
      to: r.assignmentsTable.id,
    }),
    document: r.one.documentsTable({
      from: r.assignmentSubmissionsTable.documentId,
      to: r.documentsTable.id,
    }),
  },
}));
