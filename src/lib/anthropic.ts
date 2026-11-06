// Anthropic Messages API client for Eco Traveler
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

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-5-5";
const TIMEOUT_MS = 20_000;

// Rate limiting: 10 requests per 10 minutes per IP
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  // Garbage collect expired entries
  if (rateLimitMap.size > 1000) {
    rateLimitMap.forEach((entry, key) => {
      if (entry.resetAt <= now) rateLimitMap.delete(key);
    });
  }

  const record = rateLimitMap.get(ip);
  if (!record || record.resetAt <= now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true; // Allowed
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Exceeded
  }

  record.count += 1;
  return true; // Allowed
}

// In-memory cache for narration results: key = hash(stops + lang + note)
const narrativeCache = new Map<string, { data: NarrateApiResponse; cachedAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function computeCacheKey(stops: NarrateStopInput[], lang: string, userNote?: string): string {
  const stopKeys = stops.map((s) => s.id).sort().join("|");
  return `${lang}::${stopKeys}::${(userNote || "").trim().toLowerCase()}`;
}

async function callAnthropicMessagesApi(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number
): Promise<string> {
  let attempt = 0;
  const maxAttempts = 2; // initial + 1 retry

  while (attempt < maxAttempts) {
    attempt++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const requestPayload: Record<string, unknown> = {
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      };

      // claude-sonnet-5-5 and reasoning models deprecate temperature parameter
      if (!model.includes("sonnet-5-5") && !model.includes("claude-sonnet-5-5")) {
        requestPayload.temperature = 0.3;
      }

      const response = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        // If 4xx (client error / invalid model or key), do not retry
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
        }
        // If 5xx, retry once
        if (attempt >= maxAttempts) {
          throw new Error(`Anthropic API server error (${response.status}): ${errorText}`);
        }
        continue;
      }

      const json = await response.json();
      const textBlock = Array.isArray(json?.content)
        ? json.content.find((c: { type: string; text?: string }) => c.type === "text")
        : null;
      const content = textBlock?.text;
      if (typeof content !== "string") {
        throw new Error("Invalid response format from Anthropic API: text block not found");
      }
      return content;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (attempt >= maxAttempts) {
        throw err;
      }
    }
  }

  throw new Error("Failed to reach Anthropic API after retry");
}

export function cleanJsonOutput(raw: string): string {
  let cleaned = raw.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  return cleaned;
}

// 1A. Generate Route & Stop Narratives
export async function generateAiNarrative(
  stops: NarrateStopInput[],
  lang: "id" | "en",
  userNote?: string
): Promise<{ success: boolean; data?: NarrateApiResponse; isFallback: boolean }> {
  const rawKey = process.env.ANTHROPIC_API_KEY || "";
  const apiKey = rawKey.replace(/^[#\s"']+|[#\s"']+$/g, "").trim();
  if (!apiKey) {
    return { success: false, isFallback: true };
  }

  const cacheKey = computeCacheKey(stops, lang, userNote);
  const cached = narrativeCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return { success: true, data: cached.data, isFallback: false };
  }

  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
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
    const rawContent = await callAnthropicMessagesApi(
      apiKey,
      model,
      systemPrompt,
      JSON.stringify(payloadData),
      2500
    );

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
    console.warn("AI narrative failed, falling back to deterministic:", err);
    return { success: false, isFallback: true };
  }
}

// 1B. Parse Natural Language Preferences
export async function parseAiPreferences(
  userText: string,
  lang: "id" | "en"
): Promise<{ success: boolean; data?: ParsedPreferencesResponse; isFallback: boolean }> {
  const rawKey = process.env.ANTHROPIC_API_KEY || "";
  const apiKey = rawKey.replace(/^[#\s"']+|[#\s"']+$/g, "").trim();
  if (!apiKey) {
    return { success: false, isFallback: true };
  }

  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const systemPrompt = getParsePreferencesSystemPrompt(lang);

  const cleanUserText = (userText || "").slice(0, 300).trim();
  if (!cleanUserText) {
    return { success: false, isFallback: true };
  }

  try {
    const rawContent = await callAnthropicMessagesApi(
      apiKey,
      model,
      systemPrompt,
      cleanUserText,
      1000
    );

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
    console.warn("AI parse preferences failed, falling back:", err);
    return { success: false, isFallback: true };
  }
}
