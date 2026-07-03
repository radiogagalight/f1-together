import { NextResponse } from "next/server";
import { sendWeekendReminders } from "@/lib/server/raceReminders";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await sendWeekendReminders();
  return NextResponse.json({ ok: true, results });
}
