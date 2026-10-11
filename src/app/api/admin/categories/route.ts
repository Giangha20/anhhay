import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { categorySchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị viên' }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        parent: { select: { id: true, name: true } },
        children: {
          select: { id: true, name: true, slug: true, displayOrder: true, isVisible: true },
          orderBy: { displayOrder: 'asc' },
        },
        _count: { select: { images: true } },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Lỗi lấy danh mục:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi lấy danh mục' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị viên' }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = categorySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Dữ liệu danh mục không hợp lệ' },
        { status: 400 }
      );
    }

    const { name, slug, description, coverImage, displayOrder, isVisible, parentId } =
      parseResult.data;

    // Check slug uniqueness
    const existing = await prisma.category.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Đường dẫn (slug) '${slug}' đã được sử dụng. Vui lòng chọn slug khác.` },
        { status: 400 }
      );
    }

    // Verify parent exists if provided
    let validParentId: string | null = null;
    if (parentId && parentId.trim() !== '' && parentId !== 'none') {
      const parentCat = await prisma.category.findUnique({
        where: { id: parentId },
      });
      if (parentCat) {
        validParentId = parentCat.id;
      }
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        coverImage: coverImage || null,
        displayOrder,
        isVisible,
        parentId: validParentId,
      },
    });

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAudit({
      adminId: auth.admin.id,
      action: 'CREATE_CATEGORY',
      details: `Tạo danh mục "${category.name}" (Slug: ${category.slug})`,
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    console.error('Lỗi khi tạo danh mục:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi tạo danh mục' }, { status: 500 });
  }
}
