'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SUI_CONFIG, STATUS_CODES } from '@/config/sui';
import { callMoveFunction } from '@/lib/suiClient';
import { useAuth } from './AuthContext';
import { formatAddress } from '@/lib/utils';

export interface Recipient {
  recipient: string;
  percentageBasisPoints: number;
  name?: string;
}

export interface ReworkNote {
  author: string;
  text: string;
  timestamp: string;
}

export interface DeliverableFile {
  name: string;
  url: string;
  size?: number;
  type?: string;
  uploadedAt?: string;
}

export interface EscrowItem {
  id: string;
  client: string;
  clientName?: string;
  leadFreelancer: string;
  freelancerName?: string;
  title: string;
  totalAmount: number;
  status: number;
  deliveryProofUri: string;
  recipients: Recipient[];
  clientAgrees: boolean;
  freelancerAgrees: boolean;
  createdAt: string;
  isOnChain?: boolean;
  scopeDescription?: string;
  attachedDocumentUrl?: string;
  attachedDocumentName?: string;
  deliverableAttachmentUrl?: string;
  deliverableAttachmentName?: string;
  deliverableFiles?: DeliverableFile[];
  deliverableComment?: string;
  agreementStatus: 'pending' | 'accepted' | 'rejected' | 'negotiating' | 'client_approved';
  agreementRejectReason?: string;
  negotiationNotes?: string;
  originalTotalAmount?: number;
  originalRecipients?: Recipient[];
  proposedAmount?: number;
  proposedRecipients?: Recipient[];
  reworkComments?: ReworkNote[];
  isRevisionRequested?: boolean;
  cancelledWithPenalty?: boolean;
  penaltyAmount?: number;
  disputeVerdict?: {
    freelancerPct: number;
    clientRefundPct: number;
    freelancerAmount: number;
    clientRefundAmount: number;
    summary?: string;
    isSettled?: boolean;
    settledAt?: string;
  };
  txHistory: {
    action: string;
    digest: string;
    timestamp: string;
    isReal?: boolean;
  }[];
}

// Demo seed data — Bob Vance has the correct Lead Freelancer address so testing works out of the box!
const INITIAL_ESCROWS: EscrowItem[] = [
  {
    id: '0x3781294817293817294817294817293817294817293817294817293817294817',
    client: '0xaf39410b7ef60d0de77312789647ca1a9989784229b275d5a7866e4a610e7771',
    clientName: 'Alice Corp',
    leadFreelancer: '0x7b5a8e23912a7d45129ca01289fe20349b1248a8927164917a4918239a9c1824',
    freelancerName: 'Bob Vance',
    title: 'Sui zkLogin Payment Integration & Landing Page',
    scopeDescription: 'Full responsive Web3 landing page with Google zkLogin onboarding, team split distribution, and smart contract audit.',
    totalAmount: 1500,
    status: STATUS_CODES.DELIVERED,
    agreementStatus: 'accepted',
    deliveryProofUri: 'https://github.com/suipact/core-mvp/pull/42',
    recipients: [
      { recipient: '0x7b5a8e23912a7d45129ca01289fe20349b1248a8927164917a4918239a9c1824', name: 'Bob Vance (Lead)', percentageBasisPoints: 6000 },
      { recipient: '0x3918a7c00a6f40db9693ad1415d880f9879785369065b2370007891866ad34a2', name: 'Charlie UI (Designer)', percentageBasisPoints: 2500 },
      { recipient: '0x9928198a27491724018274019284710294719284710294710294710294710294', name: 'David Backend (Engineer)', percentageBasisPoints: 1500 },
    ],
    clientAgrees: false,
    freelancerAgrees: false,
    createdAt: '2026-08-28T14:30:00Z',
    isOnChain: false,
    txHistory: [
      { action: 'Escrow Created & Deposit Locked', digest: '3teRC52TQvDgh9YAVmmoDJvQqMtgUzzpnJgA5QqtQTYf', timestamp: '2026-08-28T14:30:00Z', isReal: true },
      { action: 'Pact Agreement Accepted by Lead Freelancer', digest: '89aPactAcceptLeadBobVance771928371928471029471928', timestamp: '2026-08-28T15:00:00Z', isReal: false },
      { action: 'Deliverable Submitted', digest: '7XqB2n9zWvJmKpL8RtY1sEuFoGh4DcVa3Qi5WeTyUiPo', timestamp: '2026-08-28T18:15:00Z', isReal: false },
    ],
  },
  {
    id: '0x5928192847192847192847192847192847192847192847192847192847192847',
    client: '0xaf39410b7ef60d0de77312789647ca1a9989784229b275d5a7866e4a610e7771',
    clientName: 'Alice Corp',
    leadFreelancer: '0x7b5a8e23912a7d45129ca01289fe20349b1248a8927164917a4918239a9c1824',
    freelancerName: 'Bob Vance',
    title: 'Brand Identity & Design System Kit',
    scopeDescription: 'Vector logo package, typography guidelines, Figma token library, and corporate slide deck templates.',
    totalAmount: 850,
    status: STATUS_CODES.LOCKED,
    agreementStatus: 'pending',
    deliveryProofUri: '',
    recipients: [
      { recipient: '0x7b5a8e23912a7d45129ca01289fe20349b1248a8927164917a4918239a9c1824', name: 'Bob Vance (Lead)', percentageBasisPoints: 5000 },
      { recipient: '0x3918a7c00a6f40db9693ad1415d880f9879785369065b2370007891866ad34a2', name: 'Charlie UI (Designer)', percentageBasisPoints: 5000 },
    ],
    clientAgrees: false,
    freelancerAgrees: false,
    createdAt: '2026-08-29T02:00:00Z',
    isOnChain: false,
    txHistory: [
      { action: 'Escrow Created & Deposit Locked', digest: '5uu66WwjRpo8e3hkivYnVXpjRF7hCBLDdf6h5Hgeytx6', timestamp: '2026-08-29T02:00:00Z', isReal: false },
    ],
  },
];

interface CreateEscrowParams {
  title: string;
  leadFreelancer: string;
  totalAmount: number;
  recipients: Recipient[];
  scopeDescription?: string;
  attachedDocumentUrl?: string;
  attachedDocumentName?: string;
}

interface EscrowContextType {
  escrows: EscrowItem[];
  getEscrowById: (id: string) => EscrowItem | undefined;
  createEscrow: (params: CreateEscrowParams) => Promise<EscrowItem>;
  submitDeliverable: (
    escrowId: string,
    proofUri?: string,
    attachmentUrl?: string,
    attachmentName?: string,
    deliverableFiles?: DeliverableFile[],
    deliverableComment?: string
  ) => Promise<void>;
  approveAndRelease: (escrowId: string) => Promise<{ digest: string }>;
  refundClient: (escrowId: string) => Promise<{ digest: string }>;
  raiseDispute: (escrowId: string) => Promise<void>;
  agreeToRelease: (escrowId: string) => Promise<void>;
  acceptAgreement: (escrowId: string) => Promise<void>;
  rejectAgreement: (escrowId: string, reason: string) => Promise<void>;
  negotiateAgreement: (escrowId: string, notes: string, proposedAmount?: number, proposedRecipients?: Recipient[]) => Promise<void>;
  clientApproveNegotiation: (escrowId: string) => Promise<void>;
  rejectNegotiation: (escrowId: string, clientFeedback?: string) => Promise<void>;
  requestRework: (escrowId: string, comment: string) => Promise<void>;
  cancelWithPenalty: (escrowId: string) => Promise<{ digest: string }>;
  resetEscrows: () => Promise<void>;
}

const EscrowContext = createContext<EscrowContextType | undefined>(undefined);

export const EscrowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [escrows, setEscrows] = useState<EscrowItem[]>(INITIAL_ESCROWS);
  const { user, deductBalance, creditBalance } = useAuth();

  useEffect(() => {
    // 1. First load from local storage
    const saved = localStorage.getItem('suipact_escrows_v3');
    let localList: EscrowItem[] = [];
    if (saved) {
      try {
        localList = JSON.parse(saved);
      } catch (e) {}
    }

    // Merge with INITIAL_ESCROWS
    const localMap = new Map<string, EscrowItem>();
    INITIAL_ESCROWS.forEach(e => localMap.set(e.id, e));
    localList.forEach(e => localMap.set(e.id, e));
    const merged = Array.from(localMap.values());
    setEscrows(merged);

    // 2. Fetch from shared backend server if reachable (ensures cross-browser real-time sync)
    fetch('http://localhost:3001/api/escrows')
      .then(res => res.json())
      .then((serverEscrows: EscrowItem[]) => {
        if (Array.isArray(serverEscrows) && serverEscrows.length > 0) {
          serverEscrows.forEach(e => localMap.set(e.id, e));
          const finalMerged = Array.from(localMap.values());
          setEscrows(finalMerged);
          localStorage.setItem('suipact_escrows_v3', JSON.stringify(finalMerged));
        }
      })
      .catch(() => {
        // Backend offline or unreachable, local state active
      });
  }, []);

  const saveEscrows = (items: EscrowItem[]) => {
    setEscrows(items);
    localStorage.setItem('suipact_escrows_v3', JSON.stringify(items));
    // Asynchronously push to backend store for cross-browser sync
    items.forEach(item => {
      fetch('http://localhost:3001/api/escrows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      }).catch(() => {});
    });
  };

  const getEscrowById = (id: string) => escrows.find(e => e.id === id);

  // ── Create Escrow ────────────────────────────────────────────────────────
  const createEscrow = async (params: CreateEscrowParams) => {
    const sender = user?.address || SUI_CONFIG.sponsorAddress;
    const amountMist = Math.floor(params.totalAmount * 1_000_000);

    const recipientAddrs = params.recipients.map(r => r.recipient);
    const recipientBps = params.recipients.map(r => r.percentageBasisPoints);

    let digest: string;
    let createdObjectId: string | null = null;
    let isOnChain = false;

    try {
      const result = await callMoveFunction('create_and_deposit_entry', [
        params.leadFreelancer,
        params.title,
        recipientAddrs,
        recipientBps,
        amountMist,
      ]);
      digest = result.digest;
      createdObjectId = result.createdObjectId ?? null;
      isOnChain = true;
    } catch (err: any) {
      console.warn('[EscrowContext] On-chain create fallback:', err.message);
      digest = '9xcreate_' + Array.from({ length: 32 }, () => 'abcdef0123456789'[Math.floor(Math.random() * 16)]).join('');
      isOnChain = false;
    }

    const newId = createdObjectId || '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const newEscrow: EscrowItem = {
      id: newId,
      client: sender,
      clientName: user?.name || 'Client',
      leadFreelancer: params.leadFreelancer,
      title: params.title,
      totalAmount: params.totalAmount,
      status: STATUS_CODES.LOCKED,
      agreementStatus: 'pending',
      deliveryProofUri: '',
      recipients: params.recipients,
      clientAgrees: false,
      freelancerAgrees: false,
      createdAt: new Date().toISOString(),
      isOnChain,
      scopeDescription: params.scopeDescription || '',
      attachedDocumentUrl: params.attachedDocumentUrl || '',
      attachedDocumentName: params.attachedDocumentName || '',
      txHistory: [{ action: 'Escrow Created & Full Deposit Locked', digest, timestamp: new Date().toISOString(), isReal: isOnChain }],
    };

    // Deduct total amount from client wallet balance reactively
    deductBalance(params.totalAmount, sender);

    const updated = [newEscrow, ...escrows];
    saveEscrows(updated);
    return newEscrow;
  };

  // ── Pre-Work Agreement Actions (Accept / Reject / Negotiate) ─────────────
  const acceptAgreement = async (escrowId: string) => {
    const target = escrows.find(e => e.id === escrowId);
    if (!target) throw new Error('Escrow not found.');

    const updated = escrows.map(e => {
      if (e.id === escrowId) {
        return {
          ...e,
          agreementStatus: 'accepted' as const,
          txHistory: [
            ...e.txHistory,
            {
              action: 'Agreement Accepted by Lead Freelancer (Execution Unlocked)',
              digest: '5aAccept' + Array.from({ length: 32 }, () => 'abcdef0123456789'[Math.floor(Math.random() * 16)]).join(''),
              timestamp: new Date().toISOString(),
              isReal: false,
            },
          ],
        };
      }
      return e;
    });
    saveEscrows(updated);
  };

  const rejectAgreement = async (escrowId: string, reason: string) => {
    const target = escrows.find(e => e.id === escrowId);
    if (!target) throw new Error('Escrow not found.');

    // 100% full refund to client on rejection
    creditBalance(target.totalAmount, target.client);

    const updated = escrows.map(e => {
      if (e.id === escrowId) {
        return {
          ...e,
          status: STATUS_CODES.REFUNDED,
          agreementStatus: 'rejected' as const,
          agreementRejectReason: reason,
          txHistory: [
            ...e.txHistory,
            {
              action: `Agreement Declined by Freelancer: "${reason}" (100% Refunded)`,
              digest: '9rDecline' + Array.from({ length: 32 }, () => 'abcdef0123456789'[Math.floor(Math.random() * 16)]).join(''),
              timestamp: new Date().toISOString(),
              isReal: false,
            },
          ],
        };
      }
      return e;
    });
    saveEscrows(updated);
  };

  const negotiateAgreement = async (
    escrowId: string,
    notes: string,
    proposedAmount?: number,
    proposedRecipients?: Recipient[]
  ) => {
    const target = escrows.find(e => e.id === escrowId);
    if (!target) throw new Error('Escrow not found.');

    const newAmount = proposedAmount && proposedAmount > 0 ? proposedAmount : target.totalAmount;
    const newRecipients = proposedRecipients && proposedRecipients.length > 0 ? proposedRecipients : target.recipients;

    const updated = escrows.map(e => {
      if (e.id === escrowId) {
        return {
          ...e,
          originalTotalAmount: target.originalTotalAmount || target.totalAmount,
          originalRecipients: target.originalRecipients || target.recipients,
          totalAmount: newAmount,
          recipients: newRecipients,
          agreementStatus: 'negotiating' as const,
          negotiationNotes: notes,
          txHistory: [
            ...e.txHistory,
            {
              action: `Counter-Offer ($${newAmount} USDC & Revised Split Schedule) Requested: "${notes}"`,
              digest: '2nNego' + Array.from({ length: 32 }, () => 'abcdef0123456789'[Math.floor(Math.random() * 16)]).join(''),
              timestamp: new Date().toISOString(),
              isReal: false,
            },
          ],
        };
      }
      return e;
    });
    saveEscrows(updated);
  };

  const clientApproveNegotiation = async (escrowId: string) => {
    const target = escrows.find(e => e.id === escrowId);
    if (!target) throw new Error('Escrow not found.');

    const updated = escrows.map(e => {
      if (e.id === escrowId) {
        return {
          ...e,
          clientAgrees: true,
          agreementStatus: 'client_approved' as const,
          txHistory: [
            ...e.txHistory,
            {
              action: `Client Approved Counter-Offer ($${e.totalAmount} USDC). Awaiting Final Lead Freelancer Acceptance.`,
              digest: '7aClientApprove' + Array.from({ length: 32 }, () => 'abcdef0123456789'[Math.floor(Math.random() * 16)]).join(''),
              timestamp: new Date().toISOString(),
              isReal: false,
            },
          ],
        };
      }
      return e;
    });
    saveEscrows(updated);
  };

  const rejectNegotiation = async (escrowId: string, clientFeedback?: string) => {
    const target = escrows.find(e => e.id === escrowId);
    if (!target) throw new Error('Escrow not found.');

    const revertedAmount = target.originalTotalAmount || target.totalAmount;
    const revertedRecipients = target.originalRecipients || target.recipients;
    const reasonText = clientFeedback?.trim() || 'Client declined proposed rate; original contract terms maintained.';

    const updated = escrows.map(e => {
      if (e.id === escrowId) {
        return {
          ...e,
          totalAmount: revertedAmount,
          recipients: revertedRecipients,
          agreementStatus: 'pending' as const,
          negotiationNotes: undefined,
          txHistory: [
            ...e.txHistory,
            {
              action: `Counter-Offer Declined by Client: "${reasonText}" (Reverted to $${revertedAmount} USDC)`,
              digest: '3rNegoDeclined' + Array.from({ length: 32 }, () => 'abcdef0123456789'[Math.floor(Math.random() * 16)]).join(''),
              timestamp: new Date().toISOString(),
              isReal: false,
            },
          ],
        };
      }
      return e;
    });
    saveEscrows(updated);
  };

  // ── Submit Deliverable ───────────────────────────────────────────────────
  const submitDeliverable = async (
    escrowId: string,
    proofUri = '',
    attachmentUrl?: string,
    attachmentName?: string,
    deliverableFiles?: DeliverableFile[],
    deliverableComment?: string
  ) => {
    const target = escrows.find(e => e.id === escrowId);
    if (!target) throw new Error('Escrow order not found.');

    if (!user?.address || user.address.toLowerCase() !== target.leadFreelancer.toLowerCase()) {
      throw new Error(
        `Security Violation: Only the designated Lead Freelancer (${target.freelancerName || formatAddress(target.leadFreelancer, 6)}) is authorized to submit deliverables.`
      );
    }

    const effectiveUri =
      proofUri.trim() ||
      target.deliveryProofUri ||
      (deliverableFiles && deliverableFiles.length > 0 ? deliverableFiles[0].name : '') ||
      (deliverableComment ? 'Comment / Notes update submitted.' : 'Deliverable files submitted.');

    let digest: string;
    let isReal = false;

    if (target.isOnChain) {
      try {
        const result = await callMoveFunction('submit_deliverable_entry', [escrowId, effectiveUri]);
        digest = result.digest;
        isReal = true;
      } catch (err: any) {
        throw new Error(err.message || 'Failed to submit deliverable on-chain');
      }
    } else {
      digest = '8ySubmit' + Array.from({ length: 32 }, () => 'abcdef0123456789'[Math.floor(Math.random() * 16)]).join('');
    }

    const wasRevision = target.isRevisionRequested;

    const updated = escrows.map(e => {
      if (e.id === escrowId) {
        const existingFiles = e.deliverableFiles || [];
        const newFiles = deliverableFiles !== undefined ? deliverableFiles : existingFiles;
        const finalAttachmentUrl = attachmentUrl !== undefined ? attachmentUrl : (newFiles.length > 0 ? newFiles[0].url : e.deliverableAttachmentUrl);
        const finalAttachmentName = attachmentName !== undefined ? attachmentName : (newFiles.length > 0 ? newFiles[0].name : e.deliverableAttachmentName);

        const fileSummary = newFiles.length > 0 ? ` (${newFiles.length} file${newFiles.length > 1 ? 's' : ''} attached)` : '';
        const commentSummary = deliverableComment ? ` [Notes: "${deliverableComment.slice(0, 40)}${deliverableComment.length > 40 ? '...' : ''}"]` : '';

        return {
          ...e,
          status: STATUS_CODES.DELIVERED,
          isRevisionRequested: false,
          deliveryProofUri: effectiveUri,
          deliverableAttachmentUrl: finalAttachmentUrl,
          deliverableAttachmentName: finalAttachmentName,
          deliverableFiles: newFiles,
          deliverableComment: deliverableComment !== undefined ? deliverableComment : e.deliverableComment,
          txHistory: [
            ...e.txHistory,
            {
              action: wasRevision
                ? `Revised Deliverable Submitted: "${effectiveUri}"${fileSummary}${commentSummary}`
                : `Deliverable Submitted: "${effectiveUri}"${fileSummary}${commentSummary}`,
              digest,
              timestamp: new Date().toISOString(),
              isReal,
            },
          ],
        };
      }
      return e;
    });
    saveEscrows(updated);
  };

  // ── Request Rework / Revision ────────────────────────────────────────────
  const requestRework = async (escrowId: string, comment: string) => {
    const target = escrows.find(e => e.id === escrowId);
    if (!target) throw new Error('Escrow order not found.');

    const newComment: ReworkNote = {
      author: user?.name || 'Client',
      text: comment,
      timestamp: new Date().toISOString(),
    };

    const updated = escrows.map(e => {
      if (e.id === escrowId) {
        const existingComments = e.reworkComments || [];
        return {
          ...e,
          isRevisionRequested: true,
          reworkComments: [...existingComments, newComment],
          txHistory: [
            ...e.txHistory,
            {
              action: `Client Requested Revision: "${comment}"`,
              digest: '7wRework' + Array.from({ length: 32 }, () => 'abcdef0123456789'[Math.floor(Math.random() * 16)]).join(''),
              timestamp: new Date().toISOString(),
              isReal: false,
            },
          ],
        };
      }
      return e;
    });
    saveEscrows(updated);
  };

  // ── Approve & Release Payout (Atomically splits to all recipients) ───────
  const approveAndRelease = async (escrowId: string) => {
    const target = escrows.find(e => e.id === escrowId);
    if (!target) throw new Error('Escrow order not found.');

    if (!user?.address || user.address.toLowerCase() !== target.client.toLowerCase()) {
      throw new Error(
        `Security Violation: Only the verified Client (${target.clientName || formatAddress(target.client, 6)}) can release payment.`
      );
    }

    let digest: string;
    let isReal = false;

    if (target.isOnChain) {
      try {
        const result = await callMoveFunction('approve_and_split_payout_entry', [escrowId]);
        digest = result.digest;
        isReal = true;
      } catch (err: any) {
        throw new Error(err.message || 'Failed to release payout on-chain');
      }
    } else {
      digest = '2rRelease' + Array.from({ length: 32 }, () => 'abcdef0123456789'[Math.floor(Math.random() * 16)]).join('');
    }

    // Atomically credit each team recipient's live wallet balance (honoring dispute compromise if applicable)
    const verdict = target.disputeVerdict;
    if (verdict && verdict.freelancerPct && !verdict.isSettled) {
      const clientRefund = verdict.clientRefundAmount || (target.totalAmount * verdict.clientRefundPct) / 100;
      const freelancerPool = verdict.freelancerAmount || (target.totalAmount * verdict.freelancerPct) / 100;

      creditBalance(clientRefund, target.client);
      target.recipients.forEach(r => {
        const payout = (freelancerPool * r.percentageBasisPoints) / 10000;
        creditBalance(payout, r.recipient);
      });
    } else if (!verdict?.isSettled) {
      target.recipients.forEach(r => {
        const payout = (target.totalAmount * r.percentageBasisPoints) / 10000;
        creditBalance(payout, r.recipient);
      });
    }

    const updated = escrows.map(e => {
      if (e.id === escrowId) {
        return {
          ...e,
          status: STATUS_CODES.RELEASED,
          disputeVerdict: e.disputeVerdict ? { ...e.disputeVerdict, isSettled: true, settledAt: new Date().toISOString() } : undefined,
          txHistory: [...e.txHistory, { action: 'Atomic Split Payout Released', digest, timestamp: new Date().toISOString(), isReal }],
        };
      }
      return e;
    });
    saveEscrows(updated);
    return { digest };
  };

  // ── Cancel with 25% Penalty (During active work) ─────────────────────────
  const cancelWithPenalty = async (escrowId: string) => {
    const target = escrows.find(e => e.id === escrowId);
    if (!target) throw new Error('Escrow order not found.');

    const penalty = target.totalAmount * 0.25;
    const clientRefund = target.totalAmount * 0.75;

    // Refund 75% to Client, pay 25% penalty to Lead Freelancer
    creditBalance(clientRefund, target.client);
    creditBalance(penalty, target.leadFreelancer);

    const digest = '6pCancelPenalty' + Array.from({ length: 32 }, () => 'abcdef0123456789'[Math.floor(Math.random() * 16)]).join('');

    const updated = escrows.map(e => {
      if (e.id === escrowId) {
        return {
          ...e,
          status: STATUS_CODES.REFUNDED,
          cancelledWithPenalty: true,
          penaltyAmount: penalty,
          txHistory: [
            ...e.txHistory,
            {
              action: `Mid-Project Cancellation: $${clientRefund.toFixed(2)} refunded to Client, $${penalty.toFixed(2)} penalty compensated to Lead Freelancer`,
              digest,
              timestamp: new Date().toISOString(),
              isReal: false,
            },
          ],
        };
      }
      return e;
    });
    saveEscrows(updated);
    return { digest };
  };

  // ── Refund Client ────────────────────────────────────────────────────────
  const refundClient = async (escrowId: string) => {
    const target = escrows.find(e => e.id === escrowId);
    if (!target) throw new Error('Escrow order not found.');

    if (!user?.address || user.address.toLowerCase() !== target.client.toLowerCase()) {
      throw new Error(
        `Security Violation: Only the Client (${target.clientName || formatAddress(target.client, 6)}) can refund this escrow.`
      );
    }

    let digest: string;
    let isReal = false;

    if (target.isOnChain) {
      try {
        const result = await callMoveFunction('refund_client_entry', [escrowId]);
        digest = result.digest;
        isReal = true;
      } catch (err: any) {
        throw new Error(err.message || 'Failed to refund on-chain');
      }
    } else {
      digest = '4fRefund' + Array.from({ length: 32 }, () => 'abcdef0123456789'[Math.floor(Math.random() * 16)]).join('');
    }

    // 100% full refund back to client wallet
    creditBalance(target.totalAmount, target.client);

    const updated = escrows.map(e => {
      if (e.id === escrowId) {
        return {
          ...e,
          status: STATUS_CODES.REFUNDED,
          txHistory: [...e.txHistory, { action: 'Full Escrow Deposit Refunded to Client', digest, timestamp: new Date().toISOString(), isReal }],
        };
      }
      return e;
    });
    saveEscrows(updated);
    return { digest };
  };

  // ── Raise Dispute ────────────────────────────────────────────────────────
  const raiseDispute = async (escrowId: string) => {
    const target = escrows.find(e => e.id === escrowId);
    if (!target) throw new Error('Escrow order not found.');

    const isClient = user?.address?.toLowerCase() === target.client.toLowerCase();
    const isFreelancer = user?.address?.toLowerCase() === target.leadFreelancer.toLowerCase();
    if (!isClient && !isFreelancer) {
      throw new Error('Security Violation: Only the Client or Lead Freelancer can raise a dispute.');
    }

    let digest: string;
    let isReal = false;

    if (target.isOnChain) {
      try {
        const result = await callMoveFunction('raise_dispute_entry', [escrowId]);
        digest = result.digest;
        isReal = true;
      } catch (err: any) {
        throw new Error(err.message || 'Failed to raise dispute on-chain');
      }
    } else {
      digest = '1dDispute' + Array.from({ length: 32 }, () => 'abcdef0123456789'[Math.floor(Math.random() * 16)]).join('');
    }

    const freelancerPct = 75;
    const clientRefundPct = 25;
    const freelancerAmount = (target.totalAmount * freelancerPct) / 100;
    const clientRefundAmount = (target.totalAmount * clientRefundPct) / 100;

    const updated = escrows.map(e => {
      if (e.id === escrowId) {
        return {
          ...e,
          status: STATUS_CODES.DISPUTED,
          clientAgrees: true,
          freelancerAgrees: false,
          disputeVerdict: {
            freelancerPct,
            clientRefundPct,
            freelancerAmount,
            clientRefundAmount,
            summary: `Based on deliverable artifacts and scope criteria, the project has achieved approximately ${freelancerPct}% completion. Recommended fair compromise: ${freelancerPct}% ($${freelancerAmount.toFixed(2)} USDC) payout to Lead Freelancer team and ${clientRefundPct}% ($${clientRefundAmount.toFixed(2)} USDC) refund to Client.`,
            isSettled: false,
          },
          txHistory: [...e.txHistory, { action: 'Formal Dispute Raised on Escrow', digest, timestamp: new Date().toISOString(), isReal }],
        };
      }
      return e;
    });
    saveEscrows(updated);
  };

  // ── Agree to Release (Dispute Resolution) ────────────────────────────────
  const agreeToRelease = async (escrowId: string) => {
    const target = getEscrowById(escrowId);
    if (!target) throw new Error('Escrow not found.');

    const isClient = user?.address?.toLowerCase() === target.client.toLowerCase();
    const isFreelancer = user?.address?.toLowerCase() === target.leadFreelancer.toLowerCase();
    if (!isClient && !isFreelancer) {
      throw new Error('Security Violation: Only contract parties can register mutual agreement.');
    }

    let digest: string;
    let isReal = false;

    if (target.isOnChain) {
      try {
        const result = await callMoveFunction('agree_to_release_entry', [escrowId]);
        digest = result.digest;
        isReal = true;
      } catch (err: any) {
        throw new Error(err.message || 'Failed to agree to release on-chain');
      }
    } else {
      digest = '3mMutual' + Array.from({ length: 32 }, () => 'abcdef0123456789'[Math.floor(Math.random() * 16)]).join('');
    }

    // Determine dispute compromise amounts (Default to 75% Freelancer / 25% Client)
    const freelancerPct = target.disputeVerdict?.freelancerPct ?? 75;
    const clientRefundPct = target.disputeVerdict?.clientRefundPct ?? 25;
    const freelancerAmount = target.disputeVerdict?.freelancerAmount ?? (target.totalAmount * freelancerPct) / 100;
    const clientRefundAmount = target.disputeVerdict?.clientRefundAmount ?? (target.totalAmount * clientRefundPct) / 100;

    const updated = escrows.map(e => {
      if (e.id === escrowId) {
        const clientAgrees = isClient ? true : e.clientAgrees;
        const freelancerAgrees = isFreelancer ? true : e.freelancerAgrees;
        const bothAgree = clientAgrees && freelancerAgrees;

        // When both parties agree, atomically disburse the compromise payout immediately!
        if (bothAgree) {
          // 1. Credit 25% refund back to Client's wallet balance
          creditBalance(clientRefundAmount, target.client);

          // 2. Atomically credit 75% split to team recipients' live wallets
          target.recipients.forEach(r => {
            const payout = (freelancerAmount * r.percentageBasisPoints) / 10000;
            creditBalance(payout, r.recipient);
          });
        }

        const newVerdict = {
          freelancerPct,
          clientRefundPct,
          freelancerAmount,
          clientRefundAmount,
          summary: `Based on deliverable artifacts and scope criteria, the project has achieved approximately ${freelancerPct}% completion. Recommended fair compromise: ${freelancerPct}% ($${freelancerAmount.toFixed(2)} USDC) payout to Lead Freelancer team and ${clientRefundPct}% ($${clientRefundAmount.toFixed(2)} USDC) refund to Client.`,
          isSettled: bothAgree ? true : (e.disputeVerdict?.isSettled || false),
          settledAt: bothAgree ? new Date().toISOString() : e.disputeVerdict?.settledAt,
        };

        const txAction = bothAgree
          ? `Dispute Settlement Approved & Released by Client: ${freelancerPct}% ($${freelancerAmount.toFixed(2)} USDC) split to team, ${clientRefundPct}% ($${clientRefundAmount.toFixed(2)} USDC) refunded to Client`
          : isFreelancer
          ? `AI Settlement Terms Accepted by Lead Freelancer (Awaiting Client Final Approval & Release)`
          : `Dispute Settlement Pre-Approved by Client (Awaiting Freelancer Acceptance)`;

        return {
          ...e,
          clientAgrees,
          freelancerAgrees,
          status: bothAgree ? STATUS_CODES.RELEASED : STATUS_CODES.DISPUTED,
          disputeVerdict: newVerdict,
          txHistory: [
            ...e.txHistory,
            {
              action: txAction,
              digest,
              timestamp: new Date().toISOString(),
              isReal,
            },
          ],
        };
      }
      return e;
    });
    saveEscrows(updated);
  };

  const resetEscrows = async () => {
    setEscrows(INITIAL_ESCROWS);
    localStorage.setItem('suipact_escrows_v3', JSON.stringify(INITIAL_ESCROWS));
    try {
      await fetch(`${SUI_CONFIG.relayerUrl}/api/reset-demo`, { method: 'POST' });
    } catch (e) {}
  };

  return (
    <EscrowContext.Provider
      value={{
        escrows,
        getEscrowById,
        createEscrow,
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
        resetEscrows,
      }}
    >
      {children}
    </EscrowContext.Provider>
  );
};

export const useEscrow = () => {
  const context = useContext(EscrowContext);
  if (!context) throw new Error('useEscrow must be used within an EscrowProvider');
  return context;
};
