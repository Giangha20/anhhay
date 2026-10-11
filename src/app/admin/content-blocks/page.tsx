'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Layers,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface ContentBlockItem {
  id: string;
  type: string;
  title: string;
  subtitle?: string | null;
  content?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;
  order: number;
  isVisible: boolean;
}

export default function AdminContentBlocksPage() {
  const [blocks, setBlocks] = useState<ContentBlockItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState('banner');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonLink, setButtonLink] = useState('');
  const [order, setOrder] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBlocks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/content-blocks');
      if (res.ok) {
        const data = await res.json();
        setBlocks(data.blocks || []);
      }
    } catch (err) {
      console.error('Lỗi tải khối nội dung:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlocks();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setType('banner');
    setTitle('');
    setSubtitle('');
    setContent('');
    setButtonText('');
    setButtonLink('');
    setOrder(blocks.length + 1);
    setIsVisible(true);
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: ContentBlockItem) => {
    setEditingId(b.id);
    setType(b.type);
    setTitle(b.title);
    setSubtitle(b.subtitle || '');
    setContent(b.content || '');
    setButtonText(b.buttonText || '');
    setButtonLink(b.buttonLink || '');
    setOrder(b.order);
    setIsVisible(b.isVisible);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload = {
      type,
      title,
      subtitle: subtitle || null,
      content: content || null,
      buttonText: buttonText || null,
      buttonLink: buttonLink || null,
      order: Number(order),
      isVisible,
    };

    try {
      const url = editingId ? `/api/admin/content-blocks/${editingId}` : '/api/admin/content-blocks';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        loadBlocks();
      } else {
        const data = await res.json();
        setError(data.error || 'Lỗi thao tác');
      }
    } catch {
      setError('Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa khối nội dung này?')) return;
    try {
      const res = await fetch(`/api/admin/content-blocks/${id}`, { method: 'DELETE' });
      if (res.ok) loadBlocks();
    } catch (err) {
      alert('Lỗi xóa khối nội dung');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Nội dung và khối trang chủ
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tùy biến các khối giới thiệu, banner, thông điệp trên giao diện mà không cần sửa mã nguồn
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm khối mới</span>
        </button>
      </div>

      {/* Blocks List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : blocks.length > 0 ? (
        <div className="space-y-4">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    {block.type}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    Thứ tự: {block.order}
                  </span>
                  {block.isVisible ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Hiển thị</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Ẩn</span>
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {block.title}
                </h3>

                {block.subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {block.subtitle}
                  </p>
                )}
                {block.content && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {block.content}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => handleOpenEdit(block)}
                  className="p-2 rounded-xl text-slate-500 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Chỉnh sửa khối"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(block.id)}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Xóa khối"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500">
          Chưa có khối nội dung nào.
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingId ? 'Sửa khối nội dung' : 'Thêm khối nội dung mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                    Loại khối
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="hero">Hero (Banner đầu trang)</option>
                    <option value="banner">Banner thông điệp</option>
                    <option value="about">Giới thiệu (About)</option>
                    <option value="featured">Nổi bật (Featured)</option>
                    <option value="text">Đoạn văn bản tự do</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Tiêu đề
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Tiêu đề phụ (Subtitle)
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Nội dung chi tiết
                </label>
                <textarea
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                    Nút bấm (Nhãn)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Xem ngay"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                    Đường dẫn nút
                  </label>
                  <input
                    type="text"
                    placeholder="VD: /categories"
                    value={buttonLink}
                    onChange={(e) => setButtonLink(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Hiển thị trên website
                  </span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu khối nội dung'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
