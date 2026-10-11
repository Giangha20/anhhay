'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Image as ImageIcon,
  FolderTree,
  HardDrive,
  Activity,
  Upload,
  Plus,
  Sliders,
  Archive,
  ArrowRight,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface StatsData {
  photosCount: number;
  categoriesCount: number;
  storageStats: {
    imagesSizeBytes: number;
    thumbnailsSizeBytes: number;
    backupsSizeBytes: number;
    dbSizeBytes: number;
    totalSizeBytes: number;
    totalSizeFormatted: string;
    storageBasePath: string;
  };
  recentPhotos: Array<{
    id: string;
    title: string;
    filename: string;
    createdAt: string;
    category?: { name: string } | null;
  }>;
  recentLogs: Array<{
    id: string;
    action: string;
    details?: string | null;
    createdAt: string;
    admin?: { username: string } | null;
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Lỗi tải thống kê:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Tổng số hình ảnh',
      value: stats?.photosCount || 0,
      unit: 'ảnh',
      icon: ImageIcon,
      color: 'from-emerald-500 to-teal-600',
      href: '/admin/photos',
    },
    {
      label: 'Tổng số danh mục',
      value: stats?.categoriesCount || 0,
      unit: 'chủ đề',
      icon: FolderTree,
      color: 'from-blue-500 to-indigo-600',
      href: '/admin/categories',
    },
    {
      label: 'Dung lượng ổ D',
      value: stats?.storageStats?.totalSizeFormatted || '0 MB',
      unit: 'đã sử dụng',
      icon: HardDrive,
      color: 'from-violet-500 to-purple-600',
      href: '/admin/backups',
    },
    {
      label: 'Cơ sở dữ liệu SQLite',
      value: `${((stats?.storageStats?.dbSizeBytes || 0) / (1024 * 1024)).toFixed(2)} MB`,
      unit: 'photoweb.db',
      icon: ShieldCheck,
      color: 'from-amber-500 to-orange-600',
      href: '/admin/settings',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Title & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Tổng quan hệ thống
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Máy chủ lưu trữ và thư viện ảnh vận hành trên ổ D: Windows
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/photos"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all hover:scale-105"
          >
            <Upload className="w-4 h-4" />
            <span>Tải ảnh lên</span>
          </Link>
          <Link
            href="/admin/categories"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm danh mục</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              href={card.href}
              className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 shadow-sm hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {card.value}
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                {card.label} <span className="text-[10px] opacity-75">({card.unit})</span>
              </p>
            </Link>
          );
        })}
      </div>

      {/* Storage Breakdown Details */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-500" />
            <span>Chi tiết lưu trữ thực tế trên ổ D</span>
          </h2>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">
            {stats?.storageStats?.storageBasePath}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500">Ảnh gốc (storage/images):</span>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
              {((stats?.storageStats?.imagesSizeBytes || 0) / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500">Ảnh thu nhỏ (storage/thumbnails):</span>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
              {((stats?.storageStats?.thumbnailsSizeBytes || 0) / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500">Bản sao lưu (storage/backups):</span>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
              {((stats?.storageStats?.backupsSizeBytes || 0) / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        </div>
      </div>

      {/* Two columns: Recent Photos & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Photos */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-500" />
              <span>Ảnh tải lên gần đây</span>
            </h2>
            <Link
              href="/admin/photos"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Xem tất cả
            </Link>
          </div>

          {stats?.recentPhotos && stats.recentPhotos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {stats.recentPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative rounded-xl overflow-hidden aspect-video bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800"
                >
                  <img
                    src={`/api/images/${photo.filename}?thumb=1`}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-white truncate font-medium">{photo.title}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Chưa có hình ảnh nào được tải lên.
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              <span>Hoạt động quản trị gần đây</span>
            </h2>
            <Link
              href="/admin/audit-logs"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Xem nhật ký
            </Link>
          </div>

          {stats?.recentLogs && stats.recentLogs.length > 0 ? (
            <div className="space-y-3">
              {stats.recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs"
                >
                  <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{log.action}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleTimeString('vi-VN')}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-slate-600 dark:text-slate-300 truncate mt-0.5">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Chưa ghi nhận hoạt động nào.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
