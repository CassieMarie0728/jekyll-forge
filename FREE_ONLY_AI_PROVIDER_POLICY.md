# Free-Only AI Provider Policy

**Status:** Implementation contract for Jekyll Forge.  
**Last reviewed:** August 14, 2026.  
**Scope:** All AI writing, repurposing, and accessibility-generation requests initiated by Jekyll Forge.

Jekyll Forge must never use its own managed AI credentials for customer content. Every AI request must use a key deliberately supplied by the signed-in user, be processed only on the server, and be limited to an approved no-cost model path. The client applications must never receive, store, or display a provider API key after submission.

> **Provider-account boundary.** Jekyll Forge can enforce the model ID, request shape, output cap, and app-level limits. It cannot inspect or change a user-owned provider account's billing enrollment. The setup experience therefore requires the user to keep their provider account on its free plan and to avoid enabling paid billing. This limitation is disclosed before a key is saved.

## Enforceable Model Policy

The server treats provider and model selection as untrusted input. It evaluates the selection against the following allowlist before testing a key and before **every** content-generation request. No client-provided base URL, tool configuration, image/audio capability, fallback model, or provider-routing option is accepted.

| Provider | Server-accepted models | Why this is eligible | App safeguard |
| --- | --- | --- | --- |
| OpenRouter | `openrouter/free` and model IDs ending exactly in `:free` | OpenRouter defines `:free` as an always-free model variant and documents its distinct free-model limits. [1] [2] | The server rejects every model ID without the exact free suffix and disables automatic fallback. |
| Google Gemini | `gemini-2.5-flash`, `gemini-2.5-flash-lite` | Google currently lists free input and output for both stable text-capable endpoints on the Gemini Developer API Free tier. [3] | Requests use text generation only. Google Search grounding, Maps grounding, cached content, media generation, and paid-only models are never enabled. |
| Groq | `llama-3.1-8b-instant`, `llama-3.3-70b-versatile`, `openai/gpt-oss-20b`, `openai/gpt-oss-120b` | Groq publishes Free Plan request and token limits for these text models. [4] | The server permits only the listed text completion IDs, limits outputs, and reports upstream `429` responses without retrying into a different model. |
| Mistral | **No content-writing model is enabled in strict mode.** | Mistral's documentation describes Free mode as included monthly usage, while pay-as-you-go can extend consumption; the public pricing list does not identify a compatible, permanently no-cost text-generation endpoint for this workflow. [5] [6] | Mistral is intentionally displayed as unavailable until Mistral publishes a text model with an enforceable no-cost endpoint. A generic `*-latest` model must never be added merely because an account begins in Free mode. |

This policy does not accept aliases such as `*-latest` where the provider may silently retarget a model, preview-only IDs, image/audio models, paid priority modes, batch APIs, provider tools, grounding, custom base URLs, or model fallbacks. The model list is source controlled and test covered; it is not populated from a provider's full model catalog.

## Conservative Limits and Request Contract

The application applies its own per-user, per-provider limits before calling an upstream service. Limits are deliberately below published free-plan ceilings where a numeric ceiling is public. The provider's own lower or changing limits still take precedence; a provider `429` is surfaced with a retry recommendation and never triggers automatic fallback to another model.

| Provider | Application cap | Published context | Request restrictions |
| --- | --- | --- | --- |
| OpenRouter | 10 requests/minute; 40 requests/day | Free variants are limited to 20 RPM and, without prior credit purchases, 50 RPD. [1] | Text-only chat completion, no fallback models, 1,024 maximum generated tokens. |
| Gemini | 5 requests/minute; 100 requests/day | Google applies quotas per project and model, measures RPM/TPM/RPD, and states that active limits can change. [7] | Text-only `generateContent`; no grounding, tools, cached content, image/audio inputs, or media outputs. |
| Groq | 10 requests/minute; 200 requests/day | The most restrictive approved Groq text models publish 30 RPM and 1,000 RPD on the Free Plan. [4] | OpenAI-compatible text completion only, 1,024 maximum generated tokens. |
| Mistral | Not applicable while unavailable | Mistral limits are organization- and model-specific. [5] | No request is sent. |

Each enforced limit maintains both a rolling minute window and a daily UTC window. The server returns a typed `TOO_MANY_REQUESTS` error with a clear reset time before reading or decrypting a provider key. Request payloads are further constrained to the Jekyll writing tasks already supported by the app and to a 1,024-token output maximum.

## Key Storage and Access Contract

Provider keys are stored in a `user_ai_providers` table as AES-256-GCM ciphertext. Ciphertext includes a versioned envelope containing a random IV, authentication tag, and encrypted key material. The encryption key is derived server-side from the existing session-secret material and is never exposed to either web or Android clients.

The table has one row per `(userId, provider)`. Database helpers that retrieve a row always accept the caller's user ID; settings queries project only non-sensitive fields such as provider, selected model, enabled state, and timestamps. Key values are never included in tRPC responses, logs, test error messages, or mobile storage. Saving a replacement key overwrites the encrypted ciphertext. Deletion removes the provider record under the caller's user ID.

## Required User-Facing Disclosures

The web configuration screen and Android status view must state that provider keys are optional, user owned, sent only to the chosen provider through Jekyll Forge's server, and cannot be recovered after saving. Gemini must additionally state that Google identifies Free-tier content as used to improve its products. [3] OpenRouter, Gemini, and Groq each require the user to acknowledge that they are using a provider account configured for its free path; Jekyll Forge's server safeguards cannot override billing settings changed directly at the provider.

## References

[1]: https://openrouter.ai/docs/api_reference/limits "OpenRouter API limits"
[2]: https://openrouter.ai/docs/faq "OpenRouter FAQ"
[3]: https://ai.google.dev/gemini-api/docs/pricing "Gemini Developer API pricing"
[4]: https://console.groq.com/docs/rate-limits "Groq Free Plan rate limits"
[5]: https://docs.mistral.ai/admin/billing-usage/usage-limits "Mistral usage and limits"
[6]: https://mistral.ai/pricing/api/ "Mistral API pricing"
[7]: https://ai.google.dev/gemini-api/docs/rate-limits "Gemini API rate limits"
