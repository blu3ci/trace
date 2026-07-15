import { defineRelations } from "drizzle-orm";

import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  assignmentsTable: {
    members: r.many.assignmentMembersTable({
      from: r.assignmentsTable.id,
      to: r.assignmentMembersTable.assignmentId,
    }),
  },
  assignmentMembersTable: {
    assignment: r.one.assignmentsTable({
      from: r.assignmentMembersTable.assignmentId,
      to: r.assignmentsTable.id,
    }),
  },
}));
