'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  MessageCircle,
  ShieldCheck,
  Star,
  Sparkles,
  Plus,
  CheckCircle2,
  Clock,
  Filter,
  Check,
  ArrowRight,
} from 'lucide-react';

interface FreelanceService {
  id: string;
  title: string;
  category: string;
  freelancerName: string;
  freelancerRole: string;
  freelancerAvatar: string;
  freelancerInitials: string;
  rating: number;
  reviewsCount: number;
  completedPacts: number;
  priceSui: number;
  priceUsd: number;
  deliveryDays: string;
  suiVerified: boolean;
  whatsappNumber: string; // e.g. "60123456789"
  displayPhone: string;
  tags: string[];
  deliverables: string[];
  description: string;
}

const CATEGORIES = [
  'All Categories',
  'Sui Move & Smart Contracts',
  'Frontend & Web3 UI',
  'Fullstack & dApps',
  'AI & LLM Integration',
  'Security Audit',
  'UI/UX & Design',
];

const MOCK_SERVICES: FreelanceService[] = [
  {
    id: 'srv-1',
    title: 'Custom Sui Move v2 Smart Contract & Atomic Escrow PTBs',
    category: 'Sui Move & Smart Contracts',
    freelancerName: 'Hafiz Radzi',
    freelancerRole: 'Senior Sui Move Architect',
    freelancerAvatar: '',
    freelancerInitials: 'HR',
    rating: 4.98,
    reviewsCount: 34,
    completedPacts: 48,
    priceSui: 450,
    priceUsd: 1450,
    deliveryDays: '4 Days',
    suiVerified: true,
    whatsappNumber: '60123456789',
    displayPhone: '+60 12-345 6789',
    tags: ['Sui Move v2', 'PTB', 'Object Ownership', 'Atomic Splits'],
    deliverables: [
      'Production-ready Move module with unit test suite',
      'Programmable Transaction Block (PTB) builders',
      'Deployment on Sui Testnet/Mainnet',
      'Formal verification with Move Prover',
    ],
    description: 'Expert Move smart contracts tailored for high-throughput DeFi, multi-sig vaults, atomic payout splits, and sponsored zero-gas mechanics.',
  },
  {
    id: 'srv-2',
    title: 'Modern Web3 Frontend with zkLogin & Wallet Standard Integration',
    category: 'Frontend & Web3 UI',
    freelancerName: 'Sarah Tan',
    freelancerRole: 'Lead Web3 Frontend Engineer',
    freelancerAvatar: '',
    freelancerInitials: 'ST',
    rating: 4.95,
    reviewsCount: 29,
    completedPacts: 41,
    priceSui: 380,
    priceUsd: 1220,
    deliveryDays: '5 Days',
    suiVerified: true,
    whatsappNumber: '60198765432',
    displayPhone: '+60 19-876 5432',
    tags: ['Next.js 15', 'Tailwind CSS', 'Sui zkLogin', '@mysten/dapp-kit'],
    deliverables: [
      'Responsive modern Web3 user interface',
      'Google zkLogin + Sui Wallet Standard connectors',
      'Live chain event polling & transaction toast system',
      'Vercel deployment & performance optimization',
    ],
    description: 'Ultra-fast Next.js 15 web applications with seamless zero-friction user onboarding using Google zkLogin and Sui DApp Kit.',
  },
  {
    id: 'srv-3',
    title: 'Autonomous AI Agreement Agent & Gemini 2.0 Integration',
    category: 'AI & LLM Integration',
    freelancerName: 'Devin Chen',
    freelancerRole: 'AI Agent & LLM Specialist',
    freelancerAvatar: '',
    freelancerInitials: 'DC',
    rating: 4.92,
    reviewsCount: 19,
    completedPacts: 26,
    priceSui: 520,
    priceUsd: 1670,
    deliveryDays: '6 Days',
    suiVerified: true,
    whatsappNumber: '60172348901',
    displayPhone: '+60 17-234 8901',
    tags: ['Gemini 2.0 Flash', 'DeepSeek', 'LangChain', 'Automated Dispute AI'],
    deliverables: [
      'AI prompt-to-Pact contract generator',
      'Automated milestone verification agent',
      'Multi-LLM fallback architecture (Gemini + DeepSeek)',
      'Structured JSON extraction & auto-escrow wiring',
    ],
    description: 'Transform conversational English prompts into binding Sui escrow terms and AI arbitration agents using state-of-the-art LLMs.',
  },
  {
    id: 'srv-4',
    title: 'Sui Move Smart Contract Security Audit & Vulnerability Report',
    category: 'Security Audit',
    freelancerName: 'Amina Al-Mansoor',
    freelancerRole: 'Web3 Security Researcher',
    freelancerAvatar: '',
    freelancerInitials: 'AM',
    rating: 5.0,
    reviewsCount: 42,
    completedPacts: 55,
    priceSui: 800,
    priceUsd: 2560,
    deliveryDays: '7 Days',
    suiVerified: true,
    whatsappNumber: '601156781234',
    displayPhone: '+60 11-5678 1234',
    tags: ['Security Audit', 'Reentrancy Checks', 'Capability Leakage', 'Formal Audit PDF'],
    deliverables: [
      'Line-by-line Move bytecode & source audit',
      'Object capability & re-entrancy attack simulation',
      'Signed Security Audit Report & badge for stakeholders',
      'Code fix advisory and remediation validation',
    ],
    description: 'Comprehensive security review of your Sui Move modules to protect against drain bugs, unauthorized capability transfer, and logic flaws.',
  },
  {
    id: 'srv-5',
    title: 'Fullstack dApp MVP: Smart Contracts, Backend & Frontend',
    category: 'Fullstack & dApps',
    freelancerName: 'Kenji Sato',
    freelancerRole: 'Fullstack Web3 Builder',
    freelancerAvatar: '',
    freelancerInitials: 'KS',
    rating: 4.88,
    reviewsCount: 22,
    completedPacts: 31,
    priceSui: 950,
    priceUsd: 3040,
    deliveryDays: '12 Days',
    suiVerified: true,
    whatsappNumber: '60134567890',
    displayPhone: '+60 13-456 7890',
    tags: ['Node.js', 'Express', 'Sui Move', 'Next.js', 'PostgreSQL'],
    deliverables: [
      'Complete end-to-end dApp architecture',
      'Custom backend indexer & WebSocket event broadcaster',
      'Full Sui Move contract suite with zero-gas sponsor backend',
      'Clean modern dashboard with analytics',
    ],
    description: 'Turn your product idea into a working Web3 SaaS MVP on Sui within two weeks, complete with frontend, backend, and Move contracts.',
  },
  {
    id: 'srv-6',
    title: 'High-Conversion Web3 UI/UX Design System & Interactive Figma',
    category: 'UI/UX & Design',
    freelancerName: 'Farah Zulaikha',
    freelancerRole: 'Product & Web3 Designer',
    freelancerAvatar: '',
    freelancerInitials: 'FZ',
    rating: 4.96,
    reviewsCount: 38,
    completedPacts: 47,
    priceSui: 280,
    priceUsd: 890,
    deliveryDays: '3 Days',
    suiVerified: true,
    whatsappNumber: '60189012345',
    displayPhone: '+60 18-901 2345',
    tags: ['Figma Component System', 'Dark Mode UI', 'Micro-Animations', 'User Journey'],
    deliverables: [
      'Complete auto-layout Figma design system (Dark & Light)',
      'Interactive prototype with onboarding flows',
      'Developer handoff tokens & SVG asset exports',
      'Mobile-responsive layout specifications',
    ],
    description: 'Stunning, high-end Web3 user interfaces tailored for high user conversion, gamified onboarding, and mobile-friendly usability.',
  },
];

export default function ServicesMarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter services by category and search query
  const filteredServices = MOCK_SERVICES.filter((srv) => {
    const matchesCategory =
      selectedCategory === 'All Categories' || srv.category === selectedCategory;
    const matchesSearch =
      srv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.freelancerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      srv.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const generateWhatsAppLink = (srv: FreelanceService) => {
    const text = encodeURIComponent(
      `Hello ${srv.freelancerName}! 👋\n\nI saw your service on SuiPact: "${srv.title}".\nI am interested in hiring you. Let's discuss requirements and initiate a secure SuiPact Escrow PACT.`
    );
    return `https://wa.me/${srv.whatsappNumber}?text=${text}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* ── Top Hero Header (Light Theme) ───────────────────────────── */}
      <div className="border-b border-slate-200 bg-white px-4 py-8 lg:py-10 sm:px-6 lg:px-8 shadow-xs">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-700">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Verified Sui Freelancer &amp; Gig Marketplace</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
                Explore Services &amp; Hire Top Talent
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Connect directly with certified Sui developers, UI/UX designers, and AI architects via WhatsApp. Secure every milestone with zero-gas SuiPact smart contracts.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/escrow/new"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>Create Custom Escrow</span>
              </Link>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="mt-6 space-y-4">
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by skill, developer name, or service (e.g., Move v2, zkLogin, AI agent)..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3.5 pl-12 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-inner outline-hidden focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Services Cards Grid ────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between pb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Showing <span className="text-blue-600 font-mono font-black">{filteredServices.length}</span> verified services
          </p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>100% Milestone-Protected via Sui Move PTB</span>
          </div>
        </div>

        {filteredServices.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-4 shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Filter className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No services found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              We could not find any services matching &ldquo;{searchQuery}&rdquo;. Try clearing your search or picking another category.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All Categories');
              }}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((srv) => (
              <div
                key={srv.id}
                className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-blue-400 hover:shadow-xl group"
              >
                {/* Card Header & Freelancer Profile */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-sm shadow-sm">
                        {srv.freelancerInitials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {srv.freelancerName}
                          </span>
                          {srv.suiVerified && (
                            <span title="Sui Move Certified Freelancer">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-100" />
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 block">
                          {srv.freelancerRole}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-black text-amber-800">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                      <span>{srv.rating.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({srv.reviewsCount})</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md inline-block mb-1.5">
                      {srv.category}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                      {srv.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {srv.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {srv.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Key Deliverables */}
                  <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Included Deliverables:
                    </span>
                    {srv.deliverables.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-700">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer with Pricing & WhatsApp Contact */}
                <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-slate-900 font-mono">
                          {srv.priceSui} SUI
                        </span>
                        <span className="text-[11px] text-slate-500">
                          (~${srv.priceUsd.toLocaleString()})
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10.5px] text-slate-500">
                        <Clock className="h-3 w-3" />
                        <span>Delivery: {srv.deliveryDays}</span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg">
                      {srv.completedPacts} Pacts Done
                    </span>
                  </div>

                  {/* WhatsApp Contact Button & Escrow PACT Button */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={generateWhatsAppLink(srv)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
                    >
                      <MessageCircle className="h-4 w-4 fill-white" />
                      <span>WhatsApp</span>
                    </a>

                    <Link
                      href={`/escrow/new?title=${encodeURIComponent(srv.title)}&amount=${srv.priceSui}&freelancer=${encodeURIComponent(srv.freelancerName)}`}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white px-3 py-2.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
                    >
                      <span>Hire Escrow</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Client Assurance Banner ────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 mt-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-blue-700 font-extrabold text-xs uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" />
              <span>How Hiring on SuiPact Works</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              Direct WhatsApp Communication + Zero-Gas Escrow Protection
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              1. Inquire with the freelancer on WhatsApp to discuss project requirements.<br />
              2. Agree on scope &amp; create an escrow PACT on SuiPact.<br />
              3. Funds are locked safely in the Sui Move smart contract and disbursed automatically upon milestone approval.
            </p>
          </div>

          <Link
            href="/escrow/new"
            className="shrink-0 inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-5 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition-all active:scale-95"
          >
            <span>Start an Escrow PACT</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
