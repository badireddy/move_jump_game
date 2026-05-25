// Talks to the Cloudflare Worker proxy (which holds the Anthropic key).
// All calls degrade gracefully: if no proxy is configured, helpers return
// null and the UI falls back to its built-in content. Successful results are
// cached in localStorage so we never pay for the same hint twice.

const PROXY_URL = import.meta.env.VITE_AI_PROXY_URL as string | undefined
const CACHE_PREFIX = 'learnquest:ai:'

export function aiEnabled(): boolean {
  return Boolean(PROXY_URL)
}

function cacheGet(key: string): string | null {
  return localStorage.getItem(CACHE_PREFIX + key)
}
function cacheSet(key: string, value: string): void {
  try {
    localStorage.setItem(CACHE_PREFIX + key, value)
  } catch {
    /* quota — ignore */
  }
}

export type AiTask = 'mnemonic' | 'explain-wrong' | 'encourage'

interface AiRequest {
  task: AiTask
  prompt: string
  cacheKey?: string
}

async function askAI({ task, prompt, cacheKey }: AiRequest): Promise<string | null> {
  if (!PROXY_URL) return null
  if (cacheKey) {
    const hit = cacheGet(cacheKey)
    if (hit) return hit
  }
  try {
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ task, prompt }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { text?: string }
    const text = data.text?.trim()
    if (!text) return null
    if (cacheKey) cacheSet(cacheKey, text)
    return text
  } catch {
    return null
  }
}

// A kid-friendly memory trick (age ~7-9) for a fact, e.g. a capital city.
export function mnemonicFor(itemId: string, fact: string): Promise<string | null> {
  return askAI({
    task: 'mnemonic',
    cacheKey: `mnemonic:${itemId}`,
    prompt:
      `Give a fun, vivid one-sentence memory trick a 7-9 year old can use to remember this fact: "${fact}". ` +
      `Use simple words and a playful image. Return only the sentence.`,
  })
}

// A gentle one-sentence explanation when a child picks the wrong answer.
export function explainWrong(correct: string, chosen: string): Promise<string | null> {
  return askAI({
    task: 'explain-wrong',
    cacheKey: `explain:${chosen}=>${correct}`,
    prompt:
      `A 7-9 year old answered "${chosen}" but the correct answer is "${correct}". ` +
      `In one short, kind, encouraging sentence, help them tell the two apart. Return only the sentence.`,
  })
}
