import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { IMAGES_DIR, THUMBNAILS_DIR, assertSafePath } from '@/lib/storage';
import prisma from '@/lib/prisma';

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.tiff': 'image/tiff',
  '.svg': 'image/svg+xml',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
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
      } catch {
        // Check fallback below
      }
    }

    // Fallback to bundled public/images directory if available
    if (!targetPath) {
      try {
        if (!filename.includes('..') && !filename.includes('/') && !filename.includes('\\')) {
          const publicFallback = path.join(process.cwd(), 'public', 'images', filename);
          if (fs.existsSync(publicFallback)) {
            targetPath = publicFallback;
          }
        }
      } catch {
        // Ignore
      }
    }

    if (!targetPath || !fs.existsSync(targetPath)) {
      // Database fallback (for serverless cloud environments where /tmp is ephemeral)
      try {
        const imageRecord = await prisma.image.findUnique({
          where: { filename },
          select: { thumbDataUrl: true, dataUrl: true, format: true },
        });

        if (imageRecord) {
          const rawDataUrl = isThumbRequested
            ? imageRecord.thumbDataUrl || imageRecord.dataUrl
            : imageRecord.dataUrl || imageRecord.thumbDataUrl;

          if (rawDataUrl && rawDataUrl.startsWith('data:')) {
            const matches = rawDataUrl.match(/^data:([A-Za-z0-9\-+\/.]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              const mime = matches[1];
              const base64Data = matches[2];
              const buffer = Buffer.from(base64Data, 'base64');

              // Cache to disk if possible for faster subsequent responses
              try {
                const cacheDir = isThumbRequested ? THUMBNAILS_DIR : IMAGES_DIR;
                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
                const cacheFile = isThumbRequested
                  ? path.join(THUMBNAILS_DIR, `thumb_${filename.replace(/\.[^/.]+$/, '')}.webp`)
                  : path.join(IMAGES_DIR, filename);
                fs.promises.writeFile(cacheFile, buffer).catch(() => {});
              } catch {}

              return new NextResponse(buffer, {
                status: 200,
                headers: {
                  'Content-Type': mime,
                  'Content-Length': buffer.length.toString(),
                  'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
                  'X-Content-Type-Options': 'nosniff',
                },
              });
            }
          }
        }
      } catch (dbErr) {
        console.warn('Lỗi đọc ảnh từ database fallback:', dbErr);
      }

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
