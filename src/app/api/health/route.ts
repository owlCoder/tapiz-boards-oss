import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";

export const dynamic = "force-dynamic";

/** Health endpoint — koristi ga i eksterni monitoring (Tapiz LMS status sistem). */
export async function GET() {
  let dbStatus: "ok" | "down" = "ok";
  try {
    await db.execute(sql`select 1`);
  } catch {
    dbStatus = "down";
  }
  const healthy = dbStatus === "ok";
  return NextResponse.json(
    {
      service: "tapiz-boards",
      status: healthy ? "operational" : "degraded",
      db: dbStatus,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
