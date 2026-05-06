// POST /api/purchase
//
// Mock purchase endpoint. In production this will be replaced by a payment
// gateway webhook (bKash, SSLCommerz, etc.) that verifies a signed payload
// before granting credits. For now it always succeeds — the purchase flow
// can be wired up end-to-end without a real payment provider.
//
// Request:  { packageId: 'five-pack' }
// Response: { success: true, creditsGranted: 5, newBalance: N }
//
// 401 if not authenticated; 400 if packageId is unknown.
//
// Credit grant is handled by the process_mock_purchase() security-definer
// RPC which atomically inserts the purchase record AND increments
// profiles.toolkit_credits in a single transaction.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticate, userClient } from './_lib/auth.js';
import { randomUUID } from 'crypto';

const PACKAGES: Record<string, { credits: number; amountTaka: number; label: string }> = {
  'five-pack': { credits: 5, amountTaka: 200, label: '5 Toolkit Generations' },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const auth = await authenticate(req, res);
  if (!auth) return;

  const { packageId } = req.body as { packageId?: string };
  const pkg = packageId ? PACKAGES[packageId] : undefined;
  if (!pkg) {
    res.status(400).json({ error: `Unknown package: "${packageId}". Valid options: ${Object.keys(PACKAGES).join(', ')}` });
    return;
  }

  const reference = `mock-${randomUUID()}`;
  const supabase = userClient(auth.jwt);

  const { data: newBalance, error } = await supabase.rpc('process_mock_purchase', {
    p_credits: pkg.credits,
    p_amount_taka: pkg.amountTaka,
    p_reference: reference,
  });

  if (error) {
    console.error('[purchase] process_mock_purchase RPC failed:', error.message);
    res.status(500).json({ error: 'Purchase could not be processed. Please try again.' });
    return;
  }

  res.status(200).json({
    success: true,
    creditsGranted: pkg.credits,
    newBalance,
    label: pkg.label,
  });
}
