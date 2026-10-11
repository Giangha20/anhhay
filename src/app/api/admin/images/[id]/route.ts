import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { deleteImageFromDisk } from '@/lib/storage';
import { logAudit } from '@/lib/audit';
import { updateImageSchema } from '@/lib/validation';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthenticatedAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị viên' }, { status: 401 });
    }

    const image = await prisma.image.findUnique({
      where: { id: params.id },
      include: { category: true },
    });

    if (!image) {
      return NextResponse.json({ error: 'Không tìm thấy ảnh' }, { status: 404 });
    }

    return NextResponse.json({ image });
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
    const parseResult = updateImageSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { title, description, categoryId } = parseResult.data;

    const existing = await prisma.image.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy ảnh cần sửa' }, { status: 404 });
    }

    // Verify category if set
    let validCategoryId: string | null = null;
    if (categoryId && categoryId !== 'none' && categoryId.trim() !== '') {
      const cat = await prisma.category.findUnique({
        where: { id: categoryId.trim() },
      });
      if (cat) validCategoryId = cat.id;
    }

    const updated = await prisma.image.update({
      where: { id: params.id },
      data: {
        title,
        description: description || null,
        categoryId: validCategoryId,
      },
      include: { category: true },
    });

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAudit({
      adminId: auth.admin.id,
      action: 'EDIT_IMAGE',
      details: `Chỉnh sửa ảnh "${updated.title}" (ID: ${updated.id})`,
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      image: updated,
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật ảnh:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi cập nhật ảnh' }, { status: 500 });
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

    const image = await prisma.image.findUnique({
      where: { id: params.id },
    });

    if (!image) {
      return NextResponse.json({ error: 'Ảnh không tồn tại hoặc đã bị xóa trước đó' }, { status: 404 });
    }

    // 1. Delete actual files on D: drive
    await deleteImageFromDisk(image.filename);

    // 2. Delete database record
    await prisma.image.delete({
      where: { id: params.id },
    });

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAudit({
      adminId: auth.admin.id,
      action: 'DELETE_IMAGE',
      details: `Xóa ảnh "${image.title}" (${image.filename})`,
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: 'Đã xóa ảnh và tệp lưu trữ thành công.',
    });
  } catch (error) {
    console.error('Lỗi khi xóa ảnh:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi xóa ảnh' }, { status: 500 });
  }
}
