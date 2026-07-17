export function canJoinAssignment({
  assignmentArchivedAt,
  assignmentOwnerId,
  viewerId,
}: {
  assignmentArchivedAt: Date | null;
  assignmentOwnerId: string;
  viewerId: string;
}) {
  return !assignmentArchivedAt && assignmentOwnerId !== viewerId;
}

export function canEditDocument(submittedAt: Date | null) {
  return submittedAt == null;
}

export function canViewReceipt({
  assignmentOwnerId,
  studentId,
  viewerId,
}: {
  assignmentOwnerId: string;
  studentId: string;
  viewerId: string;
}) {
  return viewerId === studentId || viewerId === assignmentOwnerId;
}
