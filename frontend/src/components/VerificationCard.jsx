import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Lock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Copy,
  Check,
  Eye,
  Info
} from './Icons';

export function VerificationCard({
  orderId,
  verification,
  intent,
  onCapture,
  isCapturing,
  captureResult,
  onReverify,
  isReverifying,
  isDemo: propIsDemo
}) {
  const [copiedField, setCopiedField] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);

  // Determine if this is a demo/simulated scenario
  const isDemo = Boolean(
    propIsDemo ||
    intent?.isDemo ||
    intent?.isSimulated ||
    orderId?.startsWith('SIM_') ||
    orderId?.startsWith('SIMULATED_')
  );

  if (!verification) {
    return (
      <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400">
        <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-slate-500" />
        <p className="font-medium text-slate-300">Awaiting verification evaluation...</p>
        <p className="text-xs text-slate-500 mt-1">Order parameters will be compared with registered intent.</p>
      </div>
    );
  }

  const { decision, riskScore = 0, mismatches = [], warnings = [], verified, timestamp } = verification;

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getDecisionTheme = () => {
    switch (decision) {
      case 'SAFE':
        return {
          bannerBg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200',
          badgeBg: 'bg-emerald-500 text-slate-950',
          textColor: 'text-emerald-400',
          icon: ShieldCheck,
          title: isDemo ? 'SIMULATED: VERIFIED SAFE - CAPTURE PERMITTED' : 'VERIFIED SAFE - CAPTURE PERMITTED',
          subtitle: isDemo
            ? 'Simulated scenario: all parameters match. Demonstrates SAFE verification state.'
            : 'All payment parameters match registered intent. No tampering or risk detected.'
        };
      case 'WARNING':
        return {
          bannerBg: 'bg-amber-950/60 border-amber-500/40 text-amber-200',
          badgeBg: 'bg-amber-400 text-slate-950',
          textColor: 'text-amber-400',
          icon: ShieldAlert,
          title: isDemo ? 'SIMULATED: WARNING - VERIFICATION INCOMPLETE' : 'WARNING - VERIFICATION INCOMPLETE',
          subtitle: isDemo
            ? 'Simulated scenario: demonstrates unverified payee metadata warning and capture hold.'
            : 'One or more secondary parameters could not be independently verified. Capture held.'
        };
      case 'BLOCKED':
      default:
        return {
          bannerBg: 'bg-rose-950/60 border-rose-500/40 text-rose-200',
          badgeBg: 'bg-rose-500 text-white',
          textColor: 'text-rose-400',
          icon: ShieldX,
          title: isDemo ? 'SIMULATED: CAPTURE BLOCKED - MISMATCH DETECTED' : 'CAPTURE BLOCKED - INTENT MISMATCH DETECTED',
          subtitle: isDemo
            ? 'Simulated scenario: demonstrates critical parameter tampering detection and capture refusal.'
            : 'Critical discrepancies found between registered intent and gateway order. Capture strictly forbidden.'
        };
    }
  };

  const theme = getDecisionTheme();
  const DecisionIcon = theme.icon;

  const hasPurposeWarning = warnings.some(w => w.toLowerCase().includes('purpose'));

  return (
    <div className={`bg-slate-900/80 rounded-2xl border ${isDemo ? 'border-purple-500/50 shadow-purple-500/10' : 'border-slate-800'} shadow-xl overflow-hidden backdrop-blur-md`}>

      {/* Prominent Demo / Simulated Banner */}
      {isDemo && (
        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-950 px-6 py-2.5 border-b border-purple-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-purple-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
              DEMO / SIMULATED
            </span>
            <span className="text-xs font-semibold text-purple-200">
              Evaluation Scenario — Not an Actual PayPal Transaction
            </span>
          </div>
          <span className="text-[11px] text-purple-300/80 font-mono">
            Real PayPal API capture calls are blocked
          </span>
        </div>
      )}

      {/* Top Decision Header */}
      <div className={`p-6 border-b ${theme.bannerBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl bg-slate-950/50 border border-current shadow-lg shrink-0`}>
              <DecisionIcon className={`w-8 h-8 ${theme.textColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider uppercase ${theme.badgeBg}`}>
                  {decision}
                </span>
                {isDemo && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    SIMULATION
                  </span>
                )}
                <span className="text-xs text-slate-400 font-mono">
                  Score: {riskScore}/100 Risk
                </span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">{theme.title}</h3>
              <p className="text-xs text-slate-300/90 mt-0.5">{theme.subtitle}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            {onReverify && !isDemo && (
              <button
                onClick={onReverify}
                disabled={isReverifying}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
                title="Re-run verification against live PayPal order"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReverifying ? 'animate-spin' : ''}`} />
                Re-verify
              </button>
            )}
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              {showRawJson ? 'Hide Raw' : 'Raw JSON'}
            </button>
          </div>
        </div>

        {/* Risk Score Meter */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-300">ZevRA Risk Assessment Index</span>
            <span className="font-mono font-bold text-white">{riskScore}% Risk</span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                riskScore === 0
                  ? 'bg-emerald-400'
                  : riskScore <= 30
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.max(riskScore, 4)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>0% (Ideal / SAFE)</span>
            <span>50% (High Risk)</span>
            <span>100% (Critical Attack)</span>
          </div>
        </div>
      </div>

      {/* Main Body: Parameter Comparison & Mismatches */}
      <div className="p-6 space-y-6">

        {/* Order & Evaluation Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold flex items-center justify-between">
              <span>PayPal Order ID</span>
              {isDemo && <span className="text-[10px] text-purple-400 font-bold">[SIMULATED]</span>}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono text-xs font-bold text-slate-200 truncate pr-2">{orderId}</span>
              <button
                onClick={() => handleCopy(orderId, 'orderId')}
                className="text-slate-400 hover:text-slate-200 p-1"
                title="Copy Order ID"
              >
                {copiedField === 'orderId' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Evaluation Timestamp</div>
            <div className="font-mono text-xs text-slate-300 mt-1">
              {timestamp ? new Date(timestamp).toLocaleString() : 'N/A'}
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Capture Status</div>
            <div className="flex items-center gap-1.5 mt-1 font-semibold text-xs">
              {captureResult ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {isDemo ? 'Simulated Capture' : 'Captured & Settled'}
                </span>
              ) : decision === 'SAFE' ? (
                <span className="text-emerald-300 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  {isDemo ? 'Simulated: Capture Permitted' : 'Capture Authorized'}
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Capture Prohibited
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Verification Checks Matrix */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <span>Verified Parameter Integrity</span>
          </h4>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Parameter</th>
                  <th className="py-2.5 px-4">Expected (Registered Intent)</th>
                  <th className="py-2.5 px-4">Gateway Value (PayPal Order)</th>
                  <th className="py-2.5 px-4 text-right">Integrity Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">

                {/* Amount Check */}
                <tr className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-300">Amount</td>
                  <td className="py-3 px-4 font-mono text-slate-200">
                    {intent?.amount ? `${intent.amount} ${intent.currency || ''}` : 'Registered Intent'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {mismatches.find(m => m.field === 'amount')
                      ? mismatches.find(m => m.field === 'amount').actual
                      : (intent?.amount || 'Verified match')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {mismatches.some(m => m.field === 'amount') ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[11px] font-bold">
                        <XCircle className="w-3 h-3" /> Mismatch
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                        <CheckCircle className="w-3 h-3" /> Matched
                      </span>
                    )}
                  </td>
                </tr>

                {/* Currency Check */}
                <tr className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-300">Currency</td>
                  <td className="py-3 px-4 font-mono text-slate-200">
                    {intent?.currency || 'USD'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {mismatches.find(m => m.field === 'currency')
                      ? mismatches.find(m => m.field === 'currency').actual
                      : (intent?.currency || 'USD')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {mismatches.some(m => m.field === 'currency') ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[11px] font-bold">
                        <XCircle className="w-3 h-3" /> Mismatch
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                        <CheckCircle className="w-3 h-3" /> Matched
                      </span>
                    )}
                  </td>
                </tr>

                {/* Recipient Check */}
                <tr className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-300">Recipient / Payee</td>
                  <td className="py-3 px-4 text-slate-200 font-mono text-[11px]">
                    {intent?.recipient || 'Intended Recipient'}
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                    {mismatches.find(m => m.field === 'recipient')
                      ? mismatches.find(m => m.field === 'recipient').actual
                      : warnings.some(w => w.includes('Recipient'))
                      ? '(Unverified Gateway Payee)'
                      : (intent?.recipient || 'Matched')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {mismatches.some(m => m.field === 'recipient') ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[11px] font-bold">
                        <XCircle className="w-3 h-3" /> Diverted
                      </span>
                    ) : warnings.some(w => w.includes('Recipient')) ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                        <AlertTriangle className="w-3 h-3" /> Unverified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </td>
                </tr>

                {/* Purpose Check - ACCURATELY DOCUMENTED AS INTERNAL PRESENCE ONLY */}
                <tr className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-300">
                    Payment Purpose
                    <span className="block text-[10px] text-slate-500 font-normal">Internal Record</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 truncate max-w-[200px]" title={intent?.purpose}>
                    {intent?.purpose || 'Registered in Intent'}
                  </td>
                  <td className="py-3 px-4 text-slate-400 italic font-mono text-[11px]">
                    Not supported in PayPal schema
                  </td>
                  <td className="py-3 px-4 text-right">
                    {hasPurposeWarning ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-medium">
                        <AlertTriangle className="w-3 h-3" /> Missing in Intent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-medium" title="Backend checks presence in intent record only">
                        Intent Presence Checked
                      </span>
                    )}
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

          {/* Accurate disclaimer regarding Payment Purpose */}
          <div className="mt-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">Verification Boundary: </span>
              Amount and Currency are strictly compared against PayPal's gateway values. Recipient is compared against the gateway payee when available.
              Payment Purpose is an internal intent validity requirement (3–200 characters) and is <strong className="text-slate-300">not</strong> independently verified against PayPal metadata.
            </div>
          </div>
        </div>

        {/* Mismatches Alert Box */}
        {mismatches.length > 0 && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200">
            <div className="flex items-center gap-2 font-bold text-rose-300 text-sm mb-2">
              <XCircle className="w-4 h-4 text-rose-400" />
              Critical Parameter Mismatches Detected ({mismatches.length})
            </div>
            <p className="text-xs text-rose-300/80 mb-3">
              The following values returned by PayPal do not match the registered payment intent. ZevRA has quarantined this order to prevent unauthorized fund transfer.
            </p>
            <div className="space-y-2">
              {mismatches.map((m, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-rose-900/30 border border-rose-700/40 text-xs font-mono">
                  <span className="text-rose-400 font-bold uppercase">{m.field}: </span>
                  <span className="text-slate-300">Expected </span>
                  <span className="text-emerald-400 font-semibold bg-emerald-950/80 px-1 py-0.5 rounded">{m.expected}</span>
                  <span className="text-slate-300"> vs Gateway Actual </span>
                  <span className="text-rose-300 font-semibold bg-rose-950/80 px-1 py-0.5 rounded">{m.actual}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings Alert Box */}
        {warnings.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-sm mb-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Security Warnings ({warnings.length})
            </div>
            <ul className="list-disc list-inside text-xs space-y-1 text-amber-300/90 font-mono">
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
            <p className="text-[11px] text-amber-400/70 mt-2">
              Under ZevRA Zero-Trust policy, unverified warnings prevent capture until explicitly authenticated.
            </p>
          </div>
        )}

        {/* Capture Execution Action */}
        <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              Zero-Trust Capture Protection
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {isDemo
                ? 'Demo Mode: Simulates capture locally without issuing any real PayPal network request.'
                : decision === 'SAFE' && verified
                ? 'Pre-capture conditions are satisfied. You may safely release and capture payment.'
                : 'Backend enforces capture prevention unless intent verification is SAFE and verified.'}
            </p>
          </div>

          <div>
            {captureResult ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <CheckCircle className="w-4 h-4" />
                {isDemo ? 'Capture Simulated (Demo)' : `Captured (ID: ${captureResult.captureId || captureResult.id})`}
              </div>
            ) : decision === 'SAFE' && verified ? (
              <button
                onClick={onCapture}
                disabled={isCapturing}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isCapturing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {isDemo ? 'Simulating Capture...' : 'Capturing with PayPal...'}
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    {isDemo ? 'Simulate Capture (Demo Only)' : 'Capture Payment Now'}
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
                <XCircle className="w-4 h-4 text-rose-400" />
                Capture Blocked by Policy
              </div>
            )}
          </div>
        </div>

        {/* Capture Result Receipt */}
        {captureResult && (
          <div className={`p-4 rounded-xl ${isDemo ? 'bg-purple-950/40 border border-purple-500/40 text-purple-200' : 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`font-bold text-sm ${isDemo ? 'text-purple-300' : 'text-emerald-300'} flex items-center gap-1.5`}>
                <CheckCircle className={`w-4 h-4 ${isDemo ? 'text-purple-400' : 'text-emerald-400'}`} />
                {isDemo ? 'Simulated Capture Receipt (Demo Only)' : 'Capture Settled Successfully'}
              </span>
              <span className={`font-mono text-xs ${isDemo ? 'text-purple-300 bg-purple-900/60' : 'text-emerald-400 bg-emerald-900/60'} px-2 py-0.5 rounded`}>
                Status: {captureResult.captureStatus || 'COMPLETED'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono mt-3">
              <div className={`p-2 ${isDemo ? 'bg-purple-900/30 border-purple-700/30' : 'bg-emerald-900/30 border-emerald-700/30'} rounded border`}>
                <div className={`text-[10px] ${isDemo ? 'text-purple-400' : 'text-emerald-400'} uppercase`}>Capture ID</div>
                <div className="text-white font-bold truncate">{captureResult.captureId || 'N/A'}</div>
              </div>
              <div className={`p-2 ${isDemo ? 'bg-purple-900/30 border-purple-700/30' : 'bg-emerald-900/30 border-emerald-700/30'} rounded border`}>
                <div className={`text-[10px] ${isDemo ? 'text-purple-400' : 'text-emerald-400'} uppercase`}>Settled Amount</div>
                <div className="text-white font-bold">
                  {captureResult.amount?.value || intent?.amount} {captureResult.amount?.currency_code || intent?.currency}
                </div>
              </div>
              <div className={`p-2 ${isDemo ? 'bg-purple-900/30 border-purple-700/30' : 'bg-emerald-900/30 border-emerald-700/30'} rounded border`}>
                <div className={`text-[10px] ${isDemo ? 'text-purple-400' : 'text-emerald-400'} uppercase`}>ZevRA Decision</div>
                <div className={`${isDemo ? 'text-purple-300' : 'text-emerald-300'} font-bold`}>{captureResult.zevraDecision || 'SAFE'}</div>
              </div>
            </div>
            {isDemo && (
              <p className="text-[11px] text-purple-300/80 mt-2 font-mono">
                * Note: This simulated capture was handled purely in local client UI. No request was sent to PayPal Sandbox.
              </p>
            )}
          </div>
        )}

        {/* Raw JSON Debug Viewer */}
        {showRawJson && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs">
            <div className="flex items-center justify-between mb-2 text-slate-400">
              <span className="font-semibold text-xs">
                Raw Verification Payload {isDemo ? '(Simulated Scenario)' : ''}
              </span>
              <button
                onClick={() => handleCopy(JSON.stringify(verification, null, 2), 'rawJson')}
                className="hover:text-white flex items-center gap-1 text-[11px]"
              >
                {copiedField === 'rawJson' ? 'Copied!' : 'Copy JSON'}
              </button>
            </div>
            <pre className="overflow-x-auto text-[11px] p-3 bg-slate-900/80 rounded-lg text-emerald-300">
              {JSON.stringify(verification, null, 2)}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
}
