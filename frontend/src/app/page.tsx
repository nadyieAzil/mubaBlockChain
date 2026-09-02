'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import {
  ShieldCheck,
  Zap,
  Users,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Lock,
  ChevronRight,
  Code2,
  Globe,
  Clock,
  DollarSign,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { SUI_CONFIG, getSuiVisionPackageUrl } from '@/config/sui';

export default function LandingPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Hero Section ─────────────────────────────── */}
      <section className="relative overflow-hidden bg-blue-gradient pt-20 pb-28">
        {/* Animated background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl animate-orb" />
          <div className="absolute top-20 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl animate-orb delay-300" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-500/10 blur-2xl animate-orb delay-500" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badges row */}
          {mounted && (
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-xs font-bold text-white">
                <span className="flex h-2 w-2 rounded-full bg-yellow-300 animate-pulse" />
                MUBA Blockchain Hackathon 2026
                <span className="text-blue-200">|</span>
                <span className="text-blue-100 font-medium">Sui Track 01: Payments & Stablecoins</span>
              </div>
              <a
                href={getSuiVisionPackageUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-red-400/40 bg-red-500/20 backdrop-blur-sm px-4 py-1.5 text-xs font-bold text-white hover:bg-red-500/30 transition-colors"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400"></span>
                </span>
                LIVE ON SUI TESTNET
                <ExternalLink className="h-3 w-3 text-red-300" />
              </a>
            </div>
          )}

          {/* Main headline */}
          <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight max-w-4xl mx-auto ${mounted ? 'animate-fade-in-up delay-100' : 'opacity-0'}`}>
            Freelance Payments Without{' '}
            <span className="relative">
              <span className="text-yellow-300">the 20% Cut</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 8" fill="none">
                <path d="M2 6C60 2 180 2 298 6" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" className="animate-draw-line" />
              </svg>
            </span>
          </h1>

          <p className={`mt-6 mx-auto max-w-2xl text-lg text-blue-100 leading-relaxed ${mounted ? 'animate-fade-in-up delay-200' : 'opacity-0'}`}>
            Lock USDC, submit proof of work, release atomic split payouts to your entire team —{' '}
            <strong className="text-white">all in one blockchain transaction</strong> with{' '}
            <strong className="text-yellow-300">$0 gas fees</strong> and Google sign-in. No seed phrases. No middlemen.
          </p>

          {/* CTA Buttons */}
          <div className={`mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 ${mounted ? 'animate-fade-in-up delay-300' : 'opacity-0'}`}>
            {user ? (
              <>
                <Link href="/dashboard" className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-extrabold text-blue-700 shadow-lg shadow-blue-900/20 hover:bg-blue-50 active:scale-[0.98] transition-all">
                  Go to My Orders <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/escrow/new" className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border-2 border-white/30 bg-white/10 backdrop-blur-sm px-8 py-4 text-sm font-extrabold text-white hover:bg-white/20 transition-all">
                  <Zap className="h-4 w-4 text-yellow-300" />
                  Create Escrow Now
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-extrabold text-blue-700 shadow-lg shadow-blue-900/20 hover:bg-blue-50 active:scale-[0.98] transition-all glow-blue">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  Start for Free — Google Sign In
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={getSuiVisionPackageUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border-2 border-white/30 bg-white/10 backdrop-blur-sm px-7 py-4 text-sm font-extrabold text-white hover:bg-white/20 transition-all"
                >
                  <Code2 className="h-4 w-4" />
                  View Move Contract
                  <ExternalLink className="h-3.5 w-3.5 text-blue-200" />
                </a>
              </>
            )}
          </div>

          {/* Trust Badges */}
          <div className={`mt-10 flex flex-wrap items-center justify-center gap-3 ${mounted ? 'animate-fade-in delay-500' : 'opacity-0'}`}>
            {[
              { icon: <CheckCircle2 className="h-3.5 w-3.5" />, text: '0% Commission' },
              { icon: <Zap className="h-3.5 w-3.5 text-yellow-300" />, text: '$0 Gas Fees' },
              { icon: <ShieldCheck className="h-3.5 w-3.5" />, text: 'Google zkLogin' },
              { icon: <Users className="h-3.5 w-3.5" />, text: 'Multi-Recipient Split' },
              { icon: <Globe className="h-3.5 w-3.5" />, text: 'Deployed on Sui Testnet' },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1.5 text-xs font-semibold text-white">
                {b.icon} {b.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Stats Bar ─────────────────────────── */}
      <section className="bg-blue-900 border-y border-blue-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Platform Commission', value: 0, suffix: '%', color: 'text-emerald-400', prefix: '' },
              { label: 'User Gas Cost', value: 0, suffix: '.00', color: 'text-yellow-300', prefix: '$' },
              { label: 'Settlement Time', value: 400, suffix: 'ms', color: 'text-blue-300', prefix: '~' },
              { label: 'Move Unit Tests', value: 9, suffix: '/9', color: 'text-violet-300', prefix: '' },
            ].map((s, i) => (
              <div key={i} className="space-y-1">
                <div className={`text-2xl font-extrabold ${s.color}`}>
                  <AnimatedCounter value={s.value} prefix={s.prefix} suffix={s.suffix} duration={1500} />
                </div>
                <div className="text-xs text-blue-300 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Concrete Use-Case Story ────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Story */}
          <div className="space-y-5 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
              💡 Real-World Scenario
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">
              A 3-person design agency just finished a $2,000 Sui DApp project.
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Their client wants to pay them, but the team needs to be paid fairly:
              Lead dev gets 50%, designer 30%, project manager 20%.
            </p>

            {/* Comparison cards */}
            <div className="space-y-3">
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-rose-600" />
                  <span className="text-sm font-bold text-rose-700">On Fiverr / Upwork</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-extrabold text-rose-700 text-base">$400</div>
                    <div className="text-rose-600">Platform fee (20%)</div>
                  </div>
                  <div className="text-center">
                    <div className="font-extrabold text-rose-700 text-base">14 days</div>
                    <div className="text-rose-600">Settlement wait</div>
                  </div>
                  <div className="text-center">
                    <div className="font-extrabold text-rose-700 text-base">Manual</div>
                    <div className="text-rose-600">Team sub-contracts</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-700">On SuiPact</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-extrabold text-emerald-700 text-base">$0</div>
                    <div className="text-emerald-600">Zero fees, zero gas</div>
                  </div>
                  <div className="text-center">
                    <div className="font-extrabold text-emerald-700 text-base">~400ms</div>
                    <div className="text-emerald-600">Instant settlement</div>
                  </div>
                  <div className="text-center">
                    <div className="font-extrabold text-emerald-700 text-base">1 click</div>
                    <div className="text-emerald-600">Atomic team split</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visual PTB Flow */}
          <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-50 space-y-4">
            <div className="text-xs font-extrabold uppercase tracking-wider text-blue-600 mb-4">
              SuiPact Atomic Split Flow
            </div>

            {/* Flow nodes */}
            {[
              { label: 'Client Locks $2,000 USDC', icon: '🔐', sub: 'Deposited into Move shared object', color: 'bg-blue-50 border-blue-200 text-blue-700' },
              { label: 'Lead Freelancer Submits GitHub PR', icon: '📎', sub: 'Proof URI bound immutably on-chain', color: 'bg-violet-50 border-violet-200 text-violet-700' },
              { label: 'Client Approves — 1 Click', icon: '✅', sub: 'Triggers Programmable Transaction Block', color: 'bg-amber-50 border-amber-200 text-amber-700' },
            ].map((node, i) => (
              <div key={i} className="space-y-1">
                <div className={`flex items-center gap-3 rounded-xl border p-3 ${node.color}`}>
                  <span className="text-xl">{node.icon}</span>
                  <div>
                    <div className="text-xs font-bold">{node.label}</div>
                    <div className="text-[11px] opacity-70">{node.sub}</div>
                  </div>
                </div>
                {i < 2 && (
                  <div className="flex justify-center">
                    <div className="h-5 w-0.5 bg-gradient-to-b from-blue-300 to-blue-100" />
                  </div>
                )}
              </div>
            ))}

            {/* Split result */}
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-blue-50 p-4">
              <div className="text-xs font-extrabold text-emerald-700 mb-3 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" /> Atomic Single-PTB Disbursement
              </div>
              <div className="space-y-1.5">
                {[
                  { name: 'Lead Dev', pct: '50%', amt: '$1,000', color: 'bg-blue-500' },
                  { name: 'Designer', pct: '30%', amt: '$600', color: 'bg-violet-500' },
                  { name: 'Project Manager', pct: '20%', amt: '$400', color: 'bg-emerald-500' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className={`h-2 w-2 rounded-full ${r.color}`} />
                    <span className="flex-1 font-semibold text-slate-700">{r.name}</span>
                    <span className="text-slate-500">{r.pct}</span>
                    <span className="font-extrabold text-emerald-700">{r.amt}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[10px] text-emerald-600 font-semibold text-center">
                ↳ All 3 transfers in 1 transaction block · $0.00 gas
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────── */}
      <section className="bg-blue-gradient-soft py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">Simple 3-Step Process</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">How SuiPact Works</h2>
            <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
              No crypto expertise needed. If you can use Google, you can use SuiPact.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: <Lock className="h-6 w-6 text-blue-600" />,
                title: 'Deposit & Lock USDC',
                desc: 'Client signs in with Google and locks USDC into a Move shared object. Set the team split (e.g. 60% Lead, 25% Designer, 15% Dev) using simple sliders.',
                tag: 'Client Action',
                tagColor: 'bg-blue-100 text-blue-700',
              },
              {
                step: '02',
                icon: <ShieldCheck className="h-6 w-6 text-violet-600" />,
                title: 'Submit Proof of Work',
                desc: 'Lead freelancer attaches deliverable proof (GitHub PR, Figma link, or IPFS hash). This is recorded immutably on Sui blockchain — no he-said-she-said disputes.',
                tag: 'Freelancer Action',
                tagColor: 'bg-violet-100 text-violet-700',
              },
              {
                step: '03',
                icon: <Zap className="h-6 w-6 text-emerald-600" />,
                title: 'Release → Instant Team Payout',
                desc: 'Client reviews the proof and clicks Approve. Sui executes a Programmable Transaction Block that simultaneously sends each team member their exact share — in one atomic tx.',
                tag: 'Atomic PTB',
                tagColor: 'bg-emerald-100 text-emerald-700',
              },
            ].map((step, i) => (
              <div key={i} className="relative rounded-2xl bg-white border border-blue-100 p-6 shadow-sm card-interactive">
                <div className="absolute top-4 right-4 text-5xl font-extrabold text-blue-50 select-none">{step.step}</div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 mb-4">
                  {step.icon}
                </div>
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${step.tagColor} mb-3`}>
                  {step.tag}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Sui? Technical Section ─────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 border border-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
              🔧 Technical Advantage
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">Why this is only possible on Sui</h2>
            <p className="text-slate-600 leading-relaxed text-sm">
              On Ethereum or Solana, splitting a payment to 3 people requires 3 separate transactions — 3 gas fees, 3 signing rounds, and risk that only 1 or 2 go through. Sui's{' '}
              <strong>Programmable Transaction Blocks (PTBs)</strong> allow multiple Move function calls and transfers to compose atomically in one request.
            </p>
            <div className="space-y-3">
              {[
                { label: 'Programmable Transaction Blocks', desc: 'Multiple transfers in one atomic tx — impossible on Ethereum without a smart contract per split', icon: '⚡' },
                { label: 'Object-Centric Move', desc: 'Escrow funds are wrapped in a typed Move object — can\'t be drained without calling the right entry function', icon: '🔐' },
                { label: 'Native Sponsored Transactions', desc: 'Sui protocol supports a separate gas owner from sender — enabling $0 UX without custom account abstraction', icon: '🆓' },
                { label: 'zkLogin (Google → Sui Address)', desc: 'Derives a real Sui address from a Google JWT without ever generating a seed phrase', icon: '🔑' },
              ].map((f, i) => (
                <div key={i} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3.5 card-interactive">
                  <span className="text-xl mt-0.5">{f.icon}</span>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">{f.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Code snippet */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-900 p-5 text-xs font-mono shadow-xl shadow-blue-900/10 overflow-x-auto">
              <div className="flex items-center gap-2 mb-4 text-slate-400 text-[10px] font-sans">
                <div className="h-3 w-3 rounded-full bg-rose-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="ml-2">escrow.move — approve_and_split_payout</span>
              </div>
              <pre className="text-slate-300 leading-relaxed whitespace-pre-wrap text-[11px]">{`public entry fun approve_and_split_payout<T>(
  escrow: &mut MilestoneEscrow<T>,
  ctx: &mut TxContext
) {
  assert!(ctx.sender() == escrow.client, ENotClient);
  assert!(escrow.status == STATUS_DELIVERED, EInvalidStatus);

  let total = coin::value(&escrow.payment);
  let n = vector::length(&escrow.recipients);
  let mut distributed = 0u64;

  // Atomic multi-recipient split in one PTB
  let mut i = 0;
  while (i < n) {
    let r = vector::borrow(&escrow.recipients, i);
    let amount = if (i == n - 1) {
      // Dust remainder → last recipient
      total - distributed
    } else {
      (total * r.bps) / 10000
    };
    let payout = coin::split(&mut escrow.payment, amount, ctx);
    transfer::public_transfer(payout, r.recipient);
    distributed = distributed + amount;
    i = i + 1;
  };
  escrow.status = STATUS_RELEASED;
}`}</pre>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Verified on Sui Testnet — Package v2 <code className="bg-slate-100 px-1 rounded text-[10px]">0x8c57edf1...</code></span>
            </div>
            <a
              href={getSuiVisionPackageUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              View live on SuiVision Explorer <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Gas Savings Calculator ───────────────────── */}
      <GasSavingsCalculator />

      {/* ── Feature Comparison Table ─────────────────── */}
      <ComparisonTable />

      {/* ── Final CTA ─────────────────────────────── */}
      <section className="bg-blue-gradient py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready to replace your Fiverr contract?
          </h2>
          <p className="text-blue-100 text-lg max-w-xl mx-auto">
            Sign in with your Google account — no wallet setup, no seed phrases, no gas tokens needed.
          </p>
          <Link
            href={user ? '/escrow/new' : '/login'}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-10 py-4 text-sm font-extrabold text-blue-700 shadow-lg hover:bg-blue-50 active:scale-[0.98] transition-all"
          >
            <Sparkles className="h-4 w-4 text-blue-500" />
            {user ? 'Create Your First Escrow' : 'Get Started Free — Google Sign In'}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="text-xs text-blue-200 font-medium">
            Zero fees · Zero gas · Deployed on Sui Testnet · Open source Move contract
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Gas Savings Calculator Component ──────────────────────────────────────
function GasSavingsCalculator() {
  const [amount, setAmount] = React.useState(1500);
  const [recipients, setRecipients] = React.useState(3);

  const fiverrFee = amount <= 500
    ? amount * 0.20
    : 500 * 0.20 + (amount - 500) * 0.10;
  const ethGasFee = recipients * 4.20; // ~$4.20 per transfer on Ethereum mainnet average
  const upworkFee = amount * 0.10;
  const totalTraditional = Math.max(fiverrFee, upworkFee) + ethGasFee;
  const suipactFee = 0;
  const savings = totalTraditional.toFixed(2);

  return (
    <section className="bg-white py-20 border-t border-slate-100">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 mb-4">
            <DollarSign className="h-3.5 w-3.5" /> Savings Calculator
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">See Exactly What You Save</h2>
          <p className="text-slate-500 mt-2 text-sm">Move the sliders — watch your savings update in real time</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm space-y-8">
          {/* Sliders */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700">Escrow Amount</label>
                <span className="text-lg font-extrabold text-blue-600">${amount.toLocaleString()} USDC</span>
              </div>
              <input
                type="range" min={100} max={10000} step={100}
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>$100</span><span>$10,000</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700">Recipients / Team Members</label>
                <span className="text-lg font-extrabold text-blue-600">{recipients} people</span>
              </div>
              <input
                type="range" min={1} max={10} step={1}
                value={recipients}
                onChange={e => setRecipients(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1</span><span>10</span>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-red-50 border border-red-100 p-5 text-center">
              <div className="text-xs font-semibold text-red-500 mb-1">Fiverr / Upwork</div>
              <div className="text-2xl font-extrabold text-red-600">${fiverrFee.toFixed(2)}</div>
              <div className="text-[10px] text-red-400 mt-1">Platform commission</div>
            </div>
            <div className="rounded-2xl bg-orange-50 border border-orange-100 p-5 text-center">
              <div className="text-xs font-semibold text-orange-500 mb-1">Ethereum Gas</div>
              <div className="text-2xl font-extrabold text-orange-600">${ethGasFee.toFixed(2)}</div>
              <div className="text-[10px] text-orange-400 mt-1">{recipients}× transfers @ ~$4.20</div>
            </div>
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center ring-2 ring-emerald-400">
              <div className="text-xs font-bold text-emerald-600 mb-1">SuiPact Total</div>
              <div className="text-2xl font-extrabold text-emerald-700">$0.00</div>
              <div className="text-[10px] text-emerald-500 mt-1">Zero fees · Zero gas</div>
            </div>
          </div>

          {/* Savings banner */}
          <div className="rounded-2xl bg-blue-gradient p-6 text-center">
            <div className="text-blue-100 text-sm font-semibold mb-1">You save with SuiPact</div>
            <div className="text-5xl font-black text-white">
              ${savings}
            </div>
            <div className="text-blue-200 text-xs mt-2">
              vs. Fiverr/Upwork commission + Ethereum gas for {recipients} recipient{recipients > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Feature Comparison Table ───────────────────────────────────────────────
function ComparisonTable() {
  const features = [
    { label: 'Platform Fee', suipact: '$0.00', fiverr: '10–20%', crypto: '2–5% gas' },
    { label: 'Settlement Time', suipact: '< 1 second', fiverr: '7–14 days', crypto: '3–5 minutes' },
    { label: 'Multi-Recipient Split', suipact: '✅ 1 Atomic PTB', fiverr: '❌ Manual only', crypto: '❌ Multiple tx' },
    { label: 'No Wallet / Seed Phrase', suipact: '✅ Google zkLogin', fiverr: '✅ OAuth', crypto: '❌ Required' },
    { label: 'On-Chain Proof of Delivery', suipact: '✅ Immutable URI', fiverr: '❌ Off-chain', crypto: '❌ None' },
    { label: 'Dispute Resolution', suipact: '✅ Mutual-consent', fiverr: '⚠️ Manual arbitration', crypto: '❌ No mechanism' },
    { label: 'Dust / Rounding Handling', suipact: '✅ Automatic', fiverr: 'N/A', crypto: '❌ None' },
  ];

  return (
    <section className="bg-slate-50 py-20 border-t border-slate-100">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900">Why SuiPact Wins</h2>
          <p className="text-slate-500 mt-2 text-sm">Head-to-head comparison with traditional platforms</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-4 bg-slate-800 text-white text-xs font-bold">
            <div className="p-4">Feature</div>
            <div className="p-4 text-center bg-blue-gradient">SuiPact</div>
            <div className="p-4 text-center text-slate-300">Fiverr / Upwork</div>
            <div className="p-4 text-center text-slate-300">Crypto Escrow</div>
          </div>
          {features.map((f, i) => (
            <div key={i} className={`grid grid-cols-4 border-t border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
              <div className="p-4 text-xs font-semibold text-slate-700">{f.label}</div>
              <div className="p-4 text-xs font-bold text-center text-emerald-700 bg-emerald-50/50">{f.suipact}</div>
              <div className="p-4 text-xs text-center text-slate-500">{f.fiverr}</div>
              <div className="p-4 text-xs text-center text-slate-500">{f.crypto}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
