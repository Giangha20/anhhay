'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Image as ImageIcon,
  FolderTree,
  FileText,
  Sliders,
  UserCheck,
  Archive,
  History,
  LogOut,
  ExternalLink,
  Shield,
  Menu,
  X,
  AlertTriangle,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [adminUser, setAdminUser] = useState<{
    id: string;
    username: string;
    mustChangePassword: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check auth
  useEffect(() => {
    // If we're on login page, don't wrap layout
    if (pathname === '/admin/login') {
      setLoading(false);
      return;
    }

    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/admin/login');
          return;
        }
        const data = await res.json();
        if (data.authenticated && data.admin) {
          setAdminUser(data.admin);
        } else {
          router.push('/admin/login');
        }
      } catch {
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Lỗi đăng xuất:', err);
    }
  };

  // If login page, render children directly without sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Đang tải bảng quản trị...</span>
        </div>
      </div>
    );
  }

  const navLinks = [
    { label: 'Tổng quan', href: '/admin', icon: LayoutDashboard },
    { label: 'Quản lý ảnh', href: '/admin/photos', icon: ImageIcon },
    { label: 'Quản lý danh mục', href: '/admin/categories', icon: FolderTree },
    { label: 'Nội dung trang', href: '/admin/content-blocks', icon: FileText },
    { label: 'Cài đặt website', href: '/admin/settings', icon: Sliders },
    { label: 'Tài khoản admin', href: '/admin/account', icon: UserCheck },
    { label: 'Sao lưu & Phục hồi', href: '/admin/backups', icon: Archive },
    { label: 'Nhật ký hoạt động', href: '/admin/audit-logs', icon: History },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 select-none">
        {/* Brand */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-slate-900 dark:text-white tracking-tight">PhotoWeb</span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-500">Admin Panel</span>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User bar & Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {adminUser?.username || 'Admin'}
              </p>
              <p className="text-[10px] text-emerald-500 font-semibold">Toàn quyền hệ thống</p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Đổi giao diện sáng/tối"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Link
              href="/"
              target="_blank"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Xem Web</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar for Mobile */}
        <header className="lg:hidden h-16 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-black text-slate-900 dark:text-white">Admin Panel</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-rose-600 dark:text-rose-400"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative w-64 max-w-xs bg-white dark:bg-slate-900 h-full flex flex-col z-10 shadow-2xl">
              <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white">Danh mục quản trị</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                        isActive
                          ? 'bg-emerald-500 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change password warning banner */}
        {adminUser?.mustChangePassword && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Cảnh báo an toàn: Bạn đang sử dụng mật khẩu khởi tạo mặc định. Hãy đổi mật khẩu ngay để bảo vệ máy chủ!
              </span>
            </div>
            <Link
              href="/admin/account"
              className="px-3 py-1 rounded-md bg-slate-950 text-white text-xs font-bold shrink-0 hover:bg-slate-800"
            >
              Đổi mật khẩu ngay
            </Link>
          </div>
        )}

        {/* Sub-page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
