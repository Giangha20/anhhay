import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// If on Vercel or non-windows production, ensure SQLite database exists in /tmp
if (process.env.VERCEL || process.platform !== 'win32') {
  try {
    const targetDbPath = '/tmp/photoweb.db';
    const sourceDb = path.join(process.cwd(), 'prisma', 'photoweb.db');
    if (fs.existsSync(sourceDb)) {
      fs.copyFileSync(sourceDb, targetDbPath);
    }
    process.env.DATABASE_URL = `file:${targetDbPath}`;
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

if (process.env.VERCEL) {
  prisma.image
    .deleteMany({
      where: {
        filename: {
          in: [
            'cau-vang-ba-na.png',
            'hoang-hon-da-lat.png',
            'landmark-81-ve-dem.png',
            'mua-vang-mu-cang-chai.png',
            'nu-cuoi-tay-bac.png',
            'pho-co-ha-noi.png',
            'pho-co-hoi-an.png',
            'song-nho-que.png',
          ],
        },
      },
    })
    .catch(() => {});
}

export default prisma;
