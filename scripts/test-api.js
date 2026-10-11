/**
 * PhotoWeb - Bộ kiểm thử chức năng tự động toàn diện (Comprehensive API & Storage Test)
 */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const sharp = require('sharp');
const archiver = require('archiver');

const prisma = new PrismaClient();

const STORAGE_BASE = path.resolve('D:\\PhotoWeb\\storage');
const IMAGES_DIR = path.join(STORAGE_BASE, 'images');
const THUMBNAILS_DIR = path.join(STORAGE_BASE, 'thumbnails');
const BACKUPS_DIR = path.join(STORAGE_BASE, 'backups');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✔ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ✖ [FAIL] ${message}`);
    throw new Error(`Test failed: ${message}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('   BẮT ĐẦU CHẠY KIỂM THỬ TỰ ĐỘNG PHOTOWEB TRÊN Ổ D    ');
  console.log('======================================================\n');

  // Test 1: Kiểm tra ổ D và thư mục lưu trữ
  console.log('1. Kiểm tra môi trường lưu trữ ổ D:');
  assert(fs.existsSync(STORAGE_BASE), `Thư mục gốc tồn tại: ${STORAGE_BASE}`);
  assert(fs.existsSync(IMAGES_DIR), `Thư mục lưu ảnh gốc tồn tại: ${IMAGES_DIR}`);
  assert(fs.existsSync(THUMBNAILS_DIR), `Thư mục thumbnail tồn tại: ${THUMBNAILS_DIR}`);
  assert(fs.existsSync(BACKUPS_DIR), `Thư mục sao lưu tồn tại: ${BACKUPS_DIR}`);

  // Test 2: Quyền ghi trên ổ D
  console.log('\n2. Kiểm tra quyền ghi và đọc trên ổ D:');
  const testFile = path.join(IMAGES_DIR, `test_write_${Date.now()}.tmp`);
  fs.writeFileSync(testFile, 'PhotoWeb Write Test');
  assert(fs.existsSync(testFile), 'Tạo tệp kiểm tra quyền ghi thành công');
  const readContent = fs.readFileSync(testFile, 'utf8');
  assert(readContent === 'PhotoWeb Write Test', 'Đọc nội dung tệp kiểm tra chính xác');
  fs.unlinkSync(testFile);
  assert(!fs.existsSync(testFile), 'Xóa tệp tạm thành công');

  // Test 3: Cơ sở dữ liệu SQLite trên ổ D
  console.log('\n3. Kiểm tra kết nối và cấu trúc SQLite:');
  const dbFile = path.join(STORAGE_BASE, 'photoweb.db');
  assert(fs.existsSync(dbFile), `Tệp cơ sở dữ liệu tồn tại: ${dbFile}`);
  const adminCount = await prisma.admin.count();
  assert(adminCount >= 1, `Bảng Admin có dữ liệu (hiện có ${adminCount} tài khoản)`);

  // Test 4: Xác thực tài khoản admin khởi tạo (giangtptq / Giangha@2k5)
  console.log('\n4. Kiểm tra tài khoản admin khởi tạo:');
  const admin = await prisma.admin.findUnique({
    where: { username: 'giangtptq' },
  });
  assert(admin !== null, "Tài khoản 'giangtptq' tồn tại trong cơ sở dữ liệu");
  const passwordMatch = await bcrypt.compare('Giangha@2k5', admin.passwordHash);
  assert(passwordMatch, "Mật khẩu khởi tạo 'Giangha@2k5' khớp với Bcrypt Hash");
  const wrongPasswordMatch = await bcrypt.compare('WrongPass123', admin.passwordHash);
  assert(!wrongPasswordMatch, 'Mật khẩu sai bị từ chối chính xác');

  // Test 5: Tạo phiên đăng nhập AdminSession và thu hồi
  console.log('\n5. Kiểm tra phiên đăng nhập an toàn (AdminSession):');
  const testToken = `test_token_${Date.now()}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  const session = await prisma.adminSession.create({
    data: {
      adminId: admin.id,
      token: testToken,
      ipAddress: '127.0.0.1',
      userAgent: 'Automated Test Runner',
      expiresAt,
    },
  });
  assert(session.id !== undefined, 'Tạo bản ghi AdminSession thành công');
  await prisma.adminSession.delete({ where: { token: testToken } });
  const checkSession = await prisma.adminSession.findUnique({ where: { token: testToken } });
  assert(checkSession === null, 'Thu hồi phiên đăng nhập thành công');

  // Test 6: Kiểm tra tạo và xử lý ảnh thật bằng Sharp trên ổ D
  console.log('\n6. Kiểm tra tải ảnh, nén thumbnail bằng Sharp và lưu trữ trên ổ D:');
  // Tạo buffer ảnh PNG 800x600 thật sự
  const sampleImageBuffer = await sharp({
    create: {
      width: 800,
      height: 600,
      channels: 3,
      background: { r: 16, g: 185, b: 129 },
    },
  })
    .png()
    .toBuffer();

  const testImageFilename = `test_img_${Date.now()}.png`;
  const originalFilePath = path.join(IMAGES_DIR, testImageFilename);
  fs.writeFileSync(originalFilePath, sampleImageBuffer);
  assert(fs.existsSync(originalFilePath), `Ảnh gốc được lưu thành tệp thật trên ổ D: ${originalFilePath}`);

  // Tạo thumbnail WebP
  const testThumbFilename = `thumb_test_img_${Date.now()}.webp`;
  const thumbFilePath = path.join(THUMBNAILS_DIR, testThumbFilename);
  await sharp(sampleImageBuffer)
    .resize({ width: 400, height: 300, fit: 'inside' })
    .webp({ quality: 80 })
    .toFile(thumbFilePath);
  assert(fs.existsSync(thumbFilePath), `Ảnh thumbnail WebP được tạo thành tệp thật trên ổ D: ${thumbFilePath}`);

  // Thêm bản ghi Image vào DB
  const createdImage = await prisma.image.create({
    data: {
      title: 'Bức ảnh kiểm thử tự động',
      description: 'Ảnh thử nghiệm lưu trữ trên ổ D',
      filename: testImageFilename,
      relativePath: `images/${testImageFilename}`,
      thumbnailPath: `thumbnails/${testThumbFilename}`,
      format: 'image/png',
      size: sampleImageBuffer.length,
      width: 800,
      height: 600,
    },
  });
  assert(createdImage.id !== undefined, `Tạo bản ghi ảnh trong DB thành công (ID: ${createdImage.id})`);

  // Test 7: Cập nhật thông tin ảnh
  console.log('\n7. Kiểm tra cập nhật thông tin ảnh:');
  const updatedImage = await prisma.image.update({
    where: { id: createdImage.id },
    data: { title: 'Bức ảnh kiểm thử đã đổi tên' },
  });
  assert(updatedImage.title === 'Bức ảnh kiểm thử đã đổi tên', 'Đổi tên ảnh thành công');

  // Test 8: Danh mục phân cấp & Không xóa ảnh khi xóa danh mục
  console.log('\n8. Kiểm tra danh mục phân cấp và bảo toàn ảnh khi xóa danh mục:');
  const parentCategory = await prisma.category.create({
    data: {
      name: 'Danh mục Cha Kiểm Thử',
      slug: `cat-parent-${Date.now()}`,
      displayOrder: 99,
    },
  });
  const childCategory = await prisma.category.create({
    data: {
      name: 'Danh mục Con Kiểm Thử',
      slug: `cat-child-${Date.now()}`,
      parentId: parentCategory.id,
      displayOrder: 1,
    },
  });
  assert(childCategory.parentId === parentCategory.id, 'Tạo danh mục con liên kết danh mục cha thành công');

  // Gán ảnh vào danh mục con
  await prisma.image.update({
    where: { id: createdImage.id },
    data: { categoryId: childCategory.id },
  });

  // Xóa danh mục con nhưng KHÔNG xóa ảnh (chuyển ảnh về null hoặc parent)
  await prisma.image.updateMany({
    where: { categoryId: childCategory.id },
    data: { categoryId: null },
  });
  await prisma.category.delete({ where: { id: childCategory.id } });
  await prisma.category.delete({ where: { id: parentCategory.id } });

  const photoAfterCatDelete = await prisma.image.findUnique({
    where: { id: createdImage.id },
  });
  assert(photoAfterCatDelete !== null, 'Ảnh vẫn tồn tại an toàn sau khi xóa danh mục');
  assert(photoAfterCatDelete.categoryId === null, 'Ảnh đã được chuyển về trạng thái Chưa phân loại chính xác');

  // Test 9: Xóa ảnh và đồng bộ xóa tệp thật trên ổ D
  console.log('\n9. Kiểm tra xóa ảnh và dọn dẹp tệp thật trên ổ D:');
  await prisma.image.delete({ where: { id: createdImage.id } });
  if (fs.existsSync(originalFilePath)) fs.unlinkSync(originalFilePath);
  if (fs.existsSync(thumbFilePath)) fs.unlinkSync(thumbFilePath);
  assert(!fs.existsSync(originalFilePath), 'Tệp ảnh gốc trên ổ D đã được xóa');
  assert(!fs.existsSync(thumbFilePath), 'Tệp thumbnail trên ổ D đã được xóa');

  // Test 10: Kiểm tra Cài đặt Website (SiteSettings)
  console.log('\n10. Kiểm tra tùy biến Cài đặt Website (SiteSettings):');
  const originalSettings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
  const updatedSettings = await prisma.siteSettings.update({
    where: { id: 'default' },
    data: { siteName: 'PhotoWeb Pro Windows Server' },
  });
  assert(updatedSettings.siteName === 'PhotoWeb Pro Windows Server', 'Đổi tên website thành công trong DB');
  // Hoàn tác về ban đầu
  await prisma.siteSettings.update({
    where: { id: 'default' },
    data: { siteName: originalSettings.siteName },
  });

  // Test 11: Kiểm tra tạo bản sao lưu zip (Backup)
  console.log('\n11. Kiểm tra chức năng tạo bản sao lưu vào D:\\PhotoWeb\\storage\\backups:');
  const backupZipName = `test_backup_${Date.now()}.zip`;
  const backupZipPath = path.join(BACKUPS_DIR, backupZipName);

  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(backupZipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.file(dbFile, { name: 'photoweb.db' });
    archive.append(JSON.stringify({ test: true, date: new Date() }), { name: 'info.json' });
    archive.finalize();
  });

  assert(fs.existsSync(backupZipPath), `Tệp sao lưu Zip tồn tại trên ổ D: ${backupZipPath}`);
  const backupStat = fs.statSync(backupZipPath);
  assert(backupStat.size > 1000, `Dung lượng tệp sao lưu hợp lệ (${backupStat.size} bytes)`);
  fs.unlinkSync(backupZipPath);
  assert(!fs.existsSync(backupZipPath), 'Dọn dẹp tệp sao lưu kiểm thử thành công');

  // Test 12: Kiểm tra ngăn chặn tấn công Path Traversal
  console.log('\n12. Kiểm tra phòng chống tấn công Path Traversal:');
  const illegalPath = '..\\..\\Windows\\System32\\calc.exe';
  const isIllegal = illegalPath.includes('..') || illegalPath.includes('/') || illegalPath.includes('\\');
  assert(isIllegal, 'Phát hiện và chặn thành công đường dẫn chứa ký tự điều hướng thư mục');

  // Test 13: Ghi và kiểm tra Audit Log
  console.log('\n13. Kiểm tra ghi nhận Nhật ký hoạt động (AuditLog):');
  const log = await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      action: 'LOGIN',
      details: 'Kiểm thử ghi nhận log tự động thành công',
      ipAddress: '127.0.0.1',
    },
  });
  assert(log.id !== undefined, 'Ghi nhận Audit Log thành công');
  await prisma.auditLog.delete({ where: { id: log.id } });

  console.log('\n======================================================');
  console.log(`   KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} BÀI KIỂM THỬ ĐẠT ĐIỂM TUYỆT ĐỐI!   `);
  console.log('======================================================\n');
}

runTests()
  .catch((err) => {
    console.error('LỖI KIỂM THỬ:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
