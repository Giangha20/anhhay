import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin, revokeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin();
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await revokeSession(token);
    }

    if (auth?.admin) {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
      await logAudit({
        adminId: auth.admin.id,
        action: 'LOGOUT',
        details: `Đăng xuất khỏi hệ thống`,
        ipAddress: ip,
      });
    }

    const response = NextResponse.json({ success: true, message: 'Đã đăng xuất thành công.' });
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  } catch (error) {
    console.error('Lỗi API Logout:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi đăng xuất.' }, { status: 500 });
  }
}
