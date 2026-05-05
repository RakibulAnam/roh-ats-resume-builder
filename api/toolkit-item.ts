// POST /api/toolkit-item
//
// Single-item regenerate endpoint. Used by the per-item retry buttons
// (cover letter, outreach email, LinkedIn note, interview questions) in
// the Builder/Preview UI.
//
// Request:  { kind: 'coverLetter'|'outreachEmail'|'linkedInMessage'|'interviewQuestions', data: ResumeData }
// Response: { result: <typed-by-kind> }

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticate } from './_lib/auth.js';
import { assertWithinLimit, logCall, RateLimitError } from './_lib/rateLimit.js';
import {
  coverLetterGenerator,
  outreachEmailGenerator,
  linkedInMessageGenerator,
  interviewQuestionsGenerator,
} from './_lib/aiFactory.js';
import type { ResumeData } from '../src/domain/entities/Resume';

type Kind = 'coverLetter' | 'outreachEmail' | 'linkedInMessage' | 'interviewQuestions';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const auth = await authenticate(req, res);
  if (!auth) return;

  const { kind, data } = (req.body ?? {}) as { kind?: Kind; data?: ResumeData };
  if (!kind || !data || !data.targetJob?.description) {
    res.status(400).json({ error: 'Missing kind or resume data' });
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

  try {
    const result = await runItem(kind, data);
    await logCall(auth.userId, auth.jwt, 'toolkit_item');
    res.status(200).json({ result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Generation failed';
    res.status(502).json({ error: msg });
  }
}

async function runItem(kind: Kind, data: ResumeData): Promise<unknown> {
  switch (kind) {
    case 'coverLetter':
      if (!coverLetterGenerator) throw new Error('Cover letter generator not configured');
      return coverLetterGenerator.generate(data);
    case 'outreachEmail':
      if (!outreachEmailGenerator) throw new Error('Outreach email generator not configured');
      return outreachEmailGenerator.generate(data);
    case 'linkedInMessage':
      if (!linkedInMessageGenerator) throw new Error('LinkedIn message generator not configured');
      return linkedInMessageGenerator.generate(data);
    case 'interviewQuestions':
      if (!interviewQuestionsGenerator) throw new Error('Interview questions generator not configured');
      return interviewQuestionsGenerator.generate(data);
    default:
      throw new Error(`Unknown toolkit item kind: ${kind}`);
  }
}
