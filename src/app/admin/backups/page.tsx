'use client';

import React, { useEffect, useState } from 'react';
import {
  Archive,
  Download,
  Trash2,
  Plus,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  FileArchive,
} from 'lucide-react';

interface BackupItem {
  filename: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
}

export default function AdminBackupsPage() {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/backups');
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách sao lưu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/backups', { method: 'POST' });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({
          type: 'success',
          text: `Đã tạo bản sao lưu ${data.backup?.filename} thành công trên ổ D!`,
        });
        loadBackups();
      } else {
        setMessage({ type: 'error', text: data.error || 'Lỗi khi tạo sao lưu' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối máy chủ' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`Bạn có chắc muốn xóa bản sao lưu ${filename}?`)) return;

    try {
      const res = await fetch(`/api/admin/backups/${filename}`, { method: 'DELETE' });
      if (res.ok) {
        loadBackups();
      } else {
        alert('Xóa bản sao lưu thất bại');
      }
    } catch {
      alert('Lỗi kết nối khi xóa bản sao lưu');
    }
  };

  return (
    <div className="max-w-5xl space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Sao lưu và phục hồi dữ liệu
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Lưu trữ bản sao lưu an toàn tại thư mục D:\PhotoWeb\storage\backups
          </p>
        </div>

        <button
          onClick={handleCreateBackup}
          disabled={creating}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all hover:scale-105 disabled:opacity-50"
        >
          {creating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang tạo bản sao lưu...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Tạo bản sao lưu ngay</span>
            </>
          )}
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-3 animate-fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Backups List */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileArchive className="w-5 h-5 text-emerald-500" />
          <span>Danh sách các bản sao lưu đã tạo</span>
        </h2>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : backups.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {backups.map((b) => (
              <div
                key={b.filename}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {b.filename}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>Dung lượng: {b.sizeFormatted}</span>
                    <span>•</span>
                    <span>Ngày tạo: {new Date(b.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/api/admin/backups/${b.filename}`}
                    download={b.filename}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-500 hover:text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải về</span>
                  </a>
                  <button
                    onClick={() => handleDeleteBackup(b.filename)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Xóa bản sao lưu này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-500">
            Chưa có bản sao lưu nào. Hãy bấm "Tạo bản sao lưu ngay" để bảo vệ dữ liệu của bạn!
          </div>
        )}
      </div>

      {/* Guide Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <span>Hướng dẫn sao lưu và phục hồi toàn diện</span>
        </h3>

        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-3 leading-relaxed">
          <p>
            <strong>1. Cấu trúc lưu trữ trên máy tính của bạn:</strong>
            <br />
            - Cơ sở dữ liệu: <code className="text-emerald-500 font-mono">D:\PhotoWeb\storage\photoweb.db</code>
            <br />
            - Ảnh gốc do admin đăng: <code className="text-emerald-500 font-mono">D:\PhotoWeb\storage\images\</code>
            <br />
            - Ảnh thu nhỏ thumbnail: <code className="text-emerald-500 font-mono">D:\PhotoWeb\storage\thumbnails\</code>
          </p>

          <p>
            <strong>2. Sao lưu thủ công toàn bộ (Full Backup):</strong>
            <br />
            Bạn chỉ cần sao chép (Copy) toàn bộ thư mục <code className="text-emerald-500 font-mono">D:\PhotoWeb\storage</code> sang ổ cứng gắn ngoài, USB hoặc dịch vụ đám mây (Google Drive, OneDrive).
          </p>

          <p>
            <strong>3. Phục hồi dữ liệu (Restore):</strong>
            <br />
            Khi cần khôi phục lại máy chủ: Chỉ cần giải nén tệp zip sao lưu và đặt tệp <code className="text-emerald-500 font-mono">photoweb.db</code> vào <code className="text-emerald-500 font-mono">D:\PhotoWeb\storage\</code> rồi khởi động lại máy chủ Next.js.
          </p>
        </div>
      </div>
    </div>
  );
}
