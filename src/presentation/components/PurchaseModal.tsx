// PurchaseModal — buy a pack of toolkit generations via bKash.
//
// Production flow (no payment gateway):
//   1. User sees the owner's bKash number and the package amount.
//   2. User sends the amount via bKash to that number out-of-band.
//   3. User pastes the Transaction ID (TrxID) from the bKash confirmation
//      SMS into the form here.
//   4. We POST to /api/purchase which records a 'pending' purchase row.
//   5. The owner's Flutter SMS-watcher app reads the bKash SMS on the
//      owner's phone, matches the TrxID, and POSTs to /api/confirm-purchase
//      which flips the row to 'completed' and grants credits.
//
// Dev / mock flow (when VITE_BKASH_MOCK_AUTOCONFIRM=true):
//   - Steps 1–4 happen as above.
//   - INSTEAD of waiting for the Flutter app, this modal auto-fires
//     /api/dev-mock-confirm after a short delay so the buy → pending →
//     credits flow can be exercised end-to-end. Delete the mock-confirm
//     dispatch (search "mockConfirm") and the dev endpoint when shipping.

import React, { useState } from 'react';
import { X, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '../i18n/LocaleContext';
import { supabase } from '../../infrastructure/supabase/client';
import { purchasePackage, type PackageId } from '../../infrastructure/api/purchaseClient';
import { ApiCallError } from '../../infrastructure/ai/proxy/ProxyClients';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Called after a pending purchase is recorded (mock mode: after credits land). */
  onSuccess?: () => void;
}

const PACKAGE_ID: PackageId = 'five-pack';

const ENV = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env ?? {};
const OWNER_BKASH_NUMBER = ENV.VITE_BKASH_PAYMENT_NUMBER || '01XXXXXXXXX';
const MOCK_AUTOCONFIRM = ENV.VITE_BKASH_MOCK_AUTOCONFIRM === 'true';
// Match the simulated SMS-arrival delay; the user perceives this as "Flutter
// is reading the SMS". 3 seconds is long enough to feel real, short enough
// not to be annoying.
const MOCK_DELAY_MS = 3000;

type Phase = 'idle' | 'submitting' | 'verifying' | 'confirmed' | 'error';

async function mockConfirm(transactionId: string): Promise<{ creditsGranted: number; newBalance: number }> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new ApiCallError('Not authenticated.', 401);
  const res = await fetch('/api/dev-mock-confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ transactionId }),
  });
  if (!res.ok) {
    let body: { error?: string } | null = null;
    try { body = await res.json(); } catch { /* leave null */ }
    throw new ApiCallError(body?.error ?? `mock-confirm ${res.status}`, res.status);
  }
  return res.json() as Promise<{ creditsGranted: number; newBalance: number }>;
}

export const PurchaseModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const t = useT();
  const [phase, setPhase] = useState<Phase>('idle');
  const [transactionId, setTransactionId] = useState('');
  const [senderMsisdn, setSenderMsisdn] = useState('');

  if (!isOpen) return null;

  const trimmedTxn = transactionId.trim();
  const txnIsValid = trimmedTxn.length >= 6;
  const busy = phase === 'submitting' || phase === 'verifying';

  const reset = () => {
    setTransactionId('');
    setSenderMsisdn('');
    setPhase('idle');
  };

  const finishAndClose = () => {
    reset();
    onSuccess?.();
    onClose();
  };

  const handleSubmit = async () => {
    if (busy || !txnIsValid) return;
    setPhase('submitting');
    try {
      await purchasePackage({
        packageId: PACKAGE_ID,
        transactionId: trimmedTxn,
        senderMsisdn: senderMsisdn.trim() || undefined,
      });

      if (MOCK_AUTOCONFIRM) {
        // Move to "verifying" — UI shows a different label + spinner so the
        // user sees the pending → confirmed transition. Match the simulated
        // SMS-arrival delay before firing the mock-confirm endpoint.
        setPhase('verifying');
        await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
        try {
          const { creditsGranted } = await mockConfirm(trimmedTxn);
          setPhase('confirmed');
          toast.success(t('purchaseModal.confirmedToast', { credits: creditsGranted }));
          // Brief "✓ Confirmed" pause then close.
          setTimeout(finishAndClose, 700);
        } catch (mockErr) {
          // Mock confirm failed — the pending row IS in the database, so
          // the production flow would still work; just surface a friendly
          // toast and close. Don't fall through to the error phase.
          console.warn('[PurchaseModal] mock-confirm failed:', mockErr);
          toast.success(t('purchaseModal.successToast'));
          finishAndClose();
        }
      } else {
        // Production behaviour: pending submitted, credits land later via
        // the Flutter SMS-watcher webhook.
        toast.success(t('purchaseModal.successToast'));
        finishAndClose();
      }
    } catch (err) {
      let msg: string;
      if (err instanceof ApiCallError) {
        if (err.code === 'duplicate_transaction_id') msg = t('purchaseModal.duplicateTxn');
        else if (err.code === 'invalid_transaction_id') msg = t('purchaseModal.invalidTxn');
        else msg = err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      } else {
        msg = t('purchaseModal.failureFallback');
      }
      toast.error(msg);
      setPhase('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm"
        onClick={busy ? undefined : onClose}
      />

      {/* Dialog */}
      <div className="relative bg-paper rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-brand-800 tracking-tight">
              {t('purchaseModal.title')}
            </h2>
            <p className="mt-2 text-sm text-charcoal-600 leading-relaxed">
              {t('purchaseModal.subtitle')}
            </p>
            {MOCK_AUTOCONFIRM && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-50 border border-accent-200 text-[11px] uppercase tracking-[0.18em] text-accent-700 font-semibold">
                {t('purchaseModal.mockBadge')}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="ml-3 -mr-1 -mt-1 p-2 text-charcoal-400 hover:text-charcoal-700 hover:bg-charcoal-100 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Pack card */}
        <div className="px-6">
          <div className="rounded-2xl border border-charcoal-200 bg-white p-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-accent-600 font-semibold">
              <Sparkles size={14} className="text-accent-500" />
              {t('purchaseModal.packEyebrow')}
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-4">
              <h3 className="font-display text-lg font-semibold text-brand-800">
                {t('purchaseModal.packName')}
              </h3>
              <div className="text-right">
                <div className="font-display text-2xl font-semibold text-brand-800 leading-none">
                  {t('purchaseModal.packPrice')}
                </div>
                <div className="mt-1 text-[11px] text-charcoal-500">
                  {t('purchaseModal.packPerUnit')}
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-charcoal-600 leading-relaxed">
              {t('purchaseModal.packDetail')}
            </p>
          </div>
        </div>

        {/* bKash steps */}
        <div className="px-6 pt-5">
          <div className="text-[11px] uppercase tracking-[0.22em] text-accent-600 font-semibold mb-2">
            {t('purchaseModal.bkashStepsTitle')}
          </div>
          <ol className="space-y-1.5 text-sm text-charcoal-700 leading-relaxed">
            <li>
              {t('purchaseModal.bkashStep1', { amount: t('purchaseModal.packPrice'), number: OWNER_BKASH_NUMBER })}
            </li>
            <li>{t('purchaseModal.bkashStep2')}</li>
            <li>{t('purchaseModal.bkashStep3')}</li>
          </ol>
          <div className="mt-3 px-3 py-2 rounded-lg bg-charcoal-50 border border-charcoal-200 text-sm">
            <div className="text-[11px] uppercase tracking-[0.18em] text-charcoal-500 font-semibold">
              {t('purchaseModal.bkashNumberLabel')}
            </div>
            <div className="font-mono text-base text-brand-800 font-semibold tracking-wide">
              {OWNER_BKASH_NUMBER}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 pt-4 space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-charcoal-700">
              {t('purchaseModal.bkashTxnIdLabel')}
            </span>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
              placeholder={t('purchaseModal.bkashTxnIdPlaceholder')}
              disabled={busy}
              className="mt-1 block w-full px-3 py-2 rounded-lg border border-charcoal-300 bg-white font-mono text-sm tracking-wide text-brand-800 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-accent-400 disabled:opacity-60"
              maxLength={32}
              autoComplete="off"
              spellCheck={false}
            />
            <span className="mt-1 block text-[11px] text-charcoal-500">
              {t('purchaseModal.bkashTxnIdHint')}
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-charcoal-700">
              {t('purchaseModal.bkashSenderLabel')}
            </span>
            <input
              type="tel"
              value={senderMsisdn}
              onChange={(e) => setSenderMsisdn(e.target.value)}
              placeholder={t('purchaseModal.bkashSenderPlaceholder')}
              disabled={busy}
              className="mt-1 block w-full px-3 py-2 rounded-lg border border-charcoal-300 bg-white text-sm text-brand-800 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-accent-400 disabled:opacity-60"
              maxLength={20}
              autoComplete="tel"
            />
            <span className="mt-1 block text-[11px] text-charcoal-500">
              {t('purchaseModal.bkashSenderHint')}
            </span>
          </label>

          <p className="text-[11px] text-charcoal-500 italic leading-relaxed">
            {t('purchaseModal.pendingNotice')}
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 pt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy || !txnIsValid}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-700 text-charcoal-50 rounded-full font-semibold text-sm hover:bg-brand-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {phase === 'submitting' && (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t('purchaseModal.processing')}
              </>
            )}
            {phase === 'verifying' && (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t('purchaseModal.verifying')}
              </>
            )}
            {phase === 'confirmed' && (
              <>
                <CheckCircle2 size={16} />
                {t('purchaseModal.confirmedToast', { credits: 5 })}
              </>
            )}
            {(phase === 'idle' || phase === 'error') && t('purchaseModal.submit')}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="w-full py-2 text-sm text-charcoal-600 hover:text-charcoal-900 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('purchaseModal.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
