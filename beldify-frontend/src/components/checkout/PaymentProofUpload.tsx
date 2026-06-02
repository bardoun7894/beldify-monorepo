'use client';

import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, Clock, FileText, MessageCircle, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { orderService, Order } from '@/services/orderService';
import toast from '@/utils/toast';
import logger from '@/utils/consoleLogger';

const TRANSFER_METHODS = [
  'bank_transfer',
  'wafacash',
  'cash_plus',
  'western_union',
  'moneygram',
];

// Support contact for customers who don't know how to pay.
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+212708150351';
const SUPPORT_WHATSAPP = SUPPORT_PHONE.replace(/[^0-9]/g, '');

function PaymentHelp() {
  const { t } = useTranslation();
  return (
    <div className="mt-4 pt-4 border-t border-amber-100">
      <p className="text-xs text-gray-500 mb-2">
        {t('order_confirmation.proof.need_help', "Not sure how to pay? We're here to help.")}
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href={`https://wa.me/${SUPPORT_WHATSAPP}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 ring-1 ring-green-200 rounded-full px-3 py-1.5 hover:bg-green-100 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
          {t('order_confirmation.proof.whatsapp', 'WhatsApp')}
        </a>
        <a
          href={`tel:${SUPPORT_PHONE}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 ring-1 ring-indigo-200 rounded-full px-3 py-1.5 hover:bg-indigo-100 transition-colors"
        >
          <Phone className="w-3.5 h-3.5" aria-hidden="true" />
          {t('order_confirmation.proof.call', 'Call us')}
        </a>
      </div>
    </div>
  );
}

interface Props {
  order: Order;
  onUploaded?: () => void;
}

/**
 * Receipt-upload card shown on the order-confirmation page for offline
 * money-transfer orders. Hidden for COD / card / paid orders.
 */
export default function PaymentProofUpload({ order, onUploaded }: Props) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(order.payment_status === 'pending_verification');
  const [instructions, setInstructions] = useState<{ account: string; instructions: string } | null>(null);

  const method = order.payment_method || '';
  const isTransfer = TRANSFER_METHODS.includes(method);

  // Fetch the payout account + how-to-pay details for this method.
  useEffect(() => {
    if (!isTransfer) return;
    let active = true;
    orderService.getPaymentInstructions(method).then((data) => {
      if (active && data) setInstructions({ account: data.account, instructions: data.instructions });
    });
    return () => {
      active = false;
    };
  }, [isTransfer, method]);

  // Only relevant for offline transfers that aren't already paid/rejected.
  if (!isTransfer || order.payment_status === 'paid' || order.payment_status === 'rejected') {
    return null;
  }

  // Already uploaded — show the "under review" state.
  if (done || order.payment_status === 'pending_verification') {
    return (
      <div className="bg-white rounded-2xl shadow-atlas-sm ring-1 ring-amber-200 p-6 flex items-start gap-3">
        <Clock className="w-6 h-6 text-indigo-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {t('order_confirmation.proof.under_review_title', 'Payment under review')}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {t(
              'order_confirmation.proof.under_review_body',
              'We received your payment evidence and will confirm your order shortly.'
            )}
          </p>
          <PaymentHelp />
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!file) {
      toast.error(t('order_confirmation.proof.file_required', 'Please attach your transfer receipt'));
      return;
    }
    setSubmitting(true);
    try {
      await orderService.uploadPaymentProof(order.order_number, file, {
        reference: reference.trim() || undefined,
        email: order.shipping_info?.email,
      });
      setDone(true);
      toast.success(
        t('order_confirmation.proof.success', 'Receipt uploaded — we will verify it shortly')
      );
      onUploaded?.();
    } catch (error: any) {
      logger.error('Payment proof upload failed:', error);
      toast.error(
        error?.response?.data?.message ||
          t('order_confirmation.proof.error', 'Could not upload your receipt. Please try again.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-atlas-sm ring-1 ring-amber-200 p-6">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle className="w-5 h-5 text-amber-500" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-gray-900">
          {t('order_confirmation.proof.title', 'Complete your payment')}
        </h3>
      </div>

      <p className="text-xs text-gray-500 mb-3">
        {instructions?.instructions ||
          t(
            `order_confirmation.proof.instructions.${method}`,
            'Send your payment using the details below, then upload the receipt to confirm your order.'
          )}
      </p>

      {instructions?.account ? (
        <div className="mb-4 rounded-xl bg-amber-50 ring-1 ring-amber-200 px-4 py-3">
          <span className="block text-[11px] uppercase tracking-wider text-amber-700 font-medium">
            {t('order_confirmation.proof.send_to', 'Send payment to')}
          </span>
          <span className="block text-sm font-semibold text-gray-900 mt-0.5 select-all break-words">
            {instructions.account}
          </span>
        </div>
      ) : null}

      <label className="block">
        <span className="sr-only">{t('order_confirmation.proof.choose_file', 'Choose receipt')}</span>
        <div className="flex items-center gap-3 border border-dashed border-amber-300 rounded-xl p-4 cursor-pointer hover:bg-amber-50/50 transition-colors">
          <Upload className="w-5 h-5 text-indigo-700 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm text-gray-600 flex items-center gap-2 truncate">
            {file ? (
              <>
                <FileText className="w-4 h-4" aria-hidden="true" />
                {file.name}
              </>
            ) : (
              t('order_confirmation.proof.choose_file', 'Choose receipt (image or PDF)')
            )}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </label>

      <input
        type="text"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder={t('order_confirmation.proof.reference', 'Transfer reference / sender name (optional)')}
        className="mt-3 w-full text-sm border border-amber-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-full py-2.5 px-6 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {submitting
          ? t('order_confirmation.proof.uploading', 'Uploading…')
          : t('order_confirmation.proof.submit', 'Upload receipt')}
      </button>

      <PaymentHelp />
    </div>
  );
}
