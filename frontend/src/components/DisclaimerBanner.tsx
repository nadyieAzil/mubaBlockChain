'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Coins, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { SUI_CONFIG } from '@/config/sui';

export const DisclaimerBanner: React.FC = () => {
  const { user, claimFaucet } = useAuth();
  const [funding, setFunding] = useState(false);
  const [funded, setFunded] = useState(false);

  const requestDemoFunds = async () => {
    setFunding(true);
    try {
      if (user?.address) {
        fetch(`${SUI_CONFIG.relayerUrl}/api/faucet`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: user.address }),
        }).catch(() => {});
      }
      claimFaucet(1000);
      setFunded(true);
      setTimeout(() => setFunded(false), 4000);
    } catch (e) {
      claimFaucet(1000);
      setFunded(true);
      setTimeout(() => setFunded(false), 4000);
    } finally {
      setFunding(false);
    }
  };

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
            <Coins className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900">Demo Testing & Stablecoin Notice</h4>
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                Testnet Mode
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Production connects to a fiat→USDC on-ramp (e.g. Stripe / MoonPay). This demo uses testnet USDC faucet funds to isolate escrow logic.
            </p>
          </div>
        </div>

        <button
          onClick={requestDemoFunds}
          disabled={funding}
          className="flex items-center justify-center gap-1.5 shrink-0 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {funding ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Claiming...</span>
            </>
          ) : funded ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
              <span>+1,000 USDC Added!</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span>Get Demo Test USDC</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
