import { neon } from "@neondatabase/serverless";
import { defineRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, relations: defineRelations(schema) });
