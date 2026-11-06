import { NextRequest, NextResponse } from "next/server";
import { TripRequest, BudgetCategory, ArrivalGate, AppLocale } from "@/types/trip";
import { generateRedistributiveItinerary } from "@/lib/ai-engine";
import { DESA_DATASET } from "@/lib/scoring";

export const runtime = "nodejs";

const VALID_BUDGETS: BudgetCategory[] = ["Backpacker", "Moderate", "Comfort"];
const VALID_GATES: ArrivalGate[] = ["NgurahRaiAirport", "GilimanukPort"];

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

    const locale: AppLocale = body.locale === "en" ? "en" : "id";

    const pace =
      body.pace === "relaxed" || body.pace === "active" ? body.pace : undefined;
    const avoidCrowds =
      body.avoidCrowds !== undefined ? Boolean(body.avoidCrowds) : undefined;
    const prioritizeLocalBusiness =
      body.prioritizeLocalBusiness !== undefined
        ? Boolean(body.prioritizeLocalBusiness)
        : undefined;
    const drivingPreference =
      body.drivingPreference === "short" || body.drivingPreference === "scenic"
        ? body.drivingPreference
        : undefined;
    const excludedFocuses = Array.isArray(body.excludedFocuses)
      ? body.excludedFocuses.map(String)
      : undefined;
    const excludedVillages = Array.isArray(body.excludedVillages)
      ? body.excludedVillages.map(String)
      : undefined;

    const tripRequest: TripRequest = {
      durationDays,
      interests,
      budgetCategory,
      arrivalGate,
      simulateCapacityAlert: Boolean(body.simulateCapacityAlert) || Boolean(avoidCrowds),
      locale,
      pace,
      avoidCrowds,
      prioritizeLocalBusiness,
      drivingPreference,
      excludedFocuses,
      excludedVillages,
    };

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
        locale: "id",
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
