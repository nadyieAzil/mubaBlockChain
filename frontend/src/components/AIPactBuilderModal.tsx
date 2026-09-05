'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, ArrowRight, CheckCircle2, Wand2, RefreshCw, AlertCircle, Play, X } from 'lucide-react';

interface AIPactResult {
  title: string;
  description: string;
  totalAmount: number;
  recipients: Array<{
    name: string;
    percentageBasisPoints: number;
  }>;
}

interface AIPactBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (result: AIPactResult) => void;
}

const PRESET_PROMPTS = [
  "Build app about selling product bundles for $1,000 USDC. Split 60% Lead Developer, 40% UI Designer.",
  "Build a Sui zkLogin Web3 dApp for $1,200 USDC. Split 60% Lead Dev, 25% UI Designer, 15% QA Engineer.",
  "Smart Contract Security Audit on Sui Move for $1,500 USDC. Split 70% Auditor, 30% Tech Writer.",
];

export function AIPactBuilderModal({ isOpen, onClose, onApply }: AIPactBuilderModalProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIPactResult | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (customPrompt?: string) => {
    const textToUse = customPrompt !== undefined ? customPrompt : prompt;
    if (!textToUse.trim()) {
      setError('Please describe your project requirements.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const relayerUrl = process.env.NEXT_PUBLIC_RELAYER_URL || 'http://localhost:3001';
      const res = await fetch(`${relayerUrl}/api/ai/generate-escrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToUse }),
      });

      if (!res.ok) {
        throw new Error('AI Generator request failed.');
      }

      const data: AIPactResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate escrow scope with AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyResult = () => {
    if (result) {
      onApply(result);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-blue-100 bg-white p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Glow Header Accent */}
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-500/20 blur-2xl pointer-events-none" />

        {/* Header Title */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-[9.5px] font-extrabold text-indigo-700 uppercase tracking-wider mb-0.5">
                <span>Hackathon Track 02: SUI x AI</span>
              </div>
              <h2 className="text-lg font-black text-slate-900">SuiPact AI Scope &amp; Split Generator</h2>
              <p className="text-xs text-slate-500 font-medium">Powered by Gemini 2.0 Flash · Converts English prompts into Move pacts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step 1: Input Textarea */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Describe Your Project & Team Payout Split
          </label>
          <div className="space-y-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. build app about sell bundle for $1,000 USDC. Split 60% Lead Dev, 40% Designer..."
              className="w-full h-24 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none font-medium"
            />

            {/* Direct Evaluate Button under input */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={loading || !prompt.trim()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" /> AI Evaluating & Generating Scope...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" /> Evaluate Scope with AI (LLM)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Sample Prompts */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Or click a sample prompt:</span>
            <div className="flex flex-wrap gap-2">
              {PRESET_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(p);
                    handleGenerate(p);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 transition-all text-left"
                >
                  <Wand2 className="inline h-3 w-3 mr-1 text-blue-500" />
                  {p.slice(0, 52)}...
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Step 2: Generated Result Preview */}
        {result && (
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/40 via-indigo-50/30 to-purple-50/20 p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-xs">
            <div className="flex items-center justify-between border-b border-blue-100/80 pb-2.5">
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-blue-700 uppercase tracking-wider">
                <CheckCircle2 className="h-4 w-4 text-blue-600" /> Generated Escrow Scope
              </span>
              <span className="rounded-full bg-blue-100 border border-blue-200 px-3.5 py-1 text-xs font-black text-blue-800">
                ${result.totalAmount} USDC
              </span>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm font-extrabold text-slate-900">{result.title}</h4>
              <div className="max-h-36 overflow-y-auto rounded-xl bg-white/90 p-3 border border-slate-200/80 text-xs text-slate-700 whitespace-pre-line font-mono leading-relaxed">
                {result.description}
              </div>
            </div>

            {/* Recipient Splits */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Calculated Basis-Point Split Vector (10,000 Total):</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {result.recipients.map((r, i) => (
                  <div key={i} className="rounded-xl bg-white p-2.5 border border-slate-200 text-center shadow-2xs">
                    <div className="text-xs font-bold text-slate-800 truncate">{r.name}</div>
                    <div className="text-xs font-extrabold text-blue-600">{r.percentageBasisPoints / 100}% ({r.percentageBasisPoints} bps)</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Re-evaluate / Refine Scope Action */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Re-evaluate / Refine Scope with AI
              </button>
            </div>
          </div>
        )}

        {/* Modal Action Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          {result ? (
            <button
              onClick={handleApplyResult}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <CheckCircle2 className="h-4 w-4" /> Apply to Escrow Form <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => handleGenerate()}
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Evaluating Scope...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Evaluate & Generate Scope
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
