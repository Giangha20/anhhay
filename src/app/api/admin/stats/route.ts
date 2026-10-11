import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { getStorageStats } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await getAuthenticatedAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị viên' }, { status: 401 });
    }

    const [photosCount, categoriesCount, recentPhotos, recentLogs] = await Promise.all([
      prisma.image.count(),
      prisma.category.count(),
      prisma.image.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: { category: { select: { name: true } } },
      }),
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { admin: { select: { username: true } } },
      }),
    ]);

    const storageStats = getStorageStats();

    return NextResponse.json({
      stats: {
        photosCount,
        categoriesCount,
        storageStats,
        recentPhotos,
        recentLogs,
      },
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi lấy thống kê' }, { status: 500 });
  }
}
