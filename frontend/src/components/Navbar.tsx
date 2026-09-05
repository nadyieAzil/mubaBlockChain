'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { formatAddress, formatUSDC } from '@/lib/utils';
import { WalletTopUpModal } from '@/components/WalletTopUpModal';
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
  Wallet,
  Trash2,
  Building2,
  Code2,
  Users,
} from 'lucide-react';
import { getSuiVisionPackageUrl, getSuiScanAddressUrl } from '@/config/sui';

interface NavbarProps {
  sticky?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ sticky = true }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, balance, claimFaucet, resetBalance, resetDemoState } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
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
    <>
      <header className={`${sticky ? 'sticky top-0' : 'relative'} z-50 w-full bg-blue-gradient shadow-lg shadow-blue-900/20`}>
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
                  Zero-Gas Payment Vault &amp; AI · Sui Testnet
                </div>
              </div>
            </Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* On landing page ('/'), always present clean guest state without active account */}
            {user && pathname !== '/' ? (
              <>
                {/* Clear Wallet Balance Button */}
                <button
                  onClick={() => setShowTopUpModal(true)}
                  title="Click to Top Up, Deposit, or Reset Wallet Balance"
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 px-3 py-1.5 text-xs font-extrabold text-emerald-200 transition-all hover:scale-102 active:scale-98 cursor-pointer shadow-xs"
                >
                  <Wallet className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="text-[10px] text-emerald-300 font-bold uppercase hidden md:inline">Wallet Balance:</span>
                  <span className="text-white font-mono font-black">{formatUSDC(balance)}</span>
                </button>

                {/* Top Up / Faucet / Reset Action Button */}
                <button
                  onClick={() => setShowTopUpModal(true)}
                  title="Top Up or Reset Wallet Balance"
                  className="hidden sm:flex items-center gap-1 rounded-xl bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-300/40 px-2.5 py-1.5 text-[11px] font-bold text-yellow-200 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3 text-yellow-300" />
                  <span>Top Up / Reset</span>
                </button>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-medium text-white transition-all cursor-pointer"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-blue-700 font-extrabold text-xs uppercase">
                      {user.name ? user.name.charAt(0) : 'U'}
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        {user.name.split(' ')[0]}
                        <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                          user.role === 'client'
                            ? 'bg-blue-300/20 text-blue-100 border border-blue-200/30'
                            : 'bg-yellow-400/20 text-yellow-200 border border-yellow-300/30'
                        }`}>
                          {user.role === 'client' ? (
                            <><Building2 className="h-2.5 w-2.5" /> Client</>
                          ) : user.role === 'freelancer' ? (
                            <><Code2 className="h-2.5 w-2.5" /> Freelancer</>
                          ) : (
                            <><Users className="h-2.5 w-2.5" /> Team</>
                          )}
                        </span>
                      </div>
                      <div className="text-[10px] text-blue-200 font-mono">{formatAddress(user.address, 4)}</div>
                    </div>
                    <ChevronDown className={`h-3.5 w-3.5 text-blue-200 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                      <div className="absolute right-0 mt-2.5 w-84 rounded-3xl border border-slate-200/90 bg-white shadow-2xl z-50 animate-slide-down overflow-hidden ring-1 ring-black/5">
                        
                        {/* Profile Header with Modern Gradient */}
                        <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-5 py-4 text-white overflow-hidden">
                          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
                          <div className="relative z-10 flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 border border-white/25 text-white font-black text-lg uppercase shadow-inner backdrop-blur-md">
                              {user.name.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-extrabold text-white truncate">{user.name}</h4>
                              <p className="text-[11px] text-blue-100/90 truncate">{user.email || 'No email'}</p>
                              <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-white/15 border border-white/20 text-white text-[9.5px] font-bold uppercase px-2.5 py-0.5 backdrop-blur-xs">
                                {user.role === 'client' ? (
                                  <><Building2 className="h-2.5 w-2.5" /> Client Account</>
                                ) : user.role === 'freelancer' ? (
                                  <><Code2 className="h-2.5 w-2.5" /> Freelancer Account</>
                                ) : (
                                  <><Users className="h-2.5 w-2.5" /> Team Member</>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          {/* Connected Balance Card */}
                          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-slate-50 p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <Wallet className="h-3.5 w-3.5 text-blue-600" />
                                <span>Connected Wallet</span>
                              </span>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-200 px-2 py-0.5 rounded-full">
                                Testnet USDC
                              </span>
                            </div>
                            <div className="flex items-end justify-between gap-2 pt-0.5">
                              <div>
                                <span className="text-[10px] font-medium text-slate-400 block">Available Balance</span>
                                <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                                  {formatUSDC(balance)}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setShowTopUpModal(true);
                                  setDropdownOpen(false);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-extrabold shadow-sm transition-all cursor-pointer hover:shadow-blue-600/25"
                              >
                                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                                <span>Top Up</span>
                              </button>
                            </div>
                          </div>

                          {/* Sui Address & SuiScan Link */}
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                Sui zkLogin Address
                              </span>
                              <a
                                href={getSuiScanAddressUrl(user.address)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                <span>SuiScan</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>

                            <div className="flex items-center justify-between gap-2 rounded-xl bg-white border border-slate-200/90 px-3 py-2">
                              <span className="font-mono text-xs font-semibold text-slate-700 truncate" title={user.address}>
                                {formatAddress(user.address, 10)}
                              </span>
                              <button
                                onClick={copyAddress}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors shrink-0 cursor-pointer"
                                title="Copy full address"
                              >
                                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                <span>{copied ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                          </div>

                          {/* Sandbox & Account Management Actions */}
                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => {
                                  resetBalance(0);
                                  setDropdownOpen(false);
                                }}
                                className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 py-2 text-[11px] font-bold text-rose-700 transition-colors cursor-pointer"
                                title="Reset wallet to $0.00"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                <span>Reset to $0</span>
                              </button>

                              <button
                                onClick={() => {
                                  resetDemoState();
                                  setDropdownOpen(false);
                                }}
                                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2 text-[11px] font-bold text-slate-700 transition-colors cursor-pointer"
                                title="Restore default balance for this persona"
                              >
                                <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                                <span>Restore Balance</span>
                              </button>
                            </div>

                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 py-2.5 text-xs font-extrabold text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
                            >
                              <LogOut className="h-3.5 w-3.5 text-slate-400" />
                              <span>Sign Out</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <Suspense
                fallback={
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-20 rounded-xl bg-white/10 animate-pulse" />
                    <div className="h-8 w-20 rounded-xl bg-white animate-pulse" />
                  </div>
                }
              >
                <NavbarAuthButtons />
              </Suspense>
            )}
          </div>
        </div>
      </header>

      {/* Wallet Top Up & Balance Management Modal */}
      <WalletTopUpModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
      />
    </>
  );
};

// Component for dynamic Sign In / Sign Up active pill state
const NavbarAuthButtons: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = searchParams?.get('mode');

  const isLoginPage = pathname === '/login';
  const isSignInActive = isLoginPage && mode !== 'signup';
  const isSignUpActive = isLoginPage && mode === 'signup';

  return (
    <div className="flex items-center gap-2">
      {/* Gas Pill on Public Pages */}
      <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-bold text-white">
        <Zap className="h-3.5 w-3.5 text-yellow-300" />
        <span>$0.00 Gas</span>
        <span className="text-blue-200 font-normal">Sponsored</span>
      </div>

      {/* Dynamic Sign In and Sign Up buttons */}
      <Link
        href="/login?mode=signin"
        className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
          isSignInActive
            ? 'bg-white text-blue-700 shadow-md ring-2 ring-white/50 scale-[1.02]'
            : 'border border-white/20 bg-white/10 hover:bg-white/20 text-white'
        }`}
      >
        <LogIn className="h-3.5 w-3.5" />
        <span>Sign In</span>
      </Link>
      <Link
        href="/login?mode=signup"
        className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
          isSignUpActive
            ? 'bg-white text-blue-700 shadow-md ring-2 ring-white/50 scale-[1.02]'
            : !isLoginPage
            ? 'bg-white text-blue-700 shadow-sm hover:bg-blue-50'
            : 'border border-white/20 bg-white/10 hover:bg-white/20 text-white'
        }`}
      >
        <UserPlus className="h-3.5 w-3.5" />
        <span>Sign Up</span>
      </Link>
    </div>
  );
};
