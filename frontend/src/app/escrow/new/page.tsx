'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, PRESET_DEMO_ACCOUNTS } from '@/context/AuthContext';
import { useEscrow, Recipient } from '@/context/EscrowContext';
import { SplitPieChart, SLICE_COLORS } from '@/components/SplitPieChart';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { SUI_CONFIG } from '@/config/sui';
import { formatUSDC } from '@/lib/utils';
import {
  ShieldCheck,
  Zap,
  ArrowLeft,
  Lock,
  Loader2,
  Info,
  Plus,
  Trash2,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';

function Tooltip({ text }: { text: string }) {
  return (
    <span className="tooltip-container">
      <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-help" />
      <span className="tooltip-content">{text}</span>
    </span>
  );
}

export default function NewEscrowPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { createEscrow } = useEscrow();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [leadFreelancer, setLeadFreelancer] = useState(PRESET_DEMO_ACCOUNTS[1].address);
  const [totalAmount, setTotalAmount] = useState<number>(1000);
  const [recipients, setRecipients] = useState<Recipient[]>([
    { recipient: PRESET_DEMO_ACCOUNTS[1].address, name: 'Bob Vance (Lead)', percentageBasisPoints: 6000 },
    { recipient: PRESET_DEMO_ACCOUNTS[2].address, name: 'Charlie UI (Designer)', percentageBasisPoints: 2500 },
    { recipient: PRESET_DEMO_ACCOUNTS[3].address, name: 'David Backend', percentageBasisPoints: 1500 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalBps = recipients.reduce((acc, r) => acc + (Number(r.percentageBasisPoints) || 0), 0);
  const isValidBps = totalBps === SUI_CONFIG.basisPointsTotal;

  const addRecipient = () => {
    if (recipients.length >= 6) return;
    setRecipients([...recipients, { recipient: '', name: '', percentageBasisPoints: 0 }]);
  };

  const removeRecipient = (idx: number) => {
    if (recipients.length <= 1) return;
    setRecipients(recipients.filter((_, i) => i !== idx));
  };

  const updateRecipient = (idx: number, field: keyof Recipient, value: string | number) => {
    setRecipients(recipients.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Please enter a deliverable title.'); return; }
    if (!leadFreelancer.trim() || !leadFreelancer.startsWith('0x')) { setError('Please enter a valid lead freelancer Sui address (0x...).'); return; }
    if (totalAmount <= 0) { setError('Deposit amount must be greater than 0 USDC.'); return; }
    if (!isValidBps) { setError('Total basis points must sum to exactly 10,000 (100%).'); return; }

    setError(null);
    setSubmitting(true);
    try {
      const created = await createEscrow({ title, leadFreelancer, totalAmount, recipients });
      router.push(`/escrow/${created.id}?new=true`);
    } catch (err: any) {
      setError(err.message || 'Failed to create escrow');
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Sign In to Create Escrow</h2>
        <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
          You must be signed in with Google zkLogin or a Demo Persona to deploy a Move escrow on Sui Testnet.
        </p>
        <div className="rounded-2xl border border-blue-100 bg-white p-5 space-y-3 shadow-sm">
          <Link href="/login?redirect=/escrow/new" className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-all">
            Continue with Google zkLogin <ShieldCheck className="h-4 w-4" />
          </Link>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/login?redirect=/escrow/new" className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors text-center">💼 Alice (Client)</Link>
            <Link href="/login?redirect=/escrow/new" className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors text-center">🎨 Bob (Freelancer)</Link>
          </div>
        </div>
      </div>
    );
  }

  // Build pie slices from current recipients
  const pieSlices = recipients.map((r, i) => ({
    label: r.name || `Recipient ${i + 1}`,
    bps: Number(r.percentageBasisPoints) || 0,
    color: SLICE_COLORS[i % SLICE_COLORS.length],
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Back */}
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to My Orders
      </Link>

      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Service Escrow Order</h1>
            <p className="text-xs text-slate-500 mt-0.5">Lock USDC → Deliver proof → Atomic team split in 1 transaction</p>
          </div>
          <span className="ml-auto rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white">Sui Move</span>
        </div>
      </div>

      <DisclaimerBanner />

      {/* Main 2-Column Layout */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0 text-rose-600" />
              {error}
            </div>
          )}

          {/* Card: Order Details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 flex items-center gap-2">
              <span className="h-5 w-5 rounded bg-blue-600 text-white flex items-center justify-center text-[10px] font-extrabold">1</span>
              Order Details
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Deliverable Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Full-Stack DApp & Sui zkLogin Integration"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Scope of Work</label>
              <textarea
                rows={3}
                placeholder="Describe what deliverables must be submitted (GitHub PR, Figma URL, IPFS hash...)."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-all resize-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  Lead Freelancer Address <span className="text-rose-500">*</span>
                  <Tooltip text="Only this address can submit deliverable proof" />
                </label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={leadFreelancer}
                  onChange={(e) => setLeadFreelancer(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">Authorized to submit proof of delivery</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  Deposit Amount <span className="text-rose-500">*</span>
                  <Tooltip text="Total USDC locked into Move smart contract" />
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-20 py-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">USDC</span>
                </div>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">Gas fee: $0.00 (Sponsored)</p>
              </div>
            </div>
          </div>

          {/* Card: Split Distribution */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 flex items-center gap-2">
                <span className="h-5 w-5 rounded bg-blue-600 text-white flex items-center justify-center text-[10px] font-extrabold">2</span>
                Team Split Distribution
                <Tooltip text="1% = 100 basis points. All recipients must total exactly 10,000 bps (100%)" />
              </h3>
              <button type="button" onClick={addRecipient} disabled={recipients.length >= 6}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 disabled:opacity-40 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Add Recipient
              </button>
            </div>

            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700 font-medium">
              💡 <strong>Basis Points Explainer:</strong> 10,000 bps = 100%. So 6,000 bps = 60% of {formatUSDC(totalAmount)} = <strong>${((6000 / 10000) * totalAmount).toFixed(2)}</strong>
            </div>

            <div className="space-y-3">
              {recipients.map((r, i) => {
                const pct = totalAmount > 0 ? ((r.percentageBasisPoints / 10000) * totalAmount).toFixed(2) : '0.00';
                return (
                  <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length] }} />
                        <span className="text-xs font-bold text-slate-700">Recipient {i + 1}</span>
                        {r.name && <span className="text-xs text-slate-500">— {r.name}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-emerald-700">${pct}</span>
                        <button type="button" onClick={() => removeRecipient(i)} disabled={recipients.length <= 1}
                          className="text-slate-400 hover:text-rose-500 disabled:opacity-30 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1">
                        <input
                          type="text"
                          placeholder="Display name"
                          value={r.name || ''}
                          onChange={(e) => updateRecipient(i, 'name', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <input
                          type="text"
                          placeholder="0x... address"
                          value={r.recipient}
                          onChange={(e) => updateRecipient(i, 'recipient', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-[11px] text-slate-900 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="10000"
                            step="100"
                            placeholder="bps"
                            value={r.percentageBasisPoints}
                            onChange={(e) => updateRecipient(i, 'percentageBasisPoints', Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-200 bg-white pl-3 pr-14 py-2 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-blue-600">bps</span>
                        </div>
                        <div className="mt-1">
                          <input
                            type="range"
                            min="0" max="10000" step="100"
                            value={r.percentageBasisPoints}
                            onChange={(e) => updateRecipient(i, 'percentageBasisPoints', Number(e.target.value))}
                            style={{ accentColor: SLICE_COLORS[i % SLICE_COLORS.length] }}
                            className="w-full h-1.5 rounded-full cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500">Total allocated:</span>
                <span className={isValidBps ? 'text-emerald-600' : totalBps > 10000 ? 'text-rose-600' : 'text-amber-600'}>
                  {(totalBps / 100).toFixed(1)}% / 100%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isValidBps ? 'bg-emerald-500' : totalBps > 10000 ? 'bg-rose-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, (totalBps / 10000) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Submit Row */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Total Escrow Deposit:</div>
              <div className="text-2xl font-extrabold text-slate-900">{formatUSDC(totalAmount)}</div>
              <div className="text-xs text-emerald-600 font-bold mt-0.5">$0.00 Gas · Sponsored by Relayer</div>
            </div>

            <button
              type="submit"
              disabled={submitting || !isValidBps}
              className="flex items-center justify-center gap-2 rounded-2xl bg-blue-gradient px-8 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-800/20 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Locking on Sui...</>
              ) : (
                <><Lock className="h-4 w-4" /> Deposit & Lock Escrow</>
              )}
            </button>
          </div>
        </form>

        {/* Sticky Pie Chart Sidebar */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-600">Live Split Preview</h3>
            <SplitPieChart slices={pieSlices} totalAmount={totalAmount} />

            {/* PTB Explainer */}
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-blue-700">
                <Zap className="h-3.5 w-3.5" /> What happens on approval?
              </div>
              <p className="text-[11px] text-blue-600 leading-relaxed">
                When the client approves, Sui executes a <strong>Programmable Transaction Block (PTB)</strong> that simultaneously transfers each recipient's exact share in one atomic tx — impossible on Ethereum without a multi-sig.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
