import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { saveImageToDisk, ensureStorageDirectories } from '@/lib/storage';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị viên' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search')?.trim() || '';
    const categoryId = searchParams.get('categoryId') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId === 'unassigned' ? null : categoryId;
    }

    const [total, images] = await Promise.all([
      prisma.image.count({ where }),
      prisma.image.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
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
    console.error('Lỗi lấy danh sách ảnh admin:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi lấy danh sách ảnh' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị viên' }, { status: 401 });
    }

    const dirCheck = ensureStorageDirectories();
    if (!dirCheck.ok) {
      return NextResponse.json(
        { error: dirCheck.error || 'Lỗi quyền truy cập thư mục lưu trữ trên ổ D' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const titleParam = formData.get('title') as string | null;
    const descriptionParam = formData.get('description') as string | null;
    const categoryIdParam = formData.get('categoryId') as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng chọn ít nhất một tệp ảnh để tải lên' },
        { status: 400 }
      );
    }

    // Verify category exists if specified
    let targetCategoryId: string | null = null;
    if (categoryIdParam && categoryIdParam !== 'none' && categoryIdParam.trim() !== '') {
      const cat = await prisma.category.findUnique({
        where: { id: categoryIdParam.trim() },
      });
      if (cat) {
        targetCategoryId = cat.id;
      }
    }

    const uploadedRecords = [];
    const uploadErrors: string[] = [];

    for (const file of files) {
      if (!file || typeof file.name !== 'string') continue;

      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const saved = await saveImageToDisk(buffer, file.name);

        const defaultTitle =
          titleParam && files.length === 1
            ? titleParam.trim()
            : file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

        const record = await prisma.image.create({
          data: {
            title: defaultTitle,
            description: descriptionParam ? descriptionParam.trim() : null,
            filename: saved.filename,
            relativePath: saved.relativePath,
            thumbnailPath: saved.thumbnailPath,
            format: saved.format,
            size: saved.size,
            width: saved.width,
            height: saved.height,
            categoryId: targetCategoryId,
          },
        });

        uploadedRecords.push(record);
      } catch (err: any) {
        uploadErrors.push(`Tệp ${file.name}: ${err.message || 'Lỗi không xác định'}`);
      }
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    if (uploadedRecords.length > 0) {
      await logAudit({
        adminId: auth.admin.id,
        action: 'UPLOAD_IMAGE',
        details: `Tải lên thành công ${uploadedRecords.length} ảnh`,
        ipAddress: ip,
      });
    }

    return NextResponse.json({
      success: uploadedRecords.length > 0,
      uploadedCount: uploadedRecords.length,
      images: uploadedRecords,
      errors: uploadErrors,
    });
  } catch (error: any) {
    console.error('Lỗi khi tải ảnh lên:', error);
    return NextResponse.json(
      { error: `Đã xảy ra lỗi khi tải ảnh lên: ${error.message || 'Lỗi máy chủ'}` },
      { status: 500 }
    );
  }
}
