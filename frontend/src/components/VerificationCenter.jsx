import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Info
} from './Icons';
import { VerificationCard } from './VerificationCard';
import * as api from '../api/paymentApi';
import { updateTransaction, findTransaction } from '../services/storageService';

export function VerificationCenter({
  transactions,
  selectedOrderId,
  onSelectOrder,
  showToast,
  onRefresh
}) {
  const [inputOrderId, setInputOrderId] = useState(selectedOrderId || '');
  const [currentVerification, setCurrentVerification] = useState(null);
  const [currentIntent, setCurrentIntent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureResult, setCaptureResult] = useState(null);
  const [isDemoScenario, setIsDemoScenario] = useState(false);

  const handleLoadOrder = useCallback(async (orderIdToLoad) => {
    if (!orderIdToLoad) return;

    // Check if this is a simulation order
    if (orderIdToLoad.startsWith('SIM_') || orderIdToLoad.startsWith('SIMULATED_')) {
      return;
    }

    setIsDemoScenario(false);
    const local = findTransaction(orderIdToLoad);
    if (local) {
      setCurrentIntent(local);
      if (local.verification) setCurrentVerification(local.verification);
      if (local.capture) setCaptureResult(local.capture);
    }

    try {
      setIsLoading(true);
      const res = await api.verifyOrder(orderIdToLoad);
      setCurrentVerification(res.verification);
      updateTransaction(orderIdToLoad, {
        verification: res.verification,
        status: res.verification.decision === 'SAFE' ? 'VERIFIED' : res.verification.decision
      });
      onRefresh();
    } catch (err) {
      if (!local?.verification) {
        showToast({
          type: 'warning',
          title: 'Verification Notice',
          message: err.message || 'Could not verify order with PayPal.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [onRefresh, showToast]);

  // Synchronize with external selectedOrderId
  useEffect(() => {
    if (selectedOrderId) {
      setInputOrderId(selectedOrderId);
      handleLoadOrder(selectedOrderId);
    }
  }, [selectedOrderId, handleLoadOrder]);

  const handleLookupSubmit = (e) => {
    e.preventDefault();
    if (!inputOrderId.trim()) return;
    setIsDemoScenario(false);
    onSelectOrder(inputOrderId.trim());
    handleLoadOrder(inputOrderId.trim());
  };

  const handleCapture = async () => {
    if (!inputOrderId) return;

    // CRITICAL SAFETY CHECK: Simulated / Demo transactions NEVER call real PayPal capture API!
    if (isDemoScenario || inputOrderId.startsWith('SIM_') || inputOrderId.startsWith('SIMULATED_') || currentIntent?.isDemo) {
      setIsCapturing(true);
      setTimeout(() => {
        setCaptureResult({
          captureId: `SIM_CAP_${Date.now().toString().slice(-6)}`,
          captureStatus: 'COMPLETED',
          amount: { value: currentIntent?.amount || '50.00', currency_code: currentIntent?.currency || 'USD' },
          zevraDecision: currentVerification?.decision || 'SAFE',
          isSimulated: true
        });
        setIsCapturing(false);
        showToast({
          type: 'info',
          title: 'Simulated Capture Complete',
          message: 'Local UI demonstration only. No PayPal Sandbox API request was dispatched.'
        });
      }, 500);
      return;
    }

    try {
      setIsCapturing(true);
      const res = await api.captureOrder(inputOrderId);
      setCaptureResult(res);
      updateTransaction(inputOrderId, {
        status: 'CAPTURED',
        capture: res
      });
      onRefresh();
      showToast({
        type: 'success',
        title: 'Payment Captured Successfully',
        message: `Capture ID: ${res.captureId || res.id}. ZevRA verified safe before capture.`
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Capture Blocked',
        message: err.message || 'Capture prevented by policy.'
      });
    } finally {
      setIsCapturing(false);
    }
  };

  // Test Simulation Presets - Visibly marked as DEMO
  const runSimulation = (scenarioType) => {
    let mockVerif;
    let mockIntent;
    const simOrderId = `SIMULATED_${scenarioType.toUpperCase()}_${Date.now().toString().slice(-6)}`;

    if (scenarioType === 'SAFE') {
      mockIntent = {
        amount: '50.00',
        currency: 'USD',
        recipient: 'merchant-verified@sandbox.paypal.com',
        purpose: 'Cloud Storage Tier Standard',
        isDemo: true,
        isSimulated: true
      };
      mockVerif = {
        decision: 'SAFE',
        riskScore: 0,
        mismatches: [],
        warnings: [],
        verified: true,
        timestamp: new Date().toISOString()
      };
    } else if (scenarioType === 'WARNING') {
      mockIntent = {
        amount: '120.00',
        currency: 'USD',
        recipient: 'unregistered-contractor@external.org',
        purpose: 'Architecture Security Audit Retainer',
        isDemo: true,
        isSimulated: true
      };
      mockVerif = {
        decision: 'WARNING',
        riskScore: 10,
        mismatches: [],
        warnings: ['Recipient could not be independently verified'],
        verified: false,
        timestamp: new Date().toISOString()
      };
    } else {
      mockIntent = {
        amount: '100.00',
        currency: 'USD',
        recipient: 'authorized-vendor@company.com',
        purpose: 'Database license subscription',
        isDemo: true,
        isSimulated: true
      };
      mockVerif = {
        decision: 'BLOCKED',
        riskScore: 80,
        mismatches: [
          { field: 'amount', expected: '100.00', actual: '180.00' },
          { field: 'recipient', expected: 'authorized-vendor@company.com', actual: 'intercepted-payee@unauthorized.io' }
        ],
        warnings: [],
        verified: false,
        timestamp: new Date().toISOString()
      };
    }

    setIsDemoScenario(true);
    setInputOrderId(simOrderId);
    setCurrentIntent(mockIntent);
    setCurrentVerification(mockVerif);
    setCaptureResult(null);

    showToast({
      type: 'info',
      title: `Demo: ${scenarioType} Scenario Loaded`,
      message: `Visual evaluation simulation. Real PayPal capture is blocked.`
    });
  };

  const realTransactions = transactions.filter(t => !t.isDemo && !t.isSimulated);

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Header */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ZevRA Pre-Capture Verification Center
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluate real PayPal Sandbox orders or inspect simulated evaluation scenarios.
            </p>
          </div>
          <div className="text-xs font-mono px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            Rule Engine: Zero-Tolerance Mismatch
          </div>
        </div>

        {/* Live Order Lookup */}
        <form onSubmit={handleLookupSubmit} className="flex gap-2 max-w-2xl mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={inputOrderId}
              onChange={(e) => setInputOrderId(e.target.value)}
              placeholder="Enter active PayPal Sandbox Order ID (e.g. 6FD867062J248354F)..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-white font-mono text-xs placeholder-slate-600 focus:outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all shrink-0 flex items-center gap-1.5"
          >
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Evaluate</span>
          </button>
        </form>

        {/* Visibly Labeled Simulation Scenarios */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold uppercase tracking-wider">
              DEMO / SIMULATION
            </span>
            <span className="text-xs font-medium text-slate-400">
              Select a scenario to evaluate decision outcomes (no real PayPal API calls executed):
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => runSimulation('SAFE')}
              className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition-colors flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Demo: SAFE Scenario
            </button>
            <button
              onClick={() => runSimulation('WARNING')}
              className="px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 text-xs font-semibold border border-amber-500/40 transition-colors flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Demo: WARNING Scenario
            </button>
            <button
              onClick={() => runSimulation('BLOCKED')}
              className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-500/40 transition-colors flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Demo: BLOCKED Scenario (Tampered)
            </button>
          </div>
        </div>
      </div>

      {/* Main Inspection View */}
      {currentVerification ? (
        <VerificationCard
          orderId={inputOrderId}
          verification={currentVerification}
          intent={currentIntent}
          onCapture={handleCapture}
          isCapturing={isCapturing}
          captureResult={captureResult}
          onReverify={() => handleLoadOrder(inputOrderId)}
          isReverifying={isLoading}
          isDemo={isDemoScenario}
        />
      ) : (
        <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h3 className="font-bold text-white text-base">Select or Enter an Order to Inspect</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Input an active PayPal Sandbox Order ID above, or select one of the Demo Scenarios to inspect ZevRA's pre-capture verification engine.
          </p>
        </div>
      )}

      {/* Quick Select from Actual Local Ledger */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-md">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
          Actual PayPal Transactions from Local Ledger
        </h3>

        {realTransactions.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-500">
            <Info className="w-5 h-5 mx-auto mb-2 text-slate-600" />
            No actual PayPal Sandbox transactions recorded in the local ledger yet.
            <div className="mt-1 text-slate-400">
              Use <strong className="text-emerald-400">Create Payment</strong> to register an intent and generate a real PayPal Sandbox order.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {realTransactions.slice(0, 6).map((tx) => (
              <button
                key={tx.id || tx.orderId}
                onClick={() => {
                  setInputOrderId(tx.orderId || '');
                  setIsDemoScenario(false);
                  handleLoadOrder(tx.orderId);
                }}
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors flex items-center justify-between"
              >
                <div className="truncate pr-2">
                  <div className="font-mono text-xs font-bold text-slate-200 truncate">
                    {tx.orderId || 'Intent Registered'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {tx.amount} {tx.currency} • {tx.recipient}
                  </div>
                </div>
                <div className="shrink-0 text-[10px] font-bold">
                  {tx.verification?.decision === 'SAFE' && <span className="text-emerald-400">SAFE</span>}
                  {tx.verification?.decision === 'WARNING' && <span className="text-amber-400">WARN</span>}
                  {tx.verification?.decision === 'BLOCKED' && <span className="text-rose-400">BLOCK</span>}
                  {!tx.verification?.decision && <span className="text-slate-500">PENDING</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
