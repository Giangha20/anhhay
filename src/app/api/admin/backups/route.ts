import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { BACKUPS_DIR, STORAGE_BASE_PATH, ensureStorageDirectories } from '@/lib/storage';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const auth = await getAuthenticatedAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị viên' }, { status: 401 });
    }

    ensureStorageDirectories();

    const files = await fs.promises.readdir(BACKUPS_DIR);
    const backups = [];

    for (const file of files) {
      if (file.endsWith('.zip') || file.endsWith('.bak')) {
        const fullPath = path.join(BACKUPS_DIR, file);
        const stat = await fs.promises.stat(fullPath);
        backups.push({
          filename: file,
          sizeBytes: stat.size,
          sizeFormatted: (stat.size / (1024 * 1024)).toFixed(2) + ' MB',
          createdAt: stat.birthtime || stat.mtime,
        });
      }
    }

    // Sort newest first
    backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ backups });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sao lưu:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị viên' }, { status: 401 });
    }

    ensureStorageDirectories();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `photoweb_backup_${timestamp}.zip`;
    const targetZipPath = path.join(BACKUPS_DIR, backupFilename);

    const dbPath = path.join(STORAGE_BASE_PATH, 'photoweb.db');
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: 'Không tìm thấy tệp cơ sở dữ liệu photoweb.db' }, { status: 404 });
    }

    // Get current counts for metadata
    const [photosCount, categoriesCount] = await Promise.all([
      prisma.image.count(),
      prisma.category.count(),
    ]);

    const metadata = {
      createdAt: new Date().toISOString(),
      backupFilename,
      photosCount,
      categoriesCount,
      storagePath: STORAGE_BASE_PATH,
      version: '1.0.0',
    };

    // Create zip archive
    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(targetZipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', (err) => reject(err));

      archive.pipe(output);

      // Append database file
      archive.file(dbPath, { name: 'photoweb.db' });
      // Append metadata json
      archive.append(JSON.stringify(metadata, null, 2), { name: 'backup_metadata.json' });

      archive.finalize();
    });

    const stat = await fs.promises.stat(targetZipPath);

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await logAudit({
      adminId: auth.admin.id,
      action: 'CREATE_BACKUP',
      details: `Tạo bản sao lưu "${backupFilename}" (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`,
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: 'Tạo bản sao lưu thành công.',
      backup: {
        filename: backupFilename,
        sizeBytes: stat.size,
        createdAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Lỗi khi tạo sao lưu:', error);
    return NextResponse.json({ error: `Lỗi tạo sao lưu: ${error.message}` }, { status: 500 });
  }
}
