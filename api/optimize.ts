// POST /api/optimize
//
// Hot path. Runs the resume optimizer + toolkit generator in parallel
// (matches the existing 2-call budget). Returns combined result so the
// client only makes one HTTP round-trip per generation.
//
// Request:  { data: ResumeData }
// Response: { optimized: OptimizedResumeData, toolkit: GeneratedToolkit, errors: ToolkitErrors }
//
// 401 if not authenticated; 402 if user has no toolkit credits;
// 429 if user over daily cap; 503 if no AI provider configured.
//
// Credit flow:
//   1. consume_toolkit_credit() — atomic decrement before AI runs.
//      If balance was already 0, raises 'insufficient_credits' → 402.
//   2. If the optimizer call fails → refund_toolkit_credit() so the user
//      is not charged for a generation that produced nothing.
//   3. If the optimizer succeeds but the toolkit call fails, the credit is
//      kept — the user got their resume, and per-item retries are free.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticate, userClient } from './_lib/auth.js';
import { assertWithinLimit, logCall, RateLimitError } from './_lib/rateLimit.js';
import { resumeOptimizer, toolkitGenerator } from './_lib/aiFactory.js';
import type { ResumeData, GeneratedToolkit, ToolkitErrors } from '../src/domain/entities/Resume';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const auth = await authenticate(req, res);
  if (!auth) return;

  if (!resumeOptimizer) {
    res.status(503).json({ error: 'No AI provider configured on server' });
    return;
  }

  try {
    await assertWithinLimit(auth.userId, auth.jwt);
  } catch (err) {
    if (err instanceof RateLimitError) {
      res.status(429).json({ error: err.message, used: err.used, cap: err.cap });
      return;
    }
    throw err;
  }

  const data = req.body?.data as ResumeData | undefined;
  if (!data || !data.targetJob?.description) {
    res.status(400).json({ error: 'Missing or invalid resume data' });
    return;
  }

  // ── Credit gate ───────────────────────────────────────────────────────────
  // Atomically decrement the user's toolkit_credits balance before running AI.
  // The security-definer RPC enforces that balance cannot go below 0 and that
  // the decrement is serialised at the row level (no race condition with a
  // concurrent request).
  const supabase = userClient(auth.jwt);
  const { error: creditError } = await supabase.rpc('consume_toolkit_credit');

  if (creditError) {
    if (creditError.message?.includes('insufficient_credits')) {
      res.status(402).json({
        error: 'No toolkit credits remaining. Purchase a pack to continue.',
        code: 'insufficient_credits',
      });
      return;
    }
    // Any other DB error: fail-open with a warning so a Supabase hiccup
    // doesn't silently block all users. Log it for visibility.
    console.warn('[optimize] Credit check failed (fail-open):', creditError.message);
  }

  const creditConsumed = !creditError;

  // ── AI generation ─────────────────────────────────────────────────────────
  // Two AI calls in parallel — optimizer + combined toolkit. Promise.allSettled
  // so a toolkit failure doesn't kill the optimizer result.
  const [optimizedResult, toolkitResult] = await Promise.allSettled([
    resumeOptimizer.optimize(data),
    toolkitGenerator ? toolkitGenerator.generate(data) : Promise.reject(new Error('Toolkit generator not configured')),
  ]);

  if (optimizedResult.status === 'rejected') {
    // Core artifact failed — refund the credit so the user isn't charged for
    // a generation that produced nothing.
    if (creditConsumed) {
      const { error: refundError } = await supabase.rpc('refund_toolkit_credit');
      if (refundError) {
        console.error('[optimize] Credit refund failed:', refundError.message);
      }
    }
    const msg = optimizedResult.reason instanceof Error ? optimizedResult.reason.message : 'Optimizer failed';
    res.status(502).json({ error: msg });
    return;
  }

  const optimized = optimizedResult.value;

  let toolkit: GeneratedToolkit | undefined;
  const errors: ToolkitErrors = {};
  if (toolkitResult.status === 'fulfilled') {
    toolkit = toolkitResult.value;
  } else {
    const msg = toolkitResult.reason instanceof Error ? toolkitResult.reason.message : 'Toolkit failed';
    errors.coverLetter = msg;
    errors.outreachEmail = msg;
    errors.linkedInMessage = msg;
    errors.interviewQuestions = msg;
  }

  // Log on success — only counts toward the user's daily cap if optimizer ran.
  await logCall(auth.userId, auth.jwt, 'optimize');

  res.status(200).json({ optimized, toolkit, errors });
}
