'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Layers, Image as ImageIcon, ArrowRight, Folder } from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  children: {
    id: string;
    name: string;
    slug: string;
    _count?: { images: number };
  }[];
  _count?: { images: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [siteName, setSiteName] = useState('PhotoWeb Gallery');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, settRes] = await Promise.all([
          fetch('/api/public/categories'),
          fetch('/api/public/settings'),
        ]);

        if (catRes.ok) {
          const data = await catRes.json();
          setCategories(data.categories || []);
        }
        if (settRes.ok) {
          const data = await settRes.json();
          if (data.settings?.siteName) setSiteName(data.settings.siteName);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh mục:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <Navbar siteName={siteName} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>Khám phá theo chủ đề</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white">
            Danh mục hình ảnh
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Tìm kiếm những tác phẩm nhiếp ảnh đặc sắc được phân loại khoa học và rõ ràng.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-56 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse border border-slate-200 dark:border-slate-800"
              />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all hover:shadow-xl hover:shadow-emerald-500/5"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Folder className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {cat._count?.images || 0} ảnh
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors mb-2">
                    {cat.name}
                  </h3>

                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                    {cat.description || 'Chưa có mô tả cho danh mục này.'}
                  </p>

                  {/* Subcategories pills if any */}
                  {cat.children && cat.children.length > 0 && (
                    <div className="space-y-1.5 mb-4 pt-2 border-t border-slate-200 dark:border-slate-800/60">
                      <span className="text-xs font-semibold text-slate-400">Mục con:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.children.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/?categoryId=${sub.id}`}
                            className="px-2.5 py-1 rounded-md text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  href={`/?categoryId=${cat.id}`}
                  className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mt-4 group-hover:translate-x-1 transition-transform"
                >
                  <span>Xem bộ sưu tập ảnh</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-500">
            Chưa có danh mục nào được khởi tạo.
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
