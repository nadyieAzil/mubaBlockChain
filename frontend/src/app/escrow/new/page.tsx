'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, PRESET_DEMO_ACCOUNTS } from '@/context/AuthContext';
import { useEscrow, Recipient } from '@/context/EscrowContext';
import { SplitPieChart, SLICE_COLORS } from '@/components/SplitPieChart';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { AIPactBuilderModal } from '@/components/AIPactBuilderModal';
import { SUI_CONFIG } from '@/config/sui';
import { formatUSDC, isValidSuiAddress } from '@/lib/utils';
import { uploadDocument } from '@/lib/firebase';
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
  Sparkles,
  FileText,
  UploadCloud,
  CheckCircle2,
  Crown,
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
  const { user, loginWithDemo } = useAuth();
  const { createEscrow } = useEscrow();

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [leadFreelancer, setLeadFreelancer] = useState(PRESET_DEMO_ACCOUNTS[1].address);
  const [totalAmount, setTotalAmount] = useState<number>(1000);
  const [recipients, setRecipients] = useState<Recipient[]>([
    { recipient: PRESET_DEMO_ACCOUNTS[1].address, name: 'Bob Vance (Lead)', percentageBasisPoints: 6000 },
    { recipient: PRESET_DEMO_ACCOUNTS[2].address, name: 'Charlie UI (Designer)', percentageBasisPoints: 2500 },
    { recipient: PRESET_DEMO_ACCOUNTS[3].address, name: 'David Backend', percentageBasisPoints: 1500 },
  ]);

  // PDF Attachment State
  const [attachedDocUrl, setAttachedDocUrl] = useState<string>('');
  const [attachedDocName, setAttachedDocName] = useState<string>('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Role Gate: Only Clients can create and fund escrows
  if (user && user.role !== 'client') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl border border-slate-200 space-y-5">
          <div className="h-16 w-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
            <Lock className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Client Access Required</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Escrow creation and contract funding is reserved for hiring Client accounts. You are currently logged in as <strong>{user.name} ({user.role === 'freelancer' ? 'Freelancer' : 'Team Member'})</strong>.
            </p>
          </div>

          <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-xs text-blue-900 text-left space-y-2">
            <p className="font-bold">Want to test creating an Escrow?</p>
            <p className="text-blue-800 text-[11px]">
              Switch persona to <strong>Alice (Client)</strong> to create contracts, lock testnet USDC deposits, and define multi-recipient payout splits.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                loginWithDemo(PRESET_DEMO_ACCOUNTS[0]);
              }}
              className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 py-3 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
            >
              Switch to Alice (Client Persona)
            </button>
            <Link
              href="/dashboard"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2.5 text-xs font-bold text-slate-700 transition-colors"
            >
              Return to My Assigned Contracts
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApplyAIResult = (result: {
    title: string;
    description: string;
    totalAmount: number;
    recipients: Array<{ name: string; percentageBasisPoints: number }>;
  }) => {
    if (result.title) setTitle(result.title);
    if (result.description) setDescription(result.description);
    if (result.totalAmount) setTotalAmount(result.totalAmount);
    if (result.recipients && result.recipients.length > 0) {
      const mappedRecipients: Recipient[] = result.recipients.map((r, idx) => ({
        name: r.name,
        recipient: PRESET_DEMO_ACCOUNTS[(idx + 1) % PRESET_DEMO_ACCOUNTS.length].address,
        percentageBasisPoints: r.percentageBasisPoints,
      }));
      setRecipients(mappedRecipients);
      if (mappedRecipients[0]) setLeadFreelancer(mappedRecipients[0].recipient);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload an official PDF document (.pdf only).');
      return;
    }

    setIsUploadingDoc(true);
    setError(null);
    try {
      const res = await uploadDocument(file);
      setAttachedDocUrl(res.downloadUrl);
      setAttachedDocName(res.fileName);
    } catch (err: any) {
      setError('Document upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const totalBps = recipients.reduce((acc, r) => acc + (Number(r.percentageBasisPoints) || 0), 0);
  const isValidBps = totalBps === SUI_CONFIG.basisPointsTotal;

  const addRecipient = () => {
    if (recipients.length >= 6) return;
    setRecipients([...recipients, { recipient: '', name: '', percentageBasisPoints: 0 }]);
  };

  const removeRecipient = (idx: number) => {
    if (recipients.length <= 1) return;
    const toRemove = recipients[idx];
    const updated = recipients.filter((_, i) => i !== idx);
    setRecipients(updated);
    // If removing the current lead, re-assign lead to the first remaining recipient
    if (leadFreelancer.toLowerCase() === toRemove.recipient.toLowerCase() && updated[0]) {
      setLeadFreelancer(updated[0].recipient);
    }
  };

  const updateRecipientField = (idx: number, field: keyof Recipient, value: any) => {
    setRecipients(recipients.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  // Convert Percentage (%) input to Basis Points (bps)
  const updateRecipientPercentage = (idx: number, pctValue: number) => {
    const bps = Math.max(0, Math.min(10000, Math.round(pctValue * 100)));
    updateRecipientField(idx, 'percentageBasisPoints', bps);
  };

  // Convert Dollar ($) input to Basis Points (bps)
  const updateRecipientDollar = (idx: number, dollarValue: number) => {
    if (totalAmount <= 0) return;
    const ratio = dollarValue / totalAmount;
    const bps = Math.max(0, Math.min(10000, Math.round(ratio * 10000)));
    updateRecipientField(idx, 'percentageBasisPoints', bps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Please enter a deliverable title.'); return; }
    if (!isValidSuiAddress(leadFreelancer)) { setError('Please enter a valid Sui address (0x...) for the Lead Freelancer.'); return; }
    for (const r of recipients) {
      if (!isValidSuiAddress(r.recipient)) {
        setError(`Please enter a valid Sui 64-hex address (0x...) for recipient: ${r.name || 'Unnamed'}`);
        return;
      }
    }
    if (!isValidBps) {
      setError(`Split total must equal exactly 100.0% (${formatUSDC(totalAmount)}). Currently allocated: ${(totalBps / 100).toFixed(1)}%`);
      return;
    }
    if (totalAmount <= 0) {
      setError('Total project escrow amount must be greater than $0.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await createEscrow({
        title,
        leadFreelancer,
        totalAmount,
        recipients,
        scopeDescription: description,
        attachedDocumentUrl: attachedDocUrl,
        attachedDocumentName: attachedDocName,
      });
      router.push(`/escrow/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create escrow order.');
      setSubmitting(false);
    }
  };

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
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Service Escrow Order</h1>
            <p className="text-xs text-slate-500 mt-0.5">Deposit full budget → Freelancer verifies agreement → Atomic team split on approval</p>
          </div>
          
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAiModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-purple-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4 animate-pulse text-amber-300" /> Auto-Fill with AI
            </button>
            <span className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white">Sui Move</span>
          </div>
        </div>
      </div>

      <DisclaimerBanner />

      {/* Main 2-Column Layout */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 flex items-center gap-2 animate-fade-in">
              <Info className="h-4 w-4 shrink-0 text-rose-600" />
              {error}
            </div>
          )}

          {/* Card: Order Details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 flex items-center gap-2">
              <span className="h-5 w-5 rounded bg-blue-600 text-white flex items-center justify-center text-[10px] font-extrabold">1</span>
              Project Details & Full Budget
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Deliverable / Service Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Modern Web Application & Figma Design Kit"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Project Description & Requirements</label>
              <textarea
                rows={3}
                placeholder="Detail the work requirements (e.g. Figma screens, responsive Next.js frontend, poster design, PDF reports)."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-all resize-none"
              />
            </div>

            {/* Optional PDF File Upload (SRS / SDD Document) */}
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Attach Official Scope / SRS / SDD Document (PDF)
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">Optional reference document for freelancer review</p>
                </div>

                <label className="cursor-pointer flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-xs transition-all">
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>{isUploadingDoc ? 'Uploading...' : 'Browse PDF'}</span>
                  <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" disabled={isUploadingDoc} />
                </label>
              </div>

              {attachedDocName && (
                <div className="mt-2.5 flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Attached: {attachedDocName}</span>
                  </div>
                  <button type="button" onClick={() => { setAttachedDocUrl(''); setAttachedDocName(''); }} className="text-rose-500 hover:text-rose-700 text-[11px]">Remove</button>
                </div>
              )}
            </div>

            {/* Total Budget Clarification */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                Total Escrow Amount (Full Contract Value) <span className="text-rose-500">*</span>
                <Tooltip text="This represents 100% of the project budget locked into the Sui smart contract, not a partial deposit." />
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-24 py-3 text-base font-extrabold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-200">USDC</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Full 100% funds are held in trust on Sui Testnet. Gas fee is <strong className="text-emerald-600">$0.00 (Sponsored)</strong>.
              </p>
            </div>
          </div>

          {/* Card: Split Distribution (Dual Dollar & Percentage) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 flex items-center gap-2">
                <span className="h-5 w-5 rounded bg-blue-600 text-white flex items-center justify-center text-[10px] font-extrabold">2</span>
                Team Split Distribution (USDC $ & %)
              </h3>
              <button
                type="button"
                onClick={addRecipient}
                disabled={recipients.length >= 6}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 disabled:opacity-40 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add Recipient
              </button>
            </div>

            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800">
              💡 <strong>Designate Team Lead:</strong> Select which recipient is the <strong>Lead Freelancer</strong>. The Lead is authorized to submit deliverables, request contract reviews, and manage disputes on behalf of the team.
            </div>

            <div className="space-y-3">
              {recipients.map((r, i) => {
                const pct = (r.percentageBasisPoints / 100).toFixed(1);
                const dollarVal = totalAmount > 0 ? ((r.percentageBasisPoints / 10000) * totalAmount).toFixed(2) : '0.00';
                const isLead = leadFreelancer.toLowerCase() === r.recipient.toLowerCase();

                return (
                  <div
                    key={i}
                    className={`rounded-2xl border p-4 space-y-3 transition-all ${
                      isLead ? 'border-blue-400 bg-blue-50/30 ring-1 ring-blue-300' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length] }} />
                        <span className="text-xs font-extrabold text-slate-800">{r.name || `Recipient ${i + 1}`}</span>
                        {isLead ? (
                          <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-xs">
                            <Crown className="h-3 w-3 text-amber-300" /> Team Lead
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setLeadFreelancer(r.recipient)}
                            className="text-[10px] font-bold text-slate-500 hover:text-blue-600 hover:underline"
                          >
                            Set as Lead
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-extrabold text-emerald-700">${dollarVal} USDC</span>
                        <button
                          type="button"
                          onClick={() => removeRecipient(i)}
                          disabled={recipients.length <= 1}
                          className="text-slate-400 hover:text-rose-500 disabled:opacity-30 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Name / Role</label>
                        <input
                          type="text"
                          placeholder="e.g. Bob (Lead Dev)"
                          value={r.name || ''}
                          onChange={(e) => updateRecipientField(i, 'name', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sui Address</label>
                        <input
                          type="text"
                          placeholder="0x..."
                          value={r.recipient}
                          onChange={(e) => updateRecipientField(i, 'recipient', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-[11px] text-slate-900 focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      {/* Dual Percentage & Dollar Inputs */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Split %</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={pct}
                            onChange={(e) => updateRecipientPercentage(i, Number(e.target.value))}
                            className="w-full rounded-xl border border-slate-200 bg-white pl-2.5 pr-6 py-2 text-xs font-extrabold text-slate-900 focus:border-blue-500 focus:outline-none"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">%</span>
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payout ($)</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max={totalAmount}
                            step="1"
                            value={Math.round(Number(dollarVal))}
                            onChange={(e) => updateRecipientDollar(i, Number(e.target.value))}
                            className="w-full rounded-xl border border-slate-200 bg-white pl-5 pr-2 py-2 text-xs font-extrabold text-emerald-800 focus:border-blue-500 focus:outline-none"
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">$</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total progress bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500">Total split allocation:</span>
                <span className={isValidBps ? 'text-emerald-600' : totalBps > 10000 ? 'text-rose-600' : 'text-amber-600'}>
                  {(totalBps / 100).toFixed(1)}% / 100% {isValidBps ? '✓ Balanced' : totalBps > 10000 ? '⚠️ Over Budget' : '⚠️ Incomplete'}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isValidBps ? 'bg-emerald-500' : totalBps > 10000 ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, (totalBps / 10000) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Submit Row */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Total Escrow Budget:</div>
              <div className="text-2xl font-extrabold text-slate-900">{formatUSDC(totalAmount)}</div>
              <div className="text-xs text-emerald-600 font-bold mt-0.5">$0.00 Gas · Dual-Signed & Sponsored</div>
            </div>

            <button
              type="submit"
              disabled={submitting || !isValidBps}
              className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-8 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Locking on Sui Testnet...</>
              ) : (
                <><Lock className="h-4 w-4" /> Deposit & Lock Escrow</>
              )}
            </button>
          </div>
        </form>

        {/* Sticky Pie Chart Sidebar */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Atomic Payout Breakdown</h3>
            <div className="flex justify-center">
              <SplitPieChart slices={pieSlices} totalAmount={totalAmount} />
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs">
              <div className="font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Guaranteed On-Chain Terms
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Upon project approval, Sui Move splits the escrow amount directly into each recipient’s wallet in <strong>a single atomic transaction</strong>. If work is not delivered, Client can cancel and claim a full refund.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Pact Builder Modal */}
      {aiModalOpen && (
        <AIPactBuilderModal
          isOpen={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
          onApply={handleApplyAIResult}
        />
      )}
    </div>
  );
}
