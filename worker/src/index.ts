// Cloudflare Worker: a thin, safe proxy in front of the Anthropic API.
// The API key lives here as a secret and never reaches the phone app.
// Deploy with `npm run worker:deploy` after `wrangler secret put ANTHROPIC_API_KEY`.

export interface Env {
  ANTHROPIC_API_KEY: string
  ALLOWED_ORIGIN?: string
  MODEL?: string
}

const SYSTEM_BY_TASK: Record<string, string> = {
  mnemonic:
    'You write playful, vivid one-sentence memory tricks for a 7-9 year old. Keep it to one short sentence, simple words, no preamble.',
  'explain-wrong':
    'You are a kind tutor for a 7-9 year old. In one short, encouraging sentence, help them tell two answers apart. No preamble.',
  encourage:
    'You write one short, warm sentence of encouragement for a 7-9 year old learner. No preamble.',
}

function cors(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = env.ALLOWED_ORIGIN || '*'
    const headers = { ...cors(origin), 'content-type': 'application/json' }

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors(origin) })
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers })

    let body: { task?: string; prompt?: string }
    try {
      body = await request.json()
    } catch {
      return new Response(JSON.stringify({ error: 'bad json' }), { status: 400, headers })
    }

    const task = String(body.task ?? '')
    const prompt = String(body.prompt ?? '').slice(0, 600)
    const system = SYSTEM_BY_TASK[task]
    if (!system || !prompt) {
      return new Response(JSON.stringify({ error: 'invalid task or prompt' }), { status: 400, headers })
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: env.MODEL || 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        system,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'upstream error' }), { status: 502, headers })
    }

    const data = (await res.json()) as { content?: { text?: string }[] }
    const text = data.content?.map((c) => c.text ?? '').join('').trim() ?? ''
    return new Response(JSON.stringify({ text }), { headers })
  },
}
