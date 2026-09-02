'use client';

import React, { useState, useEffect, Suspense } from 'react';
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


// ── Main Login / Sign Up Form ───────────────────────────────────────
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';

  const { loginWithGoogle, signUpWithGoogle, loginWithDemo, isEmailRegistered, getRegisteredRole } = useAuth();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(initialMode);
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [roleInput, setRoleInput] = useState<'client' | 'freelancer'>('client');
  const [derivedPreview, setDerivedPreview] = useState<string>('');
  const [detectedRole, setDetectedRole] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGoogleConsent, setShowGoogleConsent] = useState(false);

  // Sync mode if query param changes
  useEffect(() => {
    const qMode = searchParams.get('mode');
    if (qMode === 'signup' || qMode === 'signin') {
      setAuthMode(qMode);
      setFormError(null);
    }
  }, [searchParams]);

  const handleEmailChange = async (val: string) => {
    setEmailInput(val);
    setFormError(null);
    if (val.includes('@') && val.length > 5) {
      const addr = await deriveAddressFromEmail(val);
      setDerivedPreview(addr);
      const role = getRegisteredRole(val);
      setDetectedRole(role);
    } else {
      setDerivedPreview('');
      setDetectedRole(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setFormError('Please enter a valid Google email address.');
      return;
    }

    if (authMode === 'signin') {
      const isRegistered = isEmailRegistered(emailInput);
      if (!isRegistered) {
        setFormError(`Email "${emailInput}" is not registered yet. Please switch to the "Sign Up" tab above to choose your role.`);
        return;
      }
    } else {
      const isRegistered = isEmailRegistered(emailInput);
      if (isRegistered) {
        const role = getRegisteredRole(emailInput);
        setFormError(`This email is already registered as ${role?.toUpperCase()}. Please switch to the "Sign In" tab to log in.`);
        return;
      }
    }

    setShowGoogleConsent(true);
  };

  const handleConsentConfirm = async (email: string, name: string) => {
    setShowGoogleConsent(false);
    setLoading(true);
    setFormError(null);
    try {
      if (authMode === 'signup') {
        await signUpWithGoogle(email, name || nameInput || email.split('@')[0], roleInput);
      } else {
        await loginWithGoogle(email);
      }
      router.push(redirectUrl);
    } catch (err: any) {
      setFormError(err.message || 'Authentication error.');
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
        <div className="lg:col-span-6 flex flex-col justify-center px-8 py-10 space-y-5">
          {/* Brand header */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-3">
              <img src="/logo.png" alt="SuiPact Logo" className="h-7 w-7 object-contain" />
              <span className="text-sm font-extrabold text-slate-800">SuiPact</span>
              <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">Sui Testnet</span>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200 mb-2">
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setFormError(null); }}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
                  authMode === 'signin' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🔑 Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setFormError(null); }}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
                  authMode === 'signup' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ✨ Create Account (Sign Up)
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {authMode === 'signin' ? 'Welcome Back!' : 'Create Your Account'}
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              {authMode === 'signin'
                ? 'Enter your registered Google email. Role is detected automatically.'
                : 'Sign up with Google to set your permanent role and derive your $0 gas Sui wallet.'}
            </p>
          </div>

          {/* Error Alert */}
          {formError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-900 flex items-start gap-2 animate-fade-in">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">{formError}</div>
            </div>
          )}

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Google Account Email</label>
              <input
                type="email"
                required
                placeholder="e.g. name@gmail.com"
                value={emailInput}
                onChange={(e) => handleEmailChange(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Sign Up Fields: Display Name & Role Selection */}
            {authMode === 'signup' ? (
              <div className="space-y-3 pt-1 animate-fade-in">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name / Company</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amir Hakim"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Your Primary Role</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRoleInput('client')}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        roleInput === 'client'
                          ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-200'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-base mb-1">💼</div>
                      <div className="text-xs font-extrabold text-slate-900">Client</div>
                      <div className="text-[10px] text-slate-500 leading-tight">Deposit USDC, hire & approve</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRoleInput('freelancer')}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        roleInput === 'freelancer'
                          ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-200'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-base mb-1">🎨</div>
                      <div className="text-xs font-extrabold text-slate-900">Freelancer</div>
                      <div className="text-[10px] text-slate-500 leading-tight">Deliver proof, receive split payouts</div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* In Sign In mode: Show auto-detected role banner if email is recognized */
              detectedRole && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 flex items-center justify-between animate-fade-in text-xs font-bold text-emerald-800">
                  <span>Detected Role:</span>
                  <span className="uppercase px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px]">
                    {detectedRole === 'client' ? '💼 Client' : '🎨 Freelancer'}
                  </span>
                </div>
              )
            )}

            {/* Derived Address Preview */}
            {derivedPreview && (
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 animate-fade-in">
                <div className="text-[10px] font-extrabold uppercase text-blue-600 mb-0.5">Your Sui zkLogin Address (Derived):</div>
                <div className="font-mono text-[11px] text-slate-700 break-all">{derivedPreview}</div>
              </div>
            )}

            {/* Main Action Button */}
            <button
              type="submit"
              disabled={loading || !emailInput}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] py-3.5 text-xs font-extrabold text-white shadow-lg shadow-blue-600/30 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : authMode === 'signup' ? (
                'Register & Launch zkLogin'
              ) : (
                'Sign In with Google zkLogin'
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
