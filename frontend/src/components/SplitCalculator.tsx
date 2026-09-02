import React from 'react';
import { Recipient } from '@/context/EscrowContext';
import { formatUSDC, formatAddress } from '@/lib/utils';
import { Plus, Trash2, Users, AlertCircle, Sparkles } from 'lucide-react';
import { SUI_CONFIG } from '@/config/sui';

interface SplitCalculatorProps {
  totalAmount: number;
  recipients: Recipient[];
  onChange: (recipients: Recipient[]) => void;
  editable?: boolean;
}

export const SplitCalculator: React.FC<SplitCalculatorProps> = ({
  totalAmount,
  recipients,
  onChange,
  editable = true,
}) => {
  const totalBps = recipients.reduce((acc, r) => acc + (Number(r.percentageBasisPoints) || 0), 0);
  const isValid = totalBps === SUI_CONFIG.basisPointsTotal;

  const handleAddRecipient = () => {
    const remainingBps = Math.max(0, SUI_CONFIG.basisPointsTotal - totalBps);
    const newRecipient: Recipient = {
      recipient: '',
      name: `Team Member #${recipients.length + 1}`,
      percentageBasisPoints: remainingBps,
    };
    onChange([...recipients, newRecipient]);
  };

  const handleRemove = (index: number) => {
    if (recipients.length <= 1) return;
    const updated = recipients.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleBpsChange = (index: number, val: number) => {
    const updated = recipients.map((r, i) => (i === index ? { ...r, percentageBasisPoints: val } : r));
    onChange(updated);
  };

  const handleNameChange = (index: number, name: string) => {
    const updated = recipients.map((r, i) => (i === index ? { ...r, name } : r));
    onChange(updated);
  };

  const handleAddressChange = (index: number, recipient: string) => {
    const updated = recipients.map((r, i) => (i === index ? { ...r, recipient } : r));
    onChange(updated);
  };

  const autoEqualize = () => {
    const count = recipients.length;
    if (count === 0) return;
    const base = Math.floor(SUI_CONFIG.basisPointsTotal / count);
    const remainder = SUI_CONFIG.basisPointsTotal - base * count;

    const updated = recipients.map((r, i) => ({
      ...r,
      percentageBasisPoints: i === count - 1 ? base + remainder : base,
    }));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Multi-Recipient Split Distribution
          </h4>
        </div>
        {editable && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={autoEqualize}
              className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              Equalize Splits
            </button>
            <button
              type="button"
              onClick={handleAddRecipient}
              className="flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Recipient
            </button>
          </div>
        )}
      </div>

      {/* Recipient Rows */}
      <div className="space-y-2.5">
        {recipients.map((r, idx) => {
          const pct = (r.percentageBasisPoints / 100).toFixed(2);
          const computedUSDC = (totalAmount * r.percentageBasisPoints) / 10000;

          return (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 hover:border-slate-300 transition-colors"
            >
              {/* Name / Role Label */}
              <div className="w-full sm:w-44">
                {editable ? (
                  <input
                    type="text"
                    value={r.name || ''}
                    onChange={(e) => handleNameChange(idx, e.target.value)}
                    placeholder="e.g. Lead, Frontend"
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                  />
                ) : (
                  <div className="text-xs font-bold text-slate-900">{r.name || `Recipient #${idx + 1}`}</div>
                )}
              </div>

              {/* Sui Address */}
              <div className="flex-1">
                {editable ? (
                  <input
                    type="text"
                    value={r.recipient}
                    onChange={(e) => handleAddressChange(idx, e.target.value)}
                    placeholder="0x... recipient Sui address"
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                  />
                ) : (
                  <div className="font-mono text-xs text-slate-600 truncate">{formatAddress(r.recipient, 8)}</div>
                )}
              </div>

              {/* Basis Points & Percentage */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-20">
                  {editable ? (
                    <input
                      type="number"
                      min="0"
                      max="10000"
                      value={r.percentageBasisPoints}
                      onChange={(e) => handleBpsChange(idx, Number(e.target.value))}
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-right text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  ) : (
                    <span className="text-xs font-bold text-slate-900">{r.percentageBasisPoints} bps</span>
                  )}
                </div>

                <span className="text-xs text-slate-400 font-mono w-12 text-right">({pct}%)</span>

                {/* Calculated USDC payout */}
                <div className="w-24 text-right">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    {formatUSDC(computedUSDC)}
                  </span>
                </div>

                {/* Delete Button */}
                {editable && recipients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Split Total Validation Bar */}
      <div
        className={`flex items-center justify-between rounded-lg px-4 py-2.5 text-xs font-semibold border ${
          isValid
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-amber-50 text-amber-800 border-amber-200'
        }`}
      >
        <div className="flex items-center gap-1.5">
          {!isValid && <AlertCircle className="h-4 w-4 text-amber-600" />}
          <span>
            {isValid
              ? '✓ Total basis points sum to 10,000 (100.00%) — Validated'
              : `Total basis points: ${totalBps} / 10,000 (${(totalBps / 100).toFixed(2)}%) — Must sum to 10,000`}
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-normal">
          Move dust remainder allocated to last recipient
        </span>
      </div>
    </div>
  );
};
