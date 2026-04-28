import { geminiApiKey } from '../firebase';

const AI_CACHE_TTL_MS = 10 * 60 * 1000;

export interface AiMetrics {
  requests: number;
  cacheHit: number;
  cacheMiss: number;
  dedupedInFlight: number;
  networkCalls: number;
  retries: number;
  timeouts: number;
  failures: number;
  promptCharsSent: number;
  promptCharsSavedByCache: number;
  promptCharsSavedByDedup: number;
  lastUpdatedAt: number | null;
}

const aiResponseCache = new Map<string, { value: string; expiry: number }>();
const inFlightRequests = new Map<string, Promise<string>>();

const aiMetrics: AiMetrics = {
  requests: 0,
  cacheHit: 0,
  cacheMiss: 0,
  dedupedInFlight: 0,
  networkCalls: 0,
  retries: 0,
  timeouts: 0,
  failures: 0,
  promptCharsSent: 0,
  promptCharsSavedByCache: 0,
  promptCharsSavedByDedup: 0,
  lastUpdatedAt: null
};

const touchAiMetrics = () => {
  aiMetrics.lastUpdatedAt = Date.now();
};

const isDev = Boolean(import.meta.env?.DEV);
const debugAiMetrics = (eventName: string) => {
  if (!isDev) return;
  console.debug(`[AI_METRICS] ${eventName}`, {
    requests: aiMetrics.requests,
    networkCalls: aiMetrics.networkCalls,
    cacheHit: aiMetrics.cacheHit,
    cacheMiss: aiMetrics.cacheMiss,
    dedupedInFlight: aiMetrics.dedupedInFlight,
    retries: aiMetrics.retries,
    timeouts: aiMetrics.timeouts
  });
};

const trimText = (text: string, maxChars: number) => {
  if (typeof text !== 'string') return '';
  if (!maxChars || text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n...[truncated]`;
};

const buildCacheKey = (model: string, systemInstruction: string, prompt: string) =>
  JSON.stringify({ model, systemInstruction, prompt });

export const getAiUsageMetrics = (): AiMetrics => ({ ...aiMetrics });

export const resetAiUsageMetrics = () => {
  (Object.keys(aiMetrics) as Array<keyof AiMetrics>).forEach((key) => {
    if (key === 'lastUpdatedAt') {
      aiMetrics[key] = null;
    } else {
      (aiMetrics[key] as number) = 0;
    }
  });
};

export const estimateAiDailySavings = (avgCharsPerRequest = 1800) => {
  const totalSavedChars = aiMetrics.promptCharsSavedByCache + aiMetrics.promptCharsSavedByDedup;
  const avgSavedRequests = totalSavedChars / Math.max(avgCharsPerRequest, 1);
  const estimatedSavedTokens = Math.round(totalSavedChars / 4);
  return {
    totalSavedChars,
    estimatedSavedRequests: Number(avgSavedRequests.toFixed(2)),
    estimatedSavedTokens
  };
};

export interface AiCallOptions {
  model?: string;
  maxPromptChars?: number;
  maxSystemChars?: number;
  useCache?: boolean;
  cacheTtlMs?: number;
  timeoutMs?: number;
}

export const callGemini = async (
  prompt: string,
  systemInstruction = "",
  retryCount = 0,
  options: AiCallOptions = {}
): Promise<string> => {
  const {
    model = options.model || "google/gemma-4-31b-it:free",
    maxPromptChars = 2500,
    maxSystemChars = 800,
    useCache = true,
    cacheTtlMs = AI_CACHE_TTL_MS,
    timeoutMs = 20000
  } = options;

  const boundedPrompt = trimText(prompt, maxPromptChars);
  const boundedSystemInstruction = trimText(
    systemInstruction || "Bạn là trợ lý đắc lực của Tít & Tún.",
    maxSystemChars
  );
  const requestChars = boundedPrompt.length + boundedSystemInstruction.length;

  aiMetrics.requests += 1;
  touchAiMetrics();

  if (!geminiApiKey || geminiApiKey === "" || !geminiApiKey.startsWith('sk-or-')) {
    console.warn("OpenRouter API key is missing or invalid.");
    aiMetrics.failures += 1;
    touchAiMetrics();
    return "Hãy thiết lập mã kết nối API OpenRouter trong .env nhé!";
  }

  const cacheKey = buildCacheKey(model, boundedSystemInstruction, boundedPrompt);
  const now = Date.now();
  if (useCache) {
    const cached = aiResponseCache.get(cacheKey);
    if (cached && cached.expiry > now) {
      aiMetrics.cacheHit += 1;
      aiMetrics.promptCharsSavedByCache += requestChars;
      touchAiMetrics();
      debugAiMetrics('cache_hit');
      return cached.value;
    }
    aiMetrics.cacheMiss += 1;
    touchAiMetrics();
  }

  if (inFlightRequests.has(cacheKey)) {
    aiMetrics.dedupedInFlight += 1;
    aiMetrics.promptCharsSavedByDedup += requestChars;
    touchAiMetrics();
    debugAiMetrics('deduped_inflight');
    return inFlightRequests.get(cacheKey)!;
  }

  const requestPromise = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      aiMetrics.networkCalls += 1;
      aiMetrics.promptCharsSent += requestChars;
      touchAiMetrics();

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${geminiApiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "TT Daily Task"
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: boundedSystemInstruction },
            { role: "user", content: boundedPrompt }
          ]
        })
      });

      const data = await response.json();
      if (!response.ok) {
        const apiError = data?.error?.message || `HTTP ${response.status}`;
        
        // --- MULTI-STAGE FALLBACK LOGIC ---
        if (retryCount < 3) {
          let nextModel = "google/gemma-4-31b-it:free";
          if (model === "google/gemma-4-31b-it:free") nextModel = "openai/gpt-oss-120b:free";
          if (model === "openai/gpt-oss-120b:free") nextModel = "qwen/qwen3-coder:free";
          
          console.warn(`AI Model ${model} failed: ${apiError}. Retrying with ${nextModel}...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return callGemini(prompt, systemInstruction, retryCount + 1, { ...options, model: nextModel });
        }
        
        return `Lỗi AI (OpenRouter): ${apiError}`;
      }

      const output = data.choices?.[0]?.message?.content || "Không nhận được phản hồi từ AI.";
      if (useCache) {
        aiResponseCache.set(cacheKey, {
          value: output,
          expiry: Date.now() + cacheTtlMs
        });
      }
      return output;
    } catch (error: any) {
      // --- RETRY / FALLBACK ON NETWORK ERROR ---
      if (retryCount < 3) {
        aiMetrics.retries += 1;
        touchAiMetrics();
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        let nextModel = "google/gemma-4-31b-it:free";
        if (model === "google/gemma-4-31b-it:free") nextModel = "openai/gpt-oss-120b:free";
        
        return callGemini(prompt, systemInstruction, retryCount + 1, { ...options, model: nextModel });
      }
      if (error?.name === 'AbortError') {
        aiMetrics.timeouts += 1;
        aiMetrics.failures += 1;
        touchAiMetrics();
        debugAiMetrics('timeout');
        return "Lỗi AI (OpenRouter): Request timeout.";
      }
      aiMetrics.failures += 1;
      touchAiMetrics();
      return "Lỗi AI (OpenRouter): " + error.message;
    } finally {
      clearTimeout(timeout);
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    if (inFlightRequests.get(cacheKey) === requestPromise) {
      inFlightRequests.delete(cacheKey);
    }
  }
};
