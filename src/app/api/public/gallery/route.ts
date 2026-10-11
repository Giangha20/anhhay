import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSiteSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const settings = await getSiteSettings();

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const defaultLimit = settings.photosPerPage || 12;
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || defaultLimit.toString(), 10)));
    const search = searchParams.get('search')?.trim() || '';
    const categorySlug = searchParams.get('category')?.trim() || '';
    const categoryId = searchParams.get('categoryId')?.trim() || '';

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (categorySlug) {
      const cat = await prisma.category.findUnique({
        where: { slug: categorySlug },
        include: { children: { select: { id: true } } },
      });
      if (cat) {
        const catIds = [cat.id, ...cat.children.map((c) => c.id)];
        where.categoryId = { in: catIds };
      } else {
        where.categoryId = 'not_found';
      }
    } else if (categoryId && categoryId !== 'all') {
      const cat = await prisma.category.findUnique({
        where: { id: categoryId },
        include: { children: { select: { id: true } } },
      });
      if (cat) {
        const catIds = [cat.id, ...cat.children.map((c) => c.id)];
        where.categoryId = { in: catIds };
      } else {
        where.categoryId = categoryId;
      }
    }

    const [total, images] = await Promise.all([
      prisma.image.count({ where }),
      prisma.image.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          filename: true,
          format: true,
          width: true,
          height: true,
          size: true,
          thumbDataUrl: true,
          createdAt: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      images,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Lỗi khi tải thư viện ảnh công khai:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi tải ảnh' }, { status: 500 });
  }
}
