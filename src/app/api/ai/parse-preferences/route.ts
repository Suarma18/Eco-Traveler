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

    if (result.status === "matched" && result.parsed) {
      return NextResponse.json({
        success: true,
        status: result.status,
        confidence: result.confidence,
        processingSource: result.processingSource,
        isAiGenerated: result.processingSource === "gemini-ai",
        fallback: result.processingSource === "semantic-fallback",
        parsed: result.parsed,
        detectedIntents: result.detectedIntents,
        conflictNotes: result.conflictNotes,
        message: result.message,
      });
    }

    return NextResponse.json({
      success: false,
      status: result.status,
      confidence: result.confidence,
      processingSource: result.processingSource,
      isAiGenerated: false,
      fallback: true,
      clarificationPrompt: result.clarificationPrompt,
      message: result.message,
      error: result.clarificationPrompt || result.message,
    });
  } catch (err) {
    console.error("Error in /api/ai/parse-preferences:", err);
    return NextResponse.json(
      { success: false, isAiGenerated: false, fallback: true },
      { status: 500 }
    );
  }
}
