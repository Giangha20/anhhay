import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { categorySchema } from '@/lib/validation';

/**
 * Check if targetParentId is a descendant of currentId to prevent cyclic loop
 */
async function isDescendant(currentId: string, targetParentId: string): Promise<boolean> {
  if (currentId === targetParentId) return true;

  let checkId: string | null = targetParentId;
  const visited = new Set<string>();

  while (checkId) {
    if (visited.has(checkId)) break;
    visited.add(checkId);

    if (checkId === currentId) return true;

    const parent: { parentId: string | null } | null = await prisma.category.findUnique({
      where: { id: checkId },
      select: { parentId: true },
    });

    checkId = parent ? parent.parentId : null;
  }

  return false;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthenticatedAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị viên' }, { status: 401 });
    }

    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        parent: true,
        children: true,
        _count: { select: { images: true } },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Không tìm thấy danh mục' }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthenticatedAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị viên' }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = categorySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { name, slug, description, coverImage, displayOrder, isVisible, parentId } =
      parseResult.data;

    const existing = await prisma.category.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy danh mục cần sửa' }, { status: 404 });
    }

    // Check slug conflict
    if (slug !== existing.slug) {
      const slugCheck = await prisma.category.findUnique({
        where: { slug },
      });
      if (slugCheck) {
        return NextResponse.json(
          { error: `Slug '${slug}' đã tồn tại ở danh mục khác.` },
          { status: 400 }
        );
      }
    }

    // Check parent cycle
    let validParentId: string | null = null;
    if (parentId && parentId.trim() !== '' && parentId !== 'none') {
      if (parentId === params.id) {
        return NextResponse.json(
          { error: 'Một danh mục không thể làm danh mục cha của chính nó' },
          { status: 400 }
        );
      }

      const cyclic = await isDescendant(params.id, parentId);
      if (cyclic) {
        return NextResponse.json(
          { error: 'Không thể chọn danh mục con làm danh mục cha (phát hiện vòng lặp phân cấp)' },
          { status: 400 }
        );
      }

      validParentId = parentId;
    }

    const updated = await prisma.category.update({
      where: { id: params.id },
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
      action: 'EDIT_CATEGORY',
      details: `Cập nhật danh mục "${updated.name}" (Slug: ${updated.slug})`,
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error) {
    console.error('Lỗi khi sửa danh mục:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi cập nhật danh mục' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthenticatedAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị viên' }, { status: 401 });
    }

    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { images: true } },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Danh mục không tồn tại' }, { status: 404 });
    }

    // Check query params or body for photo reassignment
    const searchParams = req.nextUrl.searchParams;
    const reassignToId = searchParams.get('reassignToId') || null;

    let targetCategoryId: string | null = null;
    if (reassignToId && reassignToId !== 'none' && reassignToId !== params.id) {
      const targetCat = await prisma.category.findUnique({
        where: { id: reassignToId },
      });
      if (targetCat) {
        targetCategoryId = targetCat.id;
      }
    }

    // 1. Reassign or unclassify all images in this category (Do NOT delete photos!)
    const updatedImages = await prisma.image.updateMany({
      where: { categoryId: params.id },
      data: { categoryId: targetCategoryId },
    });

    // 2. Unparent children categories
    await prisma.category.updateMany({
      where: { parentId: params.id },
      data: { parentId: category.parentId }, // Promote to grandparent or null
    });

    // 3. Delete category safely
    await prisma.category.delete({
      where: { id: params.id },
    });

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAudit({
      adminId: auth.admin.id,
      action: 'DELETE_CATEGORY',
      details: `Xóa danh mục "${category.name}". Đã chuyển ${updatedImages.count} ảnh sang ${
        targetCategoryId ? 'danh mục mới' : 'trạng thái Chưa phân loại'
      }.`,
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: `Đã xóa danh mục "${category.name}". ${updatedImages.count} ảnh đã được bảo toàn và chuyển ${
        targetCategoryId ? 'sang danh mục chỉ định' : 'về trạng thái Chưa phân loại'
      }.`,
    });
  } catch (error) {
    console.error('Lỗi khi xóa danh mục:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi xóa danh mục' }, { status: 500 });
  }
}
