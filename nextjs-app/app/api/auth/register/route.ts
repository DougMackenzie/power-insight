/**
 * User Registration API
 *
 * Registers new users for access to utility benchmarks and scoring.
 * Stores user data in a JSON file (upgrade to database for production).
 *
 * POST /api/auth/register
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// ============================================
// TYPES
// ============================================

interface RegisteredUser {
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
  sessionToken: string;
}

interface UserRegistry {
  users: RegisteredUser[];
  lastUpdated: string;
}

// ============================================
// AUTO-APPROVE DOMAINS
// ============================================

const AUTO_APPROVE_DOMAINS = [
  '.gov', '.gov.uk', '.gc.ca',
  '.edu', '.ac.uk',
  'epri.com', 'lbl.gov', 'nrel.gov', 'anl.gov', 'ornl.gov', 'pnnl.gov',
  'ferc.gov', 'eia.gov', 'naruc.org',
  'duke-energy.com', 'dominionenergy.com', 'pge.com', 'sce.com',
  'xcelenergy.com', 'entergy.com', 'aep.com', 'southerncompany.com',
  'nexteraenergy.com', 'exeloncorp.com',
];

const isAutoApprovedDomain = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  return AUTO_APPROVE_DOMAINS.some(approved =>
    domain.endsWith(approved) || domain === approved.replace('.', '')
  );
};

// ============================================
// FILE STORAGE (Replace with DB in production)
// ============================================

// Use __dirname-relative path for more reliable resolution
const DATA_DIR = path.join(process.cwd(), 'data');
const REGISTRY_PATH = path.join(DATA_DIR, 'user-registry.json');

async function ensureRegistryExists(): Promise<void> {
  try {
    // Ensure data directory exists
    try {
      await fs.access(DATA_DIR);
    } catch {
      console.log(`Creating data directory: ${DATA_DIR}`);
      await fs.mkdir(DATA_DIR, { recursive: true });
    }

    // Ensure registry file exists
    try {
      await fs.access(REGISTRY_PATH);
    } catch {
      console.log(`Creating registry file: ${REGISTRY_PATH}`);
      const emptyRegistry: UserRegistry = { users: [], lastUpdated: new Date().toISOString() };
      await fs.writeFile(REGISTRY_PATH, JSON.stringify(emptyRegistry, null, 2));
    }
  } catch (err) {
    console.error('Error ensuring registry exists:', err);
    throw err;
  }
}

async function getRegistry(): Promise<UserRegistry> {
  await ensureRegistryExists();
  const data = await fs.readFile(REGISTRY_PATH, 'utf-8');
  return JSON.parse(data);
}

async function saveRegistry(registry: UserRegistry): Promise<void> {
  registry.lastUpdated = new Date().toISOString();
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

// ============================================
// API HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { email, name, organization, role, intendedUse } = body;

    if (!email || !name || !organization) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get registry
    const registry = await getRegistry();

    // Check if user already exists
    const existingUser = registry.users.find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      // User exists - update their session and return
      existingUser.sessionToken = crypto.randomBytes(32).toString('hex');
      existingUser.lastAccessAt = new Date().toISOString();
      existingUser.accessCount += 1;
      await saveRegistry(registry);

      // Return user without sensitive data
      const { sessionToken, ...safeUser } = existingUser;
      return NextResponse.json({
        success: true,
        token: sessionToken,
        user: safeUser,
        message: 'Welcome back!',
      });
    }

    // Create new user
    const domain = email.split('@')[1]?.toLowerCase() || '';
    const autoApproved = isAutoApprovedDomain(email);
    const sessionToken = crypto.randomBytes(32).toString('hex');

    const newUser: RegisteredUser = {
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      name,
      organization,
      role: role || '',
      intendedUse: intendedUse || '',
      registeredAt: new Date().toISOString(),
      lastAccessAt: new Date().toISOString(),
      accessCount: 1,
      domain,
      autoApproved,
      status: 'active', // All users get immediate access
      sessionToken,
    };

    registry.users.push(newUser);
    await saveRegistry(registry);

    // Log registration for monitoring (in production, send to analytics)
    console.log(`[USER REGISTERED] ${newUser.email} | ${newUser.organization} | ${newUser.intendedUse} | Auto-approved: ${autoApproved}`);

    // Return user without sensitive data
    const { sessionToken: _, ...safeUser } = newUser;
    return NextResponse.json({
      success: true,
      token: sessionToken,
      user: safeUser,
      message: 'Registration successful!',
    });

  } catch (error) {
    console.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Registration failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
