import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, generateAiNarrative } from "@/lib/anthropic";
import { NarrateStopInput } from "@/lib/prompts/narrate";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          isAiGenerated: false,
          error: "Rate limit exceeded (10 requests per 10 minutes)",
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.stops) || body.stops.length === 0) {
      return NextResponse.json(
        {
          success: false,
          isAiGenerated: false,
          error: "Invalid payload: 'stops' must be a non-empty array",
        },
        { status: 400 }
      );
    }

    const locale = body.locale === "en" ? "en" : "id";
    const userNote =
      typeof body.userNote === "string" ? body.userNote.slice(0, 300) : undefined;

    const validatedStops: NarrateStopInput[] = body.stops
      .filter((s: unknown) => s && typeof s === "object" && typeof (s as Record<string, unknown>).id === "string")
      .map((s: Record<string, unknown>) => ({
        id: String(s.id),
        name: String(s.name || s.id),
        regency: String(s.regency || ""),
        highlights: Array.isArray(s.highlights) ? s.highlights.map(String) : [],
        customsNote: typeof s.customsNote === "string" ? s.customsNote : undefined,
        localUmkmSpot: typeof s.localUmkmSpot === "string" ? s.localUmkmSpot : undefined,
      }));

    if (validatedStops.length === 0) {
      return NextResponse.json(
        { success: false, isAiGenerated: false, error: "No valid stops found" },
        { status: 400 }
      );
    }

    const result = await generateAiNarrative(validatedStops, locale, userNote);

    if (!result.success || !result.data) {
      return NextResponse.json({
        success: false,
        isAiGenerated: false,
        fallback: true,
      });
    }

    // Convert stops array to key-value lookup: { [stopId]: narrative }
    const stopsMap: Record<string, string> = {};
    for (const stop of result.data.stops) {
      stopsMap[stop.id] = stop.narrative;
    }

    return NextResponse.json({
      success: true,
      isAiGenerated: true,
      summary: result.data.summary,
      stops: stopsMap,
    });
  } catch (err) {
    console.error("Error in /api/ai/narrate:", err);
    return NextResponse.json(
      { success: false, isAiGenerated: false, fallback: true },
      { status: 500 }
    );
  }
}
