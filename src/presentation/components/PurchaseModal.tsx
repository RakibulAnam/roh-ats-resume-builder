// PurchaseModal — buy a pack of toolkit generations.
//
// Currently mocked end-to-end: clicking "Pay Now" hits /api/purchase which
// always grants credits. When a real payment gateway is integrated, only the
// server side changes — this component stays the same.

import React, { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '../i18n/LocaleContext';
import { purchasePackage, type PackageId } from '../../infrastructure/api/purchaseClient';
import { ApiCallError } from '../../infrastructure/ai/proxy/ProxyClients';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the new credit balance after a successful purchase. */
  onSuccess?: (newBalance: number) => void;
}

const PACKAGE_ID: PackageId = 'five-pack';

export const PurchaseModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const t = useT();
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handlePay = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await purchasePackage(PACKAGE_ID);
      toast.success(t('purchaseModal.successToast', { credits: result.creditsGranted }));
      onSuccess?.(result.newBalance);
      onClose();
    } catch (err) {
      const msg = err instanceof ApiCallError
        ? err.message
        : err instanceof Error
          ? err.message
          : t('purchaseModal.failureFallback');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm"
        onClick={submitting ? undefined : onClose}
      />

      {/* Dialog */}
      <div className="relative bg-paper rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-brand-800 tracking-tight">
              {t('purchaseModal.title')}
            </h2>
            <p className="mt-2 text-sm text-charcoal-600 leading-relaxed">
              {t('purchaseModal.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
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

          <p className="mt-3 text-[11px] text-charcoal-500 italic text-center">
            {t('purchaseModal.mockNotice')}
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 pt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={handlePay}
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-700 text-charcoal-50 rounded-full font-semibold text-sm hover:bg-brand-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t('purchaseModal.processing')}
              </>
            ) : (
              t('purchaseModal.payNow')
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-full py-2 text-sm text-charcoal-600 hover:text-charcoal-900 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('purchaseModal.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
