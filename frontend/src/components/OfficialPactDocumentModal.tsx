'use client';

import React, { useState, useEffect } from 'react';
import { EscrowItem, Recipient } from '@/context/EscrowContext';
import { STATUS_CODES } from '@/config/sui';
import { formatAddress, formatUSDC, formatDate } from '@/lib/utils';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MessageSquare,
  ShieldCheck,
  FileText,
  Lock,
  Check,
  Sparkles,
} from 'lucide-react';

interface OfficialPactDocumentModalProps {
  escrow: EscrowItem;
  isOpen: boolean;
  onClose: () => void;
  userRole: 'client' | 'freelancer' | 'guest';
  isLeadFreelancer: boolean;
  onAccept: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onNegotiate: (notes: string, proposedAmount?: number, proposedRecipients?: Recipient[]) => Promise<void>;
}

export const OfficialPactDocumentModal: React.FC<OfficialPactDocumentModalProps> = ({
  escrow,
  isOpen,
  onClose,
  userRole,
  isLeadFreelancer,
  onAccept,
  onReject,
  onNegotiate,
}) => {
  const [rejectReason, setRejectReason] = useState('');
  const [negoNotes, setNegoNotes] = useState(escrow.negotiationNotes || '');
  const [proposedBudget, setProposedBudget] = useState<number>(escrow.totalAmount);
  const [proposedRecipients, setProposedRecipients] = useState<Recipient[]>(
    escrow.recipients?.map(r => ({ ...r })) || []
  );
  const [actionView, setActionView] = useState<'preview' | 'reject' | 'negotiate'>('preview');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setProposedBudget(escrow.totalAmount);
    setNegoNotes(escrow.negotiationNotes || '');
    setProposedRecipients(escrow.recipients?.map(r => ({ ...r })) || []);
  }, [escrow]);

  if (!isOpen) return null;

  const totalBps = proposedRecipients.reduce((acc, r) => acc + (r.percentageBasisPoints || 0), 0);

  const handleRecipientPctChange = (index: number, newPct: number) => {
    const updated = [...proposedRecipients];
    updated[index] = { ...updated[index], percentageBasisPoints: Math.round(newPct * 100) };
    setProposedRecipients(updated);
  };

  const handleRecipientDollarChange = (index: number, newDollar: number) => {
    if (proposedBudget <= 0) return;
    const calcBps = Math.round((newDollar / proposedBudget) * 10000);
    const updated = [...proposedRecipients];
    updated[index] = { ...updated[index], percentageBasisPoints: calcBps };
    setProposedRecipients(updated);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAcceptSubmit = async () => {
    setLoading(true);
    try {
      await onAccept();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) return;
    setLoading(true);
    try {
      await onReject(rejectReason);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleNegotiateSubmit = async () => {
    if (!negoNotes.trim()) return;
    if (totalBps !== 10000) {
      alert('Total split percentage must equal exactly 100% before submitting counter-offer.');
      return;
    }
    setLoading(true);
    try {
      await onNegotiate(negoNotes, proposedBudget, proposedRecipients);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="official-pact-print-modal-root" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      {/* Container */}
      <div id="official-pact-print-wrapper" className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-300 my-auto overflow-hidden flex flex-col max-h-[96vh]">

        {/* Top Control Bar (Hidden on Print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-extrabold tracking-tight">Official Pact Agreement & Payment Invoice</h2>
              <p className="text-[10px] text-slate-400 font-mono">ID: {escrow.id.slice(0, 16)}... | A4 Compact Standard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Action Prompt for Lead Freelancer when Pending or Negotiating (Hidden on Print) */}
        {isLeadFreelancer && escrow.status === STATUS_CODES.LOCKED && escrow.agreementStatus !== 'accepted' && (
          <div className="print:hidden bg-amber-50 border-b border-amber-200 px-6 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
              <p className="text-xs text-amber-900 font-semibold">
                {escrow.agreementStatus === 'client_approved'
                  ? `Client APPROVED your adjusted terms ($${escrow.totalAmount} USDC)! Please review and click "Accept & Start Work" to formally begin execution (or you may still modify or decline).`
                  : escrow.agreementStatus === 'negotiating'
                  ? `Negotiation proposal active ($${escrow.totalAmount} USDC). You can modify your proposal or accept baseline terms.`
                  : 'Please review the terms and payment splits below before accepting to start work.'}
              </p>
            </div>

            {actionView === 'preview' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActionView('negotiate')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900 transition-colors cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-amber-700" />
                  <span>{escrow.agreementStatus === 'negotiating' || escrow.agreementStatus === 'client_approved' ? 'Modify Rate / Splits' : 'Negotiate Rate'}</span>
                </button>
                <button
                  onClick={() => setActionView('reject')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-700 transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5 text-rose-600" />
                  <span>Decline Project</span>
                </button>
                <button
                  onClick={handleAcceptSubmit}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5 text-white" />
                  <span>Accept &amp; Start Work</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Read-Only Verified Banner when Accepted (Hidden on Print) */}
        {escrow.agreementStatus === 'accepted' && (
          <div className="print:hidden bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 shrink-0 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-950 font-semibold">
                Official Agreement Finalized &amp; Signed on Sui zkLogin. Terms and splits are legally locked (${formatUSDC(escrow.totalAmount)} USDC).
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
              <ShieldCheck className="h-3 w-3 text-emerald-700" />
              <span>Legally Locked</span>
            </span>
          </div>
        )}

        {/* Action View: Negotiate Counter-Offer Form (Hidden on Print) */}
        {actionView === 'negotiate' && (
          <div className="print:hidden p-6 bg-slate-50 border-b border-slate-200 space-y-4 shrink-0 max-h-[50vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase text-slate-800">
                {escrow.agreementStatus === 'negotiating' ? 'Modify Adjusted Rate or Split Schedule' : 'Propose Adjusted Rate or Terms'}
              </h3>
              <button onClick={() => setActionView('preview')} className="text-xs text-slate-500 hover:underline">Cancel</button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Proposed Total Budget (USDC)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="10"
                    value={proposedBudget}
                    onChange={(e) => setProposedBudget(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white pl-3 pr-16 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-600">USDC</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Baseline Contract Budget</label>
                <div className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                  {formatUSDC(escrow.originalTotalAmount || escrow.totalAmount)} USDC
                </div>
              </div>
            </div>

            {/* Split Schedule Adjustment Inputs */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-700">Team Split Allocation Schedule</label>
                <div className="flex items-center justify-between text-xs font-bold pt-1">
                  <span className={totalBps === 10000 ? 'text-emerald-700' : 'text-rose-600'}>
                    Total: {(totalBps / 100).toFixed(0)}% (${((totalBps / 10000) * proposedBudget).toFixed(2)} USDC) {totalBps !== 10000 && '(Split must equal 100%)'}
                  </span>
                </div>
              </div>
              <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                {proposedRecipients.map((r, i) => {
                  const pct = (r.percentageBasisPoints || 0) / 100;
                  const dollar = (pct / 100) * proposedBudget;
                  return (
                    <div key={i} className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="font-bold text-slate-800 truncate">{r.name || `Member ${i + 1}`}</span>
                        {r.recipient.toLowerCase() === escrow.leadFreelancer.toLowerCase() && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 rounded">Lead</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={pct}
                            onChange={(e) => handleRecipientPctChange(i, Number(e.target.value))}
                            className="w-14 rounded-lg border border-slate-300 px-2 py-1 text-right text-xs font-bold text-slate-900 focus:border-blue-500"
                          />
                          <span className="text-[11px] text-slate-500 font-bold">%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-slate-500 font-bold">$</span>
                          <input
                            type="number"
                            min="0"
                            max={proposedBudget}
                            value={Math.round(dollar)}
                            onChange={(e) => handleRecipientDollarChange(i, Number(e.target.value))}
                            className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-right text-xs font-bold text-emerald-700 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Reason / Counter-Offer Notes</label>
              <textarea
                rows={2}
                required
                placeholder="Explain the reason for adjustment (e.g. 'Project scope requires 2 extra API integrations')."
                value={negoNotes}
                onChange={(e) => setNegoNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleNegotiateSubmit}
              disabled={loading || !negoNotes.trim() || totalBps !== 10000}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50"
            >
              {escrow.agreementStatus === 'negotiating'
                ? `Update Counter-Offer ($${proposedBudget} USDC)`
                : `Submit Counter-Offer ($${proposedBudget} USDC) to Client`}
            </button>
          </div>
        )}

        {/* Action View: Decline / Reject Form (Hidden on Print) */}
        {actionView === 'reject' && (
          <div className="print:hidden p-6 bg-rose-50 border-b border-rose-200 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase text-rose-800">Decline Pact Agreement (100% Refund to Client)</h3>
              <button onClick={() => setActionView('preview')} className="text-xs text-slate-500 hover:underline">Cancel</button>
            </div>
            <textarea
              rows={2}
              required
              placeholder="State reason for declining this project (e.g. 'Scope exceeds capacity' or 'Budget misaligned')."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-xl border border-rose-300 bg-white p-3 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
            />
            <button
              onClick={handleRejectSubmit}
              disabled={loading || !rejectReason.trim()}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-sm"
            >
              Confirm Decline & Refund Client
            </button>
          </div>
        )}

        {/* ── Document Body (Strict B&W High-Density A4 Sheet) ── */}
        <div id="official-pact-print-body" className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 text-slate-950 font-sans print:p-0 print:m-0 print:overflow-visible print:bg-white">
          
          <div
            id="official-document-sheet"
            className="w-full max-w-[210mm] mx-auto border-2 border-black p-4 sm:p-5 bg-white text-black space-y-2 print:border-[1.5px] print:border-black print:p-3.5 text-[10.5px] leading-snug"
            style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
          >
            {/* Header: Letterhead */}
            <div className="border-b-2 border-black pb-2 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="SuiPact" className="h-7 w-7 object-contain grayscale" />
                <div>
                  <h1 className="text-sm font-bold tracking-tight uppercase leading-tight">SuiPact Network Protocol</h1>
                  <p className="text-[9px] text-black">Zero-Gas Decentralized Service Escrow &amp; Smart Payouts</p>
                  <p className="text-[8px] text-slate-600 font-mono">Contract: 0x8c57edf140ac229fb7e11652e8d9dcded7fd63dda683adfd7fd9c5bed1db5a18</p>
                </div>
              </div>

              <div className="text-right text-[9px] space-y-0.5 shrink-0">
                <div><strong>DOC REF:</strong> SP-{escrow.id.slice(2, 10).toUpperCase()}</div>
                <div><strong>DATE ISSUED:</strong> {formatDate(escrow.createdAt)}</div>
                <div><strong>NETWORK:</strong> Sui Testnet (Dual zkLogin)</div>
                <div><strong>STATUS:</strong> <span className="uppercase font-bold">{escrow.agreementStatus}</span></div>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="border border-black py-1 px-2 text-center bg-slate-100 font-bold uppercase tracking-wider text-[11px]">
              OFFICIAL SERVICE AGREEMENT &amp; ESCROW PAYMENT ORDER
              <div className="text-[9px] font-normal lowercase tracking-normal text-slate-700">
                (Official Sui Smart Contract Escrow Order &amp; Milestone Agreement)
              </div>
            </div>

            {/* Section 1: Contract Metadata Table */}
            <div className="space-y-0.5">
              <div className="font-bold uppercase text-[9.5px] border-b border-black pb-0.5">
                1. CONTRACT DETAILS &amp; INVOLVED PARTIES
              </div>
              <table className="w-full border-collapse border border-black text-[9.5px]">
                <tbody>
                  <tr className="border-b border-black">
                    <td className="w-1/3 p-1 bg-slate-100 font-bold border-r border-black">Project Title / Scope</td>
                    <td className="p-1 font-bold">{escrow.title}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="p-1 bg-slate-100 font-bold border-r border-black">Client (Principal)</td>
                    <td className="p-1">
                      <span className="font-bold">{escrow.clientName || 'Authorized Client'}</span>
                      <div className="font-mono text-[8px] text-slate-700">{escrow.client}</div>
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="p-1 bg-slate-100 font-bold border-r border-black">Lead Freelancer (Contractor)</td>
                    <td className="p-1">
                      <span className="font-bold">{escrow.freelancerName || 'Designated Lead Freelancer'}</span>
                      <div className="font-mono text-[8px] text-slate-700">{escrow.leadFreelancer}</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-1 bg-slate-100 font-bold border-r border-black">Total Locked Escrow Deposit</td>
                    <td className="p-1 font-bold text-[11px]">
                      {formatUSDC(escrow.totalAmount)} USDC (100% Locked on Sui)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 2: Project Scope & Deliverables */}
            <div className="space-y-0.5">
              <div className="font-bold uppercase text-[9.5px] border-b border-black pb-0.5">
                2. SCOPE OF WORK &amp; DELIVERABLES SPECIFICATION
              </div>
              <div className="border border-black p-1.5 text-[9.5px] leading-relaxed bg-slate-50">
                <p>{escrow.scopeDescription || 'Work specifications include UI design, smart contract coding, and official deliverable verification as mutually agreed upon.'}</p>
                {escrow.attachedDocumentName && (
                  <div className="mt-1 pt-1 border-t border-dashed border-slate-400 font-bold text-[8.5px]">
                    Attached Specification Document: {escrow.attachedDocumentName}
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Payment Split Schedule Table */}
            <div className="space-y-0.5">
              <div className="font-bold uppercase text-[9.5px] border-b border-black pb-0.5">
                3. TEAM SPLIT &amp; PAYOUT DISTRIBUTION SCHEDULE
              </div>
              <table className="w-full border-collapse border border-black text-[9px] text-left">
                <thead>
                  <tr className="bg-slate-100 border-b border-black font-bold">
                    <th className="p-1 border-r border-black w-7 text-center">No.</th>
                    <th className="p-1 border-r border-black">Recipient &amp; Role</th>
                    <th className="p-1 border-r border-black font-mono">Sui Testnet Address</th>
                    <th className="p-1 border-r border-black text-center w-14">Ratio %</th>
                    <th className="p-1 text-right w-20">Amount (USDC)</th>
                  </tr>
                </thead>
                <tbody>
                  {escrow.recipients.map((r, i) => {
                    const pct = (r.percentageBasisPoints / 100).toFixed(1);
                    const payout = (escrow.totalAmount * r.percentageBasisPoints) / 10000;
                    return (
                      <tr key={i} className="border-b border-black">
                        <td className="p-0.5 border-r border-black text-center">{i + 1}</td>
                        <td className="p-0.5 border-r border-black font-bold">{r.name || `Recipient ${i + 1}`}</td>
                        <td className="p-0.5 border-r border-black font-mono text-[8px]">{formatAddress(r.recipient, 8)}</td>
                        <td className="p-0.5 border-r border-black text-center font-bold">{pct}%</td>
                        <td className="p-0.5 text-right font-bold font-mono">${payout.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-100 font-bold border-t border-black">
                    <td colSpan={3} className="p-0.5 border-r border-black text-right uppercase">Total Contract Escrow Value:</td>
                    <td className="p-0.5 border-r border-black text-center">100.0%</td>
                    <td className="p-0.5 text-right font-mono text-[10px]">{formatUSDC(escrow.totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 4: Key Legal & Settlement Clauses */}
            <div className="space-y-0.5 text-[8.5px] leading-tight text-slate-800">
              <div className="font-bold uppercase text-[9px] text-black border-b border-black pb-0.5">
                4. SETTLEMENT &amp; CANCELLATION TERMS
              </div>
              <ul className="list-disc pl-3.5 space-y-0.5">
                <li><strong>Fund Guarantee:</strong> 100% of escrow funds are securely locked and protected on-chain in the Sui Move Smart Contract (Non-Custodial).</li>
                <li><strong>Early Cancellation:</strong> Client reserves the right to cancel and receive a 100% refund if the Lead Freelancer has not commenced work.</li>
                <li><strong>Mid-Project Termination:</strong> If cancellation occurs after work has begun, a 25% compensation penalty is allocated to the freelancer team.</li>
                <li><strong>AI Dispute Resolution:</strong> If disagreements arise, SuiPact AI Mediator audits deliverable proofs and proposes an objective settlement before mutual release.</li>
              </ul>
            </div>

            {/* Section 5: Signature & Verification Blocks */}
            <div className="pt-1 border-t-2 border-black grid grid-cols-2 gap-3 text-[9px]">
              <div className="border border-black p-1.5 space-y-1">
                <div className="font-bold uppercase text-[8.5px]">PREPARED &amp; LOCKED BY (CLIENT):</div>
                <div className="h-5 flex items-center justify-center font-mono text-[8px] text-slate-500 italic bg-slate-50 rounded">
                  [ Cryptographically Signed via Sui zkLogin ]
                </div>
                <div className="border-t border-black pt-0.5 space-y-0.5">
                  <div><strong>Name:</strong> {escrow.clientName || 'Client Principal'}</div>
                  <div className="font-mono text-[7.5px] truncate"><strong>Address:</strong> {escrow.client}</div>
                  <div><strong>Date:</strong> {formatDate(escrow.createdAt)}</div>
                </div>
              </div>

              <div className="border border-black p-1.5 space-y-1">
                <div className="font-bold uppercase text-[8.5px]">VERIFIED &amp; ACCEPTED BY (LEAD FREELANCER):</div>
                <div className="h-5 flex items-center justify-center font-mono text-[8px] text-slate-500 italic bg-slate-50 rounded">
                  {escrow.agreementStatus === 'accepted' ? (
                    <span className="text-black font-bold">[ VERIFIED &amp; ACCEPTED ON SUI NETWORK ]</span>
                  ) : (
                    '[ Awaiting Freelancer Acceptance Signature ]'
                  )}
                </div>
                <div className="border-t border-black pt-0.5 space-y-0.5">
                  <div><strong>Name:</strong> {escrow.freelancerName || 'Lead Freelancer'}</div>
                  <div className="font-mono text-[7.5px] truncate"><strong>Address:</strong> {escrow.leadFreelancer}</div>
                  <div><strong>Status:</strong> <span className="uppercase font-bold">{escrow.agreementStatus}</span></div>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="text-center text-[7.5px] text-slate-500 pt-0.5 border-t border-slate-200">
              This agreement is automatically generated by SuiPact Protocol. Cryptographically verified on the Sui Testnet blockchain without requiring physical seal.
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
