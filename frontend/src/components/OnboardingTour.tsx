'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, X, Lock, FileCheck, CheckCircle2, Zap, Sparkles } from 'lucide-react';

const TOUR_STEPS = [
  {
    icon: <Sparkles className="h-8 w-8 text-yellow-300 icon-hover-bounce" />,
    title: 'Welcome to SuiPact!',
    desc: 'SuiPact is a zero-gas stablecoin escrow on Sui Testnet. It lets clients and freelancers settle project payments safely — without middlemen or platform fees.',
    role: 'Your Role',
    roleDesc: 'You\'ll be assigned as a Client (who pays) or a Freelancer (who delivers work).',
    color: 'from-blue-700 to-blue-900',
    pillColor: 'bg-blue-100 text-blue-700',
  },
  {
    icon: <Lock className="h-8 w-8 text-white" />,
    title: 'Step 1: Client Deposits USDC',
    desc: 'The Client locks USDC into a Move smart contract. The funds are frozen and can only be released by the Client after work is delivered — or refunded if no work is submitted.',
    role: 'What is escrow?',
    roleDesc: 'Think of it like a trusted safe: the client puts money in, and nobody touches it until both parties are satisfied.',
    color: 'from-blue-600 to-indigo-700',
    pillColor: 'bg-indigo-100 text-indigo-700',
  },
  {
    icon: <FileCheck className="h-8 w-8 text-white" />,
    title: 'Step 2: Freelancer Submits Proof',
    desc: 'When work is done, the Lead Freelancer attaches a proof URI (GitHub PR link, Figma URL, IPFS hash). This is recorded immutably on-chain — no he-said-she-said disputes.',
    role: 'What is proof?',
    roleDesc: 'A link to the actual deliverable: a GitHub Pull Request, a Figma design, or an IPFS file hash. Once submitted, it can\'t be changed.',
    color: 'from-violet-600 to-violet-800',
    pillColor: 'bg-violet-100 text-violet-700',
  },
  {
    icon: <Zap className="h-8 w-8 text-yellow-300" />,
    title: 'Step 3: Atomic Team Split Payout',
    desc: 'Client reviews the proof and clicks Approve. Sui executes a Programmable Transaction Block (PTB) that instantly sends each team member their exact share — all in ONE transaction with $0 gas.',
    role: 'Why does this matter?',
    roleDesc: 'Traditional escrow platforms charge 5–20% fees, take days to settle, and require separate payments per person. SuiPact does it in 400ms, $0 cost, for up to 6 recipients.',
    color: 'from-emerald-600 to-teal-700',
    pillColor: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon: <CheckCircle2 className="h-8 w-8 text-white" />,
    title: "You're Ready!",
    desc: "That's the entire SuiPact flow. Head to the Dashboard to see your orders, or create a new escrow now. Your demo personas (Alice/Bob) are pre-funded on Sui Testnet.",
    role: 'Pro Tip',
    roleDesc: 'Log in as Alice Corp (Client) to create and fund escrow. Then switch to Bob Vance (Freelancer) to submit deliverables.',
    color: 'from-blue-700 to-blue-900',
    pillColor: 'bg-yellow-100 text-yellow-700',
  },
];

const ONBOARDING_KEY = 'suipact_onboarding_seen_v2';

export const OnboardingTour: React.FC = () => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Show tour for first-time logged-in users
    if (user && !localStorage.getItem(ONBOARDING_KEY)) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setVisible(false);
  };

  const next = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  };

  if (!visible) return null;

  const current = TOUR_STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="w-full max-w-md rounded-3xl bg-white overflow-hidden shadow-2xl animate-pop-in">
        {/* Colored header */}
        <div className={`bg-gradient-to-br ${current.color} p-8 relative overflow-hidden`}>
          {/* Orb decoration */}
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 left-4 h-24 w-24 rounded-full bg-white/5 blur-xl" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              {/* Step dots */}
              <div className="flex items-center gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                  <div key={i} className={`rounded-full transition-all ${i === step ? 'h-2 w-6 bg-white' : 'h-2 w-2 bg-white/40'}`} />
                ))}
              </div>
              <button onClick={dismiss} className="text-white/60 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-white/15 border border-white/20 mt-2">
              {current.icon}
            </div>
            <h2 className="text-xl font-extrabold text-white leading-tight">{current.title}</h2>
            <p className="text-sm text-white/80 leading-relaxed">{current.desc}</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-1.5">
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${current.pillColor}`}>
              {current.role}
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">{current.roleDesc}</p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button onClick={dismiss} className="text-xs text-slate-400 hover:text-slate-600 font-semibold transition-colors">
              Skip tour
            </button>
            <button
              onClick={next}
              className="flex items-center gap-2 rounded-2xl bg-blue-gradient px-6 py-3 text-sm font-bold text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
            >
              {step < TOUR_STEPS.length - 1 ? (
                <>Next <ArrowRight className="h-4 w-4" /></>
              ) : (
                <>Get Started! <CheckCircle2 className="h-4 w-4" /></>
              )}
            </button>
          </div>

          <div className="text-center text-[10px] text-slate-400">
            Step {step + 1} of {TOUR_STEPS.length} · SuiPact Onboarding
          </div>
        </div>
      </div>
    </div>
  );
};
