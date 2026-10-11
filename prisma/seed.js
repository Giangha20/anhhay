const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const sharp = require('sharp');

const prisma = new PrismaClient();

const STORAGE_BASE = path.resolve(process.env.STORAGE_PATH || 'D:\\PhotoWeb\\storage');
const IMAGES_DIR = path.join(STORAGE_BASE, 'images');
const THUMBNAILS_DIR = path.join(STORAGE_BASE, 'thumbnails');
const PUBLIC_IMAGES_DIR = path.join(process.cwd(), 'public', 'images');

// Ensure directories exist
for (const dir of [STORAGE_BASE, IMAGES_DIR, THUMBNAILS_DIR, PUBLIC_IMAGES_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function escapeXml(unsafe) {
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function createScenicSvg(title, subtitle, colorTop, colorBottom, accentColor, iconSvg) {
  const safeTitle = escapeXml(title);
  const safeSubtitle = escapeXml(subtitle);

  return `
  <svg width="1200" height="800" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${colorTop}" />
        <stop offset="100%" stop-color="${colorBottom}" />
      </linearGradient>
      <linearGradient id="sun" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#fbbf24" stop-opacity="0.4" />
      </linearGradient>
      <linearGradient id="mountain1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${colorBottom}" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#020617" stop-opacity="0.95" />
      </linearGradient>
    </defs>
    <!-- Sky -->
    <rect width="1200" height="800" fill="url(#bg)" />

    <!-- Sun / Glow -->
    <circle cx="600" cy="380" r="180" fill="url(#sun)" filter="blur(10px)" opacity="0.8" />
    <circle cx="600" cy="380" r="140" fill="${accentColor}" opacity="0.9" />

    <!-- Distant Mountains -->
    <path d="M0 550 Q 250 380, 500 520 T 1000 460 T 1200 530 L 1200 800 L 0 800 Z" fill="${colorBottom}" opacity="0.6" />
    <path d="M0 600 Q 300 450, 650 580 T 1200 560 L 1200 800 L 0 800 Z" fill="url(#mountain1)" />
    
    <!-- Water / Foreground reflection -->
    <rect y="640" width="1200" height="160" fill="#030712" opacity="0.9" />
    <ellipse cx="600" cy="670" rx="280" ry="12" fill="${accentColor}" opacity="0.3" />
    <ellipse cx="600" cy="710" rx="190" ry="8" fill="#fbbf24" opacity="0.2" />

    <!-- Artwork Decorative Icon -->
    <g transform="translate(560, 260) scale(3.5)" fill="none" stroke="white" stroke-width="1.5" opacity="0.9">
      ${iconSvg}
    </g>

    <!-- Typography -->
    <text x="600" y="520" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="800" fill="#ffffff" letter-spacing="1">
      ${safeTitle}
    </text>
    <text x="600" y="575" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="22" font-weight="400" fill="#e2e8f0" opacity="0.9">
      ${safeSubtitle}
    </text>
  </svg>`;
}

async function main() {
  console.log('--- KHỞI TẠO DỮ LIỆU BAN ĐẦU (SEED DATABASE) ---');

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

  // 4. Khởi tạo bộ sưu tập ảnh nghệ thuật thực tế
  const photoSpecs = [
    {
      slug: 'thien-nhien-phong-canh',
      filename: 'hoang-hon-da-lat.png',
      title: 'Hoàng hôn lãng mạn Đà Lạt',
      subtitle: 'Sắc tím lam quyện cùng mây trời cao nguyên',
      description: 'Góc nhìn từ đỉnh đồi thông nhìn xuống thung lũng Đà Lạt trong ánh hoàng hôn rực rỡ.',
      colorTop: '#4c1d95',
      colorBottom: '#1e1b4b',
      accentColor: '#f43f5e',
      icon: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
    },
    {
      slug: 'kien-truc-do-thi',
      filename: 'cau-vang-ba-na.png',
      title: 'Cầu Vàng Bà Nà Hills',
      subtitle: 'Tuyệt tác kiến trúc giữa làn sương mây',
      description: 'Kiến trúc đôi bàn tay khổng lồ nâng đỡ dải lụa vàng giữa đỉnh núi Chúa hùng vĩ.',
      colorTop: '#1e3a8a',
      colorBottom: '#0f172a',
      accentColor: '#fbbf24',
      icon: '<circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/>',
    },
    {
      slug: 'thien-nhien-phong-canh',
      filename: 'song-nho-que.png',
      title: 'Hẻm Tu Sản & Sông Nho Quế',
      subtitle: 'Dải ngọc bích uốn lượn nơi địa đầu Tổ quốc',
      description: 'Nước sông xanh màu ngọc bích chảy len lỏi qua hẻm vực sâu nhất Đông Nam Á tại Hà Giang.',
      colorTop: '#064e3b',
      colorBottom: '#022c22',
      accentColor: '#10b981',
      icon: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    },
    {
      slug: 'doi-song-nghe-thuat',
      filename: 'pho-co-hoi-an.png',
      title: 'Đêm đèn lồng Phố Cổ Hội An',
      subtitle: 'Lung linh sắc màu bên dòng sông Hoài thơ mộng',
      description: 'Hàng ngàn chiếc đèn lồng thủ công thắp sáng những mái ngói rêu phong của phố cổ Hội An.',
      colorTop: '#831843',
      colorBottom: '#4c0519',
      accentColor: '#f59e0b',
      icon: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    },
    {
      slug: 'nhiep-anh-chan-dung',
      filename: 'nu-cuoi-tay-bac.png',
      title: 'Nụ cười hồn nhiên Tây Bắc',
      subtitle: 'Ánh mắt trong trẻo giữa núi rừng mây phủ',
      description: 'Khoảnh khắc chân thật lưu giữ nét đẹp thơ ngây của trẻ em các dân tộc vùng cao phía Bắc.',
      colorTop: '#701a75',
      colorBottom: '#2e1065',
      accentColor: '#ec4899',
      icon: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    },
    {
      slug: 'kien-truc-do-thi',
      filename: 'landmark-81-ve-dem.png',
      title: 'Landmark 81 rực rỡ Sài Gòn',
      subtitle: 'Biểu tượng phát triển vươn cao bên sông',
      description: 'Đỉnh tháp Landmark 81 thắp sáng bầu trời đêm thành phố Hồ Chí Minh hiện đại và sôi động.',
      colorTop: '#0c4a6e',
      colorBottom: '#082f49',
      accentColor: '#38bdf8',
      icon: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v8h4"/><path d="M18 9h2a2 2 0 0 1 2 2v11h-4"/>',
    },
    {
      slug: 'thien-nhien-phong-canh',
      filename: 'mua-vang-mu-cang-chai.png',
      title: 'Mùa vàng Mù Cang Chải',
      subtitle: 'Sóng lúa bậc thang dập dờn trên sườn non',
      description: 'Thảm lúa chín vàng ươm tầng tầng lớp lớp trên các triền núi Yên Bái trong mùa gặt.',
      colorTop: '#78350f',
      colorBottom: '#451a03',
      accentColor: '#facc15',
      icon: '<path d="M2 20h20M5 20l4-16h6l4 16"/>',
    },
    {
      slug: 'doi-song-nghe-thuat',
      filename: 'pho-co-ha-noi.png',
      title: 'Góc phố cổ Hà Nội mùa thu',
      subtitle: 'Gánh hoa rong và nét trầm mặc nghìn năm văn hiến',
      description: 'Hà Nội dịu dàng trong sắc nắng sớm mùa thu với những chiếc xe hoa rực rỡ trên đường phố cổ.',
      colorTop: '#134e4a',
      colorBottom: '#042f2e',
      accentColor: '#2dd4bf',
      icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    },
  ];

  console.log('Đang kiểm tra và tạo ảnh nghệ thuật mẫu...');

  for (const spec of photoSpecs) {
    const originalPath = path.join(IMAGES_DIR, spec.filename);
    const publicPath = path.join(PUBLIC_IMAGES_DIR, spec.filename);
    const thumbFilename = `thumb_${spec.filename.replace(/\.[^/.]+$/, '')}.webp`;
    const thumbPath = path.join(THUMBNAILS_DIR, thumbFilename);

    let fileBuffer;
    if (!fs.existsSync(originalPath)) {
      const svg = createScenicSvg(
        spec.title,
        spec.subtitle,
        spec.colorTop,
        spec.colorBottom,
        spec.accentColor,
        spec.icon
      );
      fileBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

      // Lưu tệp ảnh gốc vào storage trên ổ D
      fs.writeFileSync(originalPath, fileBuffer);

      // Lưu bản sao vào public/images để đồng bộ Git lên Vercel
      fs.writeFileSync(publicPath, fileBuffer);

      // Tạo thumbnail WebP vào storage trên ổ D
      await sharp(fileBuffer)
        .resize({ width: 600, height: 400, fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(thumbPath);

      console.log(`✓ Đã tạo tệp ảnh nghệ thuật: ${spec.filename}`);
    } else {
      fileBuffer = fs.readFileSync(originalPath);
      if (!fs.existsSync(publicPath)) {
        fs.writeFileSync(publicPath, fileBuffer);
      }
    }

    // Thêm bản ghi vào database nếu chưa có
    const existingImage = await prisma.image.findUnique({
      where: { filename: spec.filename },
    });

    if (!existingImage) {
      await prisma.image.create({
        data: {
          title: spec.title,
          description: spec.description,
          filename: spec.filename,
          relativePath: `images/${spec.filename}`,
          thumbnailPath: `thumbnails/${thumbFilename}`,
          format: 'image/png',
          size: fileBuffer.length,
          width: 1200,
          height: 800,
          categoryId: categoryMap[spec.slug] || null,
        },
      });
      console.log(`✓ Đã thêm bản ghi ảnh vào cơ sở dữ liệu: ${spec.title}`);
    }
  }

  console.log('--- KHỞI TẠO DỮ LIỆU HOÀN TẤT THÀNH CÔNG ---');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
