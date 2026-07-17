import { defineRelations } from "drizzle-orm";

import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  documentsTable: {
    assignmentSubmission: r.one.assignmentSubmissionsTable({
      from: r.documentsTable.id,
      to: r.assignmentSubmissionsTable.documentId,
    }),
    milestones: r.many.documentMilestonesTable({
      from: r.documentsTable.id,
      to: r.documentMilestonesTable.documentId,
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
    receipt: r.one.assignmentReceiptsTable({
      from: r.assignmentSubmissionsTable.id,
      to: r.assignmentReceiptsTable.submissionId,
    }),
  },
  documentMilestonesTable: {
    document: r.one.documentsTable({
      from: r.documentMilestonesTable.documentId,
      to: r.documentsTable.id,
    }),
  },
  assignmentReceiptsTable: {
    submission: r.one.assignmentSubmissionsTable({
      from: r.assignmentReceiptsTable.submissionId,
      to: r.assignmentSubmissionsTable.id,
    }),
    document: r.one.documentsTable({
      from: r.assignmentReceiptsTable.documentId,
      to: r.documentsTable.id,
    }),
    legitimacyAnalysis: r.one.receiptLegitimacyAnalysesTable({
      from: r.assignmentReceiptsTable.id,
      to: r.receiptLegitimacyAnalysesTable.receiptId,
    }),
  },
  receiptLegitimacyAnalysesTable: {
    receipt: r.one.assignmentReceiptsTable({
      from: r.receiptLegitimacyAnalysesTable.receiptId,
      to: r.assignmentReceiptsTable.id,
    }),
  },
}));
