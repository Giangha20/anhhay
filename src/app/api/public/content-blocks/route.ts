import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const blocks = await prisma.contentBlock.findMany({
      where: { isVisible: true },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ blocks });
  } catch (error) {
    console.error('Lỗi khi tải khối nội dung công khai:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi tải nội dung' }, { status: 500 });
  }
}
