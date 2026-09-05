'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getSuiVisionPackageUrl } from '@/config/sui';
import {
  LayoutDashboard,
  Plus,
  ExternalLink,
  Code2,
  Building2,
  Crown,
  Users,
  Briefcase,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const AppSidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  // Hide on landing page ('/') and login page ('/login')
  if (pathname === '/' || pathname === '/login') {
    return null;
  }

  const isClient = user?.role === 'client';
  const isFreelancer = user?.role === 'freelancer';

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="hidden lg:flex w-72 xl:w-80 shrink-0 flex-col justify-between border-r border-[#1b264f]/80 bg-[#0b132b] text-white shadow-2xl sticky top-0 h-screen z-30 overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Top Header matching Pitch Deck Nav */}
        <div className="space-y-3 pb-3 border-b border-[#1b264f]">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-300 shadow-sm group-hover:bg-amber-400/30 transition-all">
                {isClient ? <Building2 className="h-5 w-5" /> : isFreelancer ? <Crown className="h-5 w-5" /> : <Users className="h-5 w-5" />}
              </div>
              <div>
                <span className="text-xs font-black tracking-wider text-white block uppercase">
                  {isClient ? 'CLIENT PORTAL' : isFreelancer ? 'FREELANCER HUB' : 'SUIPACT WORKSPACE'}
                </span>
                <span className="text-[10px] text-blue-300 font-semibold block">
                  MUBA Tracks 01 &amp; 02
                </span>
              </div>
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Move
            </span>
          </div>

          {/* Flow status line & progress indicator */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Workspace Active</span>
              <span className="font-black text-amber-300 font-mono">
                {user?.role ? user.role.toUpperCase() : 'TESTNET'}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#141f42] overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-amber-400 rounded-full w-3/4 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Navigation Items styled like Pitch Deck Menu */}
        <div className="space-y-2 pt-1">
          {/* 1. My Hired Projects / Assigned Contracts */}
          <Link
            href="/dashboard"
            className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all cursor-pointer group relative ${
              isActive('/dashboard')
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40'
                : 'text-slate-300 hover:bg-[#131d3f]/60 hover:text-white border border-transparent hover:border-[#1f2e60]'
            }`}
          >
            {isActive('/dashboard') && (
              <div className="absolute -left-1 top-2.5 bottom-2.5 w-1.5 rounded-full bg-amber-400 shadow-md" />
            )}
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
                isActive('/dashboard')
                  ? 'bg-white/20 text-white border border-white/30 shadow-inner'
                  : 'bg-[#141f42] border border-[#223366] text-slate-400 group-hover:text-amber-300 group-hover:border-amber-300/30'
              }`}
            >
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-mono font-bold ${isActive('/dashboard') ? 'text-amber-300' : 'text-blue-400'}`}>
                  01
                </span>
                <span className="text-xs font-extrabold truncate block text-white">
                  {isClient ? 'My Hired Projects' : 'Assigned Contracts'}
                </span>
              </div>
              <span className={`text-[10px] truncate block ${isActive('/dashboard') ? 'text-blue-100' : 'text-slate-400'}`}>
                Active Vaults &amp; Milestones
              </span>
            </div>
          </Link>

          {/* 2. Explore Services (New Tab for Clients to find services) */}
          <Link
            href="/services"
            className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all cursor-pointer group relative ${
              isActive('/services')
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40'
                : 'text-slate-300 hover:bg-[#131d3f]/60 hover:text-white border border-transparent hover:border-[#1f2e60]'
            }`}
          >
            {isActive('/services') && (
              <div className="absolute -left-1 top-2.5 bottom-2.5 w-1.5 rounded-full bg-amber-400 shadow-md" />
            )}
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
                isActive('/services')
                  ? 'bg-white/20 text-white border border-white/30 shadow-inner'
                  : 'bg-[#141f42] border border-[#223366] text-slate-400 group-hover:text-amber-300 group-hover:border-amber-300/30'
              }`}
            >
              <Briefcase className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-mono font-bold ${isActive('/services') ? 'text-amber-300' : 'text-blue-400'}`}>
                  02
                </span>
                <span className="text-xs font-extrabold truncate block text-white">
                  Explore Services
                </span>
              </div>
              <span className={`text-[10px] truncate block ${isActive('/services') ? 'text-blue-100' : 'text-slate-400'}`}>
                USDC Gigs &amp; WhatsApp
              </span>
            </div>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
              USDC
            </span>
          </Link>

          {/* 3. Create Secure Vault */}
          {isClient ? (
            <Link
              href="/escrow/new"
              className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all cursor-pointer group relative ${
                isActive('/escrow/new')
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40'
                  : 'text-slate-300 hover:bg-[#131d3f]/60 hover:text-white border border-transparent hover:border-[#1f2e60]'
              }`}
            >
              {isActive('/escrow/new') && (
                <div className="absolute -left-1 top-2.5 bottom-2.5 w-1.5 rounded-full bg-amber-400 shadow-md" />
              )}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
                  isActive('/escrow/new')
                    ? 'bg-white/20 text-white border border-white/30 shadow-inner'
                    : 'bg-[#141f42] border border-[#223366] text-slate-400 group-hover:text-amber-300 group-hover:border-amber-300/30'
                }`}
              >
                <Plus className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-mono font-bold ${isActive('/escrow/new') ? 'text-amber-300' : 'text-blue-400'}`}>
                    03
                  </span>
                  <span className="text-xs font-extrabold truncate block text-white">
                    Create Secure Vault
                  </span>
                </div>
                <span className={`text-[10px] truncate block ${isActive('/escrow/new') ? 'text-blue-100' : 'text-slate-400'}`}>
                  Zero-Gas Locked Vault
                </span>
              </div>
            </Link>
          ) : (
            <div
              className="w-full flex items-center gap-3 p-3 rounded-2xl text-left text-slate-500 bg-[#090f23]/60 border border-[#1b264f]/50 cursor-not-allowed opacity-60"
              title="Only Clients can create new vaults"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#141f42]/50 border border-[#223366]/50 text-slate-600">
                <Plus className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-600">03</span>
                  <span className="text-xs font-bold truncate block text-slate-500">Create Secure Vault</span>
                </div>
                <span className="text-[10px] text-slate-600 truncate block">Client only action</span>
              </div>
            </div>
          )}

          {/* 4. Contract Explorer */}
          <a
            href={getSuiVisionPackageUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all cursor-pointer group text-slate-300 hover:bg-[#131d3f]/60 hover:text-white border border-transparent hover:border-[#1f2e60]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#141f42] border border-[#223366] text-slate-400 group-hover:text-amber-300 group-hover:border-amber-300/30 transition-all">
              <Code2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-blue-400">04</span>
                  <span className="text-xs font-extrabold truncate block text-white">
                    Contract Explorer
                  </span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-200" />
              </div>
              <span className="text-[10px] text-slate-400 truncate block">
                SuiVision Move Package
              </span>
            </div>
          </a>
        </div>
      </div>

      {/* Sidebar Footer with Yellow Action Button and Micro Footer */}
      <div className="p-4 space-y-3 border-t border-[#1b264f] bg-[#080e22]/90">
        <Link
          href="/services"
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-xs font-black text-slate-950 shadow-lg shadow-amber-400/20 hover:bg-amber-300 transition-all active:scale-[0.98]"
        >
          <span>Explore Services Marketplace</span>
          <span className="text-sm font-bold">→</span>
        </Link>

        <div className="flex items-center justify-between pt-1 text-[10px] font-medium text-slate-400">
          <a
            href={getSuiVisionPackageUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-300 flex items-center gap-1 transition-colors"
          >
            <span>Sui Move v2</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
          <span className="font-bold text-emerald-400">10 Free Tx/Mo</span>
        </div>
      </div>
    </aside>
  );
};
