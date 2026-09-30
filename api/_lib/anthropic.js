import Anthropic from '@anthropic-ai/sdk';

// Shared across every AI endpoint (chat, plan/generate, plan/rescue) and
// both runtimes this project ships (the local Express server for `npm run
// dev:full`, and Vercel's serverless functions in production) — one client,
// one place to read the key from, so neither runtime can drift out of sync.
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
export const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

// What every AI endpoint answers when the key isn't set in this runtime's
// environment (on Vercel: Project → Settings → Environment Variables). The
// app shows its own translated message for `code`.
export const NO_KEY_RESPONSE = {
  status: 503,
  body: { error: 'AI is not set up on the server: ANTHROPIC_API_KEY is missing.', code: 'no_key' },
};

// Which parts are configured — never any secret values — so the setup can be
// checked by opening /api/chat in a browser.
export function aiStatus() {
  return { ai: !!ANTHROPIC_API_KEY };
}

export function anthropicErrorResponse(err) {
  if (err instanceof Anthropic.APIError) {
    if (err.status === 401) return { status: 502, error: 'The ANTHROPIC_API_KEY on the server was rejected.', code: 'bad_key' };
    return { status: err.status || 502, error: err.message || 'Błąd po stronie Claude.' };
  }
  return { status: 502, error: 'Nie udało się połączyć z Claude: ' + err.message };
}
