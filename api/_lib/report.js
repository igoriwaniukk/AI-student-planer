import { getVerifiedUser, authGateEnabled } from './auth.js';
import { supabaseAdmin } from './supabaseAdmin.js';

// "Report this answer" in the AI chat: the student flags an AI reply, and it
// lands in Supabase (table ai_reports, see supabase/schema.sql) for Igor to
// read in the Table Editor. Goes through /api/chat (no extra function on
// Vercel's 12-function plan) and never counts against the AI allowance.
export const REPORT_REASONS = ['harmful', 'wrong', 'other'];

const text = (s, max) => (typeof s === 'string' ? s.slice(0, max) : '');

export function cleanReport(report) {
  if (!report || !REPORT_REASONS.includes(report.reason)) return null;
  const answer = text(report.answer, 8000).trim();
  if (!answer) return null;
  return { reason: report.reason, answer, question: text(report.question, 4000), lang: text(report.lang, 8) };
}

export async function handleReport(authorization, report) {
  const clean = cleanReport(report);
  if (!clean) return { status: 400, body: { error: 'Bad report.' } };
  const user = await getVerifiedUser(authorization);
  if (authGateEnabled && !user) return { status: 401, body: { error: 'Not signed in.' } };
  if (!supabaseAdmin) return { status: 503, body: { error: 'Reports are not set up.', code: 'unavailable' } };
  const { error } = await supabaseAdmin.from('ai_reports').insert({ user_id: user?.id ?? null, ...clean });
  if (error) {
    console.error('ai_reports insert failed:', error.message);
    return { status: 500, body: { error: 'Could not save the report.' } };
  }
  return { status: 200, body: { ok: true } };
}
