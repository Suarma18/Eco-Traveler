import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, parseAiPreferences } from "@/lib/gemini";

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
    if (!body || typeof body.prompt !== "string" || !body.prompt.trim()) {
      return NextResponse.json(
        {
          success: false,
          isAiGenerated: false,
          error: "Invalid payload: 'prompt' string is required",
        },
        { status: 400 }
      );
    }

    const cleanPrompt = body.prompt.slice(0, 300).trim();
    const locale = body.locale === "en" ? "en" : "id";

    const result = await parseAiPreferences(cleanPrompt, locale);

    if (result.data) {
      return NextResponse.json({
        success: true,
        isAiGenerated: !result.isFallback,
        fallback: result.isFallback,
        parsed: result.data,
      });
    }

    return NextResponse.json({
      success: false,
      isAiGenerated: false,
      fallback: true,
      error:
        locale === "en"
          ? "We could not identify travel parameters from that prompt. Try e.g. '3 days relaxed with culinary focus'."
          : "Preferensi tidak teridentifikasi. Coba ketik misalnya '3 hari santai tambah kuliner' atau 'dari gilimanuk budget murah'.",
    });
  } catch (err) {
    console.error("Error in /api/ai/parse-preferences:", err);
    return NextResponse.json(
      { success: false, isAiGenerated: false, fallback: true },
      { status: 500 }
    );
  }
}
