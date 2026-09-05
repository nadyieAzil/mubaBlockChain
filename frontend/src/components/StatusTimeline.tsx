'use client';

import React, { useState } from 'react';
import { STATUS_CODES, getSuiScanTxUrl } from '@/config/sui';
import { formatDate, formatAddress } from '@/lib/utils';
import { Check, Clock, ExternalLink, Lock, Eye, CheckCircle2, Shield, Zap } from 'lucide-react';

interface TimelineProps {
  status: number;
  txHistory: {
    action: string;
    digest: string;
    timestamp: string;
  }[];
}

export const StatusTimeline: React.FC<TimelineProps> = ({ status, txHistory }) => {
  const [inspectedStep, setInspectedStep] = useState<number | null>(null);

  const steps = [
    {
      stepNumber: 1,
      title: '1. Deposit Locked',
      desc: 'USDC deposited into shared Move secure vault object',
      isCompleted: status >= STATUS_CODES.LOCKED,
      isActive: status === STATUS_CODES.LOCKED,
      tx: txHistory.find((t) => t.action.toLowerCase().includes('created') || t.action.toLowerCase().includes('deposit')),
    },
    {
      stepNumber: 2,
      title: '2. Deliverable Submitted',
      desc: 'Lead freelancer attached proof-of-work link on-chain',
      isCompleted: status >= STATUS_CODES.DELIVERED && status !== STATUS_CODES.REFUNDED,
      isActive: status === STATUS_CODES.DELIVERED,
      tx: txHistory.find((t) => t.action.toLowerCase().includes('submitted') || t.action.toLowerCase().includes('deliverable')),
    },
    {
      stepNumber: 3,
      title:
        status === STATUS_CODES.REFUNDED
          ? '3. Deposit Refunded'
          : status === STATUS_CODES.DISPUTED
          ? '3. Dispute Resolution'
          : txHistory.some((t) => t.action.toLowerCase().includes('settlement finalized'))
          ? '3. AI Dispute Compromise Settled'
          : '3. Atomic Split Release',
      desc:
        status === STATUS_CODES.REFUNDED
          ? 'Client reclaimed locked funds'
          : status === STATUS_CODES.DISPUTED
          ? 'Mutual consensus or resolution required'
          : txHistory.some((t) => t.action.toLowerCase().includes('settlement finalized'))
          ? '75% compromise payout disbursed, 25% refunded to Client'
          : 'USDC disbursed to all team split recipients in 1 PTB',
      isCompleted: status === STATUS_CODES.RELEASED || status === STATUS_CODES.REFUNDED,
      isActive: status === STATUS_CODES.RELEASED || status === STATUS_CODES.DISPUTED,
      tx: txHistory.find(
        (t) =>
          t.action.toLowerCase().includes('settlement') ||
          t.action.toLowerCase().includes('released') ||
          t.action.toLowerCase().includes('refunded') ||
          t.action.toLowerCase().includes('dispute')
      ),
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
            Secure Vault Milestones &amp; Sui Progress
          </h3>
        </div>
        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
          {status === STATUS_CODES.LOCKED ? 'Phase 1 Active (Execution)' : status === STATUS_CODES.DELIVERED ? 'Phase 2 Active (Review)' : 'Phase 3 (Settled)'}
        </span>
      </div>

      <div className="relative flex flex-col md:flex-row justify-between gap-6">
        {steps.map((step, idx) => {
          const isClickable = step.isCompleted;
          const isSelected = inspectedStep === idx;

          return (
            <div
              key={idx}
              onClick={() => isClickable && setInspectedStep(isSelected ? null : idx)}
              className={`flex-1 relative flex md:flex-col items-start gap-3.5 p-3 rounded-xl transition-all ${
                isClickable
                  ? 'cursor-pointer hover:bg-slate-50'
                  : 'opacity-70 cursor-not-allowed'
              } ${isSelected ? 'bg-blue-50/80 border border-blue-200 ring-1 ring-blue-300' : ''}`}
            >
              {/* Connector line for desktop - rendered across all phases including final phase */}
              <div
                className={`hidden md:block absolute top-7 left-10 ${
                  idx < steps.length - 1 ? 'right-[-24px]' : 'right-0'
                } h-0.5 transition-colors ${
                  step.isCompleted
                    ? 'bg-blue-600'
                    : step.isActive
                    ? 'bg-amber-400'
                    : 'bg-slate-200'
                }`}
                style={{ zIndex: 0 }}
              />

              {/* Step Circle */}
              <div
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  step.isCompleted
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : step.isActive
                    ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                    : 'border border-slate-300 bg-slate-100 text-slate-400'
                }`}
              >
                {step.isCompleted ? (
                  <Check className="h-4 w-4 stroke-[3]" />
                ) : step.isActive ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-slate-900">{step.title}</h4>
                  {step.isCompleted && (
                    <span title="Click to inspect phase details"><Eye className="h-3 w-3 text-blue-500 shrink-0" /></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{step.desc}</p>
                {step.isCompleted ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 mt-1 uppercase">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    <span>Verified on Sui (Click to Inspect)</span>
                  </span>
                ) : step.isActive ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 mt-1 uppercase">
                    <Zap className="h-2.5 w-2.5" />
                    <span>Current Active Task</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400 mt-1 uppercase">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Locked (Next Phase)</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Phase Inspection Box */}
      {inspectedStep !== null && steps[inspectedStep]?.isCompleted && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-2 animate-fade-in text-xs">
          <div className="flex items-center justify-between">
            <div className="font-extrabold text-blue-900 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              Phase Details: {steps[inspectedStep].title}
            </div>
            <button onClick={() => setInspectedStep(null)} className="text-[11px] text-slate-500 hover:text-slate-800">Close</button>
          </div>

          <div className="grid sm:grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500">Action:</span>{' '}
              <strong className="text-slate-800">{steps[inspectedStep].tx?.action || 'On-chain Event Recorded'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Timestamp:</span>{' '}
              <strong className="text-slate-800">{steps[inspectedStep].tx?.timestamp ? formatDate(steps[inspectedStep].tx.timestamp) : 'N/A'}</strong>
            </div>
          </div>

          {steps[inspectedStep].tx?.digest && (
            <div className="flex items-center justify-between rounded-lg bg-white p-2 border border-blue-100 font-mono text-[10px]">
              <span className="truncate text-slate-700 mr-2">Digest: {steps[inspectedStep].tx.digest}</span>
              <a
                href={getSuiScanTxUrl(steps[inspectedStep].tx.digest)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 font-bold shrink-0 hover:underline"
              >
                Explorer <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
