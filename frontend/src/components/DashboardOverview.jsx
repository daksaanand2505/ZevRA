import React, { useState } from 'react';
import {
  ShieldCheck,
  CreditCard,
  DollarSign,
  Activity,
  ArrowRight,
  Search,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info
} from './Icons';

export function DashboardOverview({
  transactions,
  onNavigateTab,
  onInspectOrder
}) {
  const [lookupOrderId, setLookupOrderId] = useState('');

  // Strictly consider only real transactions (excluding any demo scenarios)
  const realTransactions = transactions.filter(t => !t.isDemo && !t.isSimulated);
  const totalTransactions = realTransactions.length;

  const totalVolumeUSD = realTransactions
    .filter(t => t.currency === 'USD')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const safeCount = realTransactions.filter(t => t.verification?.decision === 'SAFE').length;
  const warningCount = realTransactions.filter(t => t.verification?.decision === 'WARNING').length;
  const blockedCount = realTransactions.filter(t => t.verification?.decision === 'BLOCKED').length;
  const capturedCount = realTransactions.filter(t => t.status === 'CAPTURED' || !!t.capture).length;

  const verifiedRate = totalTransactions > 0
    ? `${Math.round((safeCount / totalTransactions) * 100)}%`
    : 'N/A';

  const blockedVolumeUSD = realTransactions
    .filter(t => t.verification?.decision === 'BLOCKED' && t.currency === 'USD')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const handleLookupSubmit = (e) => {
    e.preventDefault();
    if (!lookupOrderId.trim()) return;
    onInspectOrder(lookupOrderId.trim());
  };

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Top Banner / Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              ZevRA Zero-Trust Payment Defense
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Pre-Capture Intent Verification & Gateway Protection
            </h1>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Eliminate man-in-the-middle payment diversion, silent amount tampering, and currency switching by cryptographically validating every PayPal Sandbox order before capture authorization.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <button
              onClick={() => onNavigateTab('create')}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Create Test Payment
            </button>
            <button
              onClick={() => onNavigateTab('verify')}
              className="px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verification Lab
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1: Total Volume */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Ledger Volume</span>
            <div className="p-2 rounded-xl bg-slate-800/80 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ${totalVolumeUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="font-semibold text-slate-200">{totalTransactions}</span> real intents recorded
          </div>
        </div>

        {/* Card 2: Verification SAFE Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Verification Pass Rate</span>
            <div className="p-2 rounded-xl bg-slate-800/80 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {verifiedRate}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="font-semibold text-emerald-300">{safeCount}</span> SAFE evaluated orders
          </div>
        </div>

        {/* Card 3: Tampering Prevented */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tampering Blocked</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {blockedCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            <span className="font-mono text-rose-300 font-semibold">${blockedVolumeUSD.toFixed(2)}</span> funds quarantined
          </div>
        </div>

        {/* Card 4: Settled / Captured */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Captures Settled</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {capturedCount}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Zero unauthorized capture incidents
          </div>
        </div>

      </div>

      {/* Two Column Section: Quick Order Lookup & Visual Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Verification Distribution Card */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            ZevRA Decision Distribution
          </h3>

          <div className="space-y-4">
            {/* SAFE Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> SAFE (Permitted)
                </span>
                <span className="font-mono text-white">{safeCount} ({totalTransactions > 0 ? Math.round((safeCount / totalTransactions) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${totalTransactions > 0 ? (safeCount / totalTransactions) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* WARNING Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span className="text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> WARNING (Held)
                </span>
                <span className="font-mono text-white">{warningCount} ({totalTransactions > 0 ? Math.round((warningCount / totalTransactions) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${totalTransactions > 0 ? (warningCount / totalTransactions) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* BLOCKED Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span className="text-rose-400 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" /> BLOCKED (Quarantined)
                </span>
                <span className="font-mono text-white">{blockedCount} ({totalTransactions > 0 ? Math.round((blockedCount / totalTransactions) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{ width: `${totalTransactions > 0 ? (blockedCount / totalTransactions) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <span className="font-bold text-slate-300">Strict Capture Policy: </span>
            ZevRA only authorizes PayPal capture when status is <strong className="text-emerald-400">SAFE</strong> with 0 mismatches. Any discrepancy locks capture on the backend.
          </div>
        </div>

        {/* Quick Order Lookup Form & Architecture Overview */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-emerald-400" />
              Quick Order Verification Lookup
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter any real PayPal Order ID to retrieve its state and verify against saved payment intents in real-time.
            </p>

            <form onSubmit={handleLookupSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={lookupOrderId}
                  onChange={(e) => setLookupOrderId(e.target.value)}
                  placeholder="e.g. 6FD867062J248354F"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-white font-mono text-xs placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all shrink-0 flex items-center gap-1.5"
              >
                <span>Verify Order</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Architecture Pipeline Mini-diagram */}
          <div className="pt-4 border-t border-slate-800">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-3">
              Zero-Trust Verification Pipeline
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-slate-300">1. Intent Log</div>
                <div className="text-[10px] text-slate-500 mt-0.5">POST /intent</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-slate-300">2. Sandbox Order</div>
                <div className="text-[10px] text-slate-500 mt-0.5">POST /create-order</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30">
                <div className="font-bold text-emerald-400">3. Verification</div>
                <div className="text-[10px] text-emerald-500 mt-0.5">POST /verify/:id</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-teal-500/30">
                <div className="font-bold text-teal-400">4. Protected Capture</div>
                <div className="text-[10px] text-teal-500 mt-0.5">POST /capture/:id</div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Recent Activity Table Preview */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Recent Transactions</h3>
            <p className="text-xs text-slate-400">Latest payment intents and evaluation status in local ledger</p>
          </div>
          <button
            onClick={() => onNavigateTab('history')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>View Full Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Order ID</th>
                <th className="py-2.5 px-4">Recipient</th>
                <th className="py-2.5 px-4">Amount</th>
                <th className="py-2.5 px-4">Decision</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {realTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-1.5">
                      <Info className="w-5 h-5 mx-auto text-slate-600" />
                      <p className="text-sm font-medium text-slate-400">No real PayPal Sandbox transactions yet</p>
                      <p className="text-xs text-slate-500">
                        Fabricated mock records have been removed. Register an intent in <strong className="text-emerald-400">Create Payment</strong> to test actual flow, or explore demo scenarios in <strong className="text-purple-400">Verification Lab</strong>.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                realTransactions.slice(0, 5).map((tx) => (
                  <tr key={tx.id || tx.orderId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">
                      {tx.orderId || 'Intent Only'}
                    </td>
                    <td className="py-3 px-4 text-slate-300 truncate max-w-[180px]">
                      {tx.recipient}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {tx.amount} <span className="text-slate-400 text-[10px]">{tx.currency}</span>
                    </td>
                    <td className="py-3 px-4">
                      {tx.verification?.decision === 'SAFE' ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle className="w-3 h-3" /> SAFE
                        </span>
                      ) : tx.verification?.decision === 'WARNING' ? (
                        <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                          <AlertTriangle className="w-3 h-3" /> WARNING
                        </span>
                      ) : tx.verification?.decision === 'BLOCKED' ? (
                        <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                          <XCircle className="w-3 h-3" /> BLOCKED
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">PENDING</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onInspectOrder(tx.orderId)}
                        className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
