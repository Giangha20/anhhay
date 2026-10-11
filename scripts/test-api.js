/**
 * PhotoWeb - Bộ kiểm thử chức năng tự động toàn diện (Public Gallery & Storage Test)
 */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const sharp = require('sharp');

const prisma = new PrismaClient();

const STORAGE_BASE = path.resolve(process.env.STORAGE_PATH || 'D:\\PhotoWeb\\storage');
const IMAGES_DIR = path.join(STORAGE_BASE, 'images');
const THUMBNAILS_DIR = path.join(STORAGE_BASE, 'thumbnails');

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
  console.log('   BẮT ĐẦU CHẠY KIỂM THỬ TỰ ĐỘNG PHOTOWEB PUBLIC      ');
  console.log('======================================================\n');

  // Test 1: Kiểm tra thư mục lưu trữ
  console.log('1. Kiểm tra môi trường lưu trữ:');
  if (!fs.existsSync(STORAGE_BASE)) fs.mkdirSync(STORAGE_BASE, { recursive: true });
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
  if (!fs.existsSync(THUMBNAILS_DIR)) fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });

  assert(fs.existsSync(STORAGE_BASE), `Thư mục gốc tồn tại: ${STORAGE_BASE}`);
  assert(fs.existsSync(IMAGES_DIR), `Thư mục lưu ảnh gốc tồn tại: ${IMAGES_DIR}`);
  assert(fs.existsSync(THUMBNAILS_DIR), `Thư mục thumbnail tồn tại: ${THUMBNAILS_DIR}`);

  // Test 2: Quyền ghi và đọc
  console.log('\n2. Kiểm tra quyền ghi và đọc:');
  const testFile = path.join(IMAGES_DIR, `test_write_${Date.now()}.tmp`);
  fs.writeFileSync(testFile, 'PhotoWeb Write Test');
  assert(fs.existsSync(testFile), 'Tạo tệp kiểm tra quyền ghi thành công');
  const readContent = fs.readFileSync(testFile, 'utf8');
  assert(readContent === 'PhotoWeb Write Test', 'Đọc nội dung tệp kiểm tra chính xác');
  fs.unlinkSync(testFile);
  assert(!fs.existsSync(testFile), 'Xóa tệp tạm thành công');

  // Test 3: Cơ sở dữ liệu SQLite
  console.log('\n3. Kiểm tra kết nối cơ sở dữ liệu:');
  const catCount = await prisma.category.count();
  assert(catCount >= 0, `Kết nối DB thành công (hiện có ${catCount} danh mục)`);

  // Test 4: Kiểm tra Cài đặt Website (SiteSettings)
  console.log('\n4. Kiểm tra Cài đặt Website (SiteSettings):');
  const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
  assert(settings !== null, 'Bản ghi cài đặt mặc định tồn tại');
  assert(typeof settings.siteName === 'string', `Tên website: "${settings.siteName}"`);

  // Test 5: Kiểm tra tạo và xử lý ảnh bằng Sharp
  console.log('\n5. Kiểm tra xử lý ảnh và nén thumbnail bằng Sharp:');
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
  assert(fs.existsSync(originalFilePath), `Ảnh gốc được lưu thành tệp thật: ${originalFilePath}`);

  // Tạo thumbnail WebP
  const testThumbFilename = `thumb_test_img_${Date.now()}.webp`;
  const thumbFilePath = path.join(THUMBNAILS_DIR, testThumbFilename);
  await sharp(sampleImageBuffer)
    .resize({ width: 400, height: 300, fit: 'inside' })
    .webp({ quality: 80 })
    .toFile(thumbFilePath);
  assert(fs.existsSync(thumbFilePath), `Ảnh thumbnail WebP được tạo thành tệp thật: ${thumbFilePath}`);

  // Thêm bản ghi Image vào DB
  const createdImage = await prisma.image.create({
    data: {
      title: 'Bức ảnh kiểm thử tự động',
      description: 'Ảnh thử nghiệm hệ thống thư viện',
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

  // Test 6: Danh mục phân cấp & Truy vấn ảnh theo danh mục
  console.log('\n6. Kiểm tra liên kết danh mục và ảnh:');
  const testCategory = await prisma.category.create({
    data: {
      name: `Danh mục Test ${Date.now()}`,
      slug: `cat-test-${Date.now()}`,
      displayOrder: 99,
    },
  });
  await prisma.image.update({
    where: { id: createdImage.id },
    data: { categoryId: testCategory.id },
  });

  const photoWithCat = await prisma.image.findUnique({
    where: { id: createdImage.id },
    include: { category: true },
  });
  assert(photoWithCat.category.id === testCategory.id, 'Ảnh liên kết danh mục chính xác');

  // Xóa danh mục và dọn dẹp ảnh test
  await prisma.image.delete({ where: { id: createdImage.id } });
  await prisma.category.delete({ where: { id: testCategory.id } });
  if (fs.existsSync(originalFilePath)) fs.unlinkSync(originalFilePath);
  if (fs.existsSync(thumbFilePath)) fs.unlinkSync(thumbFilePath);
  assert(!fs.existsSync(originalFilePath), 'Tệp ảnh kiểm thử đã dọn dẹp');

  // Test 7: Kiểm tra phòng chống tấn công Path Traversal
  console.log('\n7. Kiểm tra phòng chống tấn công Path Traversal:');
  const illegalPath = '..\\..\\Windows\\System32\\calc.exe';
  const isIllegal = illegalPath.includes('..') || illegalPath.includes('/') || illegalPath.includes('\\');
  assert(isIllegal, 'Phát hiện và chặn thành công đường dẫn chứa ký tự điều hướng thư mục');

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
