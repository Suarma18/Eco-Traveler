import { NextRequest, NextResponse } from "next/server";
import { TripRequest, BudgetCategory, ArrivalGate } from "@/types/trip";
import { generateRedistributiveItinerary } from "@/lib/ai-engine";
import { DESA_DATASET } from "@/lib/scoring";

export const runtime = "nodejs";

const VALID_BUDGETS: BudgetCategory[] = ["Backpacker", "Moderate", "Comfort"];
const VALID_GATES: ArrivalGate[] = ["NgurahRaiAirport", "GilimanukPort"];

// Simple per-IP token bucket (max 20 requests per minute per IP)
const RATE_WINDOW_MS = 60_000;
const MAX_REQ_PER_WINDOW = 20;
const ipHits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  if (ipHits.size > 500) {
    ipHits.forEach((v, k) => {
      if (v.resetAt <= now) ipHits.delete(k);
    });
  }
  const entry = ipHits.get(ip);
  if (!entry || entry.resetAt <= now) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQ_PER_WINDOW;
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

    const body = await req.json();

    const durationDays = Math.min(
      4,
      Math.max(1, Number(body.durationDays) || 3)
    );
    const interests: string[] =
      Array.isArray(body.interests) && body.interests.length > 0
        ? body.interests.slice(0, 5).map(String)
        : ["Culture", "Nature"];

    const budgetCategory: BudgetCategory = VALID_BUDGETS.includes(
      body.budgetCategory
    )
      ? body.budgetCategory
      : "Moderate";

    const arrivalGate: ArrivalGate = VALID_GATES.includes(body.arrivalGate)
      ? body.arrivalGate
      : "NgurahRaiAirport";

    const tripRequest: TripRequest = {
      durationDays,
      interests,
      budgetCategory,
      arrivalGate,
      simulateCapacityAlert: Boolean(body.simulateCapacityAlert),
    };

    // If IP exceeds rate limit, serve deterministic fallback directly without calling Gemini
    const itinerary = await generateRedistributiveItinerary(
      tripRequest,
      isRateLimited(ip)
    );

    return NextResponse.json(itinerary, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[POST /api/itinerary] Error:", error);
    const fallback = await generateRedistributiveItinerary(
      {
        durationDays: 3,
        interests: ["Culture", "Nature"],
        budgetCategory: "Moderate",
        arrivalGate: "NgurahRaiAirport",
        simulateCapacityAlert: true,
      },
      true
    );
    return NextResponse.json(fallback, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Eco Traveler Spatial Engine",
    verifiedVillagesCount: DESA_DATASET.length,
    villages: DESA_DATASET,
  });
}
