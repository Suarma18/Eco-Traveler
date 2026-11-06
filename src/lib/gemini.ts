// Google Gemini API client for Eco Traveler
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  getNarrateSystemPrompt,
  getParsePreferencesSystemPrompt,
  NarrateStopInput,
  NarrateApiResponse,
  ParsedPreferencesResponse,
  ALLOWED_ARRIVALS,
  ALLOWED_FOCUSES,
  ALLOWED_STAYS,
} from "./prompts/narrate";

const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";
const TIMEOUT_MS = 15_000;

// Rate limiting: 10 requests per 10 minutes per IP
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  if (rateLimitMap.size > 1000) {
    rateLimitMap.forEach((entry, key) => {
      if (entry.resetAt <= now) rateLimitMap.delete(key);
    });
  }

  const record = rateLimitMap.get(ip);
  if (!record || record.resetAt <= now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count += 1;
  return true;
}

// In-memory cache for narration results: key = hash(stops + lang + note)
const narrativeCache = new Map<string, { data: NarrateApiResponse; cachedAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function computeCacheKey(stops: NarrateStopInput[], lang: string, userNote?: string): string {
  const stopKeys = stops.map((s) => s.id).sort().join("|");
  return `${lang}::${stopKeys}::${(userNote || "").trim().toLowerCase()}`;
}

export function cleanJsonOutput(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  return cleaned;
}

function getGeminiClient(): { genAI: GoogleGenerativeAI; modelName: string } | null {
  const rawKey = process.env.GEMINI_API_KEY || "";
  const apiKey = rawKey.replace(/^[#\s"']+|[#\s"']+$/g, "").trim();
  if (!apiKey) return null;

  const modelName = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  return {
    genAI: new GoogleGenerativeAI(apiKey),
    modelName,
  };
}

// 1A. Generate Route & Stop Narratives with Gemini
export async function generateAiNarrative(
  stops: NarrateStopInput[],
  lang: "id" | "en",
  userNote?: string
): Promise<{ success: boolean; data?: NarrateApiResponse; isFallback: boolean }> {
  const client = getGeminiClient();
  if (!client) {
    return { success: false, isFallback: true };
  }

  const cacheKey = computeCacheKey(stops, lang, userNote);
  const cached = narrativeCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return { success: true, data: cached.data, isFallback: false };
  }

  const systemPrompt = getNarrateSystemPrompt(lang);
  const payloadData = {
    DATA: stops.map((s) => ({
      id: s.id,
      name: s.name,
      regency: s.regency,
      highlights: s.highlights,
      customsNote: s.customsNote || "",
      localUmkmSpot: s.localUmkmSpot || "",
    })),
    USER_NOTE: userNote || "",
  };

  try {
    const model = client.genAI.getGenerativeModel({
      model: client.modelName,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const callPromise = model.generateContent(
      `Please generate the route narrative following the instructions and provided data:\n${JSON.stringify(
        payloadData
      )}`
    );

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini narrative request timed out")), TIMEOUT_MS)
    );

    const result = await Promise.race([callPromise, timeoutPromise]);
    const rawContent = result.response.text();
    const cleaned = cleanJsonOutput(rawContent);
    const parsed = JSON.parse(cleaned);

    // Strict schema validation
    if (!parsed || typeof parsed.summary !== "string" || !Array.isArray(parsed.stops)) {
      throw new Error("Narrative schema missing summary or stops");
    }

    const validStopIds = new Set(stops.map((s) => s.id));
    const validatedStops = parsed.stops
      .filter(
        (s: unknown): s is { id: string; narrative: string } =>
          typeof s === "object" &&
          s !== null &&
          typeof (s as Record<string, unknown>).id === "string" &&
          typeof (s as Record<string, unknown>).narrative === "string" &&
          validStopIds.has((s as Record<string, unknown>).id as string)
      )
      .map((s: { id: string; narrative: string }) => ({
        id: s.id,
        narrative: s.narrative.slice(0, 350).trim(), // Cap at ~60 words
      }));

    if (validatedStops.length === 0) {
      throw new Error("No valid stops returned from AI");
    }

    const validatedResult: NarrateApiResponse = {
      summary: parsed.summary.trim(),
      stops: validatedStops,
    };

    narrativeCache.set(cacheKey, { data: validatedResult, cachedAt: Date.now() });
    return { success: true, data: validatedResult, isFallback: false };
  } catch (err) {
    console.warn("[Gemini AI] Narrative failed, falling back:", err);
    return { success: false, isFallback: true };
  }
}

// 1B. Parse Natural Language Preferences with Gemini
export async function parseAiPreferences(
  userText: string,
  lang: "id" | "en"
): Promise<{ success: boolean; data?: ParsedPreferencesResponse; isFallback: boolean }> {
  const client = getGeminiClient();
  if (!client) {
    return { success: false, isFallback: true };
  }

  const cleanUserText = (userText || "").slice(0, 300).trim();
  if (!cleanUserText) {
    return { success: false, isFallback: true };
  }

  const systemPrompt = getParsePreferencesSystemPrompt(lang);

  try {
    const model = client.genAI.getGenerativeModel({
      model: client.modelName,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const callPromise = model.generateContent(cleanUserText);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini parse preferences timed out")), TIMEOUT_MS)
    );

    const result = await Promise.race([callPromise, timeoutPromise]);
    const rawContent = result.response.text();
    const cleaned = cleanJsonOutput(rawContent);
    const parsed = JSON.parse(cleaned);

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Parse preferences output is not an object");
    }

    // Validate days
    let days: 1 | 2 | 3 | 4 | null = null;
    if (parsed.days === 1 || parsed.days === 2 || parsed.days === 3 || parsed.days === 4) {
      days = parsed.days;
    }

    // Validate arrival
    let arrival: (typeof ALLOWED_ARRIVALS)[number] | null = null;
    if (ALLOWED_ARRIVALS.includes(parsed.arrival)) {
      arrival = parsed.arrival;
    }

    // Validate focus
    let focus: (typeof ALLOWED_FOCUSES)[number][] | null = null;
    if (Array.isArray(parsed.focus)) {
      const valid = parsed.focus.filter((f: string): f is (typeof ALLOWED_FOCUSES)[number] =>
        ALLOWED_FOCUSES.includes(f as (typeof ALLOWED_FOCUSES)[number])
      );
      if (valid.length > 0) focus = valid;
    }

    // Validate stay
    let stay: (typeof ALLOWED_STAYS)[number] | null = null;
    if (ALLOWED_STAYS.includes(parsed.stay)) {
      stay = parsed.stay;
    }

    const explanation =
      typeof parsed.explanation === "string"
        ? parsed.explanation.trim()
        : lang === "en"
        ? "Preferences adjusted based on your request."
        : "Preferensi disesuaikan berdasarkan permintaan Anda.";

    const validatedResult: ParsedPreferencesResponse = {
      days,
      arrival,
      focus,
      stay,
      explanation,
    };

    return { success: true, data: validatedResult, isFallback: false };
  } catch (err) {
    console.warn("[Gemini AI] Parse preferences failed, falling back:", err);
    return { success: false, isFallback: true };
  }
}

