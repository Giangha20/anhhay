import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { BACKUPS_DIR, assertSafePath } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const auth = await getAuthenticatedAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị viên' }, { status: 401 });
    }

    const { filename } = params;
    const backupPath = assertSafePath(BACKUPS_DIR, filename);

    if (!fs.existsSync(backupPath)) {
      return NextResponse.json({ error: 'Bản sao lưu không tồn tại' }, { status: 404 });
    }

    const stat = await fs.promises.stat(backupPath);
    const fileBuffer = await fs.promises.readFile(backupPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': stat.size.toString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi tải bản sao lưu' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const auth = await getAuthenticatedAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị viên' }, { status: 401 });
    }

    const { filename } = params;
    const backupPath = assertSafePath(BACKUPS_DIR, filename);

    if (!fs.existsSync(backupPath)) {
      return NextResponse.json({ error: 'Bản sao lưu không tồn tại' }, { status: 404 });
    }

    await fs.promises.unlink(backupPath);

    return NextResponse.json({ success: true, message: 'Đã xóa bản sao lưu.' });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi xóa bản sao lưu' }, { status: 500 });
  }
}
