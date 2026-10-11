import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Lỗi khi tải cài đặt website:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi tải cài đặt' }, { status: 500 });
  }
}
