import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự').max(50),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(6, 'Xác nhận mật khẩu phải có ít nhất 6 ký tự'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu mới và xác nhận mật khẩu không khớp',
  path: ['confirmPassword'],
});

export const changeUsernameSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại để xác thực'),
  newUsername: z
    .string()
    .min(3, 'Tên đăng nhập mới phải có ít nhất 3 ký tự')
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Tên đăng nhập chỉ được chứa chữ cái, số, dấu gạch ngang hoặc gạch dưới'),
});

export const updateImageSchema = z.object({
  title: z.string().min(1, 'Tiêu đề ảnh không được để trống').max(200),
  description: z.string().max(2000).optional().nullable(),
  categoryId: z.string().optional().nullable(),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được để trống').max(100),
  slug: z
    .string()
    .min(1, 'Slug danh mục không được để trống')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug chỉ được chứa chữ thường, số và dấu gạch nối'),
  description: z.string().max(1000).optional().nullable(),
  coverImage: z.string().optional().nullable(),
  displayOrder: z.coerce.number().int().default(0),
  isVisible: z.boolean().default(true),
  parentId: z.string().optional().nullable(),
});

export const siteSettingsSchema = z.object({
  siteName: z.string().min(1, 'Tên website không được để trống').max(100),
  logoUrl: z.string().optional().nullable(),
  seoTitle: z.string().min(1).max(200),
  seoDescription: z.string().max(500),
  introText: z.string().max(2000),
  footerText: z.string().max(500),
  contactInfo: z.string().max(500).optional().nullable(),
  primaryColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Mã màu không hợp lệ'),
  bgColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Mã màu nền không hợp lệ'),
  galleryLayout: z.enum(['grid', 'masonry']),
  cardSize: z.enum(['small', 'medium', 'large']),
  defaultTheme: z.enum(['dark', 'light', 'system']),
  photosPerPage: z.coerce.number().int().min(4).max(100),
  enableAnimations: z.boolean().default(true),
  showHeroSection: z.boolean().default(true),
  showCategoriesSection: z.boolean().default(true),
});

export const contentBlockSchema = z.object({
  type: z.enum(['hero', 'banner', 'about', 'featured', 'text']),
  title: z.string().min(1, 'Tiêu đề khối không được để trống').max(200),
  subtitle: z.string().max(300).optional().nullable(),
  content: z.string().max(5000).optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  buttonText: z.string().max(50).optional().nullable(),
  buttonLink: z.string().max(200).optional().nullable(),
  order: z.coerce.number().int().default(0),
  isVisible: z.boolean().default(true),
});
