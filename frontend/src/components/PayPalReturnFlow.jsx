import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  XCircle,
  ArrowRight
} from './Icons';
import { VerificationCard } from './VerificationCard';
import * as api from '../api/paymentApi';
import { findTransaction, updateTransaction } from '../services/storageService';

export function PayPalReturnFlow({
  orderId,
  payerId,
  isCancel,
  onNavigateHome,
  showToast
}) {
  const [verification, setVerification] = useState(null);
  const [intent, setIntent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Capture State
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureResult, setCaptureResult] = useState(null);

  const runVerification = useCallback(async (targetOrderId) => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await api.verifyOrder(targetOrderId);
      setVerification(res.verification);

      // Update storage
      updateTransaction(targetOrderId, {
        verification: res.verification,
        status: res.verification.decision === 'SAFE' ? 'VERIFIED' : res.verification.decision
      });

      showToast({
        type: res.verification.decision === 'SAFE' ? 'success' : res.verification.decision === 'WARNING' ? 'warning' : 'error',
        title: `ZevRA Decision: ${res.verification.decision}`,
        message: `Evaluated risk score: ${res.verification.riskScore}%. ${res.verification.decision === 'SAFE' ? 'Safe to capture.' : 'Capture hold active.'}`
      });
    } catch (err) {
      console.error('Verification error:', err);
      let msg = err.message || 'Failed to verify order.';
      if (err.status === 409) {
        msg = 'Order has not been approved in PayPal Sandbox yet. Please approve the order in Sandbox first, or the order was already processed.';
      }
      setError(msg);

      try {
        const ord = await api.getOrder(targetOrderId);
        if (ord?.purchase_units?.[0]) {
          setIntent({
            amount: ord.purchase_units[0].amount?.value,
            currency: ord.purchase_units[0].amount?.currency_code,
            recipient: ord.purchase_units[0].payee?.email_address,
            purpose: 'PayPal Sandbox Order'
          });
        }
      } catch (orderFetchErr) {
        console.warn('Could not fetch PayPal order info:', orderFetchErr);
      }
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!orderId || isCancel) return;

    // Load intent from storage if available
    const localTx = findTransaction(orderId);
    if (localTx) {
      setIntent(localTx);
      if (localTx.verification) {
        setVerification(localTx.verification);
      }
      if (localTx.capture) {
        setCaptureResult(localTx.capture);
      }
    }

    // Run verification automatically if not captured yet
    if (!localTx?.capture) {
      runVerification(orderId);
    }
  }, [orderId, isCancel, runVerification]);

  const handleCapture = async () => {
    if (!orderId) return;

    try {
      setIsCapturing(true);
      const res = await api.captureOrder(orderId);

      setCaptureResult(res);

      // Update storage
      updateTransaction(orderId, {
        status: 'CAPTURED',
        capture: res
      });

      showToast({
        type: 'success',
        title: 'Payment Captured Successfully',
        message: `PayPal Capture ID: ${res.captureId || res.id}. Funds captured under Zero-Trust verification.`
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Capture Rejected by ZevRA',
        message: err.message || 'Capture failed.'
      });
    } finally {
      setIsCapturing(false);
    }
  };

  // If this is a Cancellation return from PayPal
  if (isCancel) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-8 text-center shadow-xl backdrop-blur-md">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Checkout Cancelled</h2>
          <p className="text-slate-300 text-sm max-w-md mx-auto mb-6">
            The PayPal Sandbox payment session was cancelled by the buyer before completion. No funds were debited or captured.
          </p>

          {orderId && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 inline-block mb-6 font-mono text-xs text-slate-400">
              Cancelled Order Token: <span className="text-slate-200 font-bold">{orderId}</span>
            </div>
          )}

          <div>
            <button
              onClick={onNavigateHome}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

      {/* Return Flow Header */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
              PayPal Sandbox Return Hook
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">Pre-Capture Intent Verification</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Returned order authentication and parameter reconciliation.
          </p>
        </div>

        <button
          onClick={onNavigateHome}
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors flex items-center gap-1.5"
        >
          <span>Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Return Metadata Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs flex justify-between items-center">
          <span className="text-slate-400">PayPal Order Token:</span>
          <span className="font-bold text-slate-200">{orderId || 'Missing Token'}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs flex justify-between items-center">
          <span className="text-slate-400">Payer ID:</span>
          <span className="text-slate-300 font-semibold">{payerId || 'Sandbox Payer'}</span>
        </div>
      </div>

      {/* Error state if verification failed */}
      {error && (
        <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-rose-300">Verification Request Failed</h4>
              <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">{error}</p>

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => runVerification(orderId)}
                  disabled={isLoading}
                  className="px-4 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-900 text-rose-200 text-xs font-semibold border border-rose-700/50 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  Retry Verification
                </button>
                <button
                  onClick={onNavigateHome}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="p-12 text-center bg-slate-900/70 rounded-2xl border border-slate-800">
          <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-emerald-400" />
          <h3 className="font-bold text-white text-base">Evaluating Order against Registered Intent...</h3>
          <p className="text-xs text-slate-400 mt-1">
            Running ZevRA algorithmic checks: Amount tolerance, Currency conformity, Payee reconciliation.
          </p>
        </div>
      )}

      {/* Verification Card Results */}
      {verification && (
        <VerificationCard
          orderId={orderId}
          verification={verification}
          intent={intent}
          onCapture={handleCapture}
          isCapturing={isCapturing}
          captureResult={captureResult}
          onReverify={() => runVerification(orderId)}
          isReverifying={isLoading}
        />
      )}

    </div>
  );
}
