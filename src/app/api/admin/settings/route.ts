import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { getSiteSettings } from '@/lib/settings';
import { logAudit } from '@/lib/audit';
import { siteSettingsSchema } from '@/lib/validation';

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Lỗi lấy settings:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị viên' }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = siteSettingsSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Dữ liệu cài đặt không hợp lệ' },
        { status: 400 }
      );
    }

    const updated = await prisma.siteSettings.upsert({
      where: { id: 'default' },
      update: parseResult.data,
      create: {
        id: 'default',
        ...parseResult.data,
      },
    });

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAudit({
      adminId: auth.admin.id,
      action: 'UPDATE_SETTINGS',
      details: `Cập nhật cấu hình website "${updated.siteName}"`,
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error('Lỗi lưu settings:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi lưu cài đặt' }, { status: 500 });
  }
}
