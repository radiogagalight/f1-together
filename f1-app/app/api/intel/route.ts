import { NextRequest, NextResponse } from "next/server";
import { fetchHistoricalCircuitResult } from "@/lib/openf1Intel";

export const maxDuration = 60; // Vercel Hobby allows up to 60s

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const round = parseInt(searchParams.get("round") ?? "");
  const year  = parseInt(searchParams.get("year")  ?? "");

  if (!round || !year) {
    return NextResponse.json({ error: "round and year are required" }, { status: 400 });
  }

  const result = await fetchHistoricalCircuitResult(round, year);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
