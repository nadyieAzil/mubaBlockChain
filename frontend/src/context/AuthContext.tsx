'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserAccount {
  address: string;
  name: string;
  email: string;
  role: 'client' | 'freelancer' | 'team_member';
  authType: 'zklogin' | 'demo' | 'wallet';
  avatarUrl?: string;
}

export const PRESET_DEMO_ACCOUNTS: UserAccount[] = [
  {
    address: '0xaf39410b7ef60d0de77312789647ca1a9989784229b275d5a7866e4a610e7771',
    name: 'Alice Corp (Client)',
    email: 'alice.client@suipact.dev',
    role: 'client',
    authType: 'demo',
  },
  {
    address: '0x7b5a8e23912a7d45129ca01289fe20349b1248a8927164917a4918239a9c1824',
    name: 'Bob Vance (Lead Freelancer)',
    email: 'bob.lead@agency.studio',
    role: 'freelancer',
    authType: 'demo',
  },
  {
    address: '0x3918a7c00a6f40db9693ad1415d880f9879785369065b2370007891866ad34a2',
    name: 'Charlie UI (Designer)',
    email: 'charlie.design@agency.studio',
    role: 'team_member',
    authType: 'demo',
  },
  {
    address: '0x9928198a27491724018274019284710294719284710294710294710294710294',
    name: 'David Backend (Engineer)',
    email: 'david.dev@agency.studio',
    role: 'team_member',
    authType: 'demo',
  },
];

// Helper to deterministically generate a Sui address from an email string
export async function deriveAddressFromEmail(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.trim().toLowerCase() + '_suipact_zklogin_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexString = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return '0x' + hexString;
}

interface AuthContextType {
  user: UserAccount | null;
  isAuthenticated: boolean;
  balance: number;
  loginWithGoogle: (email: string, name?: string, role?: 'client' | 'freelancer') => Promise<UserAccount>;
  signUpWithGoogle: (email: string, name?: string, role?: 'client' | 'freelancer') => Promise<UserAccount>;
  loginWithDemo: (account: UserAccount) => void;
  logout: () => void;
  claimFaucet: (amount?: number) => void;
  topUpBalance: (amount: number, method?: string) => void;
  resetBalance: (toAmount?: number) => void;
  resetDemoState: () => void;
  deductBalance: (amount: number, address?: string) => void;
  creditBalance: (amount: number, address?: string) => void;
  isEmailRegistered: (email: string) => boolean;
  getRegisteredRole: (email: string) => ('client' | 'freelancer' | 'team_member') | null;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  notification: string | null;
  clearNotification: () => void;
}

const DEFAULT_INITIAL_BALANCES: Record<string, number> = {
  '0xaf39410b7ef60d0de77312789647ca1a9989784229b275d5a7866e4a610e7771': 3500, // Alice (Client)
  '0x7b5a8e23912a7d45129ca01289fe20349b1248a8927164917a4918239a9c1824': 350,  // Bob (Lead Freelancer)
  '0x3918a7c00a6f40db9693ad1415d880f9879785369065b2370007891866ad34a2': 150,  // Charlie (UI)
  '0x9928198a27491724018274019284710294719284710294710294710294710294': 100,  // David (Backend)
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<Record<string, UserAccount>>({});
  const [balances, setBalances] = useState<Record<string, number>>(DEFAULT_INITIAL_BALANCES);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    // Load registered users registry
    const savedRegistry = localStorage.getItem('suipact_registered_users_v2');
    let registryMap: Record<string, UserAccount> = {};
    if (savedRegistry) {
      try {
        registryMap = JSON.parse(savedRegistry);
      } catch (e) {}
    }
    // Pre-populate demo accounts in registry if not present
    PRESET_DEMO_ACCOUNTS.forEach((demo) => {
      const cleanEmail = demo.email.toLowerCase();
      if (!registryMap[cleanEmail]) {
        registryMap[cleanEmail] = demo;
      }
    });
    setRegisteredUsers(registryMap);
    localStorage.setItem('suipact_registered_users_v2', JSON.stringify(registryMap));

    // Load wallet balances
    const savedBalances = localStorage.getItem('suipact_wallet_balances_v2');
    if (savedBalances) {
      try {
        const parsedBalances = JSON.parse(savedBalances);
        setBalances((prev) => ({ ...prev, ...parsedBalances }));
      } catch (e) {}
    }

    // Load active session
    const saved = localStorage.getItem('suipact_user_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.address) {
          setUser(parsed);
          return;
        }
      } catch (e) {
        localStorage.removeItem('suipact_user_session');
      }
    }
    setUser(null);
  }, []);

  const saveBalances = (newBalances: Record<string, number>) => {
    setBalances(newBalances);
    localStorage.setItem('suipact_wallet_balances_v2', JSON.stringify(newBalances));
  };

  const isEmailRegistered = (email: string): boolean => {
    return !!registeredUsers[email.trim().toLowerCase()];
  };

  const getRegisteredRole = (email: string) => {
    const found = registeredUsers[email.trim().toLowerCase()];
    return found ? found.role : null;
  };

  const signUpWithGoogle = async (
    email: string,
    name?: string,
    role: 'client' | 'freelancer' = 'client'
  ): Promise<UserAccount> => {
    const cleanEmail = email.trim().toLowerCase();
    if (registeredUsers[cleanEmail]) {
      const existing = registeredUsers[cleanEmail];
      throw new Error(`Email is already registered as ${existing.role.toUpperCase()}. Please sign in instead.`);
    }

    const displayName = name?.trim() || cleanEmail.split('@')[0] || 'Google User';
    const derivedAddress = await deriveAddressFromEmail(cleanEmail);

    const newUser: UserAccount = {
      address: derivedAddress,
      name: displayName,
      email: cleanEmail,
      role: role,
      authType: 'zklogin',
    };

    const updatedRegistry = { ...registeredUsers, [cleanEmail]: newUser };
    setRegisteredUsers(updatedRegistry);
    localStorage.setItem('suipact_registered_users_v2', JSON.stringify(updatedRegistry));

    // Initialize starting balance for newly registered accounts to $0.00 USDC
    const startingBalance = 0;
    const updatedBalances = { ...balances, [derivedAddress]: startingBalance };
    saveBalances(updatedBalances);

    setUser(newUser);
    localStorage.setItem('suipact_user_session', JSON.stringify(newUser));
    setIsLoginModalOpen(false);
    showNotification(`Account created! Welcome, ${displayName} (${role.toUpperCase()}) — Wallet Balance: $0.00 USDC`);
    return newUser;
  };

  const loginWithGoogle = async (
    email: string,
    name?: string,
    role?: 'client' | 'freelancer'
  ): Promise<UserAccount> => {
    const cleanEmail = email.trim().toLowerCase();
    const existing = registeredUsers[cleanEmail];

    if (!existing) {
      if (role) {
        return signUpWithGoogle(email, name, role);
      }
      throw new Error(`Account not found for ${cleanEmail}. Please switch to "Create Account" to choose your role.`);
    }

    setUser(existing);
    localStorage.setItem('suipact_user_session', JSON.stringify(existing));
    setIsLoginModalOpen(false);
    showNotification(`Welcome back, ${existing.name}! Logged in as ${existing.role.toUpperCase()}`);
    return existing;
  };

  const loginWithDemo = (account: UserAccount) => {
    setUser(account);
    localStorage.setItem('suipact_user_session', JSON.stringify(account));
    setIsLoginModalOpen(false);
    showNotification(`Switched persona to ${account.name}`);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('suipact_user_session');
    showNotification('Signed out successfully.');
  };

  const claimFaucet = (amount = 1000) => {
    if (!user?.address) return;
    const addr = user.address.toLowerCase();
    setBalances((prev) => {
      const current = prev[addr] ?? DEFAULT_INITIAL_BALANCES[addr] ?? 0;
      const updated = current + amount;
      const newBalances = { ...prev, [addr]: updated };
      localStorage.setItem('suipact_wallet_balances_v2', JSON.stringify(newBalances));
      return newBalances;
    });
    showNotification(`💰 +$${amount.toLocaleString()} Testnet USDC deposited to your wallet!`);
  };

  const resetDemoState = () => {
    localStorage.removeItem('suipact_wallet_balances_v2');
    localStorage.removeItem('suipact_escrows_v3');
    
    // If current logged-in user is a custom account (not demo persona), set their balance to 0
    const userAddr = user?.address?.toLowerCase();
    const initialForCustom = userAddr && !DEFAULT_INITIAL_BALANCES[userAddr] ? { [userAddr]: 0 } : {};
    const finalResetBalances = { ...DEFAULT_INITIAL_BALANCES, ...initialForCustom };

    setBalances(finalResetBalances);
    localStorage.setItem('suipact_wallet_balances_v2', JSON.stringify(finalResetBalances));
    showNotification('🔄 Demo wallet balances and state reset to initial pristine values (Custom user: $0.00 USDC)!');
  };

  const deductBalance = (amount: number, address?: string) => {
    const targetAddr = (address || user?.address)?.toLowerCase();
    if (!targetAddr) return;
    setBalances((prev) => {
      const current = prev[targetAddr] ?? DEFAULT_INITIAL_BALANCES[targetAddr] ?? 0;
      const updated = Math.max(0, current - amount);
      const newBalances = { ...prev, [targetAddr]: updated };
      localStorage.setItem('suipact_wallet_balances_v2', JSON.stringify(newBalances));
      return newBalances;
    });
  };

  const creditBalance = (amount: number, address?: string) => {
    const targetAddr = (address || user?.address)?.toLowerCase();
    if (!targetAddr) return;
    setBalances((prev) => {
      const current = prev[targetAddr] ?? DEFAULT_INITIAL_BALANCES[targetAddr] ?? 0;
      const updated = current + amount;
      const newBalances = { ...prev, [targetAddr]: updated };
      localStorage.setItem('suipact_wallet_balances_v2', JSON.stringify(newBalances));
      return newBalances;
    });
  };

  const topUpBalance = (amount: number, method = 'Testnet Faucet') => {
    if (!user?.address || amount <= 0) return;
    const addr = user.address.toLowerCase();
    setBalances((prev) => {
      const current = prev[addr] ?? DEFAULT_INITIAL_BALANCES[addr] ?? 0;
      const updated = current + amount;
      const newBalances = { ...prev, [addr]: updated };
      localStorage.setItem('suipact_wallet_balances_v2', JSON.stringify(newBalances));
      return newBalances;
    });
    showNotification(`💳 +$${amount.toLocaleString()} USDC added to your wallet via ${method}!`);
  };

  const resetBalance = (toAmount = 0) => {
    if (!user?.address) return;
    const addr = user.address.toLowerCase();
    setBalances((prev) => {
      const newBalances = { ...prev, [addr]: toAmount };
      localStorage.setItem('suipact_wallet_balances_v2', JSON.stringify(newBalances));
      return newBalances;
    });
    showNotification(toAmount === 0 ? '🔄 Wallet balance reset to $0.00 USDC.' : `🔄 Wallet balance set to $${toAmount.toLocaleString()} USDC.`);
  };

  const userAddrClean = user?.address?.toLowerCase() || '';
  const activeBalance = user
    ? (balances[userAddrClean] ?? DEFAULT_INITIAL_BALANCES[userAddrClean] ?? 0)
    : 0;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        balance: activeBalance,
        loginWithGoogle,
        signUpWithGoogle,
        loginWithDemo,
        logout,
        claimFaucet,
        topUpBalance,
        resetBalance,
        resetDemoState,
        deductBalance,
        creditBalance,
        isEmailRegistered,
        getRegisteredRole,
        isLoginModalOpen,
        setIsLoginModalOpen,
        notification,
        clearNotification: () => setNotification(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
