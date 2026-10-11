import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import prisma from './prisma';

export const SESSION_COOKIE_NAME = 'photoweb_session';
const SESSION_DURATION_DAYS = 7;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const SESSION_SECRET = process.env.SESSION_SECRET || 'photoweb-super-secret-production-grade-session-key-2026-windows';

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
 * Generate cryptographically signed stateless token for Vercel Serverless resilience
 */
export function signToken(payload: { adminId: string; username: string; exp: number }): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

export function verifySignedToken(token: string): { adminId: string; username: string; exp: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
      if (payload.exp && payload.exp > Date.now()) {
        return payload;
      }
    }
  } catch {}
  return null;
}

/**
 * Check if an IP is currently rate-limited due to failed attempts
 */
export async function checkRateLimit(ipAddress: string): Promise<{
  allowed: boolean;
  remainingMinutes?: number;
}> {
  if (!ipAddress) return { allowed: true };

  try {
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
  } catch {}

  return { allowed: true };
}

/**
 * Record a failed login attempt for an IP
 */
export async function recordFailedAttempt(ipAddress: string): Promise<{ locked: boolean }> {
  if (!ipAddress) return { locked: false };

  try {
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
  } catch {
    return { locked: false };
  }
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
 * Create a new admin session (both signed token and DB record)
 */
export async function createAdminSession(
  adminId: string,
  username: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ token: string; expiresAt: Date }> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  const token = signToken({
    adminId,
    username,
    exp: expiresAt.getTime(),
  });

  try {
    await prisma.adminSession.create({
      data: {
        adminId,
        token,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });
  } catch (err) {
    console.warn('Ghi nhận session DB (bỏ qua nếu DB read-only):', err);
  }

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

  // 1. Verify stateless signed token (Resilient on Vercel multi-lambda)
  const payload = verifySignedToken(sessionToken);
  if (payload) {
    try {
      const admin = await prisma.admin.findUnique({
        where: { id: payload.adminId },
        select: {
          id: true,
          username: true,
          mustChangePassword: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (admin && admin.isActive) {
        return {
          admin,
          sessionToken,
          expiresAt: new Date(payload.exp),
        };
      }
    } catch {}

    // Fallback if DB is booting or temporarily unavailable on Vercel
    return {
      admin: {
        id: payload.adminId,
        username: payload.username,
        mustChangePassword: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      sessionToken,
      expiresAt: new Date(payload.exp),
    };
  }

  // 2. Fallback to database session record
  try {
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

    if (session && session.expiresAt >= new Date() && session.admin?.isActive) {
      return {
        admin: session.admin,
        sessionToken: session.token,
        expiresAt: session.expiresAt,
      };
    }
  } catch {}

  return null;
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
 * Revoke all sessions for an admin
 */
export async function revokeAllAdminSessions(adminId: string): Promise<void> {
  try {
    await prisma.adminSession.deleteMany({
      where: { adminId },
    });
  } catch {}
}
