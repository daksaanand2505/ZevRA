import React, { useState } from 'react';
import {
  Search,
  Eye,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Lock,
  Copy,
  Check,
  RefreshCw,
  CreditCard,
  Info
} from './Icons';
import { VerificationCard } from './VerificationCard';
import * as api from '../api/paymentApi';
import { updateTransaction, clearTransactionHistory } from '../services/storageService';

export function TransactionHistory({
  transactions,
  onRefresh,
  showToast,
  _onSelectTransaction
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTx, setSelectedTx] = useState(null);
  const [isVerifyingSelected, setIsVerifyingSelected] = useState(false);
  const [isCapturingSelected, setIsCapturingSelected] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Only show real transactions in this audit history
  const realTransactions = transactions.filter(t => !t.isDemo && !t.isSimulated);

  const filteredTransactions = realTransactions.filter((tx) => {
    // Search filter
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      tx.orderId?.toLowerCase().includes(term) ||
      tx.intentId?.toLowerCase().includes(term) ||
      tx.recipient?.toLowerCase().includes(term) ||
      tx.purpose?.toLowerCase().includes(term);

    // Status filter
    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'SAFE') return matchesSearch && tx.verification?.decision === 'SAFE';
    if (statusFilter === 'WARNING') return matchesSearch && tx.verification?.decision === 'WARNING';
    if (statusFilter === 'BLOCKED') return matchesSearch && tx.verification?.decision === 'BLOCKED';
    if (statusFilter === 'CAPTURED') return matchesSearch && (tx.status === 'CAPTURED' || !!tx.capture);
    if (statusFilter === 'PENDING') return matchesSearch && tx.status !== 'CAPTURED' && !tx.capture;

    return matchesSearch;
  });

  const handleVerifyInModal = async (tx) => {
    if (!tx.orderId) {
      showToast({ type: 'warning', title: 'Order ID Missing', message: 'This transaction does not have a linked PayPal Order ID.' });
      return;
    }
    try {
      setIsVerifyingSelected(true);
      const res = await api.verifyOrder(tx.orderId);
      const updated = {
        ...selectedTx,
        verification: res.verification,
        status: res.verification.decision === 'SAFE' ? 'VERIFIED' : res.verification.decision
      };
      setSelectedTx(updated);
      updateTransaction(tx.orderId, updated);
      onRefresh();
      showToast({
        type: res.verification.decision === 'SAFE' ? 'success' : 'warning',
        title: `Verification Result: ${res.verification.decision}`,
        message: `Risk score evaluated at ${res.verification.riskScore}%.`
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Verification Failed',
        message: err.message || 'Could not verify order.'
      });
    } finally {
      setIsVerifyingSelected(false);
    }
  };

  const handleCaptureInModal = async (tx) => {
    if (!tx.orderId) return;
    try {
      setIsCapturingSelected(true);
      const res = await api.captureOrder(tx.orderId);
      const updated = {
        ...selectedTx,
        status: 'CAPTURED',
        capture: res
      };
      setSelectedTx(updated);
      updateTransaction(tx.orderId, updated);
      onRefresh();
      showToast({
        type: 'success',
        title: 'Payment Captured',
        message: `Capture ID: ${res.captureId || res.id}`
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Capture Rejected',
        message: err.message || 'Capture prevented by policy.'
      });
    } finally {
      setIsCapturingSelected(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(realTransactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `zevra_transactions_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast({ type: 'info', title: 'Exported', message: 'Transaction audit log exported to JSON.' });
  };

  const handleClearData = () => {
    if (window.confirm('Clear all stored PayPal transactions from your local ledger?')) {
      clearTransactionHistory();
      onRefresh();
      showToast({ type: 'info', title: 'Ledger Cleared', message: 'Transaction history reset.' });
    }
  };

  const getDecisionBadge = (decision) => {
    switch (decision) {
      case 'SAFE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
            <CheckCircle className="w-3 h-3" /> SAFE
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
            <AlertTriangle className="w-3 h-3" /> WARNING
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[11px] font-bold">
            <XCircle className="w-3 h-3" /> BLOCKED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-medium">
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header & Controls */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              Transaction Ledger & Audit History
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live ledger of registered payment intents, verified gateway orders, and capture decisions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              disabled={realTransactions.length === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            >
              Export JSON
            </button>
            <button
              onClick={handleClearData}
              disabled={realTransactions.length === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              title="Clear all transactions from local storage"
            >
              Clear Ledger
            </button>
          </div>
        </div>

        {/* Search Bar & Filter Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Order ID, Intent ID, Recipient, or Purpose..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2 text-white text-xs placeholder-slate-600 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'SAFE', label: 'SAFE' },
              { id: 'WARNING', label: 'WARNING' },
              { id: 'BLOCKED', label: 'BLOCKED' },
              { id: 'CAPTURED', label: 'Captured' },
              { id: 'PENDING', label: 'Pending' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === f.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Order / Intent ID</th>
                <th className="py-3 px-4">Recipient & Purpose</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">ZevRA Decision</th>
                <th className="py-3 px-4">Capture State</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-2">
                      <Info className="w-6 h-6 mx-auto text-slate-600" />
                      <p className="text-sm font-medium text-slate-400">No real PayPal transactions found in ledger.</p>
                      <p className="text-xs text-slate-500">
                        Fabricated demo records have been removed. Use <strong className="text-emerald-400">Create Payment</strong> to initiate a PayPal Sandbox payment, or open <strong className="text-purple-400">Verification Center</strong> to test simulated scenarios.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const decision = tx.verification?.decision;
                  return (
                    <tr key={tx.id || tx.orderId || tx.intentId} className="hover:bg-slate-800/40 transition-colors">
                      {/* Date */}
                      <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A'}
                        <div className="text-[10px] text-slate-500">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </td>

                      {/* IDs */}
                      <td className="py-3 px-4 font-mono">
                        {tx.orderId ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-200 truncate max-w-[120px]" title={tx.orderId}>
                              {tx.orderId}
                            </span>
                            <button
                              onClick={() => handleCopy(tx.orderId, tx.orderId)}
                              className="text-slate-500 hover:text-slate-300"
                              title="Copy Order ID"
                            >
                              {copiedId === tx.orderId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">No PayPal Order</span>
                        )}
                        <div className="text-[10px] text-slate-500 truncate max-w-[120px]" title={tx.intentId}>
                          {tx.intentId ? `Intent: ${tx.intentId.substring(0, 8)}...` : ''}
                        </div>
                      </td>

                      {/* Recipient & Purpose */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="font-medium text-slate-200 truncate" title={tx.recipient}>
                          {tx.recipient || 'N/A'}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5" title={tx.purpose}>
                          {tx.purpose || 'N/A'}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-100 whitespace-nowrap">
                        {tx.amount} <span className="text-emerald-400 text-[10px]">{tx.currency}</span>
                      </td>

                      {/* ZevRA Decision */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getDecisionBadge(decision)}
                      </td>

                      {/* Capture State */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {tx.capture || tx.status === 'CAPTURED' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                            <CheckCircle className="w-3 h-3" /> Captured
                          </span>
                        ) : decision === 'SAFE' ? (
                          <span className="text-blue-400 font-medium text-[11px]">
                            Ready for Capture
                          </span>
                        ) : decision === 'BLOCKED' ? (
                          <span className="text-rose-400 font-medium text-[11px]">
                            Protected / Blocked
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Pending Approval</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700 inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Slide-over: Inspect & Verify Transaction */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">

            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  Transaction Inspection & Security Evaluation
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Order ID: <span className="font-mono text-slate-200">{selectedTx.orderId || 'Unlinked'}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {selectedTx.verification ? (
              <VerificationCard
                orderId={selectedTx.orderId}
                verification={selectedTx.verification}
                intent={selectedTx}
                onCapture={() => handleCaptureInModal(selectedTx)}
                isCapturing={isCapturingSelected}
                captureResult={selectedTx.capture}
                onReverify={() => handleVerifyInModal(selectedTx)}
                isReverifying={isVerifyingSelected}
                isDemo={Boolean(selectedTx.isDemo)}
              />
            ) : (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
                <p className="text-sm text-slate-300">
                  This transaction has not undergone pre-capture intent verification yet.
                </p>
                {selectedTx.orderId && (
                  <button
                    onClick={() => handleVerifyInModal(selectedTx)}
                    disabled={isVerifyingSelected}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 mx-auto"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingSelected ? 'animate-spin' : ''}`} />
                    Run Intent Verification
                  </button>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
