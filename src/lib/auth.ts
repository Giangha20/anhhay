import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import prisma from './prisma';

export const SESSION_COOKIE_NAME = 'photoweb_session';
const SESSION_DURATION_DAYS = 7;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/**
 * Hash password securely with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain text password with hashed password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a cryptographically secure random session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Check if an IP is currently rate-limited due to failed attempts
 */
export async function checkRateLimit(ipAddress: string): Promise<{
  allowed: boolean;
  remainingMinutes?: number;
}> {
  if (!ipAddress) return { allowed: true };

  const record = await prisma.loginAttempt.findUnique({
    where: { ipAddress },
  });

  if (!record) return { allowed: true };

  const now = new Date();
  if (record.lockedUntil && record.lockedUntil > now) {
    const diffMs = record.lockedUntil.getTime() - now.getTime();
    const remainingMinutes = Math.ceil(diffMs / (60 * 1000));
    return { allowed: false, remainingMinutes };
  }

  return { allowed: true };
}

/**
 * Record a failed login attempt for an IP
 */
export async function recordFailedAttempt(ipAddress: string): Promise<{ locked: boolean }> {
  if (!ipAddress) return { locked: false };

  const now = new Date();
  const record = await prisma.loginAttempt.findUnique({
    where: { ipAddress },
  });

  if (!record) {
    await prisma.loginAttempt.create({
      data: {
        ipAddress,
        attempts: 1,
        lastAttempt: now,
      },
    });
    return { locked: false };
  }

  // If previous lock expired, reset attempts count
  let newAttempts = record.attempts + 1;
  if (record.lockedUntil && record.lockedUntil < now) {
    newAttempts = 1;
  }

  const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;
  const lockedUntil = shouldLock
    ? new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000)
    : null;

  await prisma.loginAttempt.update({
    where: { ipAddress },
    data: {
      attempts: newAttempts,
      lockedUntil,
      lastAttempt: now,
    },
  });

  return { locked: shouldLock };
}

/**
 * Clear failed attempts for an IP upon successful login
 */
export async function clearFailedAttempts(ipAddress: string): Promise<void> {
  if (!ipAddress) return;
  try {
    await prisma.loginAttempt.deleteMany({
      where: { ipAddress },
    });
  } catch {}
}

/**
 * Create a new admin session in DB and set cookie
 */
export async function createAdminSession(
  adminId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await prisma.adminSession.create({
    data: {
      adminId,
      token,
      ipAddress,
      userAgent,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

/**
 * Get current authenticated admin from cookies
 */
export async function getAuthenticatedAdmin() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await prisma.adminSession.findUnique({
    where: { token: sessionToken },
    include: {
      admin: {
        select: {
          id: true,
          username: true,
          mustChangePassword: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  // Check expiration
  if (session.expiresAt < new Date()) {
    try {
      await prisma.adminSession.delete({ where: { token: sessionToken } });
    } catch {}
    return null;
  }

  // Check admin status
  if (!session.admin || !session.admin.isActive) {
    return null;
  }

  return {
    admin: session.admin,
    sessionToken: session.token,
    expiresAt: session.expiresAt,
  };
}

/**
 * Revoke a specific session
 */
export async function revokeSession(token: string): Promise<void> {
  try {
    await prisma.adminSession.delete({
      where: { token },
    });
  } catch {}
}

/**
 * Revoke all sessions for an admin (e.g. after password change)
 */
export async function revokeAllAdminSessions(adminId: string): Promise<void> {
  try {
    await prisma.adminSession.deleteMany({
      where: { adminId },
    });
  } catch {}
}
