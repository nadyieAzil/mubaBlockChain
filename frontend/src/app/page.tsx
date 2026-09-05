'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { LiveSuiStats } from '@/components/LiveSuiStats';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { EcosystemPartnerBanner } from '@/components/EcosystemPartnerBanner';
import {
  ShieldCheck,
  Zap,
  Users,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Lock,
  Code2,
  Globe,
  Clock,
  DollarSign,
  TrendingDown,
  Sparkles,
  Check,
  X,
  AlertTriangle,
  Lightbulb,
  Layers,
  KeyRound,
  FileCheck,
  Coins,
  Target,
  Rocket,
  Cpu,
  PieChart,
  Award,
  BookOpen,
  Briefcase,
  Scale,
  Shield,
  Bot,
  Flame,
  BarChart3,
  HelpCircle,
} from 'lucide-react';
import { getSuiVisionPackageUrl } from '@/config/sui';

export default function LandingPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeSlide, setActiveSlide] = useState<string>('overview');

  const pitchSections = [
    { id: 'overview', num: '00', label: 'Overview & Hero', icon: Sparkles, desc: 'Zero-Gas Payment Vault & Splits' },
    { id: 'problem-objective', num: '01', label: 'Problem & Objective', icon: Target, desc: '20% Fee Trap & Disjoint Splits' },
    { id: 'motivation-challenges', num: '02', label: 'Motivation & Challenges', icon: Rocket, desc: 'Gas Tokens, zkLogin & PTBs' },
    { id: 'business-model', num: '03', label: 'Business & Ads Model', icon: DollarSign, desc: 'Ecosystem Sponsorships & Unit Econ' },
    { id: 'tech-stack', num: '04', label: 'Tracks 01 & 02: Move & AI', icon: Cpu, desc: 'Sui Move v2 & Gemini 2.0 AI' },
    { id: 'architecture-concept', num: '05', label: 'Overall Architecture', icon: Layers, desc: '5-Stage Autonomous Lifecycle' },
    { id: 'savings-calculator', num: '06', label: 'Interactive ROI Calc', icon: BarChart3, desc: 'Real Savings vs. Web2 Freelancing' },
    { id: 'evaluation', num: '07', label: 'Judge Evaluation & Demo', icon: Award, desc: 'Live Sui Testnet Demo & zkLogin' },
  ];

  useEffect(() => {
    setMounted(true);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSlide(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-15% 0px -40% 0px',
        threshold: 0.1,
      }
    );

    pitchSections.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => {
      pitchSections.forEach((sec) => {
        const el = document.getElementById(sec.id);
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSlide(id);
    if (id === 'overview') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      // Offset brings the section header cleanly to the top of the viewport
      const yOffset = -16;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  };

  const currentSectionIndex = pitchSections.findIndex((s) => s.id === activeSlide);
  const progressPercent = Math.round(((Math.max(0, currentSectionIndex) + 1) / pitchSections.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">

      {/* ── Left Side Panel Navigation (Full to Top, Sticky & Clickable) ──── */}
      <aside className="hidden lg:flex w-72 xl:w-80 shrink-0 sticky top-0 h-screen flex-col justify-between border-r border-[#1b264f]/80 bg-[#0b132b] text-white z-40 shadow-2xl overflow-y-auto">
        {/* Panel Header */}
        <div className="p-5 border-b border-[#1b264f] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-400/20 border border-yellow-300/30 text-yellow-300 shadow-sm">
                <Award className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-xs font-black tracking-tight text-white block uppercase">
                  Pitch Deck Nav
                </span>
                <span className="text-[10px] text-blue-300 font-semibold block">
                  MUBA Tracks 01 &amp; 02
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[9.5px] font-black text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Move
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span>Pitch Flow</span>
              <span className="text-yellow-300 font-mono">{currentSectionIndex >= 0 ? `${currentSectionIndex + 1}/${pitchSections.length}` : '0/8'} ({progressPercent}%)</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#141f42] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 via-blue-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Clickable Navigation Links */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          {pitchSections.map((sec) => {
            const isActive = activeSlide === sec.id;
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40'
                    : 'text-slate-300 hover:bg-[#131d3f]/60 hover:text-white border border-transparent hover:border-[#1f2e60]'
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
                    isActive
                      ? 'bg-white/20 text-white border border-white/30 shadow-inner'
                      : 'bg-[#141f42] border border-[#223366] text-slate-400 group-hover:text-yellow-300 group-hover:border-yellow-300/30'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-yellow-300' : 'text-blue-400'}`}>
                      {sec.num}
                    </span>
                    <span className="text-xs font-bold truncate leading-snug">
                      {sec.label}
                    </span>
                  </div>
                  <p className={`text-[10.5px] truncate mt-0.5 leading-tight ${isActive ? 'text-blue-100' : 'text-slate-500 group-hover:text-slate-400'}`}>
                    {sec.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Panel Footer Actions */}
        <div className="p-4 border-t border-[#1b264f] bg-[#080e22]/90 space-y-2.5">
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 py-2.5 px-3 text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <span>Launch DApp Demo</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
            <a
              href={getSuiVisionPackageUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-300 hover:text-white transition-colors"
            >
              <span>SuiVision v2</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
            <span className="text-emerald-400 font-bold">10 Free Tx/Mo</span>
          </div>
        </div>
      </aside>

      {/* ── Main Content Column (Navbar + Stats + Pitch Content on Right) ─ */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Top Header on Right: Scrolls away naturally to the top when scrolling down */}
        <div id="overview-top" className="print:hidden relative z-30 shadow-md">
          <Navbar sticky={false} />
          <LiveSuiStats />
        </div>

        {/* Mobile Horizontal Quick Bar (< lg screens) */}
        <div className="lg:hidden sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md border-b border-blue-900/60 p-2 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
          <div className="flex items-center gap-1.5 px-2 text-[10px] font-black uppercase text-yellow-300 shrink-0">
            <Award className="h-3.5 w-3.5" />
            <span>Deck:</span>
          </div>
          {pitchSections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => scrollToSection(sec.id)}
              className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                activeSlide === sec.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white bg-white/5'
              }`}
            >
              <span>{sec.num}</span>
              <span className="hidden sm:inline">{sec.label.split('.')[1] || sec.label}</span>
            </button>
          ))}
          <Link
            href="/dashboard"
            className="shrink-0 ml-auto inline-flex items-center gap-1 rounded-lg bg-yellow-400 text-slate-950 px-2.5 py-1 text-[11px] font-black"
          >
            Launch <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* ── Hero Section ─────────────────────────────── */}
        <section id="overview" className="scroll-mt-0 relative overflow-hidden bg-blue-gradient pt-16 pb-24 text-white">
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
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-500/20 backdrop-blur-sm px-4 py-1.5 text-xs font-extrabold text-yellow-200">
                <span className="flex h-2 w-2 rounded-full bg-yellow-300 animate-pulse" />
                MUBA Hackathon 2026
                <span className="text-yellow-400">|</span>
                <span className="text-white font-semibold">Track 01: Payments &amp; Stablecoins</span>
                <span className="text-yellow-400">·</span>
                <span className="text-yellow-300 font-bold">Track 02: SUI x AI</span>
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
          <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight max-w-4xl mx-auto ${mounted ? 'animate-fade-in-up delay-100' : 'opacity-0'}`}>
            Zero-Commission Freelance Payment Vault with{' '}
            <span className="relative">
              <span className="text-yellow-300">Atomic Splits &amp; AI</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 8" fill="none">
                <path d="M2 6C60 2 180 2 298 6" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" className="animate-draw-line" />
              </svg>
            </span>
          </h1>

          <p className={`mt-6 mx-auto max-w-3xl text-base sm:text-lg text-blue-100 leading-relaxed ${mounted ? 'animate-fade-in-up delay-200' : 'opacity-0'}`}>
            Lock USDC into Move smart contracts, evaluate deliverable milestones with Gemini 2.0 AI, and disburse instant multi-recipient team payouts —{' '}
            <strong className="text-white">all in a single Sui Programmable Transaction Block (PTB)</strong> with{' '}
            <strong className="text-yellow-300">10 free sponsored transactions/month</strong> and Google zkLogin.
          </p>

          {/* CTA Buttons */}
          <div className={`mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 ${mounted ? 'animate-fade-in-up delay-300' : 'opacity-0'}`}>
            {user ? (
              <>
                <Link href="/dashboard" className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-extrabold text-blue-700 shadow-lg shadow-blue-900/20 hover:bg-blue-50 active:scale-[0.98] transition-all">
                  Go to Active Vaults <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/escrow/new" className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border-2 border-white/30 bg-white/10 backdrop-blur-sm px-8 py-4 text-sm font-extrabold text-white hover:bg-white/20 transition-all">
                  <Zap className="h-4 w-4 text-yellow-300" />
                  Create New Payment Vault
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-extrabold text-blue-700 shadow-lg shadow-blue-900/20 hover:bg-blue-50 active:scale-[0.98] transition-all glow-blue">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  Try Judge Demo / Google zkLogin
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={getSuiVisionPackageUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border-2 border-white/30 bg-white/10 backdrop-blur-sm px-7 py-4 text-sm font-extrabold text-white hover:bg-white/20 transition-all"
                >
                  <Code2 className="h-4 w-4" />
                  View Move Package v2
                  <ExternalLink className="h-3.5 w-3.5 text-blue-200" />
                </a>
              </>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
              <div className="text-2xl font-black text-yellow-300">$0.00</div>
              <div className="text-xs font-semibold text-blue-100">0% Platform Cut</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
              <div className="text-2xl font-black text-emerald-300">10 Tx/Mo</div>
              <div className="text-xs font-semibold text-blue-100">Free Sponsored Gas</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
              <div className="text-2xl font-black text-cyan-300">~400ms</div>
              <div className="text-xs font-semibold text-blue-100">Atomic PTB Settlement</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
              <div className="text-2xl font-black text-violet-300">9/9 Tests</div>
              <div className="text-xs font-semibold text-blue-100">Verified Move Engine</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PILLAR 1: PROBLEM STATEMENT & PROJECT OBJECTIVE ─────────── */}
      <section id="problem-objective" className="scroll-mt-0 py-20 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-600 mb-2">
            <Target className="h-4 w-4" /> Pitch Pillar 01
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            Problem Statement &amp; Project Objective
          </h2>
          <p className="text-slate-600 mt-2 max-w-3xl text-sm sm:text-base leading-relaxed">
            The global gig economy is projected to reach $1.5 Trillion, yet digital workers and clients are held hostage by predatory middleman fees, payment delays, and cumbersome manual team splits.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mt-10">
            {/* The Problem */}
            <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2.5 text-rose-800 font-extrabold text-lg">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <span>The Web2 Freelance Pain Points</span>
              </div>
              <ul className="space-y-3.5 text-xs sm:text-sm text-rose-950">
                <li className="flex items-start gap-2.5">
                  <span className="rounded-full bg-rose-200 p-1 text-rose-800 font-bold shrink-0 mt-0.5">✕</span>
                  <div>
                    <strong>20% Middleman Tax:</strong> Upwork and Fiverr confiscate $200 out of every $1,000 earned by hard-working freelancers.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="rounded-full bg-rose-200 p-1 text-rose-800 font-bold shrink-0 mt-0.5">✕</span>
                  <div>
                    <strong>7–14 Day Settlement Delays:</strong> Legacy banking and off-chain vault platforms impose artificial waiting periods and chargeback risks.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="rounded-full bg-rose-200 p-1 text-rose-800 font-bold shrink-0 mt-0.5">✕</span>
                  <div>
                    <strong>Messy Agency Multi-Splits:</strong> Paying a lead developer (50%), designer (30%), and copywriter (20%) requires tedious sub-transactions and accounting overhead.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="rounded-full bg-rose-200 p-1 text-rose-800 font-bold shrink-0 mt-0.5">✕</span>
                  <div>
                    <strong>Subjective Dispute Deadlock:</strong> Client-freelancer disagreements result in frozen accounts and biased human support queues.
                  </div>
                </li>
              </ul>
            </div>

            {/* The Objective */}
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2.5 text-emerald-800 font-extrabold text-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>SuiPact Project Objective</span>
              </div>
              <ul className="space-y-3.5 text-xs sm:text-sm text-emerald-950">
                <li className="flex items-start gap-2.5">
                  <span className="rounded-full bg-emerald-200 p-1 text-emerald-800 font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <strong>0% Platform Commission:</strong> Keep 100% of deal value on-chain, funded sustainably via Web3 ecosystem partner sponsorships.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="rounded-full bg-emerald-200 p-1 text-emerald-800 font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <strong>Instant Atomic PTB Splits:</strong> Split payments across up to 10 team members with automatic dust allocation in a single ~400ms Sui transaction block.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="rounded-full bg-emerald-200 p-1 text-emerald-800 font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <strong>Zero-Gas Web2 UX via zkLogin:</strong> Sign in with Google (no seed phrase) and execute transactions with 10 free sponsored calls every month.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="rounded-full bg-emerald-200 p-1 text-emerald-800 font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <strong>Autonomous AI Milestone Audits:</strong> OpenRouter AI evaluates deliverable proofs (PRs, Figma links) against contract criteria objectively.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── PILLAR 2: MOTIVATION & CHALLENGES ───────────────────────── */}
      <section id="motivation-challenges" className="scroll-mt-0 py-20 bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-violet-600 mb-2">
            <Rocket className="h-4 w-4" /> Pitch Pillar 02
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            Motivation &amp; Technical Challenges Solved
          </h2>
          <p className="text-slate-600 mt-2 max-w-3xl text-sm sm:text-base leading-relaxed">
            Why has Web3 escrow and payment vaults failed to disrupt Web2 until now? Gas complexity, seed phrases, and multi-signature friction. Sui fundamentally fixes this.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {[
              {
                challenge: 'Challenge 1: The Gas Token Trap',
                problem: 'In Ethereum/Solana, freelancers cannot receive USDC unless they already own ETH or SOL to pay gas fees.',
                solution: 'Sui Native Gas Sponsorship',
                desc: 'Sui natively separates transaction sender from gas payer. SuiPact sponsors up to 10 transactions/month per user via backend relayer.',
                icon: Coins,
                badge: 'Gas Relayer',
                color: 'border-blue-200 bg-blue-50/50 text-blue-700',
              },
              {
                challenge: 'Challenge 2: Seed Phrase Intimidation',
                problem: 'Mainstream clients abandon Web3 checkouts when forced to write down 24-word recovery phrases.',
                solution: 'Google OAuth zkLogin',
                desc: 'Generates zero-knowledge cryptographic proofs directly from standard Google JWTs, giving users a true non-custodial Sui wallet effortlessly.',
                icon: KeyRound,
                badge: 'Zero Friction',
                color: 'border-violet-200 bg-violet-50/50 text-violet-700',
              },
              {
                challenge: 'Challenge 3: Disjoint Multi-Payouts',
                problem: 'Splitting to multiple sub-contractors on other chains requires N transactions, risking partial failures and high gas.',
                solution: 'Programmable Transaction Blocks',
                desc: 'Sui PTBs compose multiple coin splits and transfers atomically. If any part fails, the entire transaction reverts safely.',
                icon: Zap,
                badge: 'Atomic Move',
                color: 'border-emerald-200 bg-emerald-50/50 text-emerald-700',
              },
            ].map((card, i) => (
              <div key={i} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl border ${card.color}`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700">
                    {card.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{card.challenge}</h3>
                  <p className="text-xs text-rose-700 mt-1">{card.problem}</p>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{card.solution}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PILLAR 3: COMMERCIALISATION & BUSINESS MODEL ─────────────── */}
      <section id="business-model" className="scroll-mt-0 py-20 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600 mb-2">
            <DollarSign className="h-4 w-4" /> Pitch Pillar 03
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            Commercialisation &amp; Ecosystem Sponsorship Model
          </h2>
          <p className="text-slate-600 mt-2 max-w-3xl text-sm sm:text-base leading-relaxed">
            How SuiPact achieves true 0% platform commission while remaining fully profitable and self-sustaining from day one.
          </p>

          {/* Business Model Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mt-10">
            {/* Unit Economics Box */}
            <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-blue-900 font-extrabold text-lg">
                <PieChart className="h-5 w-5 text-blue-600" />
                <span>Micro Unit Economics</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Because Sui gas is fractions of a cent (~0.002 SUI) and fast AI tokens cost micro-cents:
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-blue-200/60 pb-1.5">
                  <span className="text-slate-600">Sui Move Gas per Secure Vault:</span>
                  <span className="font-extrabold text-slate-900">~$0.003 USD</span>
                </div>
                <div className="flex justify-between border-b border-blue-200/60 pb-1.5">
                  <span className="text-slate-600">OpenRouter AI Verification:</span>
                  <span className="font-extrabold text-slate-900">~$0.001 USD</span>
                </div>
                <div className="flex justify-between border-b border-blue-200/60 pb-1.5">
                  <span className="text-slate-600">Total Infra Cost per Deal:</span>
                  <span className="font-black text-blue-700">≈ $0.009 USD</span>
                </div>
                <div className="flex justify-between pt-1 text-emerald-700 font-extrabold">
                  <span>Cost for 1,000 Secure Vaults/Mo:</span>
                  <span>Only ~$25.00 / month!</span>
                </div>
              </div>
            </div>

            {/* Ecosystem Partner Sponsorship Model */}
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-lg">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                <span>Ecosystem Partner Slots</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Targeted Web3 protocols pay for non-intrusive luxury partner slots to reach verified crypto earners:
              </p>
              <ul className="space-y-2 text-xs text-emerald-950">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  <span><strong>DEX &amp; Swaps (Cetus):</strong> Instant USDC to SUI swaps</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  <span><strong>DeFi Yield (Navi / Scallop):</strong> Yield on secure vault deposits</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  <span><strong>Security Audits (MoveBit):</strong> Move contract verification</span>
                </li>
              </ul>
              <div className="pt-2 text-xs font-bold text-emerald-800">
                💡 1 single sponsor ($200/mo) funds 8,000+ free secure vaults!
              </div>
            </div>

            {/* Sui Storage Rebate Recycling */}
            <div className="rounded-3xl border border-violet-200 bg-violet-50/60 p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-violet-900 font-extrabold text-lg">
                <Flame className="h-5 w-5 text-violet-600" />
                <span>Storage Rebate Recycling</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sui features an on-chain storage refund mechanism:
              </p>
              <div className="rounded-2xl bg-white border border-violet-200 p-3.5 space-y-1.5 text-xs text-violet-950">
                <div className="font-extrabold text-violet-900">99% Gas Recycled on Completion</div>
                <p className="text-[11px] text-slate-600">
                  When a secure vault object is settled and finalized, up to 99% of storage fees are refunded back to the sponsor wallet automatically.
                </p>
              </div>
              <div className="text-xs font-bold text-violet-700">
                🛡️ 10 Free Sponsored Tx/Month quota prevents bot drain attacks.
              </div>
            </div>
          </div>

          {/* Interactive Ecosystem Partner Banner Showcase */}
          <div className="mt-10">
            <EcosystemPartnerBanner variant="banner" />
          </div>
        </div>
      </section>

      {/* ── PILLAR 4: TECH STACK & TRACK CHOSEN ─────────────────────── */}
      <section id="tech-stack" className="scroll-mt-0 py-20 bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-600 mb-2">
            <Cpu className="h-4 w-4" /> Pitch Pillar 04
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            Technology Stack &amp; Dual Hackathon Tracks
          </h2>
          <p className="text-slate-600 mt-2 max-w-3xl text-sm sm:text-base leading-relaxed">
            Engineered to bridge <strong>Sui Track 01: Payments &amp; Stablecoins</strong> (zero-gas USDC payment vaults &amp; atomic PTB team splits) and <strong>Sui Track 02: SUI x AI</strong> (autonomous Gemini 2.0 agreement generation, deliverable auditing, dispute arbitration, and AI Co-Pilot).
          </p>

          <div className="grid md:grid-cols-2 gap-8 mt-10">
            {/* Tech Stack Components */}
            <div className="space-y-3">
              {[
                { name: 'Sui Move Smart Contracts (v2)', desc: 'Object-centric payment vault module with shared state, basis-point vector disbursement, and 9/9 unit tests.', badge: 'Track 01 · Move', color: 'bg-blue-100 text-blue-700' },
                { name: 'Atomic Programmable Transaction Blocks', desc: 'Atomic execution composing coin splits and multi-recipient transfers in one sub-second block.', badge: 'Track 01 · PTB', color: 'bg-emerald-100 text-emerald-700' },
                { name: 'Gemini 2.0 AI Pact Generator', desc: 'Converts unstructured English prompts into locked milestone agreements, deliverable rubrics, and basis-point split distributions.', badge: 'Track 02 · SUI x AI', color: 'bg-violet-100 text-violet-700' },
                { name: 'Autonomous AI Deliverable & Dispute Auditor', desc: 'Live GitHub/Figma artifact verification and mathematical arbitration verdicts for fair dispute resolutions.', badge: 'Track 02 · SUI x AI', color: 'bg-indigo-100 text-indigo-700' },
                { name: 'Google zkLogin & Sponsored Gas Relayer', desc: 'Zero-knowledge Web2 onboarding with 10 sponsored zero-gas transactions per month.', badge: 'zkLogin & Gas', color: 'bg-amber-100 text-amber-700' },
              ].map((item, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">{item.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</div>
                  </div>
                  <span className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase shrink-0 ${item.color}`}>
                    {item.badge}
                  </span>
                </div>
              ))}
            </div>

            {/* Move Code Showcase */}
            <div className="rounded-3xl bg-slate-900 p-6 text-xs font-mono shadow-2xl text-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-slate-400 font-sans text-xs ml-2">escrow.move — Atomic Split Function</span>
                  </div>
                  <span className="text-[10px] rounded bg-blue-500/20 text-blue-300 px-2 py-0.5 font-sans font-bold">
                    Testnet Package v2
                  </span>
                </div>

                <pre className="text-[11px] leading-relaxed text-slate-300 overflow-x-auto whitespace-pre-wrap">{`public entry fun approve_and_split_payout<T>(
  escrow: &mut MilestoneEscrow<T>,
  ctx: &mut TxContext
) {
  assert!(ctx.sender() == escrow.client, ENotClient);
  assert!(escrow.status == STATUS_DELIVERED, EInvalidStatus);

  let total = coin::value(&escrow.payment);
  let n = vector::length(&escrow.recipients);
  let mut distributed = 0u64;

  let mut i = 0;
  while (i < n) {
    let r = vector::borrow(&escrow.recipients, i);
    let amount = if (i == n - 1) { total - distributed }
                 else { (total * r.bps) / 10000 };
    let payout = coin::split(&mut escrow.payment, amount, ctx);
    transfer::public_transfer(payout, r.recipient);
    distributed = distributed + amount;
    i = i + 1;
  };
  escrow.status = STATUS_RELEASED;
}`}</pre>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-slate-400 text-[11px] font-sans">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> 9/9 Tests Passing
                </span>
                <a
                  href={getSuiVisionPackageUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                >
                  View on SuiVision <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PILLAR 5: OVERALL CONCEPT & ARCHITECTURAL WORKFLOW ───────── */}
      <section id="architecture-concept" className="scroll-mt-0 py-20 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 mb-2">
            <Layers className="h-4 w-4" /> Pitch Pillar 05
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            Overall Concept &amp; End-to-End Workflow
          </h2>
          <p className="text-slate-600 mt-2 max-w-3xl text-sm sm:text-base leading-relaxed">
            A frictionless 5-stage lifecycle combining artificial intelligence and Sui smart contracts seamlessly.
          </p>

          {/* 5 Stages Flow */}
          <div className="grid md:grid-cols-5 gap-4 mt-10">
            {[
              { num: '01', title: 'AI Pact Builder', desc: 'Client describes project scope. AI structures milestones, deliverable criteria, and team splits.', icon: Bot, color: 'border-blue-200 bg-blue-50/50 text-blue-700' },
              { num: '02', title: 'zkLogin Deposit', desc: 'Client signs in via Google. USDC is locked into a typed Move shared object on Sui Testnet.', icon: Lock, color: 'border-indigo-200 bg-indigo-50/50 text-indigo-700' },
              { num: '03', title: 'Proof Submission', desc: 'Freelancer submits immutable deliverable proof (GitHub PR, Figma, or IPFS URI).', icon: FileCheck, color: 'border-violet-200 bg-violet-50/50 text-violet-700' },
              { num: '04', title: 'AI Milestone Audit', desc: 'OpenRouter AI evaluates deliverable against acceptance criteria before approval.', icon: ShieldCheck, color: 'border-amber-200 bg-amber-50/50 text-amber-700' },
              { num: '05', title: 'Atomic PTB Split', desc: 'Client approves with 1 click. Sui dispatches simultaneous payouts to all team members.', icon: Zap, color: 'border-emerald-200 bg-emerald-50/50 text-emerald-700' },
            ].map((step, idx) => (
              <div key={idx} className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black font-mono text-slate-400">{step.num}</span>
                  <div className={`p-2 rounded-xl border ${step.color}`}>
                    <step.icon className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">{step.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{step.desc}</p>
                </div>
                <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-blue-600" style={{ width: `${(idx + 1) * 20}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Real Savings Calculator ───────────────────── */}
      <GasSavingsCalculator />

      {/* ── Final Hackathon CTA ──────────────────────── */}
      <section id="evaluation" className="scroll-mt-0 bg-blue-gradient py-20 text-white text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300/40 bg-yellow-400/20 px-4 py-1.5 text-xs font-black text-yellow-300">
            <Award className="h-4 w-4" /> Ready for Judge Evaluation
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            Try SuiPact Live on Sui Testnet Today
          </h2>
          <p className="text-blue-100 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Experience gasless, non-custodial milestone secure vaults with automated AI arbitration and instant atomic team payouts.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-black text-blue-700 shadow-xl hover:bg-blue-50 active:scale-95 transition-all"
            >
              <Sparkles className="h-4 w-4 text-blue-500" />
              Launch Judge Demo (Google zkLogin)
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/40 bg-white/10 px-8 py-4 text-sm font-black text-white hover:bg-white/20 active:scale-95 transition-all"
            >
              <Briefcase className="h-4 w-4 text-yellow-300" />
              Explore Sample Orders
            </Link>
          </div>
        </div>
      </section>

      {/* Footer inside right column */}
      <footer className="bg-blue-dark-gradient border-t border-blue-900/50 py-8 mt-0 text-xs text-blue-300">
        <div className="mx-auto max-w-7xl px-4 space-y-6">
          <EcosystemPartnerBanner variant="banner" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="SuiPact" className="h-5 w-5 object-contain opacity-80" />
              <span className="font-bold text-white">SuiPact</span>
              <span className="text-blue-400">— MUBA Blockchain Hackathon 2026 · Sui Track 01</span>
            </div>
            <div className="flex items-center gap-3 text-blue-400">
              <span>Sui Move Testnet</span>
              <span className="text-blue-600">·</span>
              <span>Google zkLogin</span>
              <span className="text-blue-600">·</span>
              <span>10 Free Sponsored Tx/Mo</span>
              <span className="text-blue-600">·</span>
              <span>9/9 Tests Passing</span>
            </div>
          </div>
        </div>
      </footer>
      </div>
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
  const ethGasFee = recipients * 4.20;
  const upworkFee = amount * 0.10;
  const totalTraditional = Math.max(fiverrFee, upworkFee) + ethGasFee;
  const savings = totalTraditional.toFixed(2);

  return (
    <section id="savings-calculator" className="scroll-mt-0 bg-slate-50 py-20 border-b border-slate-200">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 mb-4">
            <DollarSign className="h-3.5 w-3.5" /> Interactive ROI Calculator
          </div>
          <h2 className="text-3xl font-black text-slate-900">Calculate Exact Real-World Savings</h2>
          <p className="text-slate-500 mt-2 text-sm">Compare SuiPact vs. Fiverr / Upwork + Ethereum gas in real time</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700">Contract Value</label>
                <span className="text-lg font-black text-blue-600">${amount.toLocaleString()} USDC</span>
              </div>
              <input
                type="range" min={100} max={10000} step={100}
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>$100</span><span>$10,000</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700">Team Split Recipients</label>
                <span className="text-lg font-black text-blue-600">{recipients} Freelancers</span>
              </div>
              <input
                type="range" min={1} max={10} step={1}
                value={recipients}
                onChange={e => setRecipients(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>1 recipient</span><span>10 recipients</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-center">
              <div className="text-xs font-bold text-red-500 mb-1">Upwork / Fiverr</div>
              <div className="text-xl sm:text-2xl font-black text-red-600">${fiverrFee.toFixed(2)}</div>
              <div className="text-[10px] text-red-400 mt-1">20% Platform Cut</div>
            </div>
            <div className="rounded-2xl bg-orange-50 border border-orange-100 p-4 text-center">
              <div className="text-xs font-bold text-orange-500 mb-1">Ethereum Gas</div>
              <div className="text-xl sm:text-2xl font-black text-orange-600">${ethGasFee.toFixed(2)}</div>
              <div className="text-[10px] text-orange-400 mt-1">{recipients}× Transfers</div>
            </div>
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center ring-2 ring-emerald-400">
              <div className="text-xs font-bold text-emerald-600 mb-1">SuiPact Total</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-700">$0.00</div>
              <div className="text-[10px] text-emerald-500 mt-1 font-bold">0% Cut · 10 Free Tx/Mo</div>
            </div>
          </div>

          <div className="rounded-2xl bg-blue-gradient p-6 text-center text-white">
            <div className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Your Direct Savings</div>
            <div className="text-4xl sm:text-5xl font-black text-white">
              ${savings}
            </div>
            <div className="text-blue-200 text-xs mt-2 font-medium">
              Saved per contract vs. traditional freelancing &amp; legacy blockchain fees
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
