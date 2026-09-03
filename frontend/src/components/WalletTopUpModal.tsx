'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatAddress, formatUSDC } from '@/lib/utils';
import {
  Wallet,
  Coins,
  Sparkles,
  RotateCcw,
  Trash2,
  X,
  CreditCard,
  Zap,
  Check,
  Copy,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface WalletTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletTopUpModal: React.FC<WalletTopUpModalProps> = ({ isOpen, onClose }) => {
  const { user, balance, topUpBalance, resetBalance, resetDemoState } = useAuth();
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<'faucet' | 'fiat'>('faucet');
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !user) return null;

  const copyAddress = () => {
    navigator.clipboard.writeText(user.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTopUp = (amount: number, label?: string) => {
    if (amount <= 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      topUpBalance(amount, label || (selectedMethod === 'faucet' ? 'Testnet Faucet' : 'MoonPay Card On-Ramp'));
      setIsProcessing(false);
    }, 400);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(customAmount);
    if (!isNaN(parsed) && parsed > 0) {
      handleTopUp(parsed, `Custom Deposit ($${parsed.toLocaleString()} USDC)`);
      setCustomAmount('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="bg-blue-gradient p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-inner">
              <Wallet className="h-6 w-6 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-white">Wallet Balance &amp; Top Up</h3>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-blue-100">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">Manage and calibrate testnet funds for {user.name}</p>
            </div>
          </div>

          {/* Current Balance Banner */}
          <div className="mt-5 rounded-2xl bg-white/10 border border-white/20 p-4 backdrop-blur-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-blue-200 uppercase tracking-wider">
                Current Connected Wallet Balance
              </span>
              <div className="text-3xl font-black text-white font-mono tracking-tight mt-0.5">
                {formatUSDC(balance)}
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="flex items-center gap-1.5 justify-end text-[11px] text-blue-100 font-mono">
                <span>{formatAddress(user.address, 4)}</span>
                <button
                  onClick={copyAddress}
                  className="rounded p-1 hover:bg-white/20 text-blue-200 hover:text-white transition-colors"
                  title="Copy address"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                <ShieldCheck className="h-3 w-3" /> Sui zkLogin Verified
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800">
          
          {/* Method Selection */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
              Top-Up Method / Source
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedMethod('faucet')}
                className={`flex items-center gap-2.5 rounded-2xl border p-3 text-left transition-all ${
                  selectedMethod === 'faucet'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${selectedMethod === 'faucet' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold">Instant Faucet</div>
                  <div className="text-[10px] text-slate-500">Sponsored testnet deposit</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('fiat')}
                className={`flex items-center gap-2.5 rounded-2xl border p-3 text-left transition-all ${
                  selectedMethod === 'fiat'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${selectedMethod === 'fiat' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold">Card / MoonPay</div>
                  <div className="text-[10px] text-slate-500">Simulated fiat on-ramp</div>
                </div>
              </button>
            </div>
          </div>

          {/* Quick Amount Presets */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
              Quick Deposit Packages
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { amount: 100, label: '+$100' },
                { amount: 500, label: '+$500' },
                { amount: 1000, label: '+$1,000', popular: true },
                { amount: 5000, label: '+$5,000' },
              ].map((pkg, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleTopUp(pkg.amount)}
                  disabled={isProcessing}
                  className={`relative rounded-2xl border p-3 text-center transition-all hover:scale-102 active:scale-98 ${
                    pkg.popular
                      ? 'border-blue-500 bg-gradient-to-b from-blue-50 to-indigo-50/50 hover:border-blue-600'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-extrabold bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase shadow-2xs">
                      Popular
                    </span>
                  )}
                  <div className="text-sm font-black text-slate-900 font-mono">{pkg.label}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">USDC</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Deposit Input */}
          <form onSubmit={handleCustomSubmit} className="space-y-2">
            <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
              Custom Amount Deposit
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="Enter custom USDC amount..."
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white pl-8 pr-4 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={!customAmount || parseFloat(customAmount) <= 0 || isProcessing}
                className="flex items-center gap-1.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition-all cursor-pointer"
              >
                <span>Deposit</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>

          {/* Reset Balance Section */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">Wallet Reset &amp; Calibration</h4>
                <p className="text-[11px] text-slate-500">Reset test balance to zero ($0.00) or restore starting persona defaults</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => resetBalance(0)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 py-2.5 px-3 text-xs font-bold transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                <span>Reset Balance to $0.00 USDC</span>
              </button>

              <button
                type="button"
                onClick={() => resetDemoState()}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 px-3 text-xs font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                <span>Restore Persona Defaults</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs">
          <span className="text-[11px] text-slate-500">
            Sui Testnet · Gas Sponsored ($0.00 Gas)
          </span>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
