import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { contentBlockSchema } from '@/lib/validation';

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
    const parseResult = contentBlockSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const updated = await prisma.contentBlock.update({
      where: { id: params.id },
      data: parseResult.data,
    });

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAudit({
      adminId: auth.admin.id,
      action: 'EDIT_CONTENT_BLOCK',
      details: `Chỉnh sửa khối nội dung "${updated.title}"`,
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, block: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
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

    const existing = await prisma.contentBlock.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Khối nội dung không tồn tại' }, { status: 404 });
    }

    await prisma.contentBlock.delete({
      where: { id: params.id },
    });

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAudit({
      adminId: auth.admin.id,
      action: 'DELETE_CONTENT_BLOCK',
      details: `Xóa khối nội dung "${existing.title}"`,
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, message: 'Đã xóa khối nội dung.' });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi máy chủ khi xóa khối nội dung' }, { status: 500 });
  }
}
