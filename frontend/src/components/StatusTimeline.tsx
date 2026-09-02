import React from 'react';
import { STATUS_CODES, getSuiScanTxUrl } from '@/config/sui';
import { formatDate, formatAddress } from '@/lib/utils';
import { Check, Clock, ExternalLink, AlertCircle, RotateCcw } from 'lucide-react';

interface TimelineProps {
  status: number;
  txHistory: {
    action: string;
    digest: string;
    timestamp: string;
  }[];
}

export const StatusTimeline: React.FC<TimelineProps> = ({ status, txHistory }) => {
  const steps = [
    {
      title: '1. Deposit Locked',
      desc: 'USDC deposited into shared Move escrow object',
      isCompleted: status >= STATUS_CODES.LOCKED,
      isActive: status === STATUS_CODES.LOCKED,
      tx: txHistory.find((t) => t.action.includes('Created')),
    },
    {
      title: '2. Deliverable Submitted',
      desc: 'Lead freelancer attached proof-of-work link on-chain',
      isCompleted: status >= STATUS_CODES.DELIVERED && status !== STATUS_CODES.REFUNDED,
      isActive: status === STATUS_CODES.DELIVERED,
      tx: txHistory.find((t) => t.action.includes('Submitted')),
    },
    {
      title:
        status === STATUS_CODES.REFUNDED
          ? '3. Deposit Refunded'
          : status === STATUS_CODES.DISPUTED
          ? '3. Dispute Resolution'
          : '3. Atomic Split Release',
      desc:
        status === STATUS_CODES.REFUNDED
          ? 'Client reclaimed locked funds'
          : status === STATUS_CODES.DISPUTED
          ? 'Mutual consensus or resolution required'
          : 'USDC disbursed to all team split recipients in 1 PTB',
      isCompleted: status === STATUS_CODES.RELEASED || status === STATUS_CODES.REFUNDED,
      isActive: status === STATUS_CODES.RELEASED || status === STATUS_CODES.DISPUTED,
      tx: txHistory.find(
        (t) =>
          t.action.includes('Released') ||
          t.action.includes('Refunded') ||
          t.action.includes('Dispute')
      ),
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center justify-between">
        <span>On-Chain Escrow Lifecycle</span>
        <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          Sui Testnet Verified
        </span>
      </h3>

      <div className="relative flex flex-col md:flex-row justify-between gap-6">
        {steps.map((step, idx) => {
          return (
            <div key={idx} className="flex-1 relative flex md:flex-col items-start gap-4">
              {/* Connector line for desktop */}
              {idx < steps.length - 1 && (
                <div
                  className={`hidden md:block absolute top-4 left-8 right-0 h-0.5 ${
                    step.isCompleted ? 'bg-indigo-500' : 'bg-slate-200'
                  }`}
                  style={{ zIndex: 0 }}
                />
              )}

              {/* Step Circle */}
              <div
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  step.isCompleted
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : step.isActive
                    ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                    : 'border border-slate-300 bg-slate-100 text-slate-500'
                }`}
              >
                {step.isCompleted ? (
                  <Check className="h-4 w-4 stroke-[3]" />
                ) : step.isActive ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  idx + 1
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">{step.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>

                {/* Tx Digest Link */}
                {step.tx ? (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-mono text-slate-600 border border-slate-200/70 hover:bg-slate-100 transition-colors">
                    <span className="text-slate-400">Tx:</span>
                    <a
                      href={getSuiScanTxUrl(step.tx.digest)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      {formatAddress(step.tx.digest, 4)}
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </a>
                  </div>
                ) : (
                  <span className="mt-2 inline-block text-[11px] text-slate-400 italic">
                    Pending step
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
