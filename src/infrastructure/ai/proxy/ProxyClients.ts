// Client-side proxy adapters — implement each AI interface by POSTing to
// /api/* on the same Vercel deployment. No API keys ever enter the client
// bundle; the server holds them.
//
// Same `IXxx` interfaces are honored, so ResumeService is unchanged.
//
// Auth: every request carries the user's Supabase access token in the
// Authorization header. Calls fail with 401 if the user isn't signed in.
// Calls fail with 429 if the user is over their daily cap (default 20/day).

import { supabase } from '../../supabase/client';
import {
  ResumeData,
  OptimizedResumeData,
  GeneratedToolkit,
  ToolkitErrors,
  OutreachEmail,
  InterviewQuestion,
} from '../../../domain/entities/Resume';
import { IResumeOptimizer } from '../../../domain/usecases/OptimizeResumeUseCase';
import { IToolkitGenerator } from '../../../domain/usecases/GenerateToolkitUseCase';
import { ICoverLetterGenerator } from '../../../domain/usecases/GenerateCoverLetterUseCase';
import { IOutreachEmailGenerator } from '../../../domain/usecases/GenerateOutreachEmailUseCase';
import { ILinkedInMessageGenerator } from '../../../domain/usecases/GenerateLinkedInMessageUseCase';
import { IInterviewQuestionsGenerator } from '../../../domain/usecases/GenerateInterviewQuestionsUseCase';
import { ExtractedProfileData, IResumeExtractor } from '../../../domain/usecases/ExtractResumeUseCase';

// ────────────────────────────────────────────────
// Shared fetch helper
// ────────────────────────────────────────────────
async function getAccessToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Not authenticated. Please sign in.');
  return token;
}

interface ApiError {
  error: string;
  used?: number;
  cap?: number;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let errorBody: ApiError | null = null;
    try { errorBody = await res.json() as ApiError; } catch { /* leave null */ }
    const friendly = errorBody?.error
      ?? `Request failed: ${res.status} ${res.statusText}`;
    if (res.status === 429 && errorBody?.used != null && errorBody?.cap != null) {
      throw new Error(`Daily limit reached (${errorBody.used}/${errorBody.cap}). Try again tomorrow.`);
    }
    throw new Error(friendly);
  }

  return res.json() as Promise<T>;
}

// ────────────────────────────────────────────────
// Optimizer + combined toolkit (the hot path)
// ────────────────────────────────────────────────
//
// /api/optimize runs BOTH the optimizer and the toolkit generator on the
// server in parallel and returns both results plus per-item errors. To keep
// the existing `IResumeOptimizer` + `IToolkitGenerator` separation on the
// client, we cache the response in-flight: the first of the two calls
// (whichever ResumeService makes first) triggers the network request; the
// second reuses the same Promise.
//
// Cache key: the ResumeData reference. Cleared after both halves resolve or
// either errors. ResumeService calls them inside the same allSettled, so the
// references are identical and cache hits.
type ApiOptimizeResponse = {
  optimized: OptimizedResumeData;
  toolkit?: GeneratedToolkit;
  errors?: ToolkitErrors;
};

const inflight = new WeakMap<ResumeData, Promise<ApiOptimizeResponse>>();
function callOptimize(data: ResumeData): Promise<ApiOptimizeResponse> {
  let p = inflight.get(data);
  if (!p) {
    p = postJson<ApiOptimizeResponse>('/api/optimize', { data })
      .finally(() => {
        // Best-effort cleanup; WeakMap entries also get GC'd naturally.
        inflight.delete(data);
      });
    inflight.set(data, p);
  }
  return p;
}

export class ProxyResumeOptimizer implements IResumeOptimizer {
  async optimize(data: ResumeData): Promise<OptimizedResumeData> {
    const r = await callOptimize(data);
    return r.optimized;
  }
}

export class ProxyToolkitGenerator implements IToolkitGenerator {
  async generate(data: ResumeData): Promise<GeneratedToolkit> {
    const r = await callOptimize(data);
    if (!r.toolkit) {
      // Toolkit failed server-side — surface the recorded error so the
      // service layer's allSettled marks all 4 items in `errors`.
      const msg = r.errors?.coverLetter ?? r.errors?.outreachEmail ?? 'Toolkit generation failed';
      throw new Error(msg);
    }
    return r.toolkit;
  }
}

// ────────────────────────────────────────────────
// Single-item regenerate (per-item retry buttons)
// ────────────────────────────────────────────────
type ToolkitItemKind = 'coverLetter' | 'outreachEmail' | 'linkedInMessage' | 'interviewQuestions';

async function regenerateItem<T>(kind: ToolkitItemKind, data: ResumeData): Promise<T> {
  const { result } = await postJson<{ result: T }>('/api/toolkit-item', { kind, data });
  return result;
}

export class ProxyCoverLetterGenerator implements ICoverLetterGenerator {
  generate(data: ResumeData): Promise<string> {
    return regenerateItem<string>('coverLetter', data);
  }
}

export class ProxyOutreachEmailGenerator implements IOutreachEmailGenerator {
  generate(data: ResumeData): Promise<OutreachEmail> {
    return regenerateItem<OutreachEmail>('outreachEmail', data);
  }
}

export class ProxyLinkedInMessageGenerator implements ILinkedInMessageGenerator {
  generate(data: ResumeData): Promise<string> {
    return regenerateItem<string>('linkedInMessage', data);
  }
}

export class ProxyInterviewQuestionsGenerator implements IInterviewQuestionsGenerator {
  generate(data: ResumeData): Promise<InterviewQuestion[]> {
    return regenerateItem<InterviewQuestion[]>('interviewQuestions', data);
  }
}

// ────────────────────────────────────────────────
// Resume extractor (PDF/Word import in profile setup)
// ────────────────────────────────────────────────
export class ProxyResumeExtractor implements IResumeExtractor {
  async extract(fileData: string, mimeType: string): Promise<ExtractedProfileData> {
    const { result } = await postJson<{ result: ExtractedProfileData }>(
      '/api/extract-resume',
      { fileData, mimeType }
    );
    return result;
  }
}
