import { TRPCError } from "@trpc/server";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";
import { getUserAiProviders, incrementAiUsage } from "../db";

export const SUPPORTED_AI_PROVIDERS = [
  "openrouter",
  "gemini",
  "groq",
  "mistral",
] as const;

export type SupportedAiProvider = (typeof SUPPORTED_AI_PROVIDERS)[number];

export type FreeAiMessage = {
  role: "system" | "user";
  content: string;
};

type ProviderModel = {
  id: string;
  label: string;
};

type ProviderCatalogEntry = {
  id: SupportedAiProvider;
  label: string;
  available: boolean;
  setupUrl: string;
  disclosure: string;
  models: readonly ProviderModel[];
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  } | null;
};

export const PROVIDER_CATALOG: Record<
  SupportedAiProvider,
  ProviderCatalogEntry
> = {
  openrouter: {
    id: "openrouter",
    label: "OpenRouter Free Models",
    available: true,
    setupUrl: "https://openrouter.ai/keys",
    disclosure:
      "Only OpenRouter's :free model variants are accepted. Keep your OpenRouter account on its free path and do not enable paid fallbacks.",
    models: [{ id: "openrouter/free", label: "OpenRouter Free Models Router" }],
    rateLimit: { requestsPerMinute: 10, requestsPerDay: 40 },
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini Free Tier",
    available: true,
    setupUrl: "https://aistudio.google.com/app/apikey",
    disclosure:
      "Google states that content submitted through the Gemini API Free tier may be used to improve its products. Do not submit sensitive content.",
    models: [
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite" },
    ],
    rateLimit: { requestsPerMinute: 5, requestsPerDay: 100 },
  },
  groq: {
    id: "groq",
    label: "Groq Free Plan",
    available: true,
    setupUrl: "https://console.groq.com/keys",
    disclosure:
      "Only the listed Groq text models are available. Keep your Groq organization on its Free Plan and review its own live limits before use.",
    models: [
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
      { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B" },
      { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
    ],
    rateLimit: { requestsPerMinute: 10, requestsPerDay: 200 },
  },
  mistral: {
    id: "mistral",
    label: "Mistral",
    available: false,
    setupUrl: "https://console.mistral.ai/api-keys/",
    disclosure:
      "Mistral is not enabled yet. Its public documentation describes included free usage that can extend into pay-as-you-go, but does not currently identify a compatible permanently no-cost text endpoint for Jekyll Forge's strict policy.",
    models: [],
    rateLimit: null,
  },
};

export const FREE_AI_MAX_OUTPUT_TOKENS = 1024;

// prettier-ignore
function asSupportedProvider(value: string): SupportedAiProvider {
  if (!SUPPORTED_AI_PROVIDERS.includes(value as SupportedAiProvider)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported AI provider." });
  }
  return value as SupportedAiProvider;
}

function isOpenRouterFreeModel(model: string): boolean {
  return (
    model === "openrouter/free" ||
    /^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*:free$/i.test(model)
  );
}

// prettier-ignore
export function assertFreeModelAllowed(
  providerValue: string,
  model: string
): { provider: SupportedAiProvider; model: string } {
  const provider = asSupportedProvider(providerValue);
  const catalog = PROVIDER_CATALOG[provider];
  if (!catalog.available) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${catalog.label} is temporarily unavailable under the strict free-only policy.`,
    });
  }

  const allowed =
    provider === "openrouter"
      ? isOpenRouterFreeModel(model)
      : catalog.models.some(candidate => candidate.id === model);
  if (!allowed) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "That model is not approved for Jekyll Forge's free-only AI policy.",
    });
  }
  return { provider, model };
}

// prettier-ignore
function getEncryptionKey(): Buffer {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required to encrypt user-owned AI provider keys.");
  }
  return createHash("sha256")
    .update(`jekyll-forge:user-ai-provider-key:v1:${secret}`)
    .digest();
}

// prettier-ignore
export function encryptProviderApiKey(apiKey: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${ciphertext.toString("base64url")}`;
}

// prettier-ignore
export function decryptProviderApiKey(envelope: string): string {
  const [version, ivValue, tagValue, ciphertextValue] = envelope.split(":");
  if (
    version !== "v1" ||
    !ivValue ||
    !tagValue ||
    !ciphertextValue
  ) {
    throw new Error("Invalid encrypted AI provider key envelope.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivValue, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

type RateWindow = {
  minuteBucket: number;
  minuteCount: number;
  dayBucket: string;
  dayCount: number;
};

export type ProviderRateLimitStatus = {
  provider: SupportedAiProvider;
  minuteRemaining: number | null;
  dailyRemaining: number | null;
  minuteResetAt: Date | null;
  dailyResetAt: Date | null;
};

// prettier-ignore
export class FreeAiProviderRateLimiter {
  private readonly windows = new Map<string, RateWindow>();

  constructor(private readonly now: () => number = () => Date.now()) {}

  private getState(userId: number, provider: SupportedAiProvider): {
    key: string;
    window: RateWindow;
    timestamp: number;
  } {
    const timestamp = this.now();
    const date = new Date(timestamp);
    const minuteBucket = Math.floor(timestamp / 60_000);
    const dayBucket = date.toISOString().slice(0, 10);
    const key = `${userId}:${provider}`;
    const existing = this.windows.get(key);
    const window: RateWindow = existing
      ? {
          minuteBucket:
            existing.minuteBucket === minuteBucket
              ? existing.minuteBucket
              : minuteBucket,
          minuteCount:
            existing.minuteBucket === minuteBucket ? existing.minuteCount : 0,
          dayBucket: existing.dayBucket === dayBucket ? existing.dayBucket : dayBucket,
          dayCount: existing.dayBucket === dayBucket ? existing.dayCount : 0,
        }
      : { minuteBucket, minuteCount: 0, dayBucket, dayCount: 0 };
    return { key, window, timestamp };
  }

  getStatus(
    userId: number,
    provider: SupportedAiProvider
  ): ProviderRateLimitStatus {
    const catalog = PROVIDER_CATALOG[provider];
    if (!catalog.rateLimit) {
      return {
        provider,
        minuteRemaining: null,
        dailyRemaining: null,
        minuteResetAt: null,
        dailyResetAt: null,
      };
    }
    const { window, timestamp } = this.getState(userId, provider);
    const current = new Date(timestamp);
    const dailyResetAt = new Date(
      Date.UTC(
        current.getUTCFullYear(),
        current.getUTCMonth(),
        current.getUTCDate() + 1
      )
    );
    return {
      provider,
      minuteRemaining: Math.max(
        0,
        catalog.rateLimit.requestsPerMinute - window.minuteCount
      ),
      dailyRemaining: Math.max(
        0,
        catalog.rateLimit.requestsPerDay - window.dayCount
      ),
      minuteResetAt: new Date((window.minuteBucket + 1) * 60_000),
      dailyResetAt,
    };
  }

  consume(userId: number, provider: SupportedAiProvider): ProviderRateLimitStatus {
    const catalog = PROVIDER_CATALOG[provider];
    if (!catalog.rateLimit) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `${catalog.label} is not available under the free-only policy.`,
      });
    }
    const { key, window } = this.getState(userId, provider);
    if (window.minuteCount >= catalog.rateLimit.requestsPerMinute) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `The ${catalog.label} minute limit has been reached. Please try again shortly.`,
      });
    }
    if (window.dayCount >= catalog.rateLimit.requestsPerDay) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `The ${catalog.label} daily free-tier safeguard has been reached. Please try again tomorrow.`,
      });
    }
    window.minuteCount += 1;
    window.dayCount += 1;
    this.windows.set(key, window);
    return this.getStatus(userId, provider);
  }
}

export const freeAiProviderRateLimiter = new FreeAiProviderRateLimiter();

// prettier-ignore
function safeProviderError(provider: SupportedAiProvider, status: number): TRPCError {
  if (status === 401 || status === 403) {
    return new TRPCError({
      code: "BAD_REQUEST",
      message: `The ${PROVIDER_CATALOG[provider].label} key was rejected. Check the key and its provider account settings.`,
    });
  }
  if (status === 429) {
    return new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `${PROVIDER_CATALOG[provider].label} is rate limiting this key. Please wait before retrying.`,
    });
  }
  return new TRPCError({
    code: "BAD_GATEWAY",
    message: `${PROVIDER_CATALOG[provider].label} could not complete the request. Please retry later.`,
  });
}

// prettier-ignore
async function providerFetch(
  provider: SupportedAiProvider,
  url: string,
  init: RequestInit
): Promise<Response> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw safeProviderError(provider, response.status);
  return response;
}

// prettier-ignore
export async function testProviderApiKey(
  providerValue: string,
  apiKey: string
): Promise<void> {
  const provider = asSupportedProvider(providerValue);
  if (!PROVIDER_CATALOG[provider].available) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${PROVIDER_CATALOG[provider].label} is not available under the strict free-only policy.`,
    });
  }

  if (provider === "openrouter") {
    await providerFetch(provider, "https://openrouter.ai/api/v1/key", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return;
  }
  if (provider === "groq") {
    await providerFetch(provider, "https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return;
  }
  if (provider === "gemini") {
    await providerFetch(
      provider,
      "https://generativelanguage.googleapis.com/v1beta/models",
      { headers: { Accept: "application/json", "x-goog-api-key": apiKey } }
    );
    return;
  }
}

type OpenAiStyleResponse = {
  choices?: Array<{ message?: { content?: unknown } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
};

// prettier-ignore
function extractOpenAiText(payload: OpenAiStyleResponse): string {
  const text = payload.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new TRPCError({ code: "BAD_GATEWAY", message: "The AI provider returned no text." });
  }
  return text;
}

// prettier-ignore
function extractGeminiText(payload: GeminiResponse): string {
  const text = payload.candidates?.[0]?.content?.parts
    ?.map(part => part.text ?? "")
    .join("")
    .trim();
  if (!text) {
    throw new TRPCError({ code: "BAD_GATEWAY", message: "The AI provider returned no text." });
  }
  return text;
}

// prettier-ignore
export async function invokeUserOwnedFreeAi(input: {
  userId: number;
  messages: FreeAiMessage[];
  temperature?: number;
  maxOutputTokens?: number;
}) {
  const configured = (await getUserAiProviders(input.userId)).find(
    provider => provider.enabled
  );

  if (!configured || !configured.enabled) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Configure and enable a free AI provider in AI Settings before using AI tools.",
    });
  }

  const { provider, model } = assertFreeModelAllowed(
    configured.provider,
    configured.selectedModel
  );
  freeAiProviderRateLimiter.consume(input.userId, provider);
  const apiKey = decryptProviderApiKey(configured.encryptedApiKey);
  const maxTokens = Math.min(
    Math.max(input.maxOutputTokens ?? FREE_AI_MAX_OUTPUT_TOKENS, 64),
    FREE_AI_MAX_OUTPUT_TOKENS
  );
  const temperature = Math.min(Math.max(input.temperature ?? 0.7, 0), 1);

  let text: string;
  let inputTokens = 0;
  let outputTokens = 0;

  if (provider === "gemini") {
    const system = input.messages.find(message => message.role === "system")?.content;
    const contents = input.messages
      .filter(message => message.role !== "system")
      .map(message => ({ role: "user", parts: [{ text: message.content }] }));
    const response = await providerFetch(
      provider,
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
          contents,
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        }),
      }
    );
    const payload = (await response.json()) as GeminiResponse;
    text = extractGeminiText(payload);
    inputTokens = payload.usageMetadata?.promptTokenCount ?? 0;
    outputTokens = payload.usageMetadata?.candidatesTokenCount ?? 0;
  } else {
    const url =
      provider === "openrouter"
        ? "https://openrouter.ai/api/v1/chat/completions"
        : "https://api.groq.com/openai/v1/chat/completions";
    const response = await providerFetch(provider, url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: input.messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
    });
    const payload = (await response.json()) as OpenAiStyleResponse;
    text = extractOpenAiText(payload);
    inputTokens = payload.usage?.prompt_tokens ?? 0;
    outputTokens = payload.usage?.completion_tokens ?? 0;
  }

  await incrementAiUsage(input.userId, inputTokens, outputTokens);
  return { text, usage: { inputTokens, outputTokens }, provider, model };
}
