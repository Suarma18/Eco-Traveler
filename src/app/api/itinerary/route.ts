import { NextRequest, NextResponse } from "next/server";
import { TripRequest, BudgetCategory, ArrivalGate } from "@/types/trip";
import { generateRedistributiveItinerary } from "@/lib/ai-engine";
import desaWisataData from "../../../../data/desa-wisata.json";

export const runtime = "nodejs";

const VALID_BUDGETS: BudgetCategory[] = ["Backpacker", "Moderate", "Comfort"];
const VALID_GATES: ArrivalGate[] = ["NgurahRaiAirport", "GilimanukPort"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const durationDays = Math.min(
      4,
      Math.max(1, Number(body.durationDays) || 3)
    );
    const interests: string[] =
      Array.isArray(body.interests) && body.interests.length > 0
        ? body.interests.map(String)
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

    const itinerary = await generateRedistributiveItinerary(tripRequest);

    return NextResponse.json(itinerary, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[POST /api/itinerary] Error:", error);
    // Zero-crash guarantee: return default 3-day itinerary even on malformed request body
    const fallback = await generateRedistributiveItinerary({
      durationDays: 3,
      interests: ["Culture", "Nature"],
      budgetCategory: "Moderate",
      arrivalGate: "NgurahRaiAirport",
      simulateCapacityAlert: true,
    });
    return NextResponse.json(fallback, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Eco Traveler Redistributive AI Engine (Bali DigiFest 2026)",
    verifiedVillagesCount: desaWisataData.length,
    villages: desaWisataData,
  });
}

