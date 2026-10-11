'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Sun, Moon, Menu, X, Image as ImageIcon, Shield } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface NavbarProps {
  siteName: string;
  logoUrl?: string | null;
  onSearch?: (query: string) => void;
  initialSearch?: string;
}

export function Navbar({ siteName, logoUrl, onSearch, initialSearch = '' }: NavbarProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      router.push(`/?search=${encodeURIComponent(searchQuery)}`);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Site Name */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-3 group">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={siteName}
                  className="h-10 w-10 object-contain rounded-lg"
                />
              ) : (
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                {siteName}
              </span>
            </Link>
          </div>

          {/* Search bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm hình ảnh theo tên hoặc mô tả..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (onSearch) onSearch(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-emerald-500 dark:focus:border-emerald-500 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all shadow-inner"
              />
            </form>
          </div>

          {/* Navigation links & Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-semibold rounded-lg text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            >
              Thư viện ảnh
            </Link>
            <Link
              href="/categories"
              className="px-4 py-2 text-sm font-semibold rounded-lg text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            >
              Danh mục
            </Link>
            <Link
              href="/admin"
              className="px-3.5 py-2 text-sm font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:text-emerald-500 flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              title="Trang quản trị"
            >
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Quản trị</span>
            </Link>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Chuyển chế độ sáng/tối"
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors ml-1"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>
          </div>

          {/* Mobile buttons */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Chuyển chế độ sáng/tối"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Mở menu điện thoại"
              className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-fade-in">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm hình ảnh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 outline-none"
              />
            </form>
            <div className="flex flex-col space-y-1 pt-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-base font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                Thư viện ảnh
              </Link>
              <Link
                href="/categories"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-base font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                Danh mục ảnh
              </Link>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-base font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                <Shield className="w-4 h-4" />
                <span>Trang quản trị (Admin)</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
