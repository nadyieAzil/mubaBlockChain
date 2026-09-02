'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth, PRESET_DEMO_ACCOUNTS, deriveAddressFromEmail } from '@/context/AuthContext';
import {
  Loader2,
  ShieldCheck,
  Zap,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

// ── Google Consent Screen Simulation ───────────────────────────────
interface GoogleConsentProps {
  onConfirm: (email: string, name: string) => void;
  onCancel: () => void;
  prefilledEmail: string;
  prefilledName: string;
}

const GoogleConsentScreen: React.FC<GoogleConsentProps> = ({ onConfirm, onCancel, prefilledEmail, prefilledName }) => {
  const [step, setStep] = useState<'account' | 'consent' | 'loading'>('account');

  const handleContinue = () => {
    setStep('consent');
  };

  const handleAllow = () => {
    setStep('loading');
    setTimeout(() => onConfirm(prefilledEmail, prefilledName), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden animate-pop-in">
        {/* Google Header */}
        <div className="px-8 pt-8 pb-6 text-center">
          {/* Google G Logo */}
          <div className="mx-auto h-14 w-14 mb-4 flex items-center justify-center">
            <svg viewBox="0 0 48 48" className="h-12 w-12">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
          </div>

          {step === 'account' && (
            <>
              <h2 className="text-xl font-semibold text-slate-800">Sign in</h2>
              <p className="text-sm text-slate-500 mt-1">to continue to <strong>SuiPact</strong></p>
            </>
          )}
          {step === 'consent' && (
            <>
              <h2 className="text-xl font-semibold text-slate-800">SuiPact wants to access your Google Account</h2>
              <p className="text-sm text-blue-600 font-semibold mt-2">{prefilledEmail}</p>
            </>
          )}
          {step === 'loading' && (
            <>
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-sm text-slate-600 mt-3">Deriving your Sui zkLogin address...</p>
            </>
          )}
        </div>

        {step === 'account' && (
          <div className="px-8 pb-8 space-y-3">
            {/* Account selector */}
            <button
              onClick={handleContinue}
              className="w-full flex items-center gap-3 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors p-3 text-left"
            >
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-extrabold text-base uppercase">
                {(prefilledName || prefilledEmail).charAt(0)}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">{prefilledName || 'Google User'}</div>
                <div className="text-xs text-slate-500">{prefilledEmail}</div>
              </div>
              <div className="ml-auto text-blue-600">›</div>
            </button>
            <button
              onClick={onCancel}
              className="w-full text-xs text-slate-500 hover:text-slate-700 py-2 transition-colors"
            >
              Use another account
            </button>
          </div>
        )}

        {step === 'consent' && (
          <div className="px-8 pb-8 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">This will allow SuiPact to:</p>
              {[
                'See your name, email address, and profile picture',
                'Derive your Sui testnet zkLogin address from your Google JWT',
                'Associate your escrow orders with this Google identity',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Demo mode notice */}
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 leading-relaxed">
                <strong>Hackathon Demo Mode:</strong> Production SuiPact uses real Google OAuth 2.0 + Mysten Labs zkLogin. This demo simulates the consent flow and derives a Sui testnet address from your email via SHA-256.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleAllow}
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
              >
                Allow
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


// ── Main Login Form ─────────────────────────────────────────────────
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const { loginWithGoogle, loginWithDemo } = useAuth();

  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [roleInput, setRoleInput] = useState<'client' | 'freelancer'>('client');
  const [derivedPreview, setDerivedPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showGoogleConsent, setShowGoogleConsent] = useState(false);

  const handleEmailChange = async (val: string) => {
    setEmailInput(val);
    if (val.includes('@') && val.length > 5) {
      const addr = await deriveAddressFromEmail(val);
      setDerivedPreview(addr);
    } else {
      setDerivedPreview('');
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) return;
    setShowGoogleConsent(true);
  };

  const handleConsentConfirm = async (email: string, name: string) => {
    setShowGoogleConsent(false);
    setLoading(true);
    try {
      await loginWithGoogle(email, name || nameInput || email.split('@')[0], roleInput);
      router.push(redirectUrl);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoPersona = (index: number) => {
    loginWithDemo(PRESET_DEMO_ACCOUNTS[index]);
    router.push(redirectUrl);
  };

  const demoPersonas = [
    { account: PRESET_DEMO_ACCOUNTS[0], emoji: '💼', desc: 'Creates & funds escrow orders' },
    { account: PRESET_DEMO_ACCOUNTS[1], emoji: '🎨', desc: 'Submits deliverables, receives payout' },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-blue-gradient-soft">
      {showGoogleConsent && (
        <GoogleConsentScreen
          onConfirm={handleConsentConfirm}
          onCancel={() => setShowGoogleConsent(false)}
          prefilledEmail={emailInput}
          prefilledName={nameInput || emailInput.split('@')[0]}
        />
      )}

      <div className="w-full max-w-5xl rounded-3xl border border-white/80 bg-white shadow-2xl shadow-blue-200/50 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">

        {/* ── Left: Form ── */}
        <div className="lg:col-span-6 flex flex-col justify-center px-8 py-10 space-y-6">
          {/* Header */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="SuiPact Logo" className="h-7 w-7 object-contain" />
              <span className="text-sm font-extrabold text-slate-800">SuiPact</span>
              <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">Sui Testnet</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">Hello Again!</h1>
            <p className="text-sm text-slate-500">Sign in to your zero-gas stablecoin escrow workspace</p>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            <div>
              <input
                type="email"
                required
                placeholder="Google account email"
                value={emailInput}
                onChange={(e) => handleEmailChange(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Display name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
              />
              <select
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value as any)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
              >
                <option value="client">💼 Client (Buyer)</option>
                <option value="freelancer">🎨 Freelancer (Seller)</option>
              </select>
            </div>

            {/* Derived Address Preview */}
            {derivedPreview && (
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 animate-fade-in">
                <div className="text-[10px] font-extrabold uppercase text-blue-600 mb-1">Your Sui zkLogin Address (Derived):</div>
                <div className="font-mono text-[11px] text-slate-700 break-all">{derivedPreview}</div>
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading || !emailInput}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', color: 'white' }}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Connecting to Google...</>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                    <path fill="white" fillOpacity="0.9" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="white" fillOpacity="0.7" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="white" fillOpacity="0.5" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="white" fillOpacity="0.3" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400 font-medium">Or try a Judge Demo Persona</span>
            </div>
          </div>

          {/* Demo Personas */}
          <div className="grid grid-cols-2 gap-3">
            {demoPersonas.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleDemoPersona(i)}
                className="flex flex-col items-start gap-1 rounded-2xl border-2 border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/50 transition-all p-3.5 text-left card-interactive"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{p.emoji}</span>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">{p.account.name.split(' ')[0]}</div>
                    <div className="text-[9px] uppercase font-bold text-blue-600 bg-blue-50 px-1.5 rounded">{p.account.role}</div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 leading-relaxed mt-1">{p.desc}</div>
              </button>
            ))}
          </div>

          <p className="text-center text-[11px] text-slate-400">
            No seed phrase · $0 gas · Sui Testnet only
          </p>
        </div>

        {/* ── Right: Visual Artwork ── */}
        <div className="lg:col-span-6 relative min-h-[380px] lg:min-h-auto bg-blue-gradient flex flex-col justify-between p-8 overflow-hidden">
          {/* Background orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-orb" />
            <div className="absolute bottom-10 left-10 h-48 w-48 rounded-full bg-indigo-500/20 blur-2xl animate-orb delay-400" />
          </div>

          <img
            src="/auth-showcase.jpg"
            alt="Scenic"
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-800/50 to-blue-700/30" />

          {/* Top badge */}
          <div className="relative z-10 flex justify-end">
            <span className="rounded-full bg-white/15 backdrop-blur-sm px-3.5 py-1 text-xs font-bold text-white border border-white/20">
              Sui Track 01 · Payments & Stablecoins
            </span>
          </div>

          {/* Feature pills (middle) */}
          <div className="relative z-10 space-y-3">
            {[
              { icon: <ShieldCheck className="h-4 w-4" />, text: 'Google zkLogin — no seed phrase' },
              { icon: <Zap className="h-4 w-4 text-yellow-300" />, text: '$0.00 gas — sponsor pays all fees' },
              { icon: <CheckCircle2 className="h-4 w-4 text-emerald-300" />, text: 'Atomic 1-PTB team split payout' },
            ].map((f, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-3 animate-fade-in-left delay-${(i + 2) * 100}`}>
                <div className="text-white">{f.icon}</div>
                <span className="text-sm font-semibold text-white">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Bottom caption & carousel arrows */}
          <div className="relative z-10 space-y-3">
            <h2 className="text-xl font-bold text-white leading-snug">
              Finally, team payments done right — on Sui blockchain.
            </h2>
            <div className="flex items-center gap-2">
              <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white border border-white/20 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white border border-white/20 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-slate-500 bg-blue-gradient-soft">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
