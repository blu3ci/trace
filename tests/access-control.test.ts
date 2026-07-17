import { describe, expect, it } from "vitest";

import { canEditDocument, canJoinAssignment, canViewReceipt } from "../src/lib/access-control";

describe("assignment access control", () => {
  it("does not allow an instructor to join their own assignment", () => {
    expect(canJoinAssignment({ assignmentArchivedAt: null, assignmentOwnerId: "instructor", viewerId: "instructor" })).toBe(false);
  });

  it("does not allow a student to join an archived assignment", () => {
    expect(canJoinAssignment({ assignmentArchivedAt: new Date(), assignmentOwnerId: "instructor", viewerId: "student" })).toBe(false);
  });

  it("allows a student to join an active assignment", () => {
    expect(canJoinAssignment({ assignmentArchivedAt: null, assignmentOwnerId: "instructor", viewerId: "student" })).toBe(true);
  });
});

describe("submitted documents", () => {
  it("cannot be edited after submission", () => {
    expect(canEditDocument(new Date())).toBe(false);
    expect(canEditDocument(null)).toBe(true);
  });
});

describe("receipt access", () => {
  it("allows the submitting student and assignment instructor", () => {
    expect(canViewReceipt({ viewerId: "student", studentId: "student", assignmentOwnerId: "instructor" })).toBe(true);
    expect(canViewReceipt({ viewerId: "instructor", studentId: "student", assignmentOwnerId: "instructor" })).toBe(true);
  });

  it("does not allow another student to view the receipt", () => {
    expect(canViewReceipt({ viewerId: "other-student", studentId: "student", assignmentOwnerId: "instructor" })).toBe(false);
  });
});
