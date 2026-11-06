// Google Gemini API client for Eco Traveler
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  getNarrateSystemPrompt,
  getParsePreferencesSystemPrompt,
  NarrateStopInput,
  NarrateApiResponse,
  ALLOWED_ARRIVALS,
  ALLOWED_FOCUSES,
  ALLOWED_STAYS,
} from "./prompts/narrate";
import {
  parsePreferencesSemantically,
  ParsedPreferencesResponse,
  SemanticParseResult,
} from "./semantic-fallback";

const CANDIDATE_GEMINI_MODELS = [
  process.env.GEMINI_MODEL || "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-flash-latest",
];

const TIMEOUT_MS = 8_000;

// Rate limiting: 20 requests per 10 minutes per IP
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
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

function getGeminiApiKey(): string | null {
  const rawKey = process.env.GEMINI_API_KEY || "";
  const apiKey = rawKey.replace(/^[#\s"']+|[#\s"']+$/g, "").trim();
  return apiKey || null;
}

// Global circuit-breaker to avoid futile retries on quota exhaustion (429)
let quotaCooldownUntil = 0;

export function isQuotaExhausted(): boolean {
  return Date.now() < quotaCooldownUntil;
}

// 1A. Generate Route & Stop Narratives with Gemini (Multi-tier model fallback)
export async function generateAiNarrative(
  stops: NarrateStopInput[],
  lang: "id" | "en",
  userNote?: string
): Promise<{ success: boolean; data?: NarrateApiResponse; isFallback: boolean }> {
  const apiKey = getGeminiApiKey();
  if (!apiKey || isQuotaExhausted()) {
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

  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of CANDIDATE_GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
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
        setTimeout(() => reject(new Error(`Gemini ${modelName} narrative request timed out`)), TIMEOUT_MS)
      );

      const result = await Promise.race([callPromise, timeoutPromise]);
      const rawContent = result.response.text();
      const cleaned = cleanJsonOutput(rawContent);
      const parsed = JSON.parse(cleaned);

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
          narrative: s.narrative.slice(0, 350).trim(),
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
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini AI] Model ${modelName} narrative generation error:`, errMsg);

      if (
        errMsg.includes("429") ||
        errMsg.includes("Quota exceeded") ||
        errMsg.includes("RESOURCE_EXHAUSTED") ||
        errMsg.includes("rate-limits")
      ) {
        quotaCooldownUntil = Date.now() + 60_000;
        console.warn("[Gemini AI] Quota exhausted during narrative. Engaging 60s cooldown; skipping remaining retries.");
        break;
      }
    }
  }

  return { success: false, isFallback: true };
}

// 1B. Parse Natural Language Preferences with Gemini + Typo-Tolerant Semantic Engine
export async function parseAiPreferences(
  userText: string,
  lang: "id" | "en"
): Promise<SemanticParseResult> {
  const cleanUserText = (userText || "").slice(0, 300).trim();
  if (!cleanUserText) {
    return parsePreferencesSemantically("", lang);
  }

  const apiKey = getGeminiApiKey();

  // If Gemini API is available and not in cooldown, try candidate models
  if (apiKey && !isQuotaExhausted()) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const systemPrompt = getParsePreferencesSystemPrompt(lang);

    for (const modelName of CANDIDATE_GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        });

        const callPromise = model.generateContent(cleanUserText);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Gemini ${modelName} parse timed out`)), 6_000)
        );

        const result = await Promise.race([callPromise, timeoutPromise]);
        const rawContent = result.response.text();
        const cleaned = cleanJsonOutput(rawContent);
        const parsed = JSON.parse(cleaned);

        if (parsed && typeof parsed === "object") {
          let days: 1 | 2 | 3 | 4 | null = null;
          if (parsed.days === 1 || parsed.days === 2 || parsed.days === 3 || parsed.days === 4) {
            days = parsed.days;
          }

          let arrival: (typeof ALLOWED_ARRIVALS)[number] | null = null;
          if (ALLOWED_ARRIVALS.includes(parsed.arrival)) {
            arrival = parsed.arrival;
          }

          let focus: (typeof ALLOWED_FOCUSES)[number][] | null = null;
          if (Array.isArray(parsed.focus)) {
            const valid = parsed.focus.filter((f: string): f is (typeof ALLOWED_FOCUSES)[number] =>
              ALLOWED_FOCUSES.includes(f as (typeof ALLOWED_FOCUSES)[number])
            );
            if (valid.length > 0) focus = valid;
          }

          // Anti-Hallucination Guard: NEVER invent a stay preference if user never mentioned accommodation
          const hasExplicitStayMention = /\b(backpacker|murah|hemat|budget|hostel|losmen|menengah|mid|standar|standard|keluarga|comfort|resort|boutique|eco\s*lodge|luxury|mewah|glamping|villa|villas|hotel|homestay|penginapan)\b/i.test(
            cleanUserText
          );

          let stay: (typeof ALLOWED_STAYS)[number] | null = null;
          if (hasExplicitStayMention && ALLOWED_STAYS.includes(parsed.stay)) {
            stay = parsed.stay;
          }

          const pace: "relaxed" | "active" | null =
            parsed.pace === "relaxed" || parsed.pace === "active" ? parsed.pace : null;

          const avoidCrowds: boolean | null =
            typeof parsed.avoidCrowds === "boolean"
              ? parsed.avoidCrowds
              : /(avoid\s*crowd|hindari\s*ramai|sepi|tenang|anti\s*overtourism)/i.test(cleanUserText)
              ? true
              : null;

          const prioritizeLocalBusiness: boolean | null =
            typeof parsed.prioritizeLocalBusiness === "boolean"
              ? parsed.prioritizeLocalBusiness
              : /(local\s*business|spend\s*more\s*on\s*local|umkm|belanja\s*warga|usaha\s*lokal)/i.test(cleanUserText)
              ? true
              : null;

          const drivingPreference: "short" | "scenic" | "standard" | null =
            parsed.drivingPreference === "short" ||
            parsed.drivingPreference === "scenic" ||
            parsed.drivingPreference === "standard"
              ? parsed.drivingPreference
              : /(short\s*driving|less\s*driving|dekat|tidak\s*jauh|rute\s*pendek)/i.test(cleanUserText)
              ? "short"
              : null;

          let excludedFocuses: (typeof ALLOWED_FOCUSES)[number][] | null = null;
          if (Array.isArray(parsed.excludedFocuses)) {
            const validEx = parsed.excludedFocuses.filter((f: string): f is (typeof ALLOWED_FOCUSES)[number] =>
              ALLOWED_FOCUSES.includes(f as (typeof ALLOWED_FOCUSES)[number])
            );
            if (validEx.length > 0) excludedFocuses = validEx;
          }

          const unsupportedPreferences: string[] | null =
            Array.isArray(parsed.unsupportedPreferences) && parsed.unsupportedPreferences.length > 0
              ? parsed.unsupportedPreferences.map(String)
              : null;

          const hasRecognizedIntent =
            days !== null ||
            arrival !== null ||
            (focus !== null && focus.length > 0) ||
            stay !== null ||
            pace !== null ||
            avoidCrowds !== null ||
            prioritizeLocalBusiness !== null ||
            drivingPreference !== null ||
            (excludedFocuses !== null && excludedFocuses.length > 0) ||
            (unsupportedPreferences !== null && unsupportedPreferences.length > 0);

          if (hasRecognizedIntent) {
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
              pace,
              avoidCrowds,
              prioritizeLocalBusiness,
              drivingPreference,
              excludedFocuses,
              unsupportedPreferences,
              explanation,
            };

            const satisfactionReport = [];
            if (focus && focus.length > 0) {
              satisfactionReport.push({
                preference: focus.join(", "),
                type: "hard_constraint" as const,
                status: "satisfied" as const,
                note: lang === "en" ? "Matched cultural & natural village highlights" : "Sesuai sorotan desa wisata",
              });
            }
            if (avoidCrowds) {
              satisfactionReport.push({
                preference: lang === "en" ? "Avoid crowded places" : "Hindari keramaian",
                type: "soft_preference" as const,
                status: "partially_supported" as const,
                note:
                  lang === "en"
                    ? "Filtered high-density spots & applied simulated capacity redirects. Live sensor data is not available."
                    : "Menyaring desa padat & mengaktifkan pengalihan kapasitas. Data sensor waktu nyata tidak tersedia.",
              });
            }
            if (prioritizeLocalBusiness) {
              satisfactionReport.push({
                preference: lang === "en" ? "Spend more on local businesses" : "Prioritas belanja usaha lokal",
                type: "soft_preference" as const,
                status: "partially_supported" as const,
                note:
                  lang === "en"
                    ? "Prioritized verified Pokdarwis UMKM & community homestays. External non-Pokdarwis vendor ownership is unverified."
                    : "Memprioritaskan UMKM Pokdarwis & homestay warga. Kepemilikan usaha komersial non-warga tidak diverifikasi.",
              });
            }
            if (drivingPreference) {
              satisfactionReport.push({
                preference: lang === "en" ? `Driving preference: ${drivingPreference}` : `Preferensi berkendara: ${drivingPreference}`,
                type: "hard_constraint" as const,
                status: "satisfied" as const,
                note:
                  lang === "en"
                    ? "Destinations clustered geographically to minimize transit legs"
                    : "Destinasi dikelompokkan secara geografis untuk meminimalkan waktu di jalan",
              });
            }
            if (pace) {
              satisfactionReport.push({
                preference: lang === "en" ? `Pace: ${pace}` : `Ritme: ${pace}`,
                type: "soft_preference" as const,
                status: "satisfied" as const,
                note: lang === "en" ? "Activity density adjusted" : "Kepadatan aktivitas harian disesuaikan",
              });
            }
            if (unsupportedPreferences) {
              for (const un of unsupportedPreferences) {
                satisfactionReport.push({
                  preference: un,
                  type: "hard_constraint" as const,
                  status: "unsupported" as const,
                  note:
                    lang === "en"
                      ? "Constraint cannot be satisfied with rural village tourism network"
                      : "Batasan tidak dapat dipenuhi dalam jaringan desa wisata",
                });
              }
            }

            return {
              status: "matched",
              confidence: "high",
              processingSource: "gemini-ai",
              parsed: validatedResult,
              detectedIntents: {
                duration: days || undefined,
                arrival: arrival || undefined,
                focuses: focus || undefined,
                excludedFocuses: excludedFocuses || undefined,
                stay: stay || undefined,
                pace: pace || undefined,
                avoidCrowds: avoidCrowds || undefined,
                prioritizeLocalBusiness: prioritizeLocalBusiness || undefined,
                drivingPreference: drivingPreference || undefined,
                unsupported: unsupportedPreferences || undefined,
              },
              satisfactionReport,
              message: explanation,
            };
          }
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[Gemini AI] Model ${modelName} parse error:`, errMsg);

        if (
          errMsg.includes("429") ||
          errMsg.includes("Quota exceeded") ||
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          errMsg.includes("rate-limits")
        ) {
          quotaCooldownUntil = Date.now() + 60_000;
          console.warn("[Gemini AI] Quota exhausted (429). Engaging 60s cooldown; switching directly to semantic engine.");
          break; // Stop retrying remaining models on project-wide quota limit!
        }
      }
    }
  }

  // Fallback: Resilient Local Semantic Rule Engine
  return parsePreferencesSemantically(cleanUserText, lang);
}
