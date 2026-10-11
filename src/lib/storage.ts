import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

// Storage paths configuration (Adaptive for Windows D: drive and Vercel Linux /tmp)
function resolveStorageBasePath(): string {
  if (process.env.STORAGE_PATH) {
    if (process.platform !== 'win32' && /^[a-zA-Z]:/.test(process.env.STORAGE_PATH)) {
      return path.join('/tmp', 'photoweb_storage');
    }
    return path.resolve(process.env.STORAGE_PATH);
  }
  if (process.env.VERCEL || process.platform !== 'win32') {
    return path.join('/tmp', 'photoweb_storage');
  }
  return path.resolve('D:\\PhotoWeb\\storage');
}

export const STORAGE_BASE_PATH = resolveStorageBasePath();
export const IMAGES_DIR = path.join(STORAGE_BASE_PATH, 'images');
export const THUMBNAILS_DIR = path.join(STORAGE_BASE_PATH, 'thumbnails');
export const BACKUPS_DIR = path.join(STORAGE_BASE_PATH, 'backups');

// Allowed image MIME types and signatures
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/tiff',
  'image/svg+xml',
  'image/heic',
  'image/heif',
];

export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB per file (Không giới hạn ảnh lớn)

/**
 * Ensures all required storage directories exist and are writable
 */
export function ensureStorageDirectories(): { ok: boolean; error?: string } {
  try {
    const dirs = [STORAGE_BASE_PATH, IMAGES_DIR, THUMBNAILS_DIR, BACKUPS_DIR];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Test write permission
      const testFile = path.join(dir, `.test_write_${Date.now()}.tmp`);
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    }
    return { ok: true };
  } catch (err: any) {
    return {
      ok: false,
      error: `Không thể truy cập hoặc ghi vào thư mục lưu trữ trên ổ D: ${err.message}`,
    };
  }
}

/**
 * Validates that a file path is safe and strictly inside the target storage directory (No directory traversal)
 */
export function assertSafePath(targetDir: string, filename: string): string {
  // Reject illegal characters and path separators
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new Error('Tên tệp không hợp lệ hoặc chứa ký tự nguy hiểm');
  }

  const resolved = path.resolve(targetDir, filename);
  if (!resolved.startsWith(path.resolve(targetDir))) {
    throw new Error('Truy cập tệp nằm ngoài thư mục lưu trữ bị từ chối');
  }

  return resolved;
}

/**
 * Generates a unique, sanitized filename for an uploaded file
 */
export function generateSafeFilename(originalName: string, format: string): string {
  const timestamp = Date.now();
  const randomHex = crypto.randomBytes(8).toString('hex');
  let ext = path.extname(originalName).toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!ext || ext.length < 2) {
    if (format === 'image/jpeg') ext = '.jpg';
    else if (format === 'image/png') ext = '.png';
    else if (format === 'image/webp') ext = '.webp';
    else if (format === 'image/gif') ext = '.gif';
    else ext = '.bin';
  } else {
    ext = `.${ext}`;
  }

  return `${timestamp}_${randomHex}${ext}`;
}

/**
 * Validates and inspects an image buffer using Sharp to verify its real format and dimensions
 */
export async function validateImageBuffer(buffer: Buffer): Promise<{
  valid: boolean;
  format: string;
  width: number;
  height: number;
  size: number;
  error?: string;
}> {
  if (buffer.length === 0) {
    return { valid: false, format: '', width: 0, height: 0, size: 0, error: 'Tệp rỗng' };
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      format: '',
      width: 0,
      height: 0,
      size: buffer.length,
      error: `Kích thước tệp vượt quá giới hạn cho phép (tối đa 100MB)`,
    };
  }

  try {
    const metadata = await sharp(buffer).metadata();
    if (!metadata.format) {
      return {
        valid: false,
        format: '',
        width: 0,
        height: 0,
        size: buffer.length,
        error: 'Tệp không phải là định dạng hình ảnh hợp lệ',
      };
    }

    const mimeMap: Record<string, string> = {
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      avif: 'image/avif',
      tiff: 'image/tiff',
      svg: 'image/svg+xml',
      heif: 'image/heif',
      heic: 'image/heic',
    };

    const mime = mimeMap[metadata.format] || `image/${metadata.format}`;
    if (!ALLOWED_MIME_TYPES.includes(mime)) {
      return {
        valid: false,
        format: metadata.format,
        width: metadata.width || 0,
        height: metadata.height || 0,
        size: buffer.length,
        error: `Định dạng ảnh '${metadata.format}' không được hỗ trợ. Vui lòng chọn ảnh hợp lệ.`,
      };
    }

    return {
      valid: true,
      format: mime,
      width: metadata.width || 0,
      height: metadata.height || 0,
      size: buffer.length,
    };
  } catch (err: any) {
    return {
      valid: false,
      format: '',
      width: 0,
      height: 0,
      size: buffer.length,
      error: `Lỗi đọc ảnh: tệp bị lỗi hoặc không phải ảnh thực tế`,
    };
  }
}

/**
 * Saves original image to disk and generates an optimized thumbnail
 */
export async function saveImageToDisk(
  buffer: Buffer,
  originalFilename: string
): Promise<{
  filename: string;
  relativePath: string;
  thumbnailPath: string;
  format: string;
  size: number;
  width: number;
  height: number;
}> {
  ensureStorageDirectories();

  const validation = await validateImageBuffer(buffer);
  if (!validation.valid) {
    throw new Error(validation.error || 'Ảnh không hợp lệ');
  }

  const filename = generateSafeFilename(originalFilename, validation.format);
  const targetOriginalPath = assertSafePath(IMAGES_DIR, filename);

  // Write original file
  await fs.promises.writeFile(targetOriginalPath, buffer);

  // Sync copy to public/images if directory exists
  try {
    const publicImagesDir = path.join(process.cwd(), 'public', 'images');
    if (fs.existsSync(publicImagesDir)) {
      await fs.promises.writeFile(path.join(publicImagesDir, filename), buffer);
    }
  } catch {}

  // Generate thumbnail: max 600px width/height, webp quality 80
  const thumbFilename = `thumb_${filename.replace(/\.[^/.]+$/, '')}.webp`;
  const targetThumbPath = assertSafePath(THUMBNAILS_DIR, thumbFilename);

  try {
    await sharp(buffer)
      .resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(targetThumbPath);
  } catch (thumbErr) {
    console.warn('Lỗi tạo ảnh thumbnail, bỏ qua tạo thumb riêng:', thumbErr);
  }

  return {
    filename,
    relativePath: `images/${filename}`,
    thumbnailPath: `thumbnails/${thumbFilename}`,
    format: validation.format,
    size: validation.size,
    width: validation.width,
    height: validation.height,
  };
}

/**
 * Deletes an image and its associated thumbnail from disk safely
 */
export async function deleteImageFromDisk(filename: string): Promise<void> {
  try {
    const originalPath = assertSafePath(IMAGES_DIR, filename);
    if (fs.existsSync(originalPath)) {
      await fs.promises.unlink(originalPath);
    }
  } catch (err) {
    console.error(`Lỗi khi xóa ảnh gốc ${filename}:`, err);
  }

  try {
    const publicImgPath = path.join(process.cwd(), 'public', 'images', filename);
    if (fs.existsSync(publicImgPath)) {
      await fs.promises.unlink(publicImgPath);
    }
  } catch {}

  try {
    const thumbFilename = `thumb_${filename.replace(/\.[^/.]+$/, '')}.webp`;
    const thumbPath = assertSafePath(THUMBNAILS_DIR, thumbFilename);
    if (fs.existsSync(thumbPath)) {
      await fs.promises.unlink(thumbPath);
    }
  } catch (err) {
    console.error(`Lỗi khi xóa thumbnail ${filename}:`, err);
  }
}

/**
 * Helper to calculate folder size in bytes recursively
 */
function getDirSizeBytes(dirPath: string): number {
  if (!fs.existsSync(dirPath)) return 0;
  let total = 0;
  try {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const full = path.join(dirPath, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        total += getDirSizeBytes(full);
      } else {
        total += stat.size;
      }
    }
  } catch {
    // Ignore read errors
  }
  return total;
}

/**
 * Returns storage statistics (total images size, thumbnails size, backups size, database size)
 */
export function getStorageStats(): {
  imagesSizeBytes: number;
  thumbnailsSizeBytes: number;
  backupsSizeBytes: number;
  dbSizeBytes: number;
  totalSizeBytes: number;
  totalSizeFormatted: string;
  storageBasePath: string;
} {
  const imagesSizeBytes = getDirSizeBytes(IMAGES_DIR);
  const thumbnailsSizeBytes = getDirSizeBytes(THUMBNAILS_DIR);
  const backupsSizeBytes = getDirSizeBytes(BACKUPS_DIR);

  let dbSizeBytes = 0;
  const dbFile = path.join(STORAGE_BASE_PATH, 'photoweb.db');
  if (fs.existsSync(dbFile)) {
    try {
      dbSizeBytes = fs.statSync(dbFile).size;
    } catch {}
  }

  const totalSizeBytes = imagesSizeBytes + thumbnailsSizeBytes + backupsSizeBytes + dbSizeBytes;

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return {
    imagesSizeBytes,
    thumbnailsSizeBytes,
    backupsSizeBytes,
    dbSizeBytes,
    totalSizeBytes,
    totalSizeFormatted: formatSize(totalSizeBytes),
    storageBasePath: STORAGE_BASE_PATH,
  };
}
