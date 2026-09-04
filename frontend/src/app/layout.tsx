import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { EscrowProvider } from '@/context/EscrowContext';
import { Navbar } from '@/components/Navbar';
import { LiveSuiStats } from '@/components/LiveSuiStats';
import { WalletModal } from '@/components/WalletModal';
import { Toast } from '@/components/Toast';
import { DemoSandboxBar } from '@/components/DemoSandboxBar';
import { EcosystemPartnerBanner } from '@/components/EcosystemPartnerBanner';

export const metadata: Metadata = {
  title: 'SuiPact — Zero-Gas Stablecoin Escrow & Atomic Split Payouts on Sui',
  description:
    'A zero-gas, single-deliverable escrow on Sui Testnet that lets clients lock testnet USDC and atomically release split payouts to multiple freelancers in one signed transaction with zkLogin.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <AuthProvider>
          <EscrowProvider>
            <div className="print:hidden">
              <Navbar />
              <LiveSuiStats />
            </div>
            <main className="flex-1">{children}</main>
            <div className="print:hidden">
              <WalletModal />
              <Toast />
              <DemoSandboxBar />
              {/* Footer with Ecosystem Partner Sponsorship Banner */}
              <footer className="bg-blue-dark-gradient border-t border-blue-900/50 py-8 mt-0 text-xs text-blue-300">
                <div className="mx-auto max-w-7xl px-4 space-y-6">
                  <EcosystemPartnerBanner variant="banner" />
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <img src="/logo.png" alt="SuiPact" className="h-5 w-5 object-contain opacity-80" />
                      <span className="font-bold text-white">SuiPact</span>
                      <span className="text-blue-400">— MUBA Blockchain Hackathon 2026 · Sui Track 01</span>
                    </div>
                    <div className="flex items-center gap-3 text-blue-400">
                      <span>Sui Move Testnet</span>
                      <span className="text-blue-600">·</span>
                      <span>Google zkLogin</span>
                      <span className="text-blue-600">·</span>
                      <span>10 Free Sponsored Tx/Mo</span>
                      <span className="text-blue-600">·</span>
                      <span>9/9 Tests Passing</span>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </EscrowProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
