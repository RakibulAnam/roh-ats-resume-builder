// POST /api/confirm-purchase
//
// Webhook called by the owner's Flutter SMS-watcher app when it detects a
// matching bKash transaction SMS on the owner's phone. The watcher extracts
// the transaction ID, the sender's bKash phone number, and the amount from
// the SMS, then POSTs them here. This endpoint authenticates the webhook
// via HMAC, then calls the `confirm_purchase` SECURITY DEFINER RPC using
// the Supabase service-role key (which bypasses the RLS column lockdown
// added in migration 005 + the EXECUTE revoke on the RPC).
//
// Request:  { transactionId: 'AB12CD34EF', senderMsisdn?: '01XXXXXXXXX', amountTaka?: 200 }
// Headers:  X-Bkash-Webhook-Signature: <hmac-sha256(body, BKASH_WEBHOOK_SECRET) hex>
// Response: { success: true, userId: '<uuid>', creditsGranted: 5, newBalance: N }
//
// 401 if signature missing or invalid; 400 if body shape is wrong;
// 404 if no matching pending purchase; 409 if msisdn doesn't match;
// 503 if SUPABASE_SERVICE_ROLE_KEY is not configured.
//
// SECURITY MODEL
// ==============
// - The Flutter app holds BKASH_WEBHOOK_SECRET (a random 32-byte string).
//   The same secret is set as a Vercel env var on the server.
// - The watcher computes HMAC-SHA256(rawBody, secret) and sends it in the
//   X-Bkash-Webhook-Signature header. We verify with timing-safe compare.
// - On success we call the `confirm_purchase` RPC under the service-role
//   key — that key bypasses RLS and is the only identity that can EXECUTE
//   `confirm_purchase` per migration 005.
// - The endpoint is intentionally NOT user-callable. End-user JWTs are
//   ignored; only the webhook signature gates entry.
//
// FLUTTER APP RESPONSIBILITIES (out of scope of this file)
// ========================================================
// - Read incoming bKash SMS via the platform's SMS-receiver permission.
// - Parse the canonical bKash money-received format. Example:
//     "You have received Tk 200.00 from 01711234567. Fee Tk 0.00. Balance
//      Tk 1234.56. TrxID ABC123XYZ at 12/05/2026 14:33."
//   Extract: transactionId='ABC123XYZ', senderMsisdn='01711234567', amountTaka=200.
// - POST to this endpoint with the HMAC signature header.
// - Retry with exponential backoff on 5xx; do NOT retry on 4xx.
// - Persist locally so the same SMS isn't replayed if the webhook briefly
//   accepts then loses state.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'crypto';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const BKASH_WEBHOOK_SECRET = process.env.BKASH_WEBHOOK_SECRET ?? '';

interface ConfirmBody {
  transactionId?: string;
  senderMsisdn?: string;
  amountTaka?: number;
}

function verifySignature(rawBody: string, providedHex: string | undefined): boolean {
  if (!providedHex || !BKASH_WEBHOOK_SECRET) return false;
  const expected = createHmac('sha256', BKASH_WEBHOOK_SECRET).update(rawBody).digest();
  let provided: Buffer;
  try {
    provided = Buffer.from(providedHex, 'hex');
  } catch {
    return false;
  }
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[confirm-purchase] SUPABASE_SERVICE_ROLE_KEY not configured');
    res.status(503).json({ error: 'Webhook is not configured on the server.' });
    return;
  }
  if (!BKASH_WEBHOOK_SECRET) {
    console.error('[confirm-purchase] BKASH_WEBHOOK_SECRET not configured');
    res.status(503).json({ error: 'Webhook is not configured on the server.' });
    return;
  }

  // Vercel parses JSON for us, but we need the raw bytes for HMAC. Reconstruct.
  // (For higher fidelity in production, switch to a raw-body middleware so we
  // hash the exact bytes the client sent — the JSON.stringify here matches
  // most Flutter http.post payloads but isn't byte-exact.)
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
  const sigHeader = req.headers['x-bkash-webhook-signature'];
  const sig = Array.isArray(sigHeader) ? sigHeader[0] : sigHeader;

  if (!verifySignature(rawBody, sig)) {
    res.status(401).json({ error: 'Invalid or missing signature.' });
    return;
  }

  const { transactionId, senderMsisdn } = (req.body ?? {}) as ConfirmBody;
  if (!transactionId || typeof transactionId !== 'string' || transactionId.trim().length < 6) {
    res.status(400).json({ error: 'transactionId is required (min 6 chars).' });
    return;
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin.rpc('confirm_purchase', {
    p_transaction_id: transactionId.trim(),
    p_observed_sender_msisdn: senderMsisdn?.trim() || null,
  });

  if (error) {
    const msg = error.message ?? '';
    if (msg.includes('no_pending_purchase')) {
      res.status(404).json({ error: 'No pending purchase matches that transaction ID.', code: 'no_pending_purchase' });
      return;
    }
    if (msg.includes('msisdn_mismatch')) {
      res.status(409).json({ error: 'Sender phone number does not match the pending purchase.', code: 'msisdn_mismatch' });
      return;
    }
    console.error('[confirm-purchase] confirm_purchase RPC failed:', msg);
    res.status(500).json({ error: 'Could not confirm purchase. Please retry.' });
    return;
  }

  // The RPC returns a single row table { user_id, new_balance, credits_granted }.
  const row = Array.isArray(data) ? data[0] : data;
  res.status(200).json({
    success: true,
    userId: row?.user_id,
    creditsGranted: row?.credits_granted,
    newBalance: row?.new_balance,
  });
}
