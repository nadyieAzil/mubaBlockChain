import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { EscrowProvider } from '@/context/EscrowContext';
import { AppLayoutHeader, AppLayoutFooter } from '@/components/AppShell';
import { AppSidebar } from '@/components/AppSidebar';
import { WalletModal } from '@/components/WalletModal';
import { Toast } from '@/components/Toast';
import { DemoSandboxBar } from '@/components/DemoSandboxBar';

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
            <div className="flex-1 flex min-h-screen w-full">
              <AppSidebar />
              <div className="flex-1 min-w-0 flex flex-col">
                <AppLayoutHeader />
                <main className="flex-1 flex flex-col">{children}</main>
                <AppLayoutFooter />
              </div>
            </div>
            <div className="print:hidden">
              <WalletModal />
              <Toast />
              <DemoSandboxBar />
            </div>
          </EscrowProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
