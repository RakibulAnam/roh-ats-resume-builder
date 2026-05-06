// Client for /api/purchase. Kept separate from the AI proxy clients because
// a purchase is not an AI call — it doesn't implement any of the domain's
// generator interfaces. Reuses ApiCallError so callers see consistent error
// shapes across all server endpoints.

import { supabase } from '../supabase/client';
import { ApiCallError } from '../ai/proxy/ProxyClients';

export type PackageId = 'five-pack';

export interface PurchaseResult {
  success: true;
  creditsGranted: number;
  newBalance: number;
  label: string;
}

interface ApiError {
  error: string;
  code?: string;
}

export async function purchasePackage(packageId: PackageId): Promise<PurchaseResult> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new ApiCallError('Not authenticated. Please sign in.', 401);

  const res = await fetch('/api/purchase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ packageId }),
  });

  if (!res.ok) {
    let body: ApiError | null = null;
    try { body = await res.json() as ApiError; } catch { /* leave null */ }
    throw new ApiCallError(
      body?.error ?? `Purchase failed: ${res.status} ${res.statusText}`,
      res.status,
      body?.code,
    );
  }

  return res.json() as Promise<PurchaseResult>;
}
