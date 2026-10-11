import prisma from './prisma';

export const DEFAULT_SETTINGS = {
  id: 'default',
  siteName: 'PhotoWeb Gallery',
  logoUrl: null,
  seoTitle: 'PhotoWeb - Thư viện ảnh chuyên nghiệp',
  seoDescription: 'Bộ sưu tập ảnh chất lượng cao trên máy tính Windows',
  introText: 'Chào mừng bạn đến với kho lưu trữ và hiển thị ảnh chất lượng cao.',
  footerText: '© 2026 PhotoWeb Gallery. Hệ thống máy chủ ảnh Windows.',
  contactInfo: 'Email: contact@photoweb.local | Hotline: 0900-123-456',
  primaryColor: '#10b981',
  bgColor: '#0f172a',
  galleryLayout: 'grid',
  cardSize: 'medium',
  defaultTheme: 'dark',
  photosPerPage: 12,
  enableAnimations: true,
  showHeroSection: true,
  showCategoriesSection: true,
};

/**
 * Fetch or initialize the single site settings record
 */
export async function getSiteSettings() {
  let settings = await prisma.siteSettings.findUnique({
    where: { id: 'default' },
  });

  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: DEFAULT_SETTINGS,
    });
  }

  return settings;
}
