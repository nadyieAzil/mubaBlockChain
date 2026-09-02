'use client';

import React, { useState } from 'react';
import { useAuth, PRESET_DEMO_ACCOUNTS, UserAccount, deriveAddressFromEmail } from '@/context/AuthContext';
import { formatAddress } from '@/lib/utils';
import { X, Shield, Sparkles, UserCheck, CheckCircle2, Mail, User, ArrowRight, Loader2 } from 'lucide-react';

export const WalletModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, loginWithGoogle, loginWithDemo, user } = useAuth();

  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [roleInput, setRoleInput] = useState<'client' | 'freelancer'>('client');
  const [derivedPreview, setDerivedPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleEmailChange = async (val: string) => {
    setEmailInput(val);
    if (val.includes('@') && val.includes('.')) {
      const addr = await deriveAddressFromEmail(val);
      setDerivedPreview(addr);
    } else {
      setDerivedPreview('');
    }
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      alert('Please enter a valid Google email address.');
      return;
    }

    setLoading(true);
    try {
      await loginWithGoogle(emailInput.trim(), nameInput.trim(), roleInput);
    } catch (err: any) {
      alert(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOneClickGoogle = async (defaultEmail: string, defaultName: string) => {
    setLoading(true);
    try {
      await loginWithGoogle(defaultEmail, defaultName, 'client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="SuiPact"
              className="h-10 w-10 object-contain rounded-lg border border-slate-200 p-1"
            />
            <div>
              <h3 className="text-lg font-bold text-slate-900">Sign in with Google zkLogin</h3>
              <p className="text-xs text-slate-500">Zero-gas, zero-seed phrase Sui account</p>
            </div>
          </div>
          <button
            onClick={() => setIsLoginModalOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Google OAuth Interactive Form */}
        <div className="space-y-4">
          {!showManualForm ? (
            <div className="space-y-3">
              <button
                onClick={() => handleOneClickGoogle('hackathon.user@gmail.com', 'Google User')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-bold text-slate-800 shadow-xs hover:bg-slate-50 hover:border-slate-400 transition-all group disabled:opacity-50"
              >
                {/* Google G Logo */}
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{loading ? 'Authenticating...' : 'Sign In with 1-Click Google OAuth'}</span>
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowManualForm(true)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Enter custom Google email & name ➔
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleGoogleSubmit} className="space-y-3.5 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Custom Google ID Registration</span>
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Back
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. satoshi.freelancer@gmail.com"
                    value={emailInput}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Display Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Satoshi"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primary Role</label>
                  <select
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="client">Client (Buyer / Approver)</option>
                    <option value="freelancer">Freelancer (Seller / Deliverer)</option>
                  </select>
                </div>
              </div>

              {/* Derived Sui Address live preview */}
              {derivedPreview && (
                <div className="rounded-lg bg-white p-2.5 border border-blue-200 text-xs">
                  <div className="text-[10px] font-bold uppercase text-blue-700">Derived Sui Testnet Address:</div>
                  <div className="font-mono text-slate-700 text-[11px] truncate mt-0.5">{derivedPreview}</div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !emailInput}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deriving Sui zkLogin Address...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Google Sign In</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Divider */}
        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-slate-400 font-bold">Or Instant Judge Personas</span>
          </div>
        </div>

        {/* Quick Demo Switcher */}
        <div className="space-y-2">
          {PRESET_DEMO_ACCOUNTS.map((acc: UserAccount) => {
            const isSelected = user?.address === acc.address;
            return (
              <button
                key={acc.address}
                onClick={() => loginWithDemo(acc)}
                className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-950 font-bold'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{acc.name}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        acc.role === 'client'
                          ? 'bg-amber-100 text-amber-900'
                          : acc.role === 'freelancer'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {acc.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">{formatAddress(acc.address, 6)}</div>
                </div>
                {isSelected ? (
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                ) : (
                  <span className="text-xs font-bold text-slate-400">Select</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
