const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanup() {
  console.log('--- BẮT ĐẦU DỌN DẸP SẠCH TOÀN BỘ ẢNH CŨ ---');

  // 1. Xóa toàn bộ bản ghi ảnh trong Database
  const deleteResult = await prisma.image.deleteMany({});
  console.log(`✓ Đã xóa ${deleteResult.count} bản ghi ảnh trong Database.`);

  // 2. Thư mục lưu trữ
  const targetDirs = [
    path.join(__dirname, '..', 'storage', 'images'),
    path.join(__dirname, '..', 'storage', 'thumbnails'),
    path.join(__dirname, '..', 'public', 'images'),
  ];

  for (const dir of targetDirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      let removedCount = 0;
      for (const file of files) {
        if (file === '.gitkeep') continue;
        const filePath = path.join(dir, file);
        try {
          fs.unlinkSync(filePath);
          removedCount++;
        } catch (err) {
          console.error(`Không thể xóa ${filePath}:`, err.message);
        }
      }
      console.log(`✓ Thư mục ${path.relative(path.join(__dirname, '..'), dir)}: Đã dọn sạch ${removedCount} tệp.`);
    }
  }

  console.log('--- HOÀN TẤT DỌN DẸP: WEBSITE ĐÃ SẠCH NHƯ MỚI 100% ---');
}

cleanup()
  .catch((e) => {
    console.error('Lỗi dọn dẹp:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
