import React, { useState } from 'react';
import {
  CreditCard,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Info
} from './Icons';
import * as api from '../api/paymentApi';
import { saveTransaction } from '../services/storageService';

const PRESETS = [
  {
    label: 'Standard SaaS ($10.00 USD)',
    amount: '10.00',
    currency: 'USD',
    recipient: 'sb-merchant@business.example.com',
    purpose: 'Standard Cloud SaaS Monthly Subscription'
  },
  {
    label: 'Enterprise Retainer ($1,500.00 USD)',
    amount: '1500.00',
    currency: 'USD',
    recipient: 'finance@enterprise-partner.io',
    purpose: 'Quarterly Infrastructure Security Retainer'
  },
  {
    label: 'Hardware Supply (€320.00 EUR)',
    amount: '320.00',
    currency: 'EUR',
    recipient: 'billing@eu-hardware-hub.de',
    purpose: 'Server rack components shipment #8492'
  }
];

export function CreatePayment({ onNavigateToReturn, showToast }) {
  const [step, setStep] = useState(1); // 1: Intent Form, 2: Intent Registered, 3: Order Created

  // Form State
  const [amount, setAmount] = useState('10.00');
  const [currency, setCurrency] = useState('USD');
  const [recipient, setRecipient] = useState('sb-merchant@business.example.com');
  const [purpose, setPurpose] = useState('Cloud Service Subscription Tier 1');

  // Operation States
  const [isSubmittingIntent, setIsSubmittingIntent] = useState(false);
  const [registeredIntent, setRegisteredIntent] = useState(null);

  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [approveUrl, setApproveUrl] = useState('');

  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const applyPreset = (preset) => {
    setAmount(preset.amount);
    setCurrency(preset.currency);
    setRecipient(preset.recipient);
    setPurpose(preset.purpose);
  };

  const handleCreateIntent = async (e) => {
    e.preventDefault();

    // Client-side validation matching backend
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      showToast({ type: 'error', title: 'Invalid Amount', message: 'Amount must be a positive number.' });
      return;
    }
    if (!['USD', 'EUR', 'GBP', 'INR'].includes(currency)) {
      showToast({ type: 'error', title: 'Invalid Currency', message: 'Supported: USD, EUR, GBP, INR.' });
      return;
    }
    if (!recipient || recipient.trim().length < 2) {
      showToast({ type: 'error', title: 'Invalid Recipient', message: 'Recipient must be at least 2 characters.' });
      return;
    }
    if (!purpose || purpose.trim().length < 3) {
      showToast({ type: 'error', title: 'Invalid Purpose', message: 'Purpose must be between 3 and 200 characters.' });
      return;
    }

    try {
      setIsSubmittingIntent(true);
      const res = await api.createIntent({
        amount: Number(amount).toFixed(2),
        currency,
        recipient: recipient.trim(),
        purpose: purpose.trim()
      });

      setRegisteredIntent({
        intentId: res.intentId,
        ...res.intent
      });

      // Persist in local store
      saveTransaction({
        intentId: res.intentId,
        amount: Number(amount).toFixed(2),
        currency,
        recipient: recipient.trim(),
        purpose: purpose.trim(),
        status: 'INTENT_REGISTERED',
        createdAt: new Date().toISOString()
      });

      showToast({
        type: 'success',
        title: 'Payment Intent Registered',
        message: `Registered intent ${res.intentId.substring(0, 8)}... with zero-trust ledger.`
      });

      setStep(2);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Intent Registration Failed',
        message: err.message || 'Could not register intent with backend.'
      });
    } finally {
      setIsSubmittingIntent(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!registeredIntent?.intentId) return;

    try {
      setIsCreatingOrder(true);
      const res = await api.createOrder(registeredIntent.intentId);

      setCreatedOrder(res);

      // Extract PayPal approval URL from links
      const approveLink = res.links?.find(
        (l) => l.rel === 'payer-action' || l.rel === 'approve'
      );
      if (approveLink?.href) {
        setApproveUrl(approveLink.href);
      }

      // Update storage
      saveTransaction({
        intentId: registeredIntent.intentId,
        orderId: res.orderId,
        amount: registeredIntent.amount,
        currency: registeredIntent.currency,
        recipient: registeredIntent.recipient,
        purpose: registeredIntent.purpose,
        status: 'ORDER_CREATED',
        approveUrl: approveLink?.href || null,
        createdAt: new Date().toISOString()
      });

      showToast({
        type: 'success',
        title: 'PayPal Order Created',
        message: `Linked Order ID: ${res.orderId}. Ready for Sandbox checkout.`
      });

      setStep(3);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Order Creation Failed',
        message: err.message || 'PayPal Sandbox order could not be generated.'
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleSimulateReturn = () => {
    if (!createdOrder?.orderId) return;
    onNavigateToReturn(createdOrder.orderId, 'MOCK_SANDBOX_PAYER_01');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">

      {/* Step Indicator Header */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between max-w-2xl mx-auto text-xs font-semibold">

          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-mono ${
              step >= 1 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
            }`}>
              1
            </span>
            <span className={step >= 1 ? 'text-white' : 'text-slate-500'}>Register Intent</span>
          </div>

          <div className={`flex-1 h-0.5 mx-3 ${step >= 2 ? 'bg-emerald-500/50' : 'bg-slate-800'}`} />

          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-mono ${
              step >= 2 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
            }`}>
              2
            </span>
            <span className={step >= 2 ? 'text-white' : 'text-slate-500'}>Create PayPal Order</span>
          </div>

          <div className={`flex-1 h-0.5 mx-3 ${step >= 3 ? 'bg-emerald-500/50' : 'bg-slate-800'}`} />

          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-mono ${
              step >= 3 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
            }`}>
              3
            </span>
            <span className={step >= 3 ? 'text-white' : 'text-slate-500'}>Sandbox Checkout</span>
          </div>

        </div>
      </div>

      {/* PHASE 1: Payment Intent Registration Form */}
      {step === 1 && (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-xl backdrop-blur-md">
          <div className="flex items-start justify-between gap-4 mb-6 pb-5 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                Step 1: Register Payment Intent
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                ZevRA records the intended transaction parameters before communicating with PayPal Sandbox.
              </p>
            </div>
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
              POST /api/payments/intent
            </div>
          </div>

          {/* Quick Presets */}
          <div className="mb-6">
            <div className="text-xs font-semibold text-slate-400 mb-2">Test Presets</div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700/80 hover:border-slate-600 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreateIntent} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Amount */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Amount <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                    {currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : '$'}
                  </span>
                  <input
                    type="text"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="10.00"
                    pattern="^\d{1,8}(\.\d{1,2})?$"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-4 py-2.5 text-white font-mono text-sm placeholder-slate-600 focus:outline-none transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Exact numeric string with up to 2 decimal places.</p>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Currency <span className="text-emerald-400">*</span>
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none transition-colors"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Supported gateway currency.</p>
              </div>

            </div>

            {/* Recipient */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Intended Recipient (Merchant / Payee Email) <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="merchant@sandbox.paypal.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                ZevRA matches this against PayPal's actual payee upon order approval.
              </p>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Payment Purpose / Contract Reference <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Brief description of service or goods"
                minLength={3}
                maxLength={200}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                3–200 characters internal intent compliance requirement (note: PayPal schema does not include a purpose field).
              </p>
            </div>

            {/* Notice */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-400">
              <Info className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-slate-300">Zero-Trust Parameter Binding: </span>
                Once registered, these values become the immutable baseline. Any alterations during PayPal's checkout will trigger a <span className="text-rose-400 font-bold">BLOCKED</span> decision and inhibit capture.
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingIntent}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isSubmittingIntent ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Registering Intent...
                  </>
                ) : (
                  <>
                    <span>Register Payment Intent</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PHASE 2: Intent Registered & Trigger Create Order */}
      {step === 2 && registeredIntent && (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-xl backdrop-blur-md">
          <div className="flex items-start justify-between gap-4 mb-6 pb-5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase">
                  Intent Registered
                </span>
              </div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Step 2: Generate PayPal Sandbox Order
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                The backend will initialize an order directly with PayPal Sandbox using the verified intent amount.
              </p>
            </div>
            <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-semibold">
              POST /api/payments/create-order
            </div>
          </div>

          {/* Registered Intent Details Card */}
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400">Registered Intent ID</span>
                <div className="font-mono text-sm font-bold text-emerald-400 mt-0.5 break-all">
                  {registeredIntent.intentId}
                </div>
              </div>
              <button
                onClick={() => handleCopy(registeredIntent.intentId, 'intentId')}
                className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                {copiedField === 'intentId' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedField === 'intentId' ? 'Copied' : 'Copy ID'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Authorized Amount</span>
                <span className="font-mono text-base font-bold text-white mt-0.5 block">
                  {registeredIntent.amount} {registeredIntent.currency}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Expected Recipient</span>
                <span className="font-mono text-xs text-slate-200 mt-0.5 block truncate" title={registeredIntent.recipient}>
                  {registeredIntent.recipient}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Purpose</span>
                <span className="text-xs text-slate-300 mt-0.5 block truncate" title={registeredIntent.purpose}>
                  {registeredIntent.purpose}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Edit Intent Parameters
            </button>

            <button
              onClick={handleCreateOrder}
              disabled={isCreatingOrder}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isCreatingOrder ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Contacting PayPal Sandbox...
                </>
              ) : (
                <>
                  <span>Create PayPal Sandbox Order</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* PHASE 3: PayPal Sandbox Checkout & Return Flow Launcher */}
      {step === 3 && createdOrder && (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-xl backdrop-blur-md">
          <div className="flex items-start justify-between gap-4 mb-6 pb-5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase">
                  PayPal Order Created
                </span>
                <span className="text-xs text-slate-400 font-mono">Status: {createdOrder.status}</span>
              </div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Step 3: PayPal Sandbox Authorization
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete checkout on PayPal Sandbox, then return to ZevRA for pre-capture verification.
              </p>
            </div>
          </div>

          {/* Order Details summary */}
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400">PayPal Order ID</span>
                <div className="font-mono text-base font-bold text-white mt-0.5">
                  {createdOrder.orderId}
                </div>
              </div>
              <button
                onClick={() => handleCopy(createdOrder.orderId, 'orderId')}
                className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                {copiedField === 'orderId' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedField === 'orderId' ? 'Copied' : 'Copy Order ID'}
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Linked Intent:</span>
                <span className="font-mono text-slate-200">{registeredIntent?.intentId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Amount & Currency:</span>
                <span className="font-mono font-bold text-emerald-400">{registeredIntent?.amount} {registeredIntent?.currency}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Return URL Configured:</span>
                <span className="font-mono text-slate-300">http://localhost:5173/payment/return</span>
              </div>
            </div>
          </div>

          {/* Dual Checkout Action Paths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Real Sandbox Checkout Link */}
            <div className="p-5 rounded-xl bg-slate-950 border border-amber-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <ExternalLink className="w-4 h-4" />
                  Live Sandbox Flow
                </div>
                <h3 className="font-bold text-white text-sm mb-1">Open PayPal Sandbox Portal</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Log in with your Sandbox Personal (buyer) account to approve the test order. PayPal will redirect back to ZevRA automatically.
                </p>
              </div>

              <div className="mt-5">
                {approveUrl ? (
                  <a
                    href={approveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/10"
                  >
                    <span>Proceed to PayPal Sandbox</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-500">No approval URL provided by gateway</span>
                )}
              </div>
            </div>

            {/* Direct Verification Flow */}
            <div className="p-5 rounded-xl bg-slate-950 border border-emerald-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <CheckCircle className="w-4 h-4" />
                  Verification & Capture Lab
                </div>
                <h3 className="font-bold text-white text-sm mb-1">Verify Return Flow</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Inspect the order in the ZevRA Verification Center. Evaluates SAFE/WARNING/BLOCKED status and tests capture protection.
                </p>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleSimulateReturn}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs uppercase tracking-wider border border-emerald-500/30 flex items-center justify-center gap-2 transition-all"
                >
                  <span>Open Verification Center</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          <div className="pt-6 border-t border-slate-800/80 mt-6 flex justify-between items-center text-xs text-slate-400">
            <button
              onClick={() => {
                setStep(1);
                setRegisteredIntent(null);
                setCreatedOrder(null);
              }}
              className="hover:text-white transition-colors"
            >
              + Create Another Payment
            </button>
            <span className="font-mono text-slate-500">ZevRA Sandbox v1.0</span>
          </div>

        </div>
      )}

    </div>
  );
}
