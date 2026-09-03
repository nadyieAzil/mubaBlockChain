'use client';

import React, { useState } from 'react';
import { useAuth, PRESET_DEMO_ACCOUNTS } from '@/context/AuthContext';
import { useEscrow } from '@/context/EscrowContext';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  RotateCcw,
  UserCheck,
  ChevronUp,
  ChevronDown,
  Play,
  Zap,
  CheckCircle2,
  Briefcase,
  Crown,
  Users,
} from 'lucide-react';

export const DemoSandboxBar: React.FC = () => {
  const { user, loginWithDemo, resetDemoState } = useAuth();
  const { resetEscrows } = useEscrow();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  const handleStartDemoFlow = () => {
    // 1. Switch to Alice (Client)
    loginWithDemo(PRESET_DEMO_ACCOUNTS[0]);
    router.push('/dashboard');
  };

  const handleSwitchToBob = () => {
    // Switch to Bob (Lead Freelancer)
    loginWithDemo(PRESET_DEMO_ACCOUNTS[1]);
  };

  const handleSwitchToAlice = () => {
    // Switch to Alice (Client)
    loginWithDemo(PRESET_DEMO_ACCOUNTS[0]);
  };

  const handleSwitchToCharlie = () => {
    // Switch to Charlie (Team Member / UI Designer)
    loginWithDemo(PRESET_DEMO_ACCOUNTS[2]);
  };

  const handleFullReset = async () => {
    setIsResetting(true);
    try {
      resetDemoState();
      await resetEscrows();
      // Ensure we switch back to Alice
      loginWithDemo(PRESET_DEMO_ACCOUNTS[0]);
      router.push('/dashboard');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-lg w-full px-2 sm:px-0">
      <div className="rounded-2xl border-2 border-blue-500 bg-slate-900/95 text-white shadow-2xl backdrop-blur-md overflow-hidden transition-all">
        {/* Top Header Toggle Bar */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 cursor-pointer hover:from-blue-600 hover:to-indigo-600 transition-all select-none"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-white">
              Demo Sandbox Controller
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase text-blue-100">
              {user?.name?.split(' ')[0] || 'Guest'}
            </span>
            {isOpen ? <ChevronDown className="h-4 w-4 text-white/80" /> : <ChevronUp className="h-4 w-4 text-white/80" />}
          </div>
        </div>

        {/* Collapsible Sandbox Body */}
        {isOpen && (
          <div className="p-4 space-y-3 text-xs">
            <p className="text-[11px] text-slate-300 leading-snug">
              Uji peranan antara <strong>Client</strong>, <strong>Lead Freelancer</strong>, &amp; <strong>Team Member (Sub-freelancer)</strong> untuk menguji ketelusan dispute.
            </p>

            {/* Quick Switch Persona Buttons (3 Roles) */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleSwitchToAlice}
                className={`flex items-center justify-center gap-1 rounded-xl border p-2 text-[11px] font-bold transition-all cursor-pointer ${
                  user?.email === 'alice.client@suipact.dev'
                    ? 'border-emerald-400 bg-emerald-950/60 text-emerald-300 ring-1 ring-emerald-400'
                    : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <Briefcase className="h-3 w-3 text-blue-400 icon-hover-bounce shrink-0" />
                <span className="truncate">Alice (Client)</span>
              </button>

              <button
                type="button"
                onClick={handleSwitchToBob}
                className={`flex items-center justify-center gap-1 rounded-xl border p-2 text-[11px] font-bold transition-all cursor-pointer ${
                  user?.email === 'bob.lead@agency.studio'
                    ? 'border-amber-400 bg-amber-950/60 text-amber-300 ring-1 ring-amber-400'
                    : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <Crown className="h-3 w-3 text-amber-400 icon-hover-bounce shrink-0" />
                <span className="truncate">Bob (Lead Free)</span>
              </button>

              <button
                type="button"
                onClick={handleSwitchToCharlie}
                className={`flex items-center justify-center gap-1 rounded-xl border p-2 text-[11px] font-bold transition-all cursor-pointer ${
                  user?.email === 'charlie.design@agency.studio'
                    ? 'border-violet-400 bg-violet-950/60 text-violet-300 ring-1 ring-violet-400'
                    : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <Users className="h-3 w-3 text-violet-400 icon-hover-bounce shrink-0" />
                <span className="truncate">Charlie (Team)</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleStartDemoFlow}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 py-2 font-extrabold text-white shadow-sm transition-all"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>Mula Demo Flow</span>
              </button>

              <button
                type="button"
                onClick={handleFullReset}
                disabled={isResetting}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-900/60 hover:bg-rose-800 border border-rose-700/80 px-3 py-2 font-bold text-rose-200 transition-all disabled:opacity-50"
                title="Reset semua baki & kontrak ke nilai asal"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>Reset Semua</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
