import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { contentBlockSchema } from '@/lib/validation';

export async function GET() {
  try {
    const blocks = await prisma.contentBlock.findMany({
      orderBy: { order: 'asc' },
    });
    return NextResponse.json({ blocks });
  } catch (error) {
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
    const parseResult = contentBlockSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const block = await prisma.contentBlock.create({
      data: parseResult.data,
    });

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAudit({
      adminId: auth.admin.id,
      action: 'CREATE_CONTENT_BLOCK',
      details: `Tạo khối nội dung "${block.title}" (Loại: ${block.type})`,
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, block });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
