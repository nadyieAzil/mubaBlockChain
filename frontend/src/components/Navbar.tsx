'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { formatAddress, formatUSDC } from '@/lib/utils';
import {
  Plus,
  Layers,
  Zap,
  ChevronDown,
  ExternalLink,
  LogOut,
  LogIn,
  Copy,
  Check,
  LayoutDashboard,
  Coins,
  Sparkles,
  UserPlus,
  RotateCcw,
} from 'lucide-react';
import { getSuiVisionPackageUrl, getSuiScanAddressUrl } from '@/config/sui';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, balance, claimFaucet, resetDemoState } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    router.push('/login');
  };

  const copyAddress = () => {
    if (!user?.address) return;
    navigator.clipboard.writeText(user.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-blue-gradient shadow-lg shadow-blue-900/20">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center h-9 w-9 overflow-hidden rounded-xl bg-white/10 border border-white/20 group-hover:bg-white/20 transition-all">
              <img src="/logo.png" alt="SuiPact" className="h-7 w-7 object-contain" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-white tracking-tight">SuiPact</span>
              <div className="text-[10px] text-blue-200 font-medium hidden sm:block leading-none mt-0.5">
                Zero-Gas Escrow · Sui Testnet
              </div>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-white/20 text-white'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  My Orders
                </Link>
                <Link
                  href="/escrow/new"
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                    isActive('/escrow/new')
                      ? 'bg-white/20 text-white'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Escrow
                </Link>
              </>
            )}
            <a
              href={getSuiVisionPackageUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg px-3.5 py-2 text-xs font-semibold text-blue-100 hover:bg-white/10 hover:text-white transition-colors"
            >
              Contract Explorer
              <ExternalLink className="h-3 w-3" />
            </a>
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* Wallet Balance Pill (Replaces $0.00 Gas for logged in users) */}
              <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 px-3 py-1.5 text-xs font-extrabold text-emerald-200">
                <Coins className="h-3.5 w-3.5 text-emerald-300" />
                <span className="text-white font-mono">{formatUSDC(balance)}</span>
                <span className="text-[10px] text-emerald-300 uppercase font-semibold">USDC</span>
              </div>

              {/* Instant Faucet Button */}
              <button
                onClick={() => claimFaucet(1000)}
                title="Claim +$1,000 Testnet USDC"
                className="hidden sm:flex items-center gap-1 rounded-xl bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-300/40 px-2.5 py-1.5 text-[11px] font-bold text-yellow-200 transition-all hover:scale-105 active:scale-95"
              >
                <Sparkles className="h-3 w-3 text-yellow-300" />
                <span>+1k Faucet</span>
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-medium text-white transition-all"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-blue-700 font-extrabold text-xs uppercase">
                    {user.name ? user.name.charAt(0) : 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      {user.name.split(' ')[0]}
                      <span className="text-[9px] uppercase font-extrabold text-yellow-300 bg-yellow-400/20 px-1.5 rounded">
                        {user.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-blue-200 font-mono">{formatAddress(user.address, 4)}</div>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-blue-200 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 animate-slide-down overflow-hidden">
                      <div className="bg-blue-gradient px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 font-extrabold text-base uppercase shadow-sm">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-white">{user.name}</h4>
                            <p className="text-[11px] text-blue-100">{user.email || 'No email'}</p>
                            <span className="inline-block mt-1 rounded bg-white/20 text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5">
                              {user.role === 'client' ? '💼 Client' : user.role === 'freelancer' ? '🎨 Freelancer' : '👥 Team Member'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        {/* Live Balance in Dropdown */}
                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-emerald-800">Available Wallet Balance</span>
                            <div className="text-base font-extrabold text-emerald-900 font-mono">{formatUSDC(balance)}</div>
                          </div>
                          <button
                            onClick={() => claimFaucet(1000)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition-all shadow-xs"
                          >
                            <Sparkles className="h-3 w-3" /> Claim +$1k
                          </button>
                        </div>

                        {/* Sui Address */}
                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase text-slate-500">Sui zkLogin Address</span>
                            <button
                              onClick={copyAddress}
                              className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800"
                            >
                              {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                              {copied ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          <p className="font-mono text-[11px] text-slate-700 break-all leading-relaxed">{user.address}</p>
                        </div>

                        {/* Explorer Link */}
                        <a
                          href={getSuiScanAddressUrl(user.address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors px-1"
                        >
                          <span>View on SuiScan Explorer</span>
                          <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                        </a>

                        {/* Reset Demo State */}
                        <div className="pt-1 border-t border-slate-100 space-y-2">
                          <button
                            onClick={() => { resetDemoState(); setDropdownOpen(false); }}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset Demo Balances
                          </button>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-50 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {/* Gas Pill on Public Pages */}
              <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-bold text-white">
                <Zap className="h-3.5 w-3.5 text-yellow-300" />
                <span>$0.00 Gas</span>
                <span className="text-blue-200 font-normal">Sponsored</span>
              </div>

              {/* Distinct Sign In and Sign Up buttons */}
              <Link
                href="/login?mode=signin"
                className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-bold text-white transition-all"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </Link>
              <Link
                href="/login?mode=signup"
                className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50 active:scale-[0.98] transition-all"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
