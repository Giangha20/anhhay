import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  getAuthenticatedAdmin,
  verifyPassword,
  hashPassword,
  revokeAllAdminSessions,
  createAdminSession,
  SESSION_COOKIE_NAME,
} from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { changePasswordSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị viên' }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = changePasswordSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Dữ liệu mật khẩu không hợp lệ' },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parseResult.data;

    // Fetch admin with passwordHash
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

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
    });

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    // Revoke old sessions and issue fresh session
    await revokeAllAdminSessions(admin.id);
    const { token, expiresAt } = await createAdminSession(admin.id, ip, userAgent);

    await logAudit({
      adminId: admin.id,
      action: 'CHANGE_PASSWORD',
      details: 'Đã đổi mật khẩu thành công và làm mới các phiên đăng nhập',
      ipAddress: ip,
    });

    const isSecure = req.nextUrl.protocol === 'https:';
    const response = NextResponse.json({
      success: true,
      message: 'Đổi mật khẩu thành công!',
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });

    return response;
  } catch (error) {
    console.error('Lỗi API Change Password:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi đổi mật khẩu' }, { status: 500 });
  }
}
