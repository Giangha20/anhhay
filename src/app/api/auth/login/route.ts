import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  verifyPassword,
  createAdminSession,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts,
  SESSION_COOKIE_NAME,
} from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { loginSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    // Check rate limit
    const rateCheck = await checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau ${rateCheck.remainingMinutes} phút.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { username, password } = parseResult.data;

    // Find admin
    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (!admin || !admin.isActive) {
      const { locked } = await recordFailedAttempt(ip);
      await logAudit({
        action: 'FAILED_LOGIN',
        details: `Đăng nhập thất bại với username '${username}' từ IP ${ip}`,
        ipAddress: ip,
      });

      return NextResponse.json(
        {
          error: locked
            ? 'Tài khoản đã bị tạm khóa 15 phút do nhập sai quá nhiều lần.'
            : 'Tên đăng nhập hoặc mật khẩu không chính xác.',
        },
        { status: 401 }
      );
    }

    const passwordMatches = await verifyPassword(password, admin.passwordHash);
    if (!passwordMatches) {
      const { locked } = await recordFailedAttempt(ip);
      await logAudit({
        adminId: admin.id,
        action: 'FAILED_LOGIN',
        details: `Nhập sai mật khẩu cho tài khoản '${username}' từ IP ${ip}`,
        ipAddress: ip,
      });

      return NextResponse.json(
        {
          error: locked
            ? 'Tài khoản đã bị tạm khóa 15 phút do nhập sai quá nhiều lần.'
            : 'Tên đăng nhập hoặc mật khẩu không chính xác.',
        },
        { status: 401 }
      );
    }

    // Success: clear rate limit
    await clearFailedAttempts(ip);

    // Create session
    const { token, expiresAt } = await createAdminSession(admin.id, ip, userAgent);

    await logAudit({
      adminId: admin.id,
      action: 'LOGIN',
      details: `Đăng nhập thành công từ IP ${ip}`,
      ipAddress: ip,
    });

    const isSecure = req.nextUrl.protocol === 'https:';
    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        mustChangePassword: admin.mustChangePassword,
      },
    });

    // Set HttpOnly cookie
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
  } catch (error: any) {
    console.error('Lỗi API Login:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi máy chủ trong quá trình xử lý đăng nhập.' },
      { status: 500 }
    );
  }
}
