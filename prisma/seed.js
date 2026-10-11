const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- KHỞI TẠO DỮ LIỆU BAN ĐẦU (SEED DATABASE) ---');

  const adminUsername = process.env.INITIAL_ADMIN_USERNAME || 'giangtptq';
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Giangha@2k5';

  console.log(`Kiểm tra tài khoản quản trị: ${adminUsername}`);
  const existingAdmin = await prisma.admin.findUnique({
    where: { username: adminUsername },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const admin = await prisma.admin.create({
      data: {
        username: adminUsername,
        passwordHash,
        mustChangePassword: true,
        isActive: true,
      },
    });
    console.log(`Đã tạo tài khoản quản trị ban đầu thành công (ID: ${admin.id})`);

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'LOGIN',
        details: 'Khởi tạo hệ thống và tài khoản quản trị ban đầu thành công',
      },
    });
  } else {
    console.log(`Tài khoản admin ${adminUsername} đã tồn tại trong cơ sở dữ liệu.`);
  }

  // Khởi tạo cài đặt website mặc định
  const existingSettings = await prisma.siteSettings.findUnique({
    where: { id: 'default' },
  });

  if (!existingSettings) {
    await prisma.siteSettings.create({
      data: {
        id: 'default',
        siteName: 'PhotoWeb Gallery',
        logoUrl: null,
        seoTitle: 'PhotoWeb - Thư viện ảnh chuyên nghiệp',
        seoDescription: 'Bộ sưu tập ảnh chất lượng cao trên máy tính Windows ổ D',
        introText: 'Khám phá những khoảnh khắc tuyệt đẹp qua lăng kính nghệ thuật. Thư viện ảnh chuyên nghiệp vận hành trực tiếp trên máy chủ Windows.',
        footerText: '© 2026 PhotoWeb Gallery. Vận hành trên ổ D: máy chủ Windows.',
        contactInfo: 'Email: admin@photoweb.local',
        primaryColor: '#10b981',
        bgColor: '#0f172a',
        galleryLayout: 'grid',
        cardSize: 'medium',
        defaultTheme: 'dark',
        photosPerPage: 12,
        enableAnimations: true,
        showHeroSection: true,
        showCategoriesSection: true,
      },
    });
    console.log('Đã khởi tạo Cài đặt website mặc định.');
  }

  // Khởi tạo một số danh mục mẫu
  const sampleCategories = [
    {
      name: 'Thiên nhiên & Phong cảnh',
      slug: 'thien-nhien-phong-canh',
      description: 'Những góc nhìn hùng vĩ của núi non, biển cả và cảnh sắc tự nhiên',
      displayOrder: 1,
    },
    {
      name: 'Kiến trúc & Đô thị',
      slug: 'kien-truc-do-thi',
      description: 'Nghệ thuật đường nét kiến trúc, ánh sáng thành phố và đời sống hiện đại',
      displayOrder: 2,
    },
    {
      name: 'Nhiếp ảnh Chân dung',
      slug: 'nhiep-anh-chan-dung',
      description: 'Cảm xúc, ánh mắt và khoảnh khắc chân thực của con người',
      displayOrder: 3,
    },
  ];

  for (const cat of sampleCategories) {
    const exists = await prisma.category.findUnique({
      where: { slug: cat.slug },
    });
    if (!exists) {
      await prisma.category.create({ data: cat });
      console.log(`Đã tạo danh mục: ${cat.name}`);
    }
  }

  // Khởi tạo khối nội dung mẫu
  const countBlocks = await prisma.contentBlock.count();
  if (countBlocks === 0) {
    await prisma.contentBlock.create({
      data: {
        type: 'hero',
        title: 'Khám phá thế giới qua từng bức ảnh',
        subtitle: 'Kho lưu trữ ảnh chất lượng cao, bảo mật và toàn quyền trên máy chủ của bạn',
        content: 'Mỗi bức ảnh là một câu chuyện, một cảm xúc và một kỷ niệm được lưu giữ mãi mãi.',
        order: 1,
        isVisible: true,
      },
    });
    console.log('Đã tạo khối nội dung giới thiệu mẫu.');
  }

  console.log('--- KHỞI TẠO DỮ LIỆU HOÀN TẤT ---');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
