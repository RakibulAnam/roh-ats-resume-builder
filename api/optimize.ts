// POST /api/optimize
//
// Hot path. Runs the resume optimizer + toolkit generator in parallel
// (matches the existing 2-call budget). Returns combined result so the
// client only makes one HTTP round-trip per generation.
//
// Request:  { data: ResumeData }
// Response: { optimized: OptimizedResumeData, toolkit: GeneratedToolkit, errors: ToolkitErrors }
//
// 401 if not authenticated; 429 if user over daily cap; 503 if no AI provider configured.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticate } from './_lib/auth.js';
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

  // Two AI calls in parallel — same budget as the existing client-side
  // ResumeService.optimizeResume(). Promise.allSettled so a toolkit failure
  // doesn't kill the optimizer result.
  const [optimizedResult, toolkitResult] = await Promise.allSettled([
    resumeOptimizer.optimize(data),
    toolkitGenerator ? toolkitGenerator.generate(data) : Promise.reject(new Error('Toolkit generator not configured')),
  ]);

  if (optimizedResult.status === 'rejected') {
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
