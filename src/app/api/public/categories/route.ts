import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isVisible: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          where: { isVisible: true },
          orderBy: { displayOrder: 'asc' },
          select: { id: true, name: true, slug: true, description: true, _count: { select: { images: true } } },
        },
        _count: { select: { images: true } },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Lỗi khi tải danh mục công khai:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi tải danh mục' }, { status: 500 });
  }
}
