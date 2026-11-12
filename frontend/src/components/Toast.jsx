import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, X } from './Icons';

export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const bgStyles = {
    success: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200',
    error: 'bg-rose-950/90 border-rose-500/40 text-rose-200',
    warning: 'bg-amber-950/90 border-amber-500/40 text-amber-200',
    info: 'bg-slate-900/90 border-blue-500/40 text-blue-200'
  }[toast.type || 'info'];

  const IconComponent = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: CheckCircle
  }[toast.type || 'info'];

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-fade-in shadow-2xl">
      <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-md ${bgStyles}`}>
        <IconComponent className="w-5 h-5 mt-0.5 shrink-0" />
        <div className="flex-1 pr-2 text-sm">
          {toast.title && <div className="font-semibold text-white mb-0.5">{toast.title}</div>}
          <div className="text-xs leading-relaxed opacity-90">{toast.message}</div>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors p-1"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
