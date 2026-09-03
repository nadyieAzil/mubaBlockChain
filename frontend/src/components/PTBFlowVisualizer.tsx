'use client';

import React, { useEffect, useState } from 'react';
import { Zap, CheckCircle2, Users, ArrowRight, Lock } from 'lucide-react';

interface Recipient {
  name?: string;
  payout: number;
  address: string;
}

interface PTBFlowVisualizerProps {
  recipients: Recipient[];
  totalAmount: number;
  onComplete: () => void;
}

const STEP_LABELS = [
  { id: 'ptb', label: 'Building PTB', sub: 'Composing Programmable Transaction Block' },
  { id: 'sign', label: 'Sponsor Signing', sub: 'Relayer attaches gas payment object' },
  { id: 'exec', label: 'Executing on Sui', sub: 'Atomic multi-transfer in 1 tx' },
  { id: 'done', label: 'Settled', sub: 'All recipients funded simultaneously' },
];

export const PTBFlowVisualizer: React.FC<PTBFlowVisualizerProps> = ({
  recipients,
  totalAmount,
  onComplete,
}) => {
  const [step, setStep] = useState(0);
  const [activeRecipient, setActiveRecipient] = useState(-1);

  useEffect(() => {
    // Step through PTB stages
    const stepTimer = setInterval(() => {
      setStep((s) => {
        if (s >= STEP_LABELS.length - 1) {
          clearInterval(stepTimer);
          return s;
        }
        return s + 1;
      });
    }, 800);

    // Animate recipients being funded one by one
    let i = 0;
    const recipientTimer = setInterval(() => {
      setActiveRecipient(i);
      i++;
      if (i >= recipients.length) {
        clearInterval(recipientTimer);
        // Final completion after all recipients shown
        setTimeout(onComplete, 1400);
      }
    }, 400);

    return () => {
      clearInterval(stepTimer);
      clearInterval(recipientTimer);
    };
  }, [recipients.length, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm animate-fade-in p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white overflow-hidden shadow-2xl animate-pop-in">
        {/* Header */}
        <div className="bg-blue-gradient px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 border border-white/25">
              <Zap className="h-5 w-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Programmable Transaction Block</h3>
              <p className="text-xs text-blue-200">Executing atomic multi-recipient split payout on Sui Testnet</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {STEP_LABELS.map((s, i) => (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-1.5 text-center" style={{ minWidth: 60 }}>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full font-extrabold text-xs transition-all duration-500 ${
                    i < step ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' :
                    i === step ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 animate-pulse-glow' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={`text-[10px] font-bold leading-tight ${i <= step ? 'text-slate-800' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all duration-700 ${i < step ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Current step sub-label */}
          <div className="text-center text-xs text-slate-500 font-medium animate-fade-in">
            {STEP_LABELS[Math.min(step, STEP_LABELS.length - 1)].sub}
          </div>

          {/* Visual flow: Escrow → Recipients */}
          <div className="space-y-3">
            {/* Escrow Source */}
            <div className="flex items-center justify-center gap-3">
              <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-center shadow-sm">
                <div className="text-xs font-extrabold text-blue-700 flex items-center justify-center gap-1">
                  <Lock className="h-3.5 w-3.5 text-blue-600" />
                  <span>Escrow Contract</span>
                </div>
                <div className="text-base font-extrabold text-slate-900 mt-0.5">${totalAmount.toLocaleString()} USDC</div>
              </div>
            </div>

            {/* Animated arrows + recipients */}
            <div className="space-y-2">
              {recipients.map((r, i) => (
                <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${i <= activeRecipient ? 'opacity-100' : 'opacity-20'}`}>
                  {/* Arrow with animated line */}
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <div className={`h-0.5 flex-1 rounded transition-all duration-700 ${i <= activeRecipient ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                    <ArrowRight className={`h-4 w-4 shrink-0 transition-all ${i <= activeRecipient ? 'text-emerald-500' : 'text-slate-300'}`} />
                  </div>
                  {/* Recipient box */}
                  <div className={`rounded-xl border px-3 py-2 text-xs transition-all duration-500 min-w-0 max-w-[200px] ${
                    i <= activeRecipient ? 'border-emerald-300 bg-emerald-50 shadow-sm shadow-emerald-100' : 'border-slate-200 bg-slate-50'
                  }`}>
                    <div className="font-extrabold text-slate-900 truncate">{r.name || `Recipient ${i + 1}`}</div>
                    <div className={`font-bold ${i <= activeRecipient ? 'text-emerald-700' : 'text-slate-400'}`}>
                      ${r.payout.toFixed(2)}
                    </div>
                  </div>
                  {i <= activeRecipient && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 animate-pop-in" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Gas cost highlight */}
          <div className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 border border-blue-100 py-3 text-xs font-bold text-blue-700">
            <Zap className="h-4 w-4 text-yellow-500" />
            Gas Cost to User: <span className="text-emerald-700">$0.00</span>
            <span className="text-blue-300 font-normal">— Paid by Relayer</span>
          </div>
        </div>
      </div>
    </div>
  );
};
