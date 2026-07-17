import "server-only";

import { createHash } from "node:crypto";

export function hashDocumentBody(content: unknown): string {
  return createHash("sha256").update(JSON.stringify(content ?? [])).digest("hex");
}
