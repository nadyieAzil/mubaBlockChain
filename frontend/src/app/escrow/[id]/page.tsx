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
import { OfficialPactDocumentModal } from '@/components/OfficialPactDocumentModal';
import { PDFDocumentViewerModal } from '@/components/PDFDocumentViewerModal';
import { STATUS_CODES, getSuiScanTxUrl, getSuiScanObjectUrl } from '@/config/sui';
import { formatUSDC, formatAddress, formatDate, sanitizeDeliverableUri } from '@/lib/utils';
import { uploadDocument } from '@/lib/firebase';
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
  FileText,
  MessageSquare,
  Sparkles,
  Bot,
  Crown,
  Eye,
  X,
  UploadCloud,
  Paperclip,
} from 'lucide-react';

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
  const {
    getEscrowById,
    submitDeliverable,
    approveAndRelease,
    refundClient,
    raiseDispute,
    agreeToRelease,
    acceptAgreement,
    rejectAgreement,
    negotiateAgreement,
    clientApproveNegotiation,
    rejectNegotiation,
    requestRework,
    cancelWithPenalty,
  } = useEscrow();

  const escrow = getEscrowById(id);

  const [proofInput, setProofInput] = useState('');
  const [proofFingerprint, setProofFingerprint] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPTBVisualizer, setShowPTBVisualizer] = useState(false);
  const [pendingTxDigest, setPendingTxDigest] = useState<string | null>(null);

  // Modals & Forms State
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [showReleaseConfirmModal, setShowReleaseConfirmModal] = useState(false);
  const [showDisputeConfirmModal, setShowDisputeConfirmModal] = useState(false);
  const [showReworkInput, setShowReworkInput] = useState(false);
  const [reworkComment, setReworkComment] = useState('');
  const [showPenaltyCancelModal, setShowPenaltyCancelModal] = useState(false);
  const [deliverableDocName, setDeliverableDocName] = useState<string>('');
  const [deliverableDocUrl, setDeliverableDocUrl] = useState<string>('');
  const [isUploadingDeliverableDoc, setIsUploadingDeliverableDoc] = useState(false);
  const [viewingPDF, setViewingPDF] = useState<{ url: string; name: string; title: string } | null>(null);

  const searchParams = useSearchParams();
  const isNew = searchParams?.get('new') === 'true';

  useEffect(() => {
    if (isNew && escrow) {
      setSuccessMessage('🎉 Escrow created and full contract deposit locked successfully!');
      window.history.replaceState(null, '', `/escrow/${id}`);
    }
  }, [isNew, escrow, id]);

  // Pre-fill deliverable URI and existing attachments if rework is requested
  useEffect(() => {
    if (escrow?.isRevisionRequested && escrow.deliveryProofUri && !proofInput) {
      setProofInput(escrow.deliveryProofUri);
    }
    if (escrow?.deliverableAttachmentName && !deliverableDocName) {
      setDeliverableDocName(escrow.deliverableAttachmentName);
      setDeliverableDocUrl(escrow.deliverableAttachmentUrl || '');
    }
  }, [escrow?.isRevisionRequested, escrow?.deliveryProofUri, escrow?.deliverableAttachmentName]);

  const handleDeliverableDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please upload a PDF document (.pdf only).');
      return;
    }

    setIsUploadingDeliverableDoc(true);
    setErrorMessage(null);
    try {
      const res = await uploadDocument(file);
      setDeliverableDocUrl(res.downloadUrl);
      setDeliverableDocName(res.fileName);
      setSuccessMessage(`Document "${file.name}" attached successfully.`);
    } catch (err: any) {
      setErrorMessage('Document upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploadingDeliverableDoc(false);
    }
  };

  const userAddr = user?.address?.toLowerCase();
  const isClient = !!userAddr && !!escrow?.client && userAddr === escrow.client.toLowerCase();
  const isFreelancer = !!userAddr && !!escrow?.leadFreelancer && userAddr === escrow.leadFreelancer.toLowerCase();
  const isRecipient = escrow?.recipients.some((r) => r.recipient?.toLowerCase() === userAddr);

  // Auto-open agreement for Lead Freelancer if pending
  useEffect(() => {
    if (escrow && isFreelancer && escrow.agreementStatus === 'pending') {
      setShowAgreementModal(true);
    }
  }, [isFreelancer, escrow?.agreementStatus]);

  if (!escrow) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg border border-slate-200 space-y-4">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Escrow Contract Not Found</h2>
          <p className="text-xs text-slate-500">The escrow object with ID {formatAddress(id, 8)} does not exist or has expired.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const copyId = () => {
    navigator.clipboard.writeText(escrow.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProofChange = async (val: string) => {
    setProofInput(val);
    if (val.trim().length > 5) {
      const hash = await sha256Fingerprint(val.trim());
      setProofFingerprint(hash);
    } else {
      setProofFingerprint(null);
    }
  };

  // Submit Deliverable (Lead Freelancer Only)
  const handleDeliver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofInput.trim()) return;

    const { sanitizedUrl, isValid } = sanitizeDeliverableUri(proofInput);
    if (!isValid || !sanitizedUrl) {
      setErrorMessage('Security Warning: Deliverable URI must be a valid https://, ipfs://, or ar:// URI.');
      return;
    }

    setLoadingAction('deliver');
    setErrorMessage(null);
    try {
      await submitDeliverable(
        escrow.id,
        sanitizedUrl,
        deliverableDocUrl || undefined,
        deliverableDocName || undefined
      );
      setSuccessMessage(
        escrow.isRevisionRequested
          ? 'Revised deliverable and updated documents submitted successfully! Client notified for review.'
          : 'Deliverable submitted successfully! Client has been notified for review.'
      );
      setProofInput('');
      setProofFingerprint(null);
      setDeliverableDocName('');
      setDeliverableDocUrl('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit deliverable.');
    } finally {
      setLoadingAction(null);
    }
  };

  // Rework Submission (Client Only)
  const handleReworkSubmit = async () => {
    if (!reworkComment.trim()) return;
    setLoadingAction('rework');
    try {
      await requestRework(escrow.id, reworkComment.trim());
      setSuccessMessage('Revision requested. Lead Freelancer has been notified with your feedback.');
      setReworkComment('');
      setShowReworkInput(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to request rework.');
    } finally {
      setLoadingAction(null);
    }
  };

  // Release Execution (with PTB animation)
  const executeRelease = async () => {
    setShowReleaseConfirmModal(false);
    setLoadingAction('release');
    setErrorMessage(null);
    try {
      const { digest } = await approveAndRelease(escrow.id);
      setPendingTxDigest(digest);
      setShowPTBVisualizer(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to release payout.');
      setLoadingAction(null);
    }
  };

  const handlePTBComplete = useCallback(() => {
    setShowPTBVisualizer(false);
    setLoadingAction(null);
    setSuccessMessage(`Payment released atomically to all ${escrow.recipients.length} team members!`);
  }, [escrow.recipients.length]);

  // Full Refund Client
  const handleFullRefund = async () => {
    setLoadingAction('refund');
    setErrorMessage(null);
    try {
      await refundClient(escrow.id);
      setSuccessMessage('100% Escrow deposit refunded back to your wallet.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to refund escrow.');
    } finally {
      setLoadingAction(null);
    }
  };

  // Cancel with 25% Penalty
  const handlePenaltyCancel = async () => {
    setShowPenaltyCancelModal(false);
    setLoadingAction('cancel_penalty');
    try {
      await cancelWithPenalty(escrow.id);
      setSuccessMessage(`Project cancelled mid-way. 75% refunded to Client, 25% penalty compensated to Lead Freelancer.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to cancel with penalty.');
    } finally {
      setLoadingAction(null);
    }
  };

  // Dispute & Mutual Resolution
  const handleRaiseDispute = async () => {
    setLoadingAction('dispute');
    try {
      await raiseDispute(escrow.id);
      setSuccessMessage('Formal dispute raised. Escrow funds locked pending AI-assisted mutual resolution.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to raise dispute.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAgreeResolution = async () => {
    setLoadingAction('agree');
    try {
      const willBothAgree = isClient ? escrow.freelancerAgrees : escrow.clientAgrees;
      await agreeToRelease(escrow.id);
      if (willBothAgree) {
        setShowPTBVisualizer(true);
        setSuccessMessage('AI dispute settlement mutually signed & finalized! 75% payout distributed to team, 25% refunded to Client.');
      } else {
        setSuccessMessage('Your dispute resolution agreement signature has been recorded. Awaiting counter-signature from the other party.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign resolution.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* PTB Flow Visualizer */}
      {showPTBVisualizer && (
        <PTBFlowVisualizer
          totalAmount={escrow.totalAmount}
          recipients={
            escrow.disputeVerdict
              ? [
                  {
                    name: `${escrow.clientName || 'Client'} (25% Dispute Refund)`,
                    payout: escrow.disputeVerdict.clientRefundAmount,
                    address: escrow.client,
                  },
                  ...escrow.recipients.map((r) => ({
                    name: r.name,
                    payout: (escrow.disputeVerdict!.freelancerAmount * r.percentageBasisPoints) / 10000,
                    address: r.recipient,
                  })),
                ]
              : escrow.recipients.map((r) => ({
                  name: r.name,
                  payout: (escrow.totalAmount * r.percentageBasisPoints) / 10000,
                  address: r.recipient,
                }))
          }
          onComplete={handlePTBComplete}
        />
      )}

      {/* Blue Header Bar */}
      <div className="print:hidden bg-blue-gradient px-4 sm:px-6 lg:px-8 py-5 shadow-sm">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-100 hover:text-white transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to My Orders
          </Link>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white">{user?.name || 'Guest'}</span>
            <span className="text-[10px] font-extrabold text-yellow-300 uppercase bg-yellow-400/20 px-1.5 py-0.5 rounded">
              {isClient ? '💼 CLIENT' : isFreelancer ? '👑 LEAD FREELANCER' : isRecipient ? '🎨 TEAM RECIPIENT' : 'OBSERVER'}
            </span>
          </div>
        </div>
      </div>

      <div className="print:hidden mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 space-y-5">
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

        {/* Main Escrow Order Card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          
          {/* Header & Order Value */}
          <div className="p-6 sm:p-8 border-b border-slate-100">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{escrow.title}</h1>
                  <StatusBadge status={escrow.status} />
                  
                  {/* Agreement Status Badge */}
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                    escrow.agreementStatus === 'accepted'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : escrow.agreementStatus === 'negotiating'
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : escrow.agreementStatus === 'rejected'
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-blue-50 border-blue-200 text-blue-700'
                  }`}>
                    Pact Agreement: {escrow.agreementStatus}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono">
                  <span>Object: {formatAddress(escrow.id, 8)}</span>
                  <button onClick={copyId} className="rounded p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600" title="Copy Object ID">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <a href={getSuiScanObjectUrl(escrow.id)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 font-sans font-bold">
                    SuiScan <ExternalLink className="h-3 w-3" />
                  </a>

                  {/* Official Pact Agreement Button */}
                  <button
                    onClick={() => setShowAgreementModal(true)}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all font-sans"
                  >
                    <FileText className="h-3.5 w-3.5 text-blue-400" />
                    <span>View Official Agreement & A4 PDF</span>
                  </button>
                </div>
              </div>

              <div className="text-left md:text-right shrink-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Total Escrow Value</div>
                <div className="text-3xl font-extrabold text-slate-900">{formatUSDC(escrow.totalAmount)}</div>
                {escrow.disputeVerdict?.isSettled ? (
                  <div className="text-[10px] font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full inline-block mt-1">
                    ⚖️ Settled: 75% Team / 25% Refund
                  </div>
                ) : (
                  <div className="text-[11px] font-bold text-emerald-600">$0.00 Gas Sponsored</div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Project Scope Description & Document Attachment */}
            {escrow.scopeDescription && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Project Requirements & Scope</div>
                <p className="text-xs text-slate-600 leading-relaxed">{escrow.scopeDescription}</p>
                {escrow.attachedDocumentName && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span>Reference Document: {escrow.attachedDocumentName}</span>
                    </div>
                    {escrow.attachedDocumentUrl && (
                      <a
                        href={escrow.attachedDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                      >
                        Open Document <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Negotiation Note Banner (If in negotiation) */}
            {escrow.agreementStatus === 'negotiating' && escrow.negotiationNotes && (
              <div className="rounded-xl border-2 border-amber-300 bg-amber-50/90 p-4 space-y-3 animate-fade-in text-xs shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-amber-900 flex items-center gap-1.5 text-sm">
                    <MessageSquare className="h-4 w-4 text-amber-700" />
                    Lead Freelancer Proposed Terms &amp; Split Adjustment
                  </div>
                  <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold uppercase px-2 py-0.5 rounded-full">
                    Awaiting Client Approval
                  </span>
                </div>

                <div className="rounded-lg bg-white/80 border border-amber-200 p-3 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500">Reason / Notes:</span>
                  <p className="text-slate-800 italic text-xs">"{escrow.negotiationNotes}"</p>
                </div>

                {/* Proposed New Split Allocation Schedule */}
                <div className="rounded-xl bg-white border border-amber-200 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">
                      Proposed Contract Value:
                    </span>
                    <span className="text-sm font-extrabold text-emerald-700">
                      ${escrow.totalAmount.toFixed(2)} USDC
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {escrow.recipients.map((r, i) => {
                      const pct = ((r.percentageBasisPoints || 0) / 100).toFixed(1);
                      const payout = (escrow.totalAmount * (r.percentageBasisPoints || 0)) / 10000;
                      return (
                        <div key={i} className="py-1.5 flex items-center justify-between text-xs font-mono">
                          <span className="font-bold text-slate-700 font-sans flex items-center gap-1">
                            {r.name || `Member ${i + 1}`}
                            {r.recipient.toLowerCase() === escrow.leadFreelancer.toLowerCase() && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 rounded font-sans">Lead</span>
                            )}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-blue-700">{pct}%</span>
                            <span className="font-extrabold text-emerald-700">${payout.toFixed(2)} USDC</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-1 flex flex-wrap items-center gap-2">
                  {isClient && (
                    <>
                      <button
                        onClick={async () => {
                          await clientApproveNegotiation(escrow.id);
                          setSuccessMessage('Adjusted rate approved! Waiting for Lead Freelancer final acceptance.');
                        }}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>✓ Approve Adjusted Rate (${escrow.totalAmount} USDC)</span>
                      </button>

                      <button
                        onClick={async () => {
                          await rejectNegotiation(escrow.id);
                          setSuccessMessage('Counter-offer declined. Original contract terms and budget restored.');
                        }}
                        className="rounded-xl bg-white border border-rose-300 hover:bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <X className="h-4 w-4" />
                        <span>✕ Decline Counter-Offer (Revert to Original)</span>
                      </button>
                    </>
                  )}

                  {isFreelancer && (
                    <button
                      onClick={() => setShowAgreementModal(true)}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <FileText className="h-4 w-4" />
                      <span>📄 View / Modify Agreement Terms</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Pending Agreement Review Banner */}
            {escrow.agreementStatus === 'pending' && (
              <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in shadow-xs">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-extrabold text-amber-950">
                      {isFreelancer ? 'Agreement Review Required' : 'Awaiting Freelancer Agreement Review'}
                    </span>
                    <p className="text-[11px] text-amber-800">
                      Baseline contract terms locked at <strong>{formatUSDC(escrow.totalAmount)} USDC</strong>. Freelancer can accept, negotiate, or decline.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAgreementModal(true)}
                  className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-1.5 text-xs shrink-0 flex items-center gap-1.5 transition-all"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>{isFreelancer ? '📄 Review / Modify Agreement' : 'View Agreement Document'}</span>
                </button>
              </div>
            )}

            {/* Client Approved Negotiation Banner */}
            {escrow.agreementStatus === 'client_approved' && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in shadow-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-extrabold text-emerald-950 text-sm">
                      {isFreelancer ? '🎉 Client Approved Your Adjusted Terms!' : '✓ You Approved Adjusted Counter-Offer'}
                    </span>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      {isFreelancer
                        ? `Client accepted rate of ${formatUSDC(escrow.totalAmount)} USDC. Please review and click Accept to formally begin work (or you may still modify or decline).`
                        : `Adjusted budget set to ${formatUSDC(escrow.totalAmount)} USDC. Waiting for Lead Freelancer final acceptance to begin work.`}
                    </p>
                  </div>
                </div>
                {isFreelancer && (
                  <button
                    onClick={() => setShowAgreementModal(true)}
                    className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 text-xs shrink-0 flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <FileText className="h-4 w-4" />
                    <span>📄 Review &amp; Accept / Modify</span>
                  </button>
                )}
              </div>
            )}

            {/* Finalized & Signed Agreement Banner */}
            {escrow.agreementStatus === 'accepted' && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in shadow-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-extrabold text-emerald-950">Official Agreement Finalized &amp; Signed</span>
                    <p className="text-[11px] text-emerald-800">
                      Contract locked at <strong>{formatUSDC(escrow.totalAmount)} USDC</strong> with verified split distribution on Sui zkLogin.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAgreementModal(true)}
                  className="rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-1.5 text-xs shrink-0 flex items-center gap-1.5 transition-all"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>📄 View Signed Agreement (A4 PDF)</span>
                </button>
              </div>
            )}

            {/* Contract Parties */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className={`rounded-xl border p-4 ${isClient ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-400' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Client / Buyer</span>
                  {isClient && <span className="text-[9px] font-extrabold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">✓ You</span>}
                </div>
                <div className="text-sm font-extrabold text-slate-900">{escrow.clientName || 'Authorized Client'}</div>
                <div className="font-mono text-[11px] text-slate-500 truncate mt-0.5">{escrow.client}</div>
              </div>

              <div className={`rounded-xl border p-4 ${isFreelancer ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-400' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
                    <Crown className="h-3 w-3 text-amber-500" /> Lead Freelancer
                  </span>
                  {isFreelancer && <span className="text-[9px] font-extrabold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">✓ You</span>}
                </div>
                <div className="text-sm font-extrabold text-slate-900">{escrow.freelancerName || 'Bob Vance'}</div>
                <div className="font-mono text-[11px] text-slate-500 truncate mt-0.5">{escrow.leadFreelancer}</div>
              </div>
            </div>

            {/* Interactive On-Chain Lifecycle Timeline */}
            <StatusTimeline status={escrow.status} txHistory={escrow.txHistory} />

            {/* Explicit Phase Action Guide Banner */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-extrabold text-xs shrink-0">
                  {escrow.status === STATUS_CODES.LOCKED ? '1' : escrow.status === STATUS_CODES.DELIVERED ? '2' : '3'}
                </div>
                <div>
                  <div className="font-extrabold text-blue-950">
                    {escrow.status === STATUS_CODES.LOCKED
                      ? 'Phase 1 Active: Deposit Locked & Work In Progress'
                      : escrow.status === STATUS_CODES.DELIVERED
                      ? 'Phase 2 Active: Work Submitted & Under Client Review'
                      : escrow.status === STATUS_CODES.DISPUTED
                      ? 'Phase Alert: Formal Dispute In Progress'
                      : 'Phase 3 Complete: Payment Atomically Released'}
                  </div>
                  <p className="text-[11px] text-blue-800">
                    {escrow.status === STATUS_CODES.LOCKED
                      ? isFreelancer
                        ? '👉 Action to complete Phase 1: Submit your deliverable link in the form below.'
                        : '⏳ Waiting for Lead Freelancer to complete work and submit proof.'
                      : escrow.status === STATUS_CODES.DELIVERED
                      ? isClient
                        ? '👉 Action to complete Phase 2: Click "Approve & Release Funds" below to disburse payment.'
                        : '⏳ Waiting for Client to review deliverables and release payment.'
                      : escrow.status === STATUS_CODES.DISPUTED
                      ? 'Both parties must sign agreement or accept AI recommendation to resolve.'
                      : 'All recipient wallets have been credited on Sui Testnet.'}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Deliverable Proof & Review Section ── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Deliverable Proof &amp; Inspection</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live proof submitted by the Lead Freelancer on the Sui network.
                  </p>
                </div>
                <span className="text-[10px] text-slate-500">Only Lead Freelancer Can Submit Proof</span>
              </div>

              {escrow.deliveryProofUri ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-mono text-xs text-blue-700 font-bold truncate flex-1">{escrow.deliveryProofUri}</div>
                      <a
                        href={sanitizeDeliverableUri(escrow.deliveryProofUri).sanitizedUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
                      >
                        Open In New Tab <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    {/* In-App Preview / Inspection (Item 12) */}
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs flex items-center justify-between">
                      <span className="text-slate-600 font-semibold">🔍 Deliverable Inspection Available</span>
                      <a
                        href={sanitizeDeliverableUri(escrow.deliveryProofUri).sanitizedUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" /> Direct Inspection Link
                      </a>
                    </div>

                    {/* Attached Supporting PDF / Document */}
                    {escrow.deliverableAttachmentUrl && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50/80 p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-slate-800 font-semibold">
                          <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                          <span>Supporting Document: <strong>{escrow.deliverableAttachmentName || 'Deliverable Report.pdf'}</strong></span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setViewingPDF({
                              url: escrow.deliverableAttachmentUrl!,
                              name: escrow.deliverableAttachmentName || 'Deliverable Report.pdf',
                              title: 'Deliverable Supporting Document / Report',
                            })
                          }
                          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-1.5 text-[11px] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>View &amp; Print PDF</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* AI Deliverable Quality Audit Card */}
                  <AIDeliverableAuditCard
                    escrowTitle={escrow.title}
                    scopeDescription={escrow.scopeDescription || escrow.title}
                    deliverableUrl={escrow.deliveryProofUri}
                  />

                  {/* Previous Revision Comments History */}
                  {escrow.reworkComments && escrow.reworkComments.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2">
                      <div className="text-xs font-bold text-amber-900 uppercase">Revision History &amp; Client Feedback</div>
                      {escrow.reworkComments.map((note, idx) => (
                        <div key={idx} className="rounded-lg bg-white p-2.5 border border-amber-200 text-xs space-y-0.5">
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <strong>{note.author}</strong>
                            <span>{formatDate(note.timestamp)}</span>
                          </div>
                          <p className="text-slate-800">{note.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic leading-relaxed">
                  No deliverable submitted yet. The Lead Freelancer will submit proof of completion (Figma link, GitHub PR, Google Drive URL, or PDF report).
                </div>
              )}

              {/* Submit / Resubmit Deliverable Form (LOCKED or Revision Requested) */}
              {(escrow.status === STATUS_CODES.LOCKED || escrow.isRevisionRequested) && (
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  {isFreelancer ? (
                    escrow.agreementStatus !== 'accepted' ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900">
                          <Lock className="h-4 w-4 text-amber-700" />
                          <span>Deliverable Submission Locked</span>
                        </div>
                        <p className="text-amber-800 text-[11px]">
                          {escrow.agreementStatus === 'negotiating'
                            ? 'Your counter-offer proposal is currently pending Client decision. Deliverable submission will unlock once terms are accepted.'
                            : 'You must review and accept the official agreement terms above before you can submit deliverables.'}
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleDeliver} className="space-y-3">
                        {/* Rework Notice for Freelancer */}
                        {escrow.isRevisionRequested && (
                          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 space-y-2 text-xs">
                            <div className="flex items-center gap-2 text-amber-900 font-extrabold">
                              <RotateCcw className="h-4 w-4 text-amber-700 animate-spin-slow" />
                              <span>Action Required: Client Requested Rework / Revision</span>
                            </div>
                            <p className="text-[11px] text-amber-800 leading-relaxed">
                              Please review client comments above, update your proof URL or attach revised documents below, then click <strong>Submit Revised Deliverable</strong>.
                            </p>
                          </div>
                        )}

                        <label className="block text-xs font-extrabold text-slate-800">
                          {escrow.isRevisionRequested ? 'Update Deliverable Proof URI' : 'Submit Proof of Work URI'}
                        </label>
                        
                        {/* Helper type chips for freelance work */}
                        <div className="flex flex-wrap gap-1.5 text-[10px]">
                          <span className="text-slate-400 font-bold self-center mr-1">Formats:</span>
                          {['https://figma.com/file/...', 'https://drive.google.com/...', 'https://github.com/org/repo/pull/1', 'https://canva.com/design/...'].map((format, idx) => (
                            <button
                              type="button"
                              key={idx}
                              onClick={() => setProofInput(format)}
                              className="rounded-lg bg-white border border-slate-200 px-2 py-0.5 text-slate-600 hover:border-blue-400 hover:text-blue-600"
                            >
                              {format.split('/')[2]}
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Paste Google Drive, Figma, GitHub PR, or PDF link..."
                            value={proofInput}
                            onChange={(e) => handleProofChange(e.target.value)}
                            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none font-mono"
                          />
                          <button
                            type="submit"
                            disabled={loadingAction === 'deliver' || !proofInput.trim() || isUploadingDeliverableDoc}
                            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-all"
                          >
                            {loadingAction === 'deliver' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            <span>{escrow.isRevisionRequested ? 'Submit Revised Deliverable' : 'Submit Proof'}</span>
                          </button>
                        </div>

                        {/* Supporting PDF Document Attachment Input */}
                        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                              <Paperclip className="h-3.5 w-3.5 text-blue-600" />
                              <span>Attach Supporting Document (PDF / Report / Asset Deliverables)</span>
                            </label>
                            <span className="text-[10px] text-slate-400 font-semibold">Optional</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-colors">
                              <UploadCloud className="h-4 w-4 text-blue-600" />
                              <span>{isUploadingDeliverableDoc ? 'Uploading...' : 'Browse PDF File'}</span>
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={handleDeliverableDocUpload}
                                className="hidden"
                                disabled={isUploadingDeliverableDoc}
                              />
                            </label>

                            {deliverableDocName ? (
                              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                                <FileText className="h-3.5 w-3.5" />
                                <span className="truncate max-w-[200px]">{deliverableDocName}</span>
                                <button
                                  type="button"
                                  onClick={() => { setDeliverableDocName(''); setDeliverableDocUrl(''); }}
                                  className="text-rose-600 hover:text-rose-800 font-bold ml-1 text-sm leading-none"
                                >
                                  ×
                                </button>
                              </div>
                            ) : escrow.deliverableAttachmentName ? (
                              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                                <FileText className="h-3.5 w-3.5 text-slate-400" />
                                <span className="truncate max-w-[200px]">Current: {escrow.deliverableAttachmentName}</span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </form>
                    )
                  ) : isClient ? (
                    <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
                      ℹ️ <strong>Client POV:</strong> {escrow.isRevisionRequested ? 'You requested revisions. Waiting for Lead Freelancer to submit updated deliverables.' : 'Funds locked in Sui contract. Waiting for Lead Freelancer to submit deliverables.'}
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* ── Client Approval, Rework & Dispute Actions ── */}
            {escrow.status === STATUS_CODES.DELIVERED && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Review & Payment Settlement</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verify the proof above. You can release payment, request revisions, or raise a dispute if in deadlock.
                    </p>
                  </div>

                  {isClient && (
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Request Revision Button */}
                      <button
                        onClick={() => setShowReworkInput(!showReworkInput)}
                        className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 px-4 py-2.5 text-xs font-bold text-amber-900 transition-all"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Request Rework</span>
                      </button>

                      {/* Raise Dispute Button */}
                      <button
                        onClick={handleRaiseDispute}
                        disabled={loadingAction === 'dispute'}
                        className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 px-3.5 py-2.5 text-xs font-bold text-rose-700 transition-all"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Raise Dispute</span>
                      </button>

                      {/* Approve & Release Button (Triggers Confirmation Modal) */}
                      <button
                        onClick={() => setShowReleaseConfirmModal(true)}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 text-xs font-extrabold text-white shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Approve & Release Funds</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Revision Input Drawer */}
                {showReworkInput && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-3 animate-fade-in">
                    <label className="block text-xs font-bold text-amber-900">
                      Revision Instructions & Feedback:
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Explain what parts require adjustment or improvement..."
                      value={reworkComment}
                      onChange={(e) => setReworkComment(e.target.value)}
                      className="w-full rounded-xl border border-amber-300 bg-white p-3 text-xs text-slate-900 focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowReworkInput(false)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-amber-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleReworkSubmit}
                        disabled={loadingAction === 'rework' || !reworkComment.trim()}
                        className="rounded-xl bg-amber-700 hover:bg-amber-800 px-4 py-1.5 text-xs font-bold text-white shadow-xs"
                      >
                        {loadingAction === 'rework' ? 'Submitting...' : 'Send Revision Feedback'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Cancellation Options in LOCKED Phase ── */}
            {escrow.status === STATUS_CODES.LOCKED && isClient && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-800">Need to cancel this project?</span>
                  <p className="text-[11px] text-slate-500">
                    {escrow.agreementStatus === 'accepted'
                      ? 'Work is currently in progress. Cancelling now incurs a 25% penalty to compensate the freelancer team.'
                      : 'Freelancer has not yet accepted terms. You can cancel now for a 100% full refund with no penalty.'}
                  </p>
                </div>

                {escrow.agreementStatus === 'accepted' ? (
                  <button
                    onClick={() => setShowPenaltyCancelModal(true)}
                    className="rounded-xl border border-rose-300 bg-white hover:bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 shadow-xs transition-colors"
                  >
                    Early Termination (25% Penalty)
                  </button>
                ) : (
                  <button
                    onClick={handleFullRefund}
                    disabled={loadingAction === 'refund'}
                    className="rounded-xl border border-slate-300 bg-white hover:bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition-colors"
                  >
                    {loadingAction === 'refund' ? 'Refunding...' : 'Cancel & 100% Full Refund'}
                  </button>
                )}
              </div>
            )}

            {/* ── Hybrid AI Dispute Resolution View ── */}
            {escrow.status === STATUS_CODES.DISPUTED && (
              <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">SuiPact AI Dispute Mediator</h3>
                      <p className="text-xs text-amber-800">Unbiased analysis of contract specifications vs delivered artifact</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                    Dual Consensus Required
                  </span>
                </div>

                <div className="rounded-xl border border-amber-200 bg-white p-4 space-y-3 text-xs shadow-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span>AI Recommended Settlement Verdict:</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    Based on deliverable artifacts and scope criteria, the project has achieved approximately <strong className="text-amber-800">75% completion</strong>. Recommended fair compromise: <strong className="text-emerald-700 font-extrabold">75% (${((escrow.totalAmount * 75) / 100).toFixed(2)} USDC) payout to Lead Freelancer team</strong> and <strong className="text-blue-700 font-extrabold">25% (${((escrow.totalAmount * 25) / 100).toFixed(2)} USDC) refund to Client</strong>.
                  </p>

                  {/* Dynamic Financial Split Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-[11px]">
                    <div className="rounded-lg bg-blue-50/80 border border-blue-200 p-2.5 space-y-0.5">
                      <div className="font-bold text-blue-900 flex items-center justify-between">
                        <span>Client Partial Refund (25%):</span>
                        <span className="font-mono text-xs font-extrabold text-blue-800">+${((escrow.totalAmount * 25) / 100).toFixed(2)} USDC</span>
                      </div>
                      <p className="text-[10px] text-blue-600">Will be returned immediately to Client wallet upon dual consent.</p>
                    </div>

                    <div className="rounded-lg bg-emerald-50/80 border border-emerald-200 p-2.5 space-y-0.5">
                      <div className="font-bold text-emerald-900 flex items-center justify-between">
                        <span>Freelancer Team Pool (75%):</span>
                        <span className="font-mono text-xs font-extrabold text-emerald-800">+${((escrow.totalAmount * 75) / 100).toFixed(2)} USDC</span>
                      </div>
                      <p className="text-[10px] text-emerald-600">Will be split atomically across all team recipients.</p>
                    </div>
                  </div>
                </div>

                {/* Dual Resolution Signatures & Role Actions */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-700">Dual Consent Status:</div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className={`inline-flex items-center gap-1 font-bold ${escrow.clientAgrees ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {escrow.clientAgrees ? '✓ Client: Approved' : '⏳ Client: Pending Confirmation'}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className={`inline-flex items-center gap-1 font-bold ${escrow.freelancerAgrees ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {escrow.freelancerAgrees ? '✓ Lead Freelancer: Accepted' : '⏳ Lead Freelancer: Pending Acceptance'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Role-Specific Action Triggers */}
                  {isClient && (
                    <div>
                      {escrow.freelancerAgrees && !escrow.clientAgrees ? (
                        <div className="rounded-xl border-2 border-emerald-400 bg-emerald-50/90 p-4 space-y-2.5 animate-fade-in shadow-xs">
                          <div className="flex items-center gap-2 font-extrabold text-emerald-950 text-xs">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span>Freelancer Accepted 75% AI Settlement — Client Confirmation Required</span>
                          </div>
                          <p className="text-[11px] text-emerald-900 leading-relaxed">
                            Lead Freelancer has accepted the 75% compromise ($${((escrow.totalAmount * 75) / 100).toFixed(2)} USDC). As the Client, please confirm and release the dispute payout below. You will immediately receive a <strong>25% ($${((escrow.totalAmount * 25) / 100).toFixed(2)} USDC) refund</strong> credited back to your wallet.
                          </p>
                          <button
                            onClick={handleAgreeResolution}
                            disabled={loadingAction === 'agree'}
                            className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 text-xs shadow-md transition-all cursor-pointer"
                          >
                            <Zap className="h-4 w-4 text-yellow-300" />
                            <span>Confirm &amp; Release Dispute Payout (Claim ${((escrow.totalAmount * 25) / 100).toFixed(2)} Refund)</span>
                          </button>
                        </div>
                      ) : escrow.clientAgrees && !escrow.freelancerAgrees ? (
                        <div className="inline-flex items-center gap-1.5 rounded-xl bg-blue-100 text-blue-900 px-4 py-2.5 text-xs font-extrabold border border-blue-300">
                          <CheckCircle2 className="h-4 w-4 text-blue-600" />
                          <span>✓ You Pre-Approved 25% Refund — Awaiting Lead Freelancer Acceptance</span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-2 p-1">
                          <span className="text-xs text-slate-600">Awaiting Freelancer to review and accept 75% terms, or you can pre-approve:</span>
                          <button
                            onClick={handleAgreeResolution}
                            disabled={loadingAction === 'agree'}
                            className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-extrabold text-white shadow-sm transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Pre-Approve 25% Refund Settlement</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {isFreelancer && (
                    <div>
                      {escrow.freelancerAgrees && !escrow.clientAgrees ? (
                        <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 text-emerald-900 px-4 py-2.5 text-xs font-extrabold border border-emerald-300">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>✓ You Accepted 75% Settlement — Awaiting Client's Final Approval &amp; Release</span>
                        </div>
                      ) : (
                        <div className="pt-1">
                          <button
                            onClick={() => setShowDisputeConfirmModal(true)}
                            disabled={loadingAction === 'agree'}
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold px-5 py-2.5 text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                          >
                            <Sparkles className="h-4 w-4 text-yellow-300" />
                            <span>Review &amp; Confirm AI Settlement (75% Team Pool: ${((escrow.totalAmount * 75) / 100).toFixed(2)} USDC)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Settled Dispute Resolution Banner ── */}
            {escrow.disputeVerdict?.isSettled && (
              <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 p-5 space-y-3 shadow-sm animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-emerald-950">
                        Dispute Resolved via Mutual AI Compromise Settlement
                      </h3>
                      <p className="text-xs text-emerald-800">
                        Both parties consented to the AI mediator terms. Funds were atomically disbursed: 75% to Freelancer team and 25% refunded to Client.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold bg-emerald-200 text-emerald-900 px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-300">
                    Settled &amp; Disbursed
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="rounded-xl bg-white border border-emerald-200 p-3 space-y-1 shadow-xs">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Client Refund ({escrow.disputeVerdict.clientRefundPct}%):</span>
                    <div className="text-base font-extrabold text-blue-700 font-mono">
                      +${escrow.disputeVerdict.clientRefundAmount.toFixed(2)} USDC
                    </div>
                    <p className="text-[10px] text-slate-500">Credited back to {escrow.clientName || 'Client'}'s wallet balance</p>
                  </div>

                  <div className="rounded-xl bg-white border border-emerald-200 p-3 space-y-1 shadow-xs">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Freelancer Team Pool ({escrow.disputeVerdict.freelancerPct}%):</span>
                    <div className="text-base font-extrabold text-emerald-700 font-mono">
                      +${escrow.disputeVerdict.freelancerAmount.toFixed(2)} USDC
                    </div>
                    <p className="text-[10px] text-slate-500">Atomically split across {escrow.recipients.length} team members</p>
                  </div>
                </div>
              </div>
            )}

            {/* Team Split Table */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Atomic Team Split Allocation
                </span>
                {escrow.disputeVerdict?.isSettled && (
                  <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-extrabold">
                    Showing Adjusted Dispute Settlement Payouts (75%)
                  </span>
                )}
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Recipient</th>
                      <th className="p-3">Sui Address</th>
                      <th className="p-3 text-center">Split %</th>
                      <th className="p-3 text-right">Payout (USDC)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {escrow.recipients.map((r, i) => {
                      const pct = (r.percentageBasisPoints / 100).toFixed(1);
                      const basePayout = (escrow.totalAmount * r.percentageBasisPoints) / 10000;
                      const isDisputeSettled = escrow.disputeVerdict?.isSettled;
                      const finalPayout = isDisputeSettled
                        ? (escrow.disputeVerdict!.freelancerAmount * r.percentageBasisPoints) / 10000
                        : basePayout;
                      const isMe = userAddr === r.recipient?.toLowerCase();

                      return (
                        <tr key={i} className={isMe ? 'bg-blue-50/50 font-semibold' : ''}>
                          <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">
                            {r.name || `Recipient ${i + 1}`}
                            {r.recipient.toLowerCase() === escrow.leadFreelancer.toLowerCase() && (
                              <span title="Team Lead"><Crown className="h-3.5 w-3.5 text-amber-500" /></span>
                            )}
                            {isMe && <span className="text-[9px] text-blue-600 font-extrabold uppercase">(You)</span>}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-500">{formatAddress(r.recipient, 6)}</td>
                          <td className="p-3 text-center font-bold">{pct}%</td>
                          <td className="p-3 text-right">
                            <span className="font-extrabold text-emerald-700 font-mono text-sm">
                              ${finalPayout.toFixed(2)}
                            </span>
                            {isDisputeSettled && (
                              <span className="text-[9.5px] text-amber-700 font-medium block">
                                (75% dispute of ${basePayout.toFixed(2)})
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {escrow.disputeVerdict?.isSettled && (
                    <tfoot className="bg-slate-50 border-t border-slate-200 text-xs font-bold">
                      <tr>
                        <td colSpan={3} className="p-3 text-right uppercase text-slate-600">
                          Team Settlement Pool (75%):
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-700 font-extrabold">
                          ${escrow.disputeVerdict.freelancerAmount.toFixed(2)}
                        </td>
                      </tr>
                      <tr className="bg-blue-50/50 border-t border-blue-100 text-blue-900">
                        <td colSpan={3} className="p-3 text-right uppercase text-slate-600">
                          Client Partial Refund (25%):
                        </td>
                        <td className="p-3 text-right font-mono text-blue-700 font-extrabold">
                          +${escrow.disputeVerdict.clientRefundAmount.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Official Pact Document Modal ── */}
      {showAgreementModal && (
        <OfficialPactDocumentModal
          escrow={escrow}
          isOpen={showAgreementModal}
          onClose={() => setShowAgreementModal(false)}
          userRole={isClient ? 'client' : isFreelancer ? 'freelancer' : 'guest'}
          isLeadFreelancer={isFreelancer}
          onAccept={async () => {
            await acceptAgreement(escrow.id);
            setSuccessMessage('Pact Agreement accepted! You are authorized to begin work.');
          }}
          onReject={async (reason) => {
            await rejectAgreement(escrow.id, reason);
            setSuccessMessage('Pact declined and full funds refunded to client.');
          }}
          onNegotiate={async (notes, proposedAmount, proposedRecipients) => {
            await negotiateAgreement(escrow.id, notes, proposedAmount, proposedRecipients);
            setSuccessMessage('Counter-offer and updated split schedule sent to client.');
          }}
        />
      )}

      {/* ── Release Double-Confirmation Modal (Item 14) ── */}
      {showReleaseConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
              <h3 className="text-base font-extrabold text-slate-900">Confirm Payment Release</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are about to release <strong>{formatUSDC(escrow.totalAmount)} USDC</strong> to the freelancer team. This transaction executes directly on Sui Testnet and is <strong>irreversible</strong>.
            </p>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1.5 text-xs">
              <div className="font-bold text-slate-700">Atomic Payout Summary:</div>
              {escrow.recipients.map((r, i) => (
                <div key={i} className="flex justify-between text-slate-600 text-[11px]">
                  <span>{r.name || `Recipient ${i + 1}`} ({(r.percentageBasisPoints / 100).toFixed(1)}%):</span>
                  <strong className="text-emerald-700 font-mono">
                    ${((escrow.totalAmount * r.percentageBasisPoints) / 10000).toFixed(2)} USDC
                  </strong>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowReleaseConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={executeRelease}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-extrabold text-white shadow-md shadow-emerald-600/20"
              >
                Confirm & Release Funds
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dispute Resolution Confirmation Modal (Freelancer POV) ── */}
      {showDisputeConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-blue-200 space-y-4">
            <div className="flex items-center gap-2.5 text-blue-600">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Confirm AI Dispute Settlement Release</h3>
                <p className="text-xs text-slate-500">Atomic Programmable Transaction Block (PTB) on Sui</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Client <strong>{escrow.clientName || 'Alice Corp'}</strong> has authorized the AI Mediator resolution terms. Please review the financial breakdown below before triggering instant automatic release:
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 space-y-1">
                <span className="font-bold text-blue-900 uppercase text-[10px]">Client Partial Refund (25%):</span>
                <div className="text-base font-extrabold text-blue-800 font-mono">
                  +${((escrow.totalAmount * 25) / 100).toFixed(2)} USDC
                </div>
                <p className="text-[10px] text-blue-600">Refunded to Client wallet</p>
              </div>

              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 space-y-1">
                <span className="font-bold text-emerald-900 uppercase text-[10px]">Your Team Pool (75%):</span>
                <div className="text-base font-extrabold text-emerald-800 font-mono">
                  +${((escrow.totalAmount * 75) / 100).toFixed(2)} USDC
                </div>
                <p className="text-[10px] text-emerald-600">Split to {escrow.recipients.length} recipients</p>
              </div>
            </div>

            {/* Recipient Split Breakdown */}
            <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
              <div className="bg-slate-50 px-3 py-1.5 font-extrabold text-[10px] uppercase text-slate-500 border-b border-slate-200">
                Dispute Payout Split Breakdown (75%)
              </div>
              <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                {escrow.recipients.map((r, i) => {
                  const pct = (r.percentageBasisPoints / 100).toFixed(1);
                  const payout = (((escrow.totalAmount * 75) / 100) * r.percentageBasisPoints) / 10000;
                  return (
                    <div key={i} className="flex items-center justify-between p-2.5">
                      <div>
                        <span className="font-bold text-slate-800">{r.name || `Recipient ${i + 1}`}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({pct}%)</span>
                      </div>
                      <span className="font-extrabold text-emerald-700 font-mono">${payout.toFixed(2)} USDC</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-900 leading-relaxed">
              ⚡ <strong>Instant Execution:</strong> Confirming will immediately disburse funds on Sui via a single Programmable Transaction Block (PTB). All team members and the client will be funded simultaneously.
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowDisputeConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Review Again
              </button>
              <button
                onClick={() => {
                  setShowDisputeConfirmModal(false);
                  handleAgreeResolution();
                }}
                disabled={loadingAction === 'agree'}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-extrabold text-white shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Zap className="h-4 w-4 text-yellow-300" />
                <span>Confirm &amp; Execute Instant Release</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Penalty Cancellation Confirmation Modal (Item 15) ── */}
      {showPenaltyCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-base font-extrabold text-slate-900">Early Termination with Penalty</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Because the freelancer team has already accepted and commenced work, cancelling now will disburse a <strong>25% compensation penalty (${(escrow.totalAmount * 0.25).toFixed(2)} USDC)</strong> to the Lead Freelancer, while returning <strong>75% (${(escrow.totalAmount * 0.75).toFixed(2)} USDC)</strong> to your wallet.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowPenaltyCancelModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Abort
              </button>
              <button
                onClick={handlePenaltyCancel}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2 text-xs font-extrabold text-white shadow-sm"
              >
                Confirm Cancellation & Pay 25%
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── In-App PDF Document Inspector Modal ── */}
      {viewingPDF && (
        <PDFDocumentViewerModal
          isOpen={!!viewingPDF}
          onClose={() => setViewingPDF(null)}
          documentUrl={viewingPDF.url}
          documentName={viewingPDF.name}
          title={viewingPDF.title}
        />
      )}

    </div>
  );
}
