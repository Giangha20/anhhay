import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin, verifyPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { changeUsernameSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị viên' }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = changeUsernameSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { currentPassword, newUsername } = parseResult.data;

    const admin = await prisma.admin.findUnique({
      where: { id: auth.admin.id },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Tài khoản không tồn tại' }, { status: 404 });
    }

    // Verify current password
    const passwordMatch = await verifyPassword(currentPassword, admin.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Mật khẩu hiện tại không chính xác' },
        { status: 400 }
      );
    }

    // Check if new username is taken
    const existing = await prisma.admin.findUnique({
      where: { username: newUsername },
    });

    if (existing && existing.id !== admin.id) {
      return NextResponse.json(
        { error: 'Tên đăng nhập này đã được sử dụng bởi tài khoản khác' },
        { status: 400 }
      );
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { username: newUsername },
    });

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAudit({
      adminId: admin.id,
      action: 'CHANGE_USERNAME',
      details: `Đổi tên đăng nhập từ '${admin.username}' sang '${newUsername}'`,
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật tên đăng nhập thành công',
      username: newUsername,
    });
  } catch (error) {
    console.error('Lỗi API Change Username:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi đổi tên đăng nhập' }, { status: 500 });
  }
}
