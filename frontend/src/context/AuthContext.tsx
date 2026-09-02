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
  loginWithGoogle: (email: string, name?: string, role?: 'client' | 'freelancer') => Promise<UserAccount>;
  loginWithDemo: (account: UserAccount) => void;
  logout: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  notification: string | null;
  clearNotification: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    // Load persisted user session from localStorage if user previously logged in
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
    // Default to unauthenticated guest (no user logged in yet)
    setUser(null);
  }, []);

  const loginWithGoogle = async (
    email: string,
    name?: string,
    role: 'client' | 'freelancer' = 'client'
  ): Promise<UserAccount> => {
    const cleanEmail = email.trim().toLowerCase();
    const displayName = name?.trim() || cleanEmail.split('@')[0] || 'Google zkLogin User';
    const derivedAddress = await deriveAddressFromEmail(cleanEmail);

    const zkUser: UserAccount = {
      address: derivedAddress,
      name: displayName,
      email: cleanEmail,
      role: role,
      authType: 'zklogin',
    };

    setUser(zkUser);
    localStorage.setItem('suipact_user_session', JSON.stringify(zkUser));
    setIsLoginModalOpen(false);
    showNotification(`Signed in with Google as ${displayName} (${cleanEmail})`);
    return zkUser;
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loginWithGoogle,
        loginWithDemo,
        logout,
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
