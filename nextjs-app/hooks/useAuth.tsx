'use client';

/**
 * Auth Stub for Power Insight v2.0 (Community-First)
 *
 * Per Phase 5.1 of the v2.0 QAQC plan: the registration wall is removed.
 * The platform is community-first — all content is publicly accessible.
 *
 * This file is now a stub that satisfies the prior `useAuth()` contract
 * while always returning a "registered, anonymous community member" so
 * existing consumers (Navigation, methodology page, benchmarks page) keep
 * rendering without surgical edits to every call site.
 *
 * Follow-up cleanup (next pass): grep for `useAuth` consumers and remove
 * the calls + the conditional rendering they gate. Delete this file and
 * `RegistrationForm.tsx`, `ProtectedContent.tsx`, and the `app/api/auth/*`
 * routes once no consumers remain.
 */

import { createContext, useContext, ReactNode } from 'react';

// ─── Types (preserved for consumer compatibility) ──────────────────────────

export interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  organization: string;
  role: string;
  intendedUse: string;
  registeredAt: string;
  lastAccessAt: string;
  accessCount: number;
  domain: string;
  autoApproved: boolean;
  status: 'active' | 'pending' | 'revoked';
}

export interface RegistrationData {
  email: string;
  name: string;
  organization: string;
  role: string;
  intendedUse: string;
}

interface AuthContextType {
  user: RegisteredUser | null;
  isLoading: boolean;
  isRegistered: boolean;
  showRegistration: boolean;
  register: (data: RegistrationData) => Promise<{ success: boolean; error?: string }>;
  checkAccess: () => Promise<boolean>;
  logout: () => void;
  openRegistration: () => void;
  closeRegistration: () => void;
}

// ─── Community-first stub user ─────────────────────────────────────────────

const COMMUNITY_USER: RegisteredUser = {
  id: 'community',
  email: 'community@power-insight.org',
  name: 'Community Member',
  organization: 'Community',
  role: '',
  intendedUse: '',
  registeredAt: new Date().toISOString(),
  lastAccessAt: new Date().toISOString(),
  accessCount: 1,
  domain: 'power-insight.org',
  autoApproved: true,
  status: 'active',
};

const STUB_CONTEXT: AuthContextType = {
  user: COMMUNITY_USER,
  isLoading: false,
  isRegistered: true,
  showRegistration: false,
  register: async () => ({ success: true }),
  checkAccess: async () => true,
  logout: () => {},
  openRegistration: () => {},
  closeRegistration: () => {},
};

// ─── Context (kept so consumers' imports still resolve) ────────────────────

const AuthContext = createContext<AuthContextType>(STUB_CONTEXT);

// ─── Provider (now a passthrough — no state) ──────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <AuthContext.Provider value={STUB_CONTEXT}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  // useContext(AuthContext) is safe even outside a provider because
  // STUB_CONTEXT is the default value. No more "must be used within an
  // AuthProvider" runtime error.
  return useContext(AuthContext);
}

// ─── Preserved utility for any consumer that imports it ───────────────────

export function isAutoApprovedDomain(_email: string): boolean {
  // Community-first: everyone is auto-approved.
  return true;
}
