import { NextResponse, type NextRequest } from "next/server";
import { eventsService } from "@/application/events.service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Applies retention to project activity history (project_events). Vercel has
 * no persistent worker, so this is hit by an external cron (GitHub Actions
 * schedule). Protected by a Bearer CRON_SECRET.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const deleted = await eventsService.applyRetention();
    return NextResponse.json({ ok: true, deleted, at: new Date().toISOString() });
  } catch (err) {
    console.error("cleanup cron failed", err);
    return NextResponse.json({ ok: false, error: "cleanup failed" }, { status: 500 });
  }
}
