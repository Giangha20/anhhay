'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PhotoCard } from '@/components/PhotoCard';
import { LightboxModal, LightboxImage } from '@/components/LightboxModal';
import {
  Sparkles,
  Filter,
  Image as ImageIcon,
  Loader2,
  ChevronDown,
  RefreshCw,
  Search,
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  _count?: { images: number };
}

interface SiteSettingsData {
  siteName: string;
  logoUrl?: string | null;
  introText: string;
  footerText: string;
  contactInfo?: string | null;
  galleryLayout: 'grid' | 'masonry';
  cardSize: 'small' | 'medium' | 'large';
  showHeroSection: boolean;
  showCategoriesSection: boolean;
  photosPerPage: number;
}

export default function HomePage() {
  const [settings, setSettings] = useState<SiteSettingsData>({
    siteName: 'PhotoWeb Gallery',
    logoUrl: null,
    introText: 'Khám phá bộ sưu tập hình ảnh chất lượng cao trên máy chủ Windows.',
    footerText: '© 2026 PhotoWeb Gallery. Bảo lưu mọi quyền.',
    contactInfo: null,
    galleryLayout: 'grid',
    cardSize: 'medium',
    showHeroSection: true,
    showCategoriesSection: true,
    photosPerPage: 12,
  });

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [images, setImages] = useState<LightboxImage[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

  // Load settings & categories on mount
  useEffect(() => {
    async function loadMeta() {
      try {
        const [settRes, catRes] = await Promise.all([
          fetch('/api/public/settings'),
          fetch('/api/public/categories'),
        ]);

        if (settRes.ok) {
          const settData = await settRes.json();
          if (settData.settings) setSettings(settData.settings);
        }

        if (catRes.ok) {
          const catData = await catRes.json();
          if (catData.categories) setCategories(catData.categories);
        }
      } catch (err) {
        console.error('Lỗi tải thông tin ban đầu:', err);
      }
    }
    loadMeta();
  }, []);

  // Fetch photos
  const fetchPhotos = useCallback(
    async (currentPage: number, append: boolean = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams();
        params.set('page', currentPage.toString());
        params.set('limit', (settings.photosPerPage || 12).toString());

        if (selectedCategory !== 'all') {
          params.set('categoryId', selectedCategory);
        }
        if (searchQuery.trim()) {
          params.set('search', searchQuery.trim());
        }

        const res = await fetch(`/api/public/gallery?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (append) {
            setImages((prev) => [...prev, ...data.images]);
          } else {
            setImages(data.images);
          }
          setTotalPages(data.pagination.totalPages);
          setTotalCount(data.pagination.total);
          setPage(data.pagination.page);
        }
      } catch (err) {
        console.error('Lỗi tải ảnh:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedCategory, searchQuery, settings.photosPerPage]
  );

  // Refetch when filter or search changes
  useEffect(() => {
    setPage(1);
    fetchPhotos(1, false);
  }, [selectedCategory, searchQuery, fetchPhotos]);

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      const nextPage = page + 1;
      fetchPhotos(nextPage, true);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <Navbar
        siteName={settings.siteName}
        logoUrl={settings.logoUrl}
        onSearch={(q) => setSearchQuery(q)}
        initialSearch={searchQuery}
      />

      <main className="flex-1">
        {/* Hero Section */}
        {settings.showHeroSection && (
          <section className="relative overflow-hidden py-16 sm:py-24 border-b border-slate-100 dark:border-slate-900 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/60 dark:to-slate-950">
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Máy chủ thư viện ảnh chuyên nghiệp</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white">
                {settings.siteName}
              </h1>
              <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
                {settings.introText}
              </p>
            </div>
          </section>
        )}

        {/* Gallery Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Controls Bar: Category Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold shrink-0 transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                Tất cả ảnh
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold shrink-0 transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat.name}
                  {cat._count && cat._count.images > 0 && (
                    <span className="ml-1.5 opacity-70 text-xs">({cat._count.images})</span>
                  )}
                </button>
              ))}
            </div>

            {/* Total items badge */}
            <div className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 shrink-0 self-end sm:self-center">
              Hiển thị <span className="font-bold text-slate-900 dark:text-white">{images.length}</span> / {totalCount} ảnh
            </div>
          </div>

          {/* Active Search Filter Notification */}
          {searchQuery && (
            <div className="mb-6 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span>
                  Kết quả tìm kiếm cho từ khóa: <strong>"{searchQuery}"</strong>
                </span>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="underline hover:text-emerald-900 font-semibold"
              >
                Xóa tìm kiếm
              </button>
            </div>
          )}

          {/* Image Grid / Masonry */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 sm:h-72 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse border border-slate-200 dark:border-slate-800"
                />
              ))}
            </div>
          ) : images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-fade-in">
              {images.map((image, index) => (
                <PhotoCard
                  key={image.id}
                  image={image}
                  cardSize={settings.cardSize}
                  onClick={() => openLightbox(index)}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-20 px-4 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 max-w-lg mx-auto">
              <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <ImageIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {searchQuery ? 'Không tìm thấy hình ảnh phù hợp' : 'Bộ sưu tập đang được cập nhật'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {searchQuery
                  ? 'Vui lòng thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc danh mục.'
                  : 'Các tác phẩm mới đang được tuyển chọn và sẽ xuất hiện sớm nhất.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20"
                >
                  Xem toàn bộ ảnh
                </button>
              )}
            </div>
          )}

          {/* Load More Button */}
          {page < totalPages && !loading && (
            <div className="mt-12 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm hover:bg-emerald-600 dark:hover:bg-emerald-400 transition-all shadow-lg hover:scale-105 disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang tải thêm ảnh...</span>
                  </>
                ) : (
                  <>
                    <span>Tải thêm hình ảnh</span>
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </section>
      </main>

      <Footer footerText={settings.footerText} contactInfo={settings.contactInfo} />

      {/* Lightbox Modal */}
      <LightboxModal
        images={images}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={(newIdx) => setLightboxIndex(newIdx)}
      />
    </div>
  );
}
