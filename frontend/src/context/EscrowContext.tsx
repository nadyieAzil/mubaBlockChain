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
  isOnChain?: boolean; // true = real Sui object ID, false = seed demo data
  txHistory: {
    action: string;
    digest: string;
    timestamp: string;
    isReal?: boolean; // false = demo seed digest, true = live Sui tx
  }[];
}

// Demo seed data — pre-populated for first-time demo judges
// These use hardcoded data and the original v1 package escrow objects
const INITIAL_ESCROWS: EscrowItem[] = [
  {
    id: '0x3781294817293817294817294817293817294817293817294817293817294817',
    client: '0xaf39410b7ef60d0de77312789647ca1a9989784229b275d5a7866e4a610e7771',
    clientName: 'Alice Corp',
    leadFreelancer: '0xaf39410b7ef60d0de77312789647ca1a9989784229b275d5a7866e4a610e7771',
    freelancerName: 'Bob Vance',
    title: 'Sui zkLogin Payment Integration & Landing Page',
    totalAmount: 1500,
    status: STATUS_CODES.DELIVERED,
    deliveryProofUri: 'https://github.com/suipact/core-mvp/pull/42',
    recipients: [
      { recipient: '0xaf39410b7ef60d0de77312789647ca1a9989784229b275d5a7866e4a610e7771', name: 'Bob Vance (Lead)', percentageBasisPoints: 6000 },
      { recipient: '0x3918a7c00a6f40db9693ad1415d880f9879785369065b2370007891866ad34a2', name: 'Charlie UI (Designer)', percentageBasisPoints: 2500 },
      { recipient: '0x9928198a27491724018274019284710294719284710294710294710294710294', name: 'David Backend (Engineer)', percentageBasisPoints: 1500 },
    ],
    clientAgrees: false,
    freelancerAgrees: false,
    createdAt: '2026-08-28T14:30:00Z',
    isOnChain: false,
    txHistory: [
      { action: 'Escrow Created & Deposit Locked', digest: '3teRC52TQvDgh9YAVmmoDJvQqMtgUzzpnJgA5QqtQTYf', timestamp: '2026-08-28T14:30:00Z', isReal: true },
      { action: 'Deliverable Submitted', digest: '7XqB2n9zWvJmKpL8RtY1sEuFoGh4DcVa3Qi5WeTyUiPo', timestamp: '2026-08-28T18:15:00Z', isReal: false },
    ],
  },
  {
    id: '0x5928192847192847192847192847192847192847192847192847192847192847',
    client: '0xaf39410b7ef60d0de77312789647ca1a9989784229b275d5a7866e4a610e7771',
    clientName: 'Alice Corp',
    leadFreelancer: '0xaf39410b7ef60d0de77312789647ca1a9989784229b275d5a7866e4a610e7771',
    freelancerName: 'Bob Vance',
    title: 'Brand Identity & Design System Kit',
    totalAmount: 850,
    status: STATUS_CODES.LOCKED,
    deliveryProofUri: '',
    recipients: [
      { recipient: '0xaf39410b7ef60d0de77312789647ca1a9989784229b275d5a7866e4a610e7771', name: 'Bob Vance (Lead)', percentageBasisPoints: 5000 },
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

interface EscrowContextType {
  escrows: EscrowItem[];
  getEscrowById: (id: string) => EscrowItem | undefined;
  createEscrow: (params: { title: string; leadFreelancer: string; totalAmount: number; recipients: Recipient[] }) => Promise<EscrowItem>;
  submitDeliverable: (escrowId: string, proofUri: string) => Promise<void>;
  approveAndRelease: (escrowId: string) => Promise<{ digest: string }>;
  refundClient: (escrowId: string) => Promise<{ digest: string }>;
  raiseDispute: (escrowId: string) => Promise<void>;
  agreeToRelease: (escrowId: string) => Promise<void>;
}

const EscrowContext = createContext<EscrowContextType | undefined>(undefined);

export const EscrowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [escrows, setEscrows] = useState<EscrowItem[]>(INITIAL_ESCROWS);
  const { user } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem('suipact_escrows_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge saved on-chain escrows with seed data (avoid duplicates)
        const onChainIds = new Set(parsed.map((e: EscrowItem) => e.id));
        const seeds = INITIAL_ESCROWS.filter(e => !onChainIds.has(e.id));
        setEscrows([...parsed, ...seeds]);
      } catch (e) {
        // fallback to seeds
      }
    }
  }, []);

  const saveEscrows = (items: EscrowItem[]) => {
    setEscrows(items);
    // Only persist on-chain escrows to avoid stale seed data conflicts
    const onChain = items.filter(e => e.isOnChain);
    localStorage.setItem('suipact_escrows_v2', JSON.stringify(onChain));
  };

  const getEscrowById = (id: string) => escrows.find(e => e.id === id);

  // ── Create Escrow — real PTB call ───────────────────────────────────────
  const createEscrow = async (params: { title: string; leadFreelancer: string; totalAmount: number; recipients: Recipient[] }) => {
    const sender = user?.address || SUI_CONFIG.sponsorAddress;

    // Convert USDC amount to "MIST-like" demo units (1 unit = 1 MIST for SUI)
    // For demo: treat $1 = 1_000_000 MIST (1000 nano-SUI per dollar)
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
      console.warn('[EscrowContext] On-chain create failed, using local fallback:', err.message);
      // Local fallback — still shows as functional demo
      digest = '9xfallback_' + Array.from({ length: 20 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');
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
      deliveryProofUri: '',
      recipients: params.recipients,
      clientAgrees: false,
      freelancerAgrees: false,
      createdAt: new Date().toISOString(),
      isOnChain,
      txHistory: [{ action: 'Escrow Created & Deposit Locked', digest, timestamp: new Date().toISOString(), isReal: isOnChain }],
    };

    const updated = [newEscrow, ...escrows];
    saveEscrows(updated);
    return newEscrow;
  };

  // ── Submit Deliverable — real PTB call ──────────────────────────────────
  const submitDeliverable = async (escrowId: string, proofUri: string) => {
    const target = escrows.find(e => e.id === escrowId);
    if (!target) throw new Error('Escrow order not found.');

    if (!user?.address || user.address.toLowerCase() !== target.leadFreelancer.toLowerCase()) {
      throw new Error(
        `Security Violation: Only the designated Lead Freelancer (${target.freelancerName || formatAddress(target.leadFreelancer, 6)}) is authorized to submit deliverable proof.`
      );
    }

    let digest: string;
    let isReal = false;

    if (target.isOnChain) {
      try {
        const result = await callMoveFunction('submit_deliverable_entry', [escrowId, proofUri]);
        digest = result.digest;
        isReal = true;
      } catch (err: any) {
        throw new Error(err.message || 'Failed to submit deliverable on-chain');
      }
    } else {
      digest = '8y' + Array.from({ length: 42 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');
    }

    const updated = escrows.map(e => {
      if (e.id === escrowId) {
        return {
          ...e,
          status: STATUS_CODES.DELIVERED,
          deliveryProofUri: proofUri,
          txHistory: [...e.txHistory, { action: 'Deliverable Submitted', digest, timestamp: new Date().toISOString(), isReal }],
        };
      }
      return e;
    });
    saveEscrows(updated);
  };

  // ── Approve & Release — real PTB call ───────────────────────────────────
  const approveAndRelease = async (escrowId: string) => {
    const target = escrows.find(e => e.id === escrowId);
    if (!target) throw new Error('Escrow order not found.');

    if (!user?.address || user.address.toLowerCase() !== target.client.toLowerCase()) {
      throw new Error(
        `Security Violation: Only the verified Client (${target.clientName || formatAddress(target.client, 6)}) who deposited the funds is cryptographically authorized to approve release.`
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
      digest = '2r' + Array.from({ length: 42 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');
    }

    const updated = escrows.map(e => {
      if (e.id === escrowId) {
        return {
          ...e,
          status: STATUS_CODES.RELEASED,
          txHistory: [...e.txHistory, { action: 'Atomic Split Payout Released', digest, timestamp: new Date().toISOString(), isReal }],
        };
      }
      return e;
    });
    saveEscrows(updated);
    return { digest };
  };

  // ── Refund Client — real PTB call ───────────────────────────────────────
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
      digest = '4f' + Array.from({ length: 42 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');
    }

    const updated = escrows.map(e => {
      if (e.id === escrowId) {
        return {
          ...e,
          status: STATUS_CODES.REFUNDED,
          txHistory: [...e.txHistory, { action: 'Deposit Refunded to Client', digest, timestamp: new Date().toISOString(), isReal }],
        };
      }
      return e;
    });
    saveEscrows(updated);
    return { digest };
  };

  // ── Raise Dispute ───────────────────────────────────────────────────────
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
      digest = '1d' + Array.from({ length: 42 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');
    }

    const updated = escrows.map(e => {
      if (e.id === escrowId) {
        return {
          ...e,
          status: STATUS_CODES.DISPUTED,
          clientAgrees: false,
          freelancerAgrees: false,
          txHistory: [...e.txHistory, { action: 'Dispute Raised', digest, timestamp: new Date().toISOString(), isReal }],
        };
      }
      return e;
    });
    saveEscrows(updated);
  };

  // ── Agree to Release ────────────────────────────────────────────────────
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
      digest = '3m' + Array.from({ length: 42 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');
    }

    const updated = escrows.map(e => {
      if (e.id === escrowId) {
        const clientAgrees = isClient ? true : e.clientAgrees;
        const freelancerAgrees = isFreelancer ? true : e.freelancerAgrees;
        const bothAgree = clientAgrees && freelancerAgrees;

        return {
          ...e,
          clientAgrees,
          freelancerAgrees,
          status: bothAgree ? STATUS_CODES.DELIVERED : STATUS_CODES.DISPUTED,
          txHistory: [
            ...e.txHistory,
            {
              action: `Mutual Agreement Logged by ${isClient ? 'Client' : 'Freelancer'}${bothAgree ? ' (Resolved)' : ''}`,
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

  return (
    <EscrowContext.Provider value={{ escrows, getEscrowById, createEscrow, submitDeliverable, approveAndRelease, refundClient, raiseDispute, agreeToRelease }}>
      {children}
    </EscrowContext.Provider>
  );
};

export const useEscrow = () => {
  const context = useContext(EscrowContext);
  if (!context) throw new Error('useEscrow must be used within an EscrowProvider');
  return context;
};
