'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { LiveSuiStats } from '@/components/LiveSuiStats';
import { EcosystemPartnerBanner } from '@/components/EcosystemPartnerBanner';

export function AppLayoutHeader() {
  const pathname = usePathname();
  // On landing page ('/'), Navbar & LiveSuiStats are embedded directly in the landing page column.
  if (pathname === '/') {
    return null;
  }

  // After login / on inner pages, only render Navbar without the top LiveSuiStats info bar.
  return (
    <div className="print:hidden">
      <Navbar />
    </div>
  );
}

export function AppLayoutFooter() {
  const pathname = usePathname();
  // On landing page ('/'), footer is rendered inside the right column of LandingPage.
  if (pathname === '/') {
    return null;
  }

  return (
    <div className="print:hidden">
      <footer className="bg-blue-dark-gradient border-t border-blue-900/50 py-8 mt-0 text-xs text-blue-300">
        <div className="mx-auto max-w-7xl px-4 space-y-6">
          <EcosystemPartnerBanner variant="banner" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="SuiPact" className="h-5 w-5 object-contain opacity-80" />
              <span className="font-bold text-white">SuiPact</span>
              <span className="text-blue-400">— MUBA Blockchain Hackathon 2026 · Sui Track 01 (Payments) &amp; Track 02 (AI)</span>
            </div>
            <div className="flex items-center gap-3 text-blue-400">
              <span>Sui Move Testnet</span>
              <span className="text-blue-600">·</span>
              <span>Google zkLogin</span>
              <span className="text-blue-600">·</span>
              <span>Multi-LLM AI Agent</span>
              <span className="text-blue-600">·</span>
              <span>10 Free Sponsored Tx/Mo</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
