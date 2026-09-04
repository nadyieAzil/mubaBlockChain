'use client';

import React, { useState } from 'react';
import { Sparkles, ExternalLink, Zap, HeartHandshake, X } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  category: string;
  tagline: string;
  url: string;
  logoBadge: string;
  color: string;
}

const ECOSYSTEM_PARTNERS: Partner[] = [
  {
    id: 'sui-foundation',
    name: 'Sui Foundation',
    category: 'Ecosystem Grant',
    tagline: 'Supporting zero-gas infrastructure and public good development on Sui Testnet.',
    url: 'https://sui.io',
    logoBadge: '💧',
    color: 'from-blue-600 to-cyan-600',
  },
  {
    id: 'cetus',
    name: 'Cetus Protocol',
    category: 'DEX & Liquidity',
    tagline: 'Swap your released escrow USDC into SUI and other ecosystem tokens at best rates.',
    url: 'https://cetus.zone',
    logoBadge: '🐳',
    color: 'from-indigo-600 to-blue-600',
  },
  {
    id: 'navi',
    name: 'Navi Protocol',
    category: 'Yield & Lending',
    tagline: 'Earn automated yield on idle USDC escrow deposits prior to project release.',
    url: 'https://naviprotocol.io',
    logoBadge: '⚡',
    color: 'from-cyan-600 to-teal-600',
  },
  {
    id: 'movebit',
    name: 'MoveBit Security',
    category: 'Move Contract Audits',
    tagline: 'Formal verification and security reviews for Move smart contract escrow safety.',
    url: 'https://movebit.xyz',
    logoBadge: '🛡️',
    color: 'from-violet-600 to-purple-600',
  },
];

export function EcosystemPartnerBanner({ variant = 'banner' }: { variant?: 'banner' | 'sidebar' | 'card' }) {
  const [activePartnerIndex, setActivePartnerIndex] = useState(0);
  const [showPartnerModal, setShowPartnerModal] = useState(false);

  const activePartner = ECOSYSTEM_PARTNERS[activePartnerIndex];

  if (variant === 'sidebar' || variant === 'card') {
    return (
      <>
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-slate-50 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-blue-700">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Ecosystem Sponsor
            </div>
            <button
              onClick={() => setShowPartnerModal(true)}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
            >
              Partner with us
            </button>
          </div>

          <div className="flex items-start gap-3 mt-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${activePartner.color} text-lg shadow-sm text-white`}>
              {activePartner.logoBadge}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-slate-900 truncate">{activePartner.name}</span>
                <span className="rounded bg-blue-100/80 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">
                  {activePartner.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                {activePartner.tagline}
              </p>
            </div>
          </div>

          <div className="mt-3.5 flex items-center justify-between border-t border-slate-200/60 pt-2.5">
            <div className="flex items-center gap-1">
              {ECOSYSTEM_PARTNERS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePartnerIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${activePartnerIndex === idx ? 'w-4 bg-blue-600' : 'w-1.5 bg-slate-300 hover:bg-slate-400'}`}
                  aria-label={`Partner ${idx + 1}`}
                />
              ))}
            </div>
            <a
              href={activePartner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 transition-colors"
            >
              Visit Partner <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {showPartnerModal && <PartnerModal onClose={() => setShowPartnerModal(false)} />}
      </>
    );
  }

  // Default wide footer/section banner
  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-blue-900/60 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-4 sm:p-5 text-white shadow-xl shadow-blue-950/20">
        {/* Background glow */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${activePartner.color} text-xl shadow-md`}>
              {activePartner.logoBadge}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-yellow-300">
                  ⚡ Powered by Ecosystem Partner
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-blue-200">
                  {activePartner.category}
                </span>
              </div>
              <div className="text-sm font-extrabold text-white mt-0.5 flex items-center gap-2">
                <span>{activePartner.name}</span>
                <span className="text-slate-400 font-normal hidden sm:inline">— {activePartner.tagline}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0">
            {/* Dots */}
            <div className="flex items-center gap-1">
              {ECOSYSTEM_PARTNERS.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setActivePartnerIndex(idx)}
                  className={`h-2 rounded-full transition-all ${activePartnerIndex === idx ? 'w-5 bg-yellow-300' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                  title={p.name}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <a
                href={activePartner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 text-xs font-bold text-white transition-all active:scale-95"
              >
                Explore <ExternalLink className="h-3 w-3 text-blue-200" />
              </a>

              <button
                onClick={() => setShowPartnerModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 px-3 py-1.5 text-xs font-extrabold text-slate-950 transition-all shadow-sm active:scale-95"
              >
                <Sparkles className="h-3 w-3 text-slate-950" />
                Sponsor a Slot
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPartnerModal && <PartnerModal onClose={() => setShowPartnerModal(false)} />}
    </>
  );
}

function PartnerModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-scale-up">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Ecosystem Partnership & Sponsorship</h3>
            <p className="text-xs text-slate-500">Fund zero-fee Web3 commerce while reaching active builders</p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-2 text-xs text-slate-600">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-blue-600" /> Why sponsor SuiPact?
          </div>
          <ul className="space-y-1.5 list-disc list-inside">
            <li><strong>High-Value Web3 Audience:</strong> 100% of users are active developers, designers, and crypto clients locking USDC.</li>
            <li><strong>Self-Funding Protocol:</strong> 1 sponsorship slot ($100–$300/mo) funds gas and AI verification for over 5,000 escrows.</li>
            <li><strong>Clean, Non-Intrusive UX:</strong> Tasteful dark-mode cards with zero popups or trackers.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-700">Available Sponsorship Slots</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3">
              <div className="font-extrabold text-blue-900">Featured Protocol Slot</div>
              <div className="text-[11px] text-blue-700 mt-0.5">Sitewide footer + Dashboard banner</div>
            </div>
            <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-3">
              <div className="font-extrabold text-violet-900">Category Exclusive</div>
              <div className="text-[11px] text-violet-700 mt-0.5">Single DEX, Lending, or Audit partner</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
          <a
            href="mailto:partnerships@suipact.app?subject=SuiPact%20Ecosystem%20Sponsorship%20Inquiry"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-blue-500/20"
          >
            Contact Partnerships Team <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
