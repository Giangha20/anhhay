const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- KHỞI TẠO DỮ LIỆU BAN ĐẦU (SEED DATABASE) ---');

  // 0. Khởi tạo tài khoản quản trị Admin
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
    console.log(`✓ Đã tạo tài khoản quản trị ban đầu thành công: ${adminUsername}`);
  } else {
    console.log(`✓ Tài khoản admin ${adminUsername} đã sẵn sàng.`);
  }

  // 1. Cài đặt website mặc định
  const existingSettings = await prisma.siteSettings.findUnique({
    where: { id: 'default' },
  });

  if (!existingSettings) {
    await prisma.siteSettings.create({
      data: {
        id: 'default',
        siteName: 'Ảnh Hay',
        logoUrl: null,
        seoTitle: 'Ảnh Hay - Thư viện ảnh nghệ thuật trực tuyến',
        seoDescription: 'Bộ sưu tập ảnh chất lượng cao tuyệt đẹp, xem mượt mà trên mọi thiết bị và mạng Internet',
        introText: 'Khám phá những khoảnh khắc tuyệt đẹp qua lăng kính nghệ thuật. Thư viện hình ảnh phong cảnh, kiến trúc, chân dung chất lượng cao mở cho tất cả mọi người.',
        footerText: '© 2026 Ảnh Hay (anhhay). Thư viện ảnh nghệ thuật trực tuyến.',
        contactInfo: 'Email: contact@anhhay.gallery',
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
    console.log('✓ Đã khởi tạo Cài đặt website mặc định: Ảnh Hay');
  }

  // 2. Danh mục ảnh
  const categoriesData = [
    {
      name: 'Thiên nhiên & Phong cảnh',
      slug: 'thien-nhien-phong-canh',
      description: 'Những góc nhìn hùng vĩ của núi non, biển cả và cảnh sắc tự nhiên',
      displayOrder: 1,
    },
    {
      name: 'Kiến trúc & Đô thị',
      slug: 'kien-truc-do-thi',
      description: 'Nghệ thuật đường nét kiến trúc, ánh sáng thành phố và nhịp sống hiện đại',
      displayOrder: 2,
    },
    {
      name: 'Nhiếp ảnh Chân dung',
      slug: 'nhiep-anh-chan-dung',
      description: 'Cảm xúc, ánh mắt và khoảnh khắc chân thực của con người',
      displayOrder: 3,
    },
    {
      name: 'Đời sống & Nghệ thuật',
      slug: 'doi-song-nghe-thuat',
      description: 'Những gam màu cuộc sống đời thường và sáng tạo thị giác',
      displayOrder: 4,
    },
  ];

  const categoryMap = {};
  for (const cat of categoriesData) {
    let category = await prisma.category.findUnique({
      where: { slug: cat.slug },
    });
    if (!category) {
      category = await prisma.category.create({ data: cat });
      console.log(`✓ Đã tạo danh mục: ${cat.name}`);
    }
    categoryMap[cat.slug] = category.id;
  }

  // 3. Khối nội dung giới thiệu
  const countBlocks = await prisma.contentBlock.count();
  if (countBlocks === 0) {
    await prisma.contentBlock.create({
      data: {
        type: 'hero',
        title: 'Khám phá thế giới qua từng bức ảnh',
        subtitle: 'Kho lưu trữ ảnh chất lượng cao, tối ưu hiển thị mượt mà trên mọi thiết bị và đường truyền',
        content: 'Mỗi bức ảnh là một câu chuyện, một cảm xúc và một kỷ niệm được lưu giữ mãi mãi.',
        order: 1,
        isVisible: true,
      },
    });
    console.log('✓ Đã tạo khối nội dung giới thiệu.');
  }



  console.log('--- KHỞI TẠO DỮ LIỆU HOÀN TẤT (HỆ THỐNG SẠCH ĐỂ TỰ TẢI ẢNH) ---');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
