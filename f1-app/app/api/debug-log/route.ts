import { appendFileSync } from "fs";
import { NextResponse } from "next/server";

const LOG_PATH = "/Users/slight/Sarah Projects/f1-together/.cursor/debug-63ed1e.log";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const entry = {
      sessionId: "63ed1e",
      ...body,
      timestamp: Date.now(),
    };

    // #region agent log
    await fetch("http://127.0.0.1:7847/ingest/959fd590-47c4-42ad-a3cc-7380bb526d17", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "63ed1e",
      },
      body: JSON.stringify(entry),
    }).catch(() => {});

    try {
      appendFileSync(LOG_PATH, `${JSON.stringify(entry)}\n`);
    } catch {
      // Ignore local log file writes outside the dev machine.
    }
    // #endregion

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
