'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useEscrow } from '@/context/EscrowContext';
import { StatusBadge } from '@/components/StatusBadge';
import { StatusTimeline } from '@/components/StatusTimeline';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { PTBFlowVisualizer } from '@/components/PTBFlowVisualizer';
import { AIDeliverableAuditCard } from '@/components/AIDeliverableAuditCard';
import { STATUS_CODES, getSuiScanTxUrl, getSuiScanObjectUrl } from '@/config/sui';

import { formatUSDC, formatAddress, formatDate, sanitizeDeliverableUri } from '@/lib/utils';
import {
  ArrowLeft,
  ExternalLink,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Send,
  Loader2,
  FileCheck,
  Users,
  Copy,
  Check,
  Lock,
  Shield,
  ShieldAlert,
  Hash,
  Fingerprint,
} from 'lucide-react';

// ── SHA-256 fingerprint of a proof URI ──────────────────────────────────────
async function sha256Fingerprint(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function EscrowDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { user } = useAuth();
  const { getEscrowById, submitDeliverable, approveAndRelease, refundClient, raiseDispute, agreeToRelease } = useEscrow();

  const escrow = getEscrowById(id);

  const [proofInput, setProofInput] = useState('');
  const [proofFingerprint, setProofFingerprint] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPTBVisualizer, setShowPTBVisualizer] = useState(false);
  const [pendingTxDigest, setPendingTxDigest] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'refund' | 'dispute' | null>(null);

  const searchParams = useSearchParams();
  const isNew = searchParams?.get('new') === 'true';

  useEffect(() => {
    if (isNew && escrow) {
      setSuccessMessage('🎉 Escrow created and deposit locked successfully!');
      window.history.replaceState(null, '', `/escrow/${id}`);
    }
  }, [isNew, escrow, id]);

  if (!escrow) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Lock className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Escrow Order Not Found</h2>
        <p className="text-xs text-slate-500">The requested escrow object ID does not exist or has expired from local state.</p>
        <Link href="/dashboard" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>
      </div>
    );
  }

  const userAddr = user?.address?.toLowerCase();
  const isClient = !!userAddr && !!escrow.client && userAddr === escrow.client.toLowerCase();
  const isFreelancer = !!userAddr && !!escrow.leadFreelancer && userAddr === escrow.leadFreelancer.toLowerCase();
  const isRecipient = escrow.recipients.some((r) => r.recipient?.toLowerCase() === userAddr);

  const copyId = () => { navigator.clipboard.writeText(escrow.id); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  // Compute SHA-256 fingerprint as user types proof URI
  const handleProofChange = async (val: string) => {
    setProofInput(val);
    if (val.trim().length > 5) {
      const hash = await sha256Fingerprint(val.trim());
      setProofFingerprint(hash);
    } else {
      setProofFingerprint(null);
    }
  };

  const handleDeliver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFreelancer) {
      setErrorMessage(`Security Warning: Only the Lead Freelancer (${escrow.freelancerName || escrow.leadFreelancer}) can submit proof.`);
      return;
    }
    const { isValid, sanitizedUrl } = sanitizeDeliverableUri(proofInput);
    if (!isValid || !sanitizedUrl) {
      setErrorMessage('Security Alert: Invalid deliverable URL. Only secure https://, http:// or ipfs:// URLs are permitted.');
      return;
    }
    setLoadingAction('deliver');
    setErrorMessage(null);
    try {
      await submitDeliverable(escrow.id, sanitizedUrl);
      setSuccessMessage('✅ Proof of delivery submitted on Sui Testnet! SHA-256 fingerprint recorded as immutable commitment.');
      setProofInput('');
      setProofFingerprint(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting deliverable');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleApprove = async () => {
    if (!isClient) {
      setErrorMessage(`Security Violation: Only the verified Client (${escrow.clientName || escrow.client}) can approve payout release.`);
      return;
    }
    setLoadingAction('approve');
    setErrorMessage(null);
    // Show the PTB visualizer immediately
    setShowPTBVisualizer(true);
    try {
      const res = await approveAndRelease(escrow.id);
      setPendingTxDigest(res.digest);
      // Visualizer will call onComplete when animation finishes
    } catch (err: any) {
      setShowPTBVisualizer(false);
      setErrorMessage(err.message || 'Error releasing payout');
      setLoadingAction(null);
    }
  };

  const handlePTBComplete = useCallback(() => {
    setShowPTBVisualizer(false);
    setLoadingAction(null);
    setSuccessMessage(`🎉 Atomic split payout released to ${escrow.recipients.length} recipients in 1 PTB! $0 gas charged to users.${pendingTxDigest ? ` Tx: ${pendingTxDigest}` : ''}`);
  }, [escrow.recipients.length, pendingTxDigest]);

  const handleRefund = async () => {
    if (!isClient) { setErrorMessage(`Security Violation: Only the Client can refund this escrow.`); return; }
    if (confirmAction !== 'refund') { setConfirmAction('refund'); return; }
    setLoadingAction('refund');
    setConfirmAction(null);
    setErrorMessage(null);
    try {
      const res = await refundClient(escrow.id);
      setSuccessMessage(`Deposit refunded to client wallet. Tx: ${res.digest}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error refunding client');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDispute = async () => {
    if (!isClient && !isFreelancer) { setErrorMessage('Security Violation: Only contract parties can raise disputes.'); return; }
    if (confirmAction !== 'dispute') { setConfirmAction('dispute'); return; }
    setLoadingAction('dispute');
    setConfirmAction(null);
    setErrorMessage(null);
    try {
      await raiseDispute(escrow.id);
      setSuccessMessage('Dispute raised. Mutual consent required to resolve.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error raising dispute');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAgree = async () => {
    if (!isClient && !isFreelancer) { setErrorMessage('Security Violation: Only contract parties can register mutual agreement.'); return; }
    setLoadingAction('agree');
    setErrorMessage(null);
    try {
      await agreeToRelease(escrow.id);
      setSuccessMessage('Mutual agreement registered on-chain.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error registering agreement');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* PTB Animated Flow Overlay */}
      {showPTBVisualizer && (
        <PTBFlowVisualizer
          totalAmount={escrow.totalAmount}
          recipients={escrow.recipients.map((r) => ({
            name: r.name,
            payout: (escrow.totalAmount * r.percentageBasisPoints) / 10000,
            address: r.recipient,
          }))}
          onComplete={handlePTBComplete}
        />
      )}

      {/* Blue Header Bar */}
      <div className="bg-blue-gradient px-4 sm:px-6 lg:px-8 py-5">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-100 hover:text-white transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to My Orders
            </Link>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white">{user?.name || 'Guest'}</span>
              <span className="text-[10px] font-extrabold text-yellow-300 uppercase bg-yellow-400/20 px-1.5 rounded">
                {isClient ? 'CLIENT' : isFreelancer ? 'FREELANCER' : isRecipient ? 'RECIPIENT' : 'OBSERVER'}
              </span>
              <Link href="/login" className="text-[10px] text-blue-200 hover:text-white font-semibold">Switch</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <DisclaimerBanner />

        {/* Alerts */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-900 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2.5"><ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />{errorMessage}</div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-600 font-bold hover:text-rose-800">✕</button>
          </div>
        )}
        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />{successMessage}</div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 font-bold hover:text-emerald-800">✕</button>
          </div>
        )}

        {/* Main Card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Title Row */}
          <div className="p-6 sm:p-8 border-b border-slate-100">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{escrow.title}</h1>
                  <StatusBadge status={escrow.status} />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                  <span>Object: {formatAddress(escrow.id, 8)}</span>
                  <button onClick={copyId} className="rounded p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Copy Object ID">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <a href={getSuiScanObjectUrl(escrow.id)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 font-sans font-bold">
                    Explorer <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              <div className="text-left md:text-right shrink-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Locked Escrow</div>
                <div className="text-3xl font-extrabold text-slate-900">{formatUSDC(escrow.totalAmount)}</div>
                <div className="text-[11px] font-bold text-blue-600">Testnet USDC</div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Parties */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {[
                { label: 'Client / Buyer', sub: 'Authorized Approver', name: escrow.clientName, addr: escrow.client, isYou: isClient, youLabel: '✓ You (Owner)' },
                { label: 'Lead Freelancer', sub: 'Authorized Deliverer', name: escrow.freelancerName, addr: escrow.leadFreelancer, isYou: isFreelancer, youLabel: '✓ You (Seller)' },
              ].map((p, i) => (
                <div key={i} className={`rounded-xl border p-4 transition-all ${p.isYou ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-400 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400">{p.label} — {p.sub}</span>
                    {p.isYou && <span className="text-[9px] font-extrabold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">{p.youLabel}</span>}
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">{p.name || 'Unknown'}</div>
                  <div className="font-mono text-[11px] text-slate-400 mt-0.5 truncate">{p.addr}</div>
                </div>
              ))}
            </div>

            {/* Status Timeline */}
            <StatusTimeline status={escrow.status} txHistory={escrow.txHistory} />

            {/* Deliverable Proof Section */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-blue-600" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">On-Chain Proof of Delivery</h4>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">Immutable URI bound to Move object</span>
              </div>

              {escrow.deliveryProofUri ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-mono text-xs text-blue-700 font-bold truncate flex-1">{escrow.deliveryProofUri}</div>
                      <a
                        href={sanitizeDeliverableUri(escrow.deliveryProofUri).sanitizedUrl || '#'}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
                      >
                        Inspect Deliverable <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  {/* SHA-256 Fingerprint of submitted URI */}
                  <ProofFingerprint uri={escrow.deliveryProofUri} />

                  {/* AI Deliverable Quality Audit Card */}
                  <AIDeliverableAuditCard
                    escrowTitle={escrow.title}
                    scopeDescription={escrow.title}
                    deliverableUrl={escrow.deliveryProofUri}
                  />
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic leading-relaxed">
                  No deliverable proof submitted yet. The lead freelancer will attach their GitHub PR, Figma URL, or IPFS CID when work is complete.
                </div>
              )}

              {/* Submission Form */}
              {escrow.status === STATUS_CODES.LOCKED && (
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  {isFreelancer ? (
                    <form onSubmit={handleDeliver} className="space-y-3">
                      <label className="block text-xs font-extrabold text-slate-800">
                        Submit Deliverable Proof URI
                        <span className="text-slate-400 font-normal ml-1">(GitHub PR / Figma / IPFS link)</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="https://github.com/org/repo/pull/123"
                          value={proofInput}
                          onChange={(e) => handleProofChange(e.target.value)}
                          className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                        <button
                          type="submit"
                          disabled={loadingAction === 'deliver'}
                          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-all"
                        >
                          {loadingAction === 'deliver' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                          Submit ($0 Gas)
                        </button>
                      </div>

                      {/* Live SHA-256 fingerprint preview */}
                      {proofFingerprint && (
                        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 space-y-1.5 animate-fade-in">
                          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-blue-700 uppercase">
                            <Fingerprint className="h-3.5 w-3.5" /> SHA-256 Fingerprint (Immutable On-Chain Commitment)
                          </div>
                          <div className="font-mono text-[10px] text-slate-700 break-all leading-relaxed bg-white rounded-lg px-2 py-1.5 border border-blue-100">
                            {proofFingerprint}
                          </div>
                          <div className="text-[10px] text-blue-600 font-medium">
                            This hash will be recorded on Sui as proof that this exact URI was submitted at this moment.
                          </div>
                        </div>
                      )}
                    </form>
                  ) : (
                    <div className="rounded-xl bg-white border border-slate-200 p-3 text-xs text-slate-500 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                      Submission restricted to Lead Freelancer ({escrow.freelancerName || formatAddress(escrow.leadFreelancer, 6)}).
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Multi-Recipient Split Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    Atomic Split Payout ({escrow.recipients.length} Recipient{escrow.recipients.length > 1 ? 's' : ''})
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Single PTB · 1 Transaction
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Recipient</th>
                      <th className="py-2.5 px-4">Sui Address</th>
                      <th className="py-2.5 px-4 text-right">Share</th>
                      <th className="py-2.5 px-4 text-right">Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                    {escrow.recipients.map((r, idx) => {
                      const pct = (r.percentageBasisPoints / 100).toFixed(2);
                      const amount = (escrow.totalAmount * r.percentageBasisPoints) / 10000;
                      const isCurrent = userAddr === r.recipient?.toLowerCase();
                      return (
                        <tr key={idx} className={isCurrent ? 'bg-blue-50/60' : 'hover:bg-slate-50'}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{r.name || `Recipient #${idx + 1}`}</span>
                              {isCurrent && <span className="rounded bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5">You</span>}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500">{formatAddress(r.recipient, 6)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold">{r.percentageBasisPoints} bps ({pct}%)</td>
                          <td className="py-3 px-4 text-right font-extrabold text-emerald-700">{formatUSDC(amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Security notice for non-clients viewing delivered state */}
            {escrow.status === STATUS_CODES.DELIVERED && !isClient && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-3 text-xs">
                <Shield className="h-5 w-5 text-slate-400 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900">Cryptographic Authorization Protection Active</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    You're viewing as <strong>{user?.name}</strong>. On-chain Move security restricts payout approval strictly to the Client (<strong>{escrow.clientName || formatAddress(escrow.client, 6)}</strong>).
                  </p>
                </div>
              </div>
            )}

            {/* Action Controls */}
            <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2 text-xs font-bold text-blue-700 w-fit">
                <Zap className="h-3.5 w-3.5 text-yellow-500" /> $0.00 Gas Sponsored by Relayer
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* LOCKED: Client can refund */}
                {escrow.status === STATUS_CODES.LOCKED && isClient && (
                  confirmAction === 'refund' ? (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2 text-xs">
                      <span className="font-bold text-rose-800 px-2">Are you sure?</span>
                      <button onClick={() => setConfirmAction(null)} className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                      <button onClick={handleRefund} disabled={loadingAction === 'refund'} className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-1.5 font-bold text-white hover:bg-rose-700 transition-all disabled:opacity-50">
                        {loadingAction === 'refund' ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                        Confirm Refund
                      </button>
                    </div>
                  ) : (
                    <button onClick={handleRefund}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all">
                      <RotateCcw className="h-3.5 w-3.5" /> Refund Deposit
                    </button>
                  )
                )}

                {/* DELIVERED: Client can dispute or approve */}
                {escrow.status === STATUS_CODES.DELIVERED && isClient && (
                  <>
                    {confirmAction === 'dispute' ? (
                      <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2 text-xs">
                        <span className="font-bold text-rose-800 px-2">Lock funds?</span>
                        <button onClick={() => setConfirmAction(null)} className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                        <button onClick={handleDispute} disabled={loadingAction === 'dispute'} className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-1.5 font-bold text-white hover:bg-rose-700 transition-all disabled:opacity-50">
                          {loadingAction === 'dispute' ? <Loader2 className="h-3 w-3 animate-spin" /> : <AlertTriangle className="h-3 w-3" />}
                          Confirm Dispute
                        </button>
                      </div>
                    ) : (
                      <button onClick={handleDispute}
                        className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-all">
                        <AlertTriangle className="h-3.5 w-3.5" /> Raise Dispute
                      </button>
                    )}

                    <button onClick={handleApprove} disabled={!!loadingAction}
                      className="flex items-center gap-2 rounded-xl bg-blue-gradient px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-800/20 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50">
                      {loadingAction === 'approve' ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Executing PTB...</>
                      ) : (
                        <><Zap className="h-4 w-4 text-yellow-300" /> Approve & Release Split Payout</>
                      )}
                    </button>
                  </>
                )}

                {/* DELIVERED: Non-client sees lock */}
                {escrow.status === STATUS_CODES.DELIVERED && !isClient && (
                  <div className="flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-4 py-2.5 text-xs text-slate-500 font-semibold">
                    <Lock className="h-4 w-4 text-slate-400" />
                    Release locked — awaiting Client ({escrow.clientName || formatAddress(escrow.client, 4)})
                  </div>
                )}

                {/* DISPUTED: Contract parties can agree */}
                {escrow.status === STATUS_CODES.DISPUTED && (isClient || isFreelancer) && (
                  <button onClick={handleAgree} disabled={loadingAction === 'agree'}
                    className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-700 transition-all disabled:opacity-50">
                    {loadingAction === 'agree' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Agree to Release (Mutual Consent)
                  </button>
                )}

                {/* RELEASED */}
                {escrow.status === STATUS_CODES.RELEASED && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Order Settled · All Payouts Disbursed
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tx Audit Log */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Hash className="h-4 w-4 text-blue-600" /> On-Chain Transaction Audit Log
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {escrow.txHistory.map((tx, idx) => (
              <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                  <span className="font-bold text-slate-900">{tx.action}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-500">
                  <span>{formatDate(tx.timestamp)}</span>
                  <a href={getSuiScanTxUrl(tx.digest)} target="_blank" rel="noopener noreferrer"
                    className="font-mono font-bold text-blue-700 hover:underline flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                    {formatAddress(tx.digest, 6)} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SHA-256 fingerprint display for already-submitted proof ────────────────
function ProofFingerprint({ uri }: { uri: string }) {
  const [hash, setHash] = React.useState<string | null>(null);

  React.useEffect(() => {
    sha256Fingerprint(uri).then(setHash);
  }, [uri]);

  if (!hash) return null;

  return (
    <div className="rounded-xl bg-violet-50 border border-violet-100 p-3 space-y-1.5">
      <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-violet-700 uppercase">
        <Fingerprint className="h-3.5 w-3.5" /> Immutable SHA-256 Proof Fingerprint
      </div>
      <div className="font-mono text-[10px] text-slate-700 break-all leading-relaxed bg-white rounded-lg px-2 py-1.5 border border-violet-100">
        {hash}
      </div>
      <div className="text-[10px] text-violet-600 font-medium">
        This cryptographic hash proves exactly which deliverable URI was bound to this escrow on-chain. Tampering with the URI would invalidate this fingerprint.
      </div>
    </div>
  );
}
