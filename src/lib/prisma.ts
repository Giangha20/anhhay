import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// If on Vercel or non-windows production, ensure SQLite database exists in /tmp
if (process.env.VERCEL || process.platform !== 'win32') {
  try {
    const targetDbPath = '/tmp/photoweb.db';
    if (!fs.existsSync(targetDbPath)) {
      const candidates = [
        path.join(process.cwd(), 'prisma', 'photoweb.db'),
        path.join(process.cwd(), 'storage', 'photoweb.db'),
      ];
      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          fs.copyFileSync(cand, targetDbPath);
          break;
        }
      }
    }
  } catch (err) {
    console.warn('Lưu ý khởi tạo DB tạm thời trên Vercel:', err);
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
