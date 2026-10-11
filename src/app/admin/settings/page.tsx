'use client';

import React, { useEffect, useState } from 'react';
import {
  Sliders,
  Save,
  Globe,
  Palette,
  Layout,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    siteName: 'PhotoWeb Gallery',
    logoUrl: '',
    seoTitle: 'PhotoWeb - Thư viện ảnh chuyên nghiệp',
    seoDescription: 'Bộ sưu tập ảnh chất lượng cao trên máy tính Windows',
    introText: 'Khám phá bộ sưu tập hình ảnh chất lượng cao.',
    footerText: '© 2026 PhotoWeb Gallery. Bảo lưu mọi quyền.',
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
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setFormData({
              siteName: data.settings.siteName || '',
              logoUrl: data.settings.logoUrl || '',
              seoTitle: data.settings.seoTitle || '',
              seoDescription: data.settings.seoDescription || '',
              introText: data.settings.introText || '',
              footerText: data.settings.footerText || '',
              contactInfo: data.settings.contactInfo || '',
              primaryColor: data.settings.primaryColor || '#10b981',
              bgColor: data.settings.bgColor || '#0f172a',
              galleryLayout: data.settings.galleryLayout || 'grid',
              cardSize: data.settings.cardSize || 'medium',
              defaultTheme: data.settings.defaultTheme || 'dark',
              photosPerPage: data.settings.photosPerPage || 12,
              enableAnimations: data.settings.enableAnimations ?? true,
              showHeroSection: data.settings.showHeroSection ?? true,
              showCategoriesSection: data.settings.showCategoriesSection ?? true,
            });
          }
        }
      } catch (err) {
        console.error('Lỗi tải cài đặt:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: 'success',
          text: 'Đã lưu cấu hình website thành công và đồng bộ tới toàn bộ người xem!',
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Lỗi khi lưu cấu hình website',
        });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối máy chủ' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Cài đặt toàn bộ website
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Tùy chỉnh thương hiệu, tiêu đề, bố cục và giao diện người dùng theo ý muốn
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-3 animate-fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Thông tin thương hiệu & Website */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Globe className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Thông tin thương hiệu & SEO
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                Tên Website
              </label>
              <input
                type="text"
                required
                value={formData.siteName}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                Logo URL (tùy chọn)
              </label>
              <input
                type="text"
                placeholder="https://... hoặc /logo.png"
                value={formData.logoUrl || ''}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
              Tiêu đề trình duyệt (SEO Title)
            </label>
            <input
              type="text"
              required
              value={formData.seoTitle}
              onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
              Mô tả tìm kiếm (SEO Description)
            </label>
            <textarea
              rows={2}
              value={formData.seoDescription}
              onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
              Đoạn văn giới thiệu trang chủ
            </label>
            <textarea
              rows={3}
              value={formData.introText}
              onChange={(e) => setFormData({ ...formData, introText: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                Nội dung chân trang (Footer Text)
              </label>
              <input
                type="text"
                value={formData.footerText}
                onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                Thông tin liên hệ
              </label>
              <input
                type="text"
                value={formData.contactInfo || ''}
                onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Giao diện & Trải nghiệm */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Palette className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Màu sắc & Bố cục hiển thị
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                Màu chủ đạo (Brand Primary)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="h-10 w-12 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                Chế độ màu mặc định
              </label>
              <select
                value={formData.defaultTheme}
                onChange={(e) => setFormData({ ...formData, defaultTheme: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
              >
                <option value="dark">Tối (Dark Mode)</option>
                <option value="light">Sáng (Light Mode)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                Kích thước thẻ ảnh
              </label>
              <select
                value={formData.cardSize}
                onChange={(e) => setFormData({ ...formData, cardSize: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
              >
                <option value="small">Nhỏ (Gọn gàng)</option>
                <option value="medium">Vừa (Chuẩn đẹp)</option>
                <option value="large">Lớn (Nổi bật chi tiết)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                Số ảnh tải mỗi trang (Phân trang)
              </label>
              <input
                type="number"
                min={4}
                max={100}
                value={formData.photosPerPage}
                onChange={(e) =>
                  setFormData({ ...formData, photosPerPage: parseInt(e.target.value, 10) || 12 })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                Kiểu hiển thị danh sách ảnh
              </label>
              <select
                value={formData.galleryLayout}
                onChange={(e) => setFormData({ ...formData, galleryLayout: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
              >
                <option value="grid">Lưới đều (Responsive Grid)</option>
                <option value="masonry">Xếp gạch (Masonry Layout)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showHeroSection}
                onChange={(e) => setFormData({ ...formData, showHeroSection: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                Hiển thị phần giới thiệu Hero Banner trên đầu trang chủ
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableAnimations}
                onChange={(e) => setFormData({ ...formData, enableAnimations: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                Kích hoạt hiệu ứng chuyển cảnh và hoạt ảnh động (Animations)
              </span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu cài đặt...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu toàn bộ cài đặt</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
