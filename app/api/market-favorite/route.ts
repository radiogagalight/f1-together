import { NextRequest, NextResponse } from "next/server";

export interface MarketFavorite {
  name: string;
  probability: number; // 0–100 integer
  runnerUp?: { name: string; probability: number };
  marketUrl: string;
}

export async function GET(req: NextRequest) {
  const raceName = req.nextUrl.searchParams.get("race") ?? "";
  if (!raceName) return NextResponse.json(null);

  try {
    const q = encodeURIComponent(raceName);
    const res = await fetch(
      `https://gamma-api.polymarket.com/markets?q=${q}&limit=20&closed=false`,
      { next: { revalidate: 3600 } },
    );

    if (!res.ok) return NextResponse.json(null);

    const markets: PolyMarket[] = await res.json();

    // Find the most relevant active race-winner market
    const lower = raceName.toLowerCase();
    const market = markets.find(
      (m) =>
        m.active &&
        !m.closed &&
        m.question?.toLowerCase().includes(lower) &&
        // Must have a list of driver outcomes, not a yes/no market
        (() => {
          try {
            const outs = Array.isArray(m.outcomes)
              ? m.outcomes
              : JSON.parse(m.outcomes as unknown as string);
            return outs.length > 2;
          } catch {
            return false;
          }
        })(),
    );

    if (!market) return NextResponse.json(null);

    const outcomes: string[] = Array.isArray(market.outcomes)
      ? market.outcomes
      : JSON.parse(market.outcomes as unknown as string);
    const prices: string[] = Array.isArray(market.outcomePrices)
      ? market.outcomePrices
      : JSON.parse(market.outcomePrices as unknown as string);

    // Rank by price descending
    const ranked = outcomes
      .map((name, i) => ({ name, p: parseFloat(prices[i] ?? "0") }))
      .sort((a, b) => b.p - a.p);

    const top = ranked[0];
    const second = ranked[1];

    if (!top || top.p < 0.03) return NextResponse.json(null); // sanity check

    const result: MarketFavorite = {
      name: top.name,
      probability: Math.round(top.p * 100),
      runnerUp: second
        ? { name: second.name, probability: Math.round(second.p * 100) }
        : undefined,
      marketUrl: `https://polymarket.com/event/${market.slug}`,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(null);
  }
}

interface PolyMarket {
  slug: string;
  question: string;
  active: boolean;
  closed: boolean;
  outcomes: string[] | string;
  outcomePrices: string[] | string;
}
