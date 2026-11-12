import React from 'react';
import { Shield, RefreshCw, Activity, Lock, CreditCard } from './Icons';

export function Navbar({ activeTab, setActiveTab, backendStatus, onRefreshHealth, isCheckingHealth }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'create', label: 'Create Payment', icon: CreditCard },
    { id: 'verify', label: 'Verification Center', icon: Shield },
    { id: 'history', label: 'Transaction History', icon: Lock }
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Brand & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black">
              <Shield className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white font-mono">ZevRA</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Zero-Trust
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Pre-Capture Payment Intent & Verification</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-850/80 p-1 rounded-xl border border-slate-800/80">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-700/80 text-white shadow-sm border border-slate-600/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Status Indicators & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* PayPal Sandbox Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="hidden sm:inline">PayPal</span> Sandbox
            </div>

            {/* Backend Health Pill */}
            <button
              onClick={onRefreshHealth}
              disabled={isCheckingHealth}
              title="Click to re-check backend status at http://localhost:5000"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                backendStatus === 'connected'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  : backendStatus === 'checking'
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === 'connected'
                    ? 'bg-emerald-400'
                    : backendStatus === 'checking'
                    ? 'bg-blue-400 animate-ping'
                    : 'bg-rose-400'
                }`}
              />
              <span className="hidden lg:inline">Backend:</span>
              <span>
                {backendStatus === 'connected'
                  ? ':5000 Online'
                  : backendStatus === 'checking'
                  ? 'Checking...'
                  : 'Offline'}
              </span>
              <RefreshCw
                className={`w-3 h-3 ml-0.5 opacity-70 hover:opacity-100 ${
                  isCheckingHealth ? 'animate-spin' : ''
                }`}
              />
            </button>
          </div>

        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/80 gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-emerald-400 font-semibold bg-slate-800/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
