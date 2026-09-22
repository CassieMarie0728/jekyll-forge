// Deadpool-cool adapts the original sarcastic, fourth-wall-breaking tone from
// CassieMarie0728/void-repo-docs, server.ts (e02e0e959d78b183dd3fcf3489866c957fe20209).
export const WRITING_TONES = [
  "professional",
  "casual",
  "technical",
  "friendly",
  "formal",
  "conversational",
  "academic",
  "humorous",
  "deadpool-cool",
] as const;
export function toneLabel(tone: string): string {
  return tone === "deadpool-cool"
    ? "Deadpool-cool"
    : tone.charAt(0).toUpperCase() + tone.slice(1);
}
export function writingToneInstructions(tone: string): string {
  if (tone !== "deadpool-cool") return `Tone: ${tone}`;
  return `Tone: Deadpool-cool.
Write with sharp, irreverent wit, biting sarcasm, fourth-wall-breaking asides, and vivid cynical analogies. Talk directly to the reader. Use specific humor grounded in the supplied topic instead of generic AI pleasantries. Swear when it fits the author's voice; do not force a joke into every sentence.
Preserve the author's meaning, emotional intent, and factual accuracy. Never invent facts, quotes, citations, or personal experiences for a punchline. Do not impersonate or reference franchise characters or borrow their catchphrases. Be compassionate around grief and vulnerability; aim the joke at the absurd situation, not the person suffering.
The requested task and output format take priority: keep JSON, YAML, slugs, code, alt text, and grammar-only corrections useful and accurate, without added comedy or commentary.`;
}
