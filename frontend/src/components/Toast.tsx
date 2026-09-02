'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { notification, clearNotification } = useAuth();

  if (!notification) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 shadow-xl shadow-slate-900/10 animate-bounce">
      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
      <span>{notification}</span>
      <button
        onClick={clearNotification}
        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
