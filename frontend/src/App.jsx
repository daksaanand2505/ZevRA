import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { CreatePayment } from './components/CreatePayment';
import { VerificationCenter } from './components/VerificationCenter';
import { TransactionHistory } from './components/TransactionHistory';
import { PayPalReturnFlow } from './components/PayPalReturnFlow';
import { Toast } from './components/Toast';
import { Shield } from './components/Icons';
import * as api from './api/paymentApi';
import { getStoredTransactions } from './services/storageService';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'connected' | 'offline' | 'checking'
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [toast, setToast] = useState(null);

  // Return flow state if PayPal redirected back to frontend
  const [returnFlowState, setReturnFlowState] = useState(null); // { orderId, payerId, isCancel }
  const [selectedOrderIdForVerification, setSelectedOrderIdForVerification] = useState(null);

  const showToast = useCallback(({ type = 'info', title, message }) => {
    setToast({ type, title, message });
  }, []);

  const loadTransactions = useCallback(() => {
    const list = getStoredTransactions();
    setTransactions(list);
  }, []);

  const checkHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    setBackendStatus('checking');
    try {
      const res = await api.checkBackendHealth();
      if (res.status === 'ok') {
        setBackendStatus('connected');
      } else {
        setBackendStatus('offline');
      }
    } catch (err) {
      console.warn('Backend health check error:', err);
      setBackendStatus('offline');
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  // Parse URL on initial load for PayPal Return / Cancel hooks
  useEffect(() => {
    loadTransactions();
    checkHealth();

    const searchParams = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;

    const token = searchParams.get('token');
    const payerId = searchParams.get('PayerID');

    if (pathname.includes('/payment/return') || (token && payerId)) {
      setReturnFlowState({
        orderId: token,
        payerId: payerId || 'MOCK_PAYER',
        isCancel: false
      });
      setActiveTab('return_flow');
    } else if (pathname.includes('/payment/cancel') || (token && pathname.includes('cancel'))) {
      setReturnFlowState({
        orderId: token,
        payerId: null,
        isCancel: true
      });
      setActiveTab('return_flow');
    }
  }, [loadTransactions, checkHealth]);

  const handleNavigateToReturn = (orderId, payerId = 'SANDBOX_PAYER') => {
    setReturnFlowState({
      orderId,
      payerId,
      isCancel: false
    });
    setActiveTab('return_flow');
  };

  const handleInspectOrder = (orderId) => {
    setSelectedOrderIdForVerification(orderId);
    setActiveTab('verify');
  };

  const handleClearReturnFlow = () => {
    setReturnFlowState(null);
    window.history.replaceState({}, document.title, '/');
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab === 'return_flow' ? 'dashboard' : activeTab}
        setActiveTab={(tab) => {
          if (returnFlowState) {
            setReturnFlowState(null);
            window.history.replaceState({}, document.title, '/');
          }
          setActiveTab(tab);
        }}
        backendStatus={backendStatus}
        onRefreshHealth={checkHealth}
        isCheckingHealth={isCheckingHealth}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Offline Warning Banner if backend is not detected on :5000 */}
        {backendStatus === 'offline' && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
              <div>
                <span className="font-bold text-sm text-white">Backend Offline (http://localhost:5000)</span>
                <p className="text-xs text-rose-300/80 mt-0.5">
                  Start your Node.js backend server with <code className="bg-rose-900/60 px-1.5 py-0.5 rounded text-white font-mono">npm run dev</code> to enable live API communication.
                </p>
              </div>
            </div>
            <button
              onClick={checkHealth}
              disabled={isCheckingHealth}
              className="px-3 py-1.5 rounded-lg bg-rose-900/80 hover:bg-rose-900 text-white text-xs font-semibold border border-rose-700/60 transition-colors whitespace-nowrap"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'return_flow' && returnFlowState && (
          <PayPalReturnFlow
            orderId={returnFlowState.orderId}
            payerId={returnFlowState.payerId}
            isCancel={returnFlowState.isCancel}
            onNavigateHome={handleClearReturnFlow}
            showToast={showToast}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardOverview
            transactions={transactions}
            onNavigateTab={setActiveTab}
            onInspectOrder={handleInspectOrder}
            backendStatus={backendStatus}
          />
        )}

        {activeTab === 'create' && (
          <CreatePayment
            onNavigateToReturn={handleNavigateToReturn}
            showToast={showToast}
          />
        )}

        {activeTab === 'verify' && (
          <VerificationCenter
            transactions={transactions}
            selectedOrderId={selectedOrderIdForVerification}
            onSelectOrder={setSelectedOrderIdForVerification}
            showToast={showToast}
            onRefresh={loadTransactions}
          />
        )}

        {activeTab === 'history' && (
          <TransactionHistory
            transactions={transactions}
            onRefresh={loadTransactions}
            showToast={showToast}
            onSelectTransaction={(tx) => handleInspectOrder(tx.orderId)}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-900/80 border-t border-slate-800/80 py-6 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300 font-bold">ZevRA Payment Defense</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Zero-Trust Pre-Capture Authorization</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              PayPal Sandbox Mode
            </span>
            <span className="text-slate-500">API: http://localhost:5000</span>
          </div>
        </div>
      </footer>

      {/* Toast Notification Container */}
      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}
