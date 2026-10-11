import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { IMAGES_DIR, THUMBNAILS_DIR, assertSafePath } from '@/lib/storage';

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;
    if (!filename) {
      return NextResponse.json({ error: 'Tên tệp không hợp lệ' }, { status: 400 });
    }

    const isThumbRequested = req.nextUrl.searchParams.get('thumb') === '1';

    let targetPath: string | null = null;
    let isThumbnail = false;

    if (isThumbRequested) {
      const baseNameWithoutExt = filename.replace(/\.[^/.]+$/, '');
      const thumbFilename = `thumb_${baseNameWithoutExt}.webp`;
      try {
        const potentialThumbPath = assertSafePath(THUMBNAILS_DIR, thumbFilename);
        if (fs.existsSync(potentialThumbPath)) {
          targetPath = potentialThumbPath;
          isThumbnail = true;
        }
      } catch {
        // Fall back to original
      }
    }

    if (!targetPath) {
      try {
        const potentialOriginalPath = assertSafePath(IMAGES_DIR, filename);
        if (fs.existsSync(potentialOriginalPath)) {
          targetPath = potentialOriginalPath;
        }
      } catch (err: any) {
        return NextResponse.json(
          { error: 'Yêu cầu tệp không hợp lệ' },
          { status: 400 }
        );
      }
    }

    if (!targetPath || !fs.existsSync(targetPath)) {
      return NextResponse.json(
        { error: 'Ảnh không tồn tại hoặc đã bị xóa.' },
        { status: 404 }
      );
    }

    const stat = await fs.promises.stat(targetPath);
    const ext = path.extname(targetPath).toLowerCase();
    const contentType = isThumbnail ? 'image/webp' : (MIME_MAP[ext] || 'application/octet-stream');

    const fileBuffer = await fs.promises.readFile(targetPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': stat.size.toString(),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Lỗi khi đọc tệp ảnh:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi đọc tệp ảnh.' },
      { status: 500 }
    );
  }
}
