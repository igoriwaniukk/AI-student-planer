import Anthropic from '@anthropic-ai/sdk';

// Shared across every AI endpoint (chat, plan/generate, plan/rescue) and
// both runtimes this project ships (the local Express server for `npm run
// dev:full`, and Vercel's serverless functions in production) — one client,
// one place to read the key from, so neither runtime can drift out of sync.
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
export const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

export function anthropicErrorResponse(err) {
  if (err instanceof Anthropic.APIError) {
    return { status: err.status || 502, error: err.message || 'Błąd po stronie Claude.' };
  }
  return { status: 502, error: 'Nie udało się połączyć z Claude: ' + err.message };
}
