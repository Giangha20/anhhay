'use client';

import React, { useEffect, useState } from 'react';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Folder,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  displayOrder: number;
  isVisible: boolean;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  children: { id: string; name: string; slug: string; displayOrder: number; isVisible: boolean }[];
  _count: { images: number };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(true);
  const [parentId, setParentId] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);
  const [reassignToId, setReassignToId] = useState<string>('unassigned');
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Lỗi tải danh mục:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const generateSlug = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setDescription('');
    setDisplayOrder(categories.length + 1);
    setIsVisible(true);
    setParentId('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setDisplayOrder(cat.displayOrder);
    setIsVisible(cat.isVisible);
    setParentId(cat.parentId || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      name,
      slug: slug || generateSlug(name),
      description,
      displayOrder: Number(displayOrder),
      isVisible,
      parentId: parentId && parentId !== 'none' ? parentId : null,
    };

    try {
      const url = editingId ? `/api/admin/categories/${editingId}` : '/api/admin/categories';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        loadCategories();
      } else {
        setFormError(data.error || 'Thao tác không thành công');
      }
    } catch (err: any) {
      setFormError('Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);

    try {
      const params = new URLSearchParams();
      if (reassignToId && reassignToId !== 'unassigned') {
        params.set('reassignToId', reassignToId);
      }

      const res = await fetch(`/api/admin/categories/${deletingCategory.id}?${params.toString()}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDeletingCategory(null);
        loadCategories();
      } else {
        const data = await res.json();
        alert(data.error || 'Xóa danh mục thất bại');
      }
    } catch {
      alert('Lỗi kết nối khi xóa danh mục');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Quản lý danh mục ảnh
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Thiết lập danh mục phân cấp (cha - con) linh hoạt, không giới hạn
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm danh mục mới</span>
        </button>
      </div>

      {/* Category Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : categories.length > 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Tên danh mục</th>
                  <th className="py-3.5 px-4">Slug (Đường dẫn)</th>
                  <th className="py-3.5 px-4">Phân cấp (Mục cha)</th>
                  <th className="py-3.5 px-4">Số lượng ảnh</th>
                  <th className="py-3.5 px-4">Thứ tự</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs sm:text-sm">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                      <Folder className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{cat.name}</span>
                      {cat.children && cat.children.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-500 font-semibold">
                          {cat.children.length} mục con
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{cat.slug}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {cat.parent ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                          {cat.parent.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Cấp cao nhất</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {cat._count.images} ảnh
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{cat.displayOrder}</td>
                    <td className="py-3.5 px-4">
                      {cat.isVisible ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Hiển thị</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Đang ẩn</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Sửa danh mục"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingCategory(cat);
                          setReassignToId('unassigned');
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Xóa danh mục"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500">
          Chưa có danh mục nào. Hãy tạo danh mục đầu tiên!
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-emerald-500" />
                <span>{editingId ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Tên danh mục
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thiên nhiên & Phong cảnh"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingId) setSlug(generateSlug(e.target.value));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Slug (Đường dẫn tĩnh)
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500 font-mono text-xs"
                />
              </div>

              {/* Parent category selector */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Danh mục cha (Cấu trúc phân cấp)
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="none">-- Là danh mục cấp cao nhất (Không có cha) --</option>
                  {categories
                    .filter((c) => c.id !== editingId)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Mô tả ngắn
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả về thể loại ảnh trong danh mục..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                    Trạng thái
                  </label>
                  <label className="flex items-center gap-2 mt-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={(e) => setIsVisible(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Hiển thị công khai
                    </span>
                  </label>
                </div>
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
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang lưu...' : editingId ? 'Lưu cập nhật' : 'Tạo danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Modal with Reassignment Option */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Xác nhận xóa danh mục "{deletingCategory.name}"
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Danh mục này hiện có <strong>{deletingCategory._count.images} bức ảnh</strong>. Hệ thống sẽ KHÔNG xóa ảnh mà cho phép bạn lựa chọn nơi lưu giữ.
              </p>
            </div>

            {deletingCategory._count.images > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Xử lý {deletingCategory._count.images} bức ảnh trong danh mục:
                </label>
                <select
                  value={reassignToId}
                  onChange={(e) => setReassignToId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs outline-none focus:border-emerald-500"
                >
                  <option value="unassigned">-- Chuyển về trạng thái "Chưa phân loại" --</option>
                  {categories
                    .filter((c) => c.id !== deletingCategory.id)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        Chuyển toàn bộ ảnh sang "{cat.name}"
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs disabled:opacity-50"
              >
                {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa danh mục'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
