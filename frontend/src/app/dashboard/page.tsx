'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, PRESET_DEMO_ACCOUNTS } from '@/context/AuthContext';
import { useEscrow, EscrowItem } from '@/context/EscrowContext';
import { STATUS_CODES } from '@/config/sui';

import { StatusBadge } from '@/components/StatusBadge';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { OnboardingTour } from '@/components/OnboardingTour';
import { formatUSDC, formatAddress, formatDate } from '@/lib/utils';
import {
  Plus, Search, Lock, ArrowUpRight, Users, CheckCircle2, Coins,
  Shield, ShieldCheck, Eye, FolderLock, Zap, LogIn, AlertCircle, Clock,
  ChevronDown, ChevronUp, Inbox, Star,
} from 'lucide-react';

// ── Action priority classification ────────────────────────────────────────
type ActionPriority = 'urgent' | 'pending' | 'waiting' | 'done';

interface ActionCard {
  escrow: EscrowItem;
  priority: ActionPriority;
  actionLabel: string;
  actionIcon: string;
  description: string;
}

function classifyAction(escrow: EscrowItem, userAddr: string): ActionCard | null {
  const isClient = escrow.client?.toLowerCase() === userAddr;
  const isFreelancer = escrow.leadFreelancer?.toLowerCase() === userAddr;
  const isRecipient = escrow.recipients?.some(r => r.recipient?.toLowerCase() === userAddr);

  if (!isClient && !isFreelancer && !isRecipient) return null;

  const { status } = escrow;

  // 1. Agreement Signing & Negotiation (Pre-Execution Phase)
  if (isFreelancer && escrow.agreementStatus === 'pending') {
    return {
      escrow,
      priority: 'urgent',
      actionLabel: 'Sign Agreement',
      actionIcon: '📄',
      description: `Client deposited funds. Review agreement terms and accept to begin work.`,
    };
  }

  if (isFreelancer && escrow.agreementStatus === 'client_approved') {
    return {
      escrow,
      priority: 'urgent',
      actionLabel: 'Sign Approved Agreement',
      actionIcon: '✍️',
      description: `Client approved your terms ($${escrow.totalAmount} USDC)! Review and sign agreement to begin work.`,
    };
  }

  if (isClient && escrow.agreementStatus === 'client_approved') {
    return {
      escrow,
      priority: 'waiting',
      actionLabel: 'Awaiting Freelancer Signature',
      actionIcon: '⏳',
      description: `You approved terms ($${escrow.totalAmount} USDC). Waiting for Lead Freelancer final acceptance.`,
    };
  }

  if (isFreelancer && escrow.agreementStatus === 'negotiating') {
    return {
      escrow,
      priority: 'waiting',
      actionLabel: 'Proposal Pending',
      actionIcon: '⏳',
      description: `Counter-offer ($${escrow.totalAmount} USDC) submitted. Waiting for Client decision.`,
    };
  }

  if (isClient && escrow.agreementStatus === 'negotiating') {
    return {
      escrow,
      priority: 'urgent',
      actionLabel: 'Review Counter-Offer',
      actionIcon: '💬',
      description: `Freelancer requested rate/terms adjustment: "${escrow.negotiationNotes || ''}"`,
    };
  }

  if (isClient && escrow.agreementStatus === 'pending') {
    return {
      escrow,
      priority: 'waiting',
      actionLabel: 'Awaiting Freelancer',
      actionIcon: '⏳',
      description: `Deposit locked. Waiting for Lead Freelancer to review and accept the agreement.`,
    };
  }

  // 2. Active Execution Phase (Agreement must be accepted)
  if (isFreelancer && escrow.isRevisionRequested) {
    return {
      escrow,
      priority: 'urgent',
      actionLabel: 'Rework Requested',
      actionIcon: '🔄',
      description: `Client requested revisions on your deliverable. Click to inspect comments and resubmit.`,
    };
  }

  if (isClient && status === STATUS_CODES.DELIVERED) {
    return {
      escrow,
      priority: 'urgent',
      actionLabel: 'Review & Approve',
      actionIcon: '🔴',
      description: `${escrow.freelancerName || 'Freelancer'} has submitted work. Click to review and release payment.`,
    };
  }

  if (isFreelancer && status === STATUS_CODES.LOCKED && escrow.agreementStatus === 'accepted') {
    return {
      escrow,
      priority: 'urgent',
      actionLabel: 'Submit Deliverable',
      actionIcon: '🟡',
      description: `Agreement locked. Work in progress — submit deliverable proof when ready.`,
    };
  }

  if ((isClient || isFreelancer) && status === STATUS_CODES.DISPUTED) {
    return {
      escrow,
      priority: 'pending',
      actionLabel: 'Resolve Dispute',
      actionIcon: '⚠️',
      description: 'Dispute in progress. Both parties must agree to release funds.',
    };
  }

  if (isClient && status === STATUS_CODES.LOCKED && escrow.agreementStatus === 'accepted') {
    return {
      escrow,
      priority: 'waiting',
      actionLabel: 'Awaiting Delivery',
      actionIcon: '⏳',
      description: `Agreement locked. Waiting for ${escrow.freelancerName || 'freelancer'} to complete and submit work.`,
    };
  }

  if (isFreelancer && status === STATUS_CODES.DELIVERED) {
    return {
      escrow,
      priority: 'waiting',
      actionLabel: 'Awaiting Client Approval',
      actionIcon: '⏳',
      description: 'Deliverable submitted. Waiting for client to review and release payment.',
    };
  }

  if (status === STATUS_CODES.RELEASED || status === STATUS_CODES.REFUNDED) {
    return {
      escrow,
      priority: 'done',
      actionLabel: status === STATUS_CODES.RELEASED ? 'Settled ✓' : 'Refunded ✓',
      actionIcon: '✅',
      description: status === STATUS_CODES.RELEASED ? 'Payment released to all recipients.' : 'Funds returned to client.',
    };
  }

  return {
    escrow,
    priority: 'waiting',
    actionLabel: 'View',
    actionIcon: '👁',
    description: 'Monitor this escrow contract.',
  };
}

const PRIORITY_ORDER: Record<ActionPriority, number> = { urgent: 0, pending: 1, waiting: 2, done: 3 };

const PRIORITY_STYLES: Record<ActionPriority, { border: string; bg: string; badge: string }> = {
  urgent: { border: 'border-red-200', bg: 'bg-red-50/60', badge: 'bg-red-100 text-red-700 border-red-200' },
  pending: { border: 'border-amber-200', bg: 'bg-amber-50/60', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  waiting: { border: 'border-blue-200', bg: 'bg-blue-50/30', badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  done: { border: 'border-slate-200', bg: 'bg-white', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export default function DashboardPage() {
  const { user, loginWithDemo } = useAuth();
  const { escrows } = useEscrow();
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchive, setShowArchive] = useState(false);

  const userAddr = user?.address?.toLowerCase();

  // ── Auth Gate ─────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
            <FolderLock className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Your Orders Await</h2>
          <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
            Sign in with your Google account or a Judge Demo Persona to view and manage your private escrow orders.
          </p>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <Link
              href="/login?redirect=/dashboard"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-all"
            >
              <LogIn className="h-4 w-4" /> Continue with Google zkLogin
            </Link>
            <div className="grid grid-cols-2 gap-2">
              {[PRESET_DEMO_ACCOUNTS[0], PRESET_DEMO_ACCOUNTS[1]].map((acc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { loginWithDemo(acc); router.refresh(); }}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  {i === 0 ? '💼' : '🎨'} {acc.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
          <Link href="/" className="inline-flex items-center text-xs text-slate-400 hover:text-blue-600 transition-colors">← Back to Home</Link>
        </div>
      </div>
    );
  }

  // ── Data ─────────────────────────────────────────────────────────────────
  const myEscrows = escrows.filter(e => {
    if (!userAddr) return false;
    return (
      e.client?.toLowerCase() === userAddr ||
      e.leadFreelancer?.toLowerCase() === userAddr ||
      e.recipients?.some(r => r.recipient?.toLowerCase() === userAddr)
    );
  });

  // Classify and sort by action priority
  const actionCards: ActionCard[] = myEscrows
    .map(e => classifyAction(e, userAddr || ''))
    .filter((c): c is ActionCard => c !== null)
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  const urgentActions = actionCards.filter(c => c.priority === 'urgent');
  const activeActions = actionCards.filter(c => c.priority !== 'done');
  const archiveActions = actionCards.filter(c => c.priority === 'done');

  // Stats
  const totalVolume = myEscrows.reduce((acc, e) => acc + e.totalAmount, 0);
  const lockedVolume = myEscrows.filter(e => [0, 1, 4].includes(e.status)).reduce((acc, e) => acc + e.totalAmount, 0);
  const releasedVolume = myEscrows.filter(e => e.status === 2).reduce((acc, e) => acc + e.totalAmount, 0);

  // Filtered for search view
  const searchFiltered = myEscrows.filter(e => {
    if (statusFilter !== 'all' && e.status.toString() !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!e.title.toLowerCase().includes(q) && !e.client.toLowerCase().includes(q) && !e.leadFreelancer.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const isFiltering = statusFilter !== 'all' || searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <OnboardingTour />

      {/* ── Blue Stats Hero Bar ──────────────────────────────── */}
      <div className="bg-blue-gradient py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-blue-200 text-xs font-semibold">
                  Welcome back, {user.name.split(' ')[0]}
                </p>
                <span className="text-[10px] font-extrabold uppercase bg-white/20 text-white px-2 py-0.5 rounded-full">
                  {user.role === 'client' ? '🏢 Client' : user.role === 'freelancer' ? '💻 Freelancer' : '👥 Team Member'}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                {user.role === 'client' ? 'My Hired Projects & Inbox' : 'My Assigned Contracts & Inbox'}
              </h1>
              <p className="text-blue-200 text-xs mt-1">
                {urgentActions.length > 0
                  ? `⚡ ${urgentActions.length} action${urgentActions.length > 1 ? 's' : ''} required — ${urgentActions.map(c => c.escrow.title.split(' ')[0]).join(', ')}`
                  : `No urgent actions · ${myEscrows.length} total contracts`}
              </p>
            </div>

            {user.role === 'client' ? (
              <Link
                href="/escrow/new"
                className="flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-blue-700 shadow-md hover:bg-blue-50 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Create New Escrow
              </Link>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 border border-white/20 px-4 py-2.5 text-xs font-bold text-yellow-200 shadow-inner">
                <span>💻 Freelancer Workspace</span>
              </div>
            )}
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: user.role === 'client' ? 'Total Funded' : 'Contract Volume', value: totalVolume, icon: <Coins className="h-5 w-5 text-blue-200" />, color: 'text-white' },
              { label: 'Active Locked', value: lockedVolume, icon: <Lock className="h-5 w-5 text-yellow-300" />, color: 'text-yellow-300' },
              { label: 'Settled Payouts', value: releasedVolume, icon: <CheckCircle2 className="h-5 w-5 text-emerald-300" />, color: 'text-emerald-300' },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-blue-200 font-semibold">{s.label}</span>
                  {s.icon}
                </div>
                <div className={`text-xl font-extrabold ${s.color}`}>
                  <AnimatedCounter value={s.value} prefix="$" suffix=" USDC" decimals={0} duration={1200} />
                </div>
                <div className="text-[11px] text-blue-300 mt-0.5">{myEscrows.length} contracts</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Role Explanation Notice for Freelancers */}
        {user.role !== 'client' && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 flex items-center gap-3.5 text-xs text-blue-900 shadow-2xs">
            <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-extrabold text-blue-950">Freelancer Workspace &amp; Assigned Orders</p>
              <p className="text-blue-800 text-[11px] mt-0.5 leading-relaxed">
                You are currently viewing all contracts where you are assigned as Lead Freelancer or Team Recipient. Review client agreements, submit deliverables, and track instant split payouts. (New escrows are created &amp; funded by hiring Clients).
              </p>
            </div>
          </div>
        )}

        {/* Search + Filter Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700">Private — only your orders shown</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative sm:w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search contracts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none shadow-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none shadow-sm"
            >
              <option value="all">All Status</option>
              <option value="0">🔒 Locked</option>
              <option value="1">📎 Delivered</option>
              <option value="2">✅ Released</option>
              <option value="3">↩ Refunded</option>
              <option value="4">⚠ Disputed</option>
            </select>
          </div>
        </div>

        {/* ── Search Results View ───────────────────────────── */}
        {isFiltering ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 font-semibold">{searchFiltered.length} result{searchFiltered.length !== 1 ? 's' : ''}</p>
            {searchFiltered.length === 0 ? (
              <EmptyState user={user} />
            ) : (
              searchFiltered.map(escrow => <EscrowCard key={escrow.id} escrow={escrow} />)
            )}
          </div>
        ) : (
          <>
            {/* ── Action Inbox View ─────────────────────────── */}
            {myEscrows.length === 0 ? (
              <EmptyState user={user} />
            ) : (
              <>
                {/* Urgent Actions */}
                {urgentActions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <h2 className="text-sm font-extrabold text-slate-900">Action Required</h2>
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700 border border-red-200">
                        {urgentActions.length}
                      </span>
                    </div>
                    {urgentActions.map(c => <ActionInboxCard key={c.escrow.id} card={c} />)}
                  </div>
                )}

                {/* Waiting / Pending */}
                {activeActions.filter(c => c.priority !== 'urgent').length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <h2 className="text-sm font-extrabold text-slate-900">In Progress</h2>
                    </div>
                    {activeActions.filter(c => c.priority !== 'urgent').map(c => <ActionInboxCard key={c.escrow.id} card={c} />)}
                  </div>
                )}

                {/* Archive (collapsed by default) */}
                {archiveActions.length > 0 && (
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowArchive(!showArchive)}
                      className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      {showArchive ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      Completed / Archive ({archiveActions.length})
                    </button>
                    {showArchive && archiveActions.map(c => <ActionInboxCard key={c.escrow.id} card={c} />)}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Action Inbox Card (role-aware) ─────────────────────────────────────────
function ActionInboxCard({ card }: { card: ActionCard }) {
  const styles = PRIORITY_STYLES[card.priority];
  return (
    <Link
      href={`/escrow/${card.escrow.id}`}
      className={`block rounded-2xl border ${styles.border} ${styles.bg} p-5 hover:shadow-md transition-all group`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${styles.badge}`}>
              {card.actionIcon} {card.actionLabel}
            </span>
            <StatusBadge status={card.escrow.status} />
            {card.escrow.isOnChain && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700">
                🔗 On-Chain
              </span>
            )}
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
            {card.escrow.title}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">{card.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
            <span>💼 <strong className="text-slate-700">{card.escrow.clientName || formatAddress(card.escrow.client, 4)}</strong></span>
            <span>·</span>
            <span>🎨 <strong className="text-slate-700">{card.escrow.freelancerName || formatAddress(card.escrow.leadFreelancer, 4)}</strong></span>
            <span>·</span>
            <span>{formatDate(card.escrow.createdAt)}</span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100/60">
          <div className="text-left md:text-right">
            <div className="text-lg font-extrabold text-slate-900">{formatUSDC(card.escrow.totalAmount)}</div>
            <div className="text-[11px] font-semibold text-blue-600 flex items-center md:justify-end gap-1 mt-0.5">
              <Users className="h-3 w-3" />
              {card.escrow.recipients.length} recipient{card.escrow.recipients.length > 1 ? 's' : ''}
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors">
            {card.priority === 'urgent' ? 'Act Now' : 'View'} <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Plain Escrow Card (for search results) ─────────────────────────────────
function EscrowCard({ escrow }: { escrow: EscrowItem }) {
  return (
    <Link
      href={`/escrow/${escrow.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm card-interactive"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-extrabold text-slate-900 truncate hover:text-blue-600 transition-colors">{escrow.title}</h3>
            <StatusBadge status={escrow.status} />
            {escrow.isOnChain && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700">🔗 On-Chain</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>💼 <strong className="text-slate-800">{escrow.clientName || formatAddress(escrow.client, 4)}</strong></span>
            <span>·</span>
            <span>🎨 <strong className="text-slate-800">{escrow.freelancerName || formatAddress(escrow.leadFreelancer, 4)}</strong></span>
            <span>·</span>
            <span>{formatDate(escrow.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          <div className="text-left md:text-right">
            <div className="text-lg font-extrabold text-slate-900">{formatUSDC(escrow.totalAmount)}</div>
            <div className="text-[11px] font-semibold text-blue-600 flex items-center md:justify-end gap-1 mt-0.5">
              <Users className="h-3 w-3" />
              {escrow.recipients.length} recipient{escrow.recipients.length > 1 ? 's' : ''}
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors">
            View <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────
function EmptyState({ user }: { user: { name: string } }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-900 mb-1">No orders for {user.name.split(' ')[0]} yet</h3>
      <p className="text-xs text-slate-500 mb-5 max-w-xs mx-auto leading-relaxed">
        Create your first escrow to lock USDC and pay your team atomically with $0 gas.
      </p>
      <Link href="/escrow/new" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-all">
        <Plus className="h-3.5 w-3.5" /> Create First Escrow
      </Link>
    </div>
  );
}
