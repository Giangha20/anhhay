'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Upload,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
  HardDrive,
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
}

interface ImageItem {
  id: string;
  title: string;
  description?: string | null;
  filename: string;
  format: string;
  size: number;
  width?: number | null;
  height?: number | null;
  thumbDataUrl?: string | null;
  dataUrl?: string | null;
  createdAt: string;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
}

export default function AdminPhotosPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Pagination
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadCatId, setUploadCatId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    percent: number;
    currentFileName: string;
  } | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit modal state
  const [editingImage, setEditingImage] = useState<ImageItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCatId, setEditCatId] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete modal state
  const [deletingImage, setDeletingImage] = useState<ImageItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/admin/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error('Lỗi tải danh mục:', err);
      }
    }
    loadCategories();
  }, []);

  // Load photos
  const loadImages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '16');
      if (search.trim()) params.set('search', search.trim());
      if (selectedCategory !== 'all') params.set('categoryId', selectedCategory);

      const res = await fetch(`/api/admin/images?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setImages(data.images || []);
        setTotalPages(data.pagination.totalPages || 1);
        setTotalCount(data.pagination.total || 0);
      }
    } catch (err) {
      console.error('Lỗi tải ảnh:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, [page, search, selectedCategory]);

  // Handle file drop / select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
      if (!uploadTitle && e.target.files.length === 1) {
        const rawName = e.target.files[0].name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setUploadTitle(rawName);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Submit Upload - Hỗ trợ không giới hạn số lượng ảnh
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadMessage(null);

    let successCount = 0;
    const errors: string[] = [];

    // Tải tuần tự từng tệp - giải quyết triệt để lỗi Payload Too Large, hỗ trợ chọn hàng trăm ảnh cùng lúc
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const progressPercent = Math.round(((i + 1) / selectedFiles.length) * 100);

      setUploadProgress({
        current: i + 1,
        total: selectedFiles.length,
        percent: progressPercent,
        currentFileName: file.name,
      });

      const formData = new FormData();
      formData.append('files', file);

      // Gán tiêu đề phù hợp
      if (selectedFiles.length === 1 && uploadTitle.trim()) {
        formData.append('title', uploadTitle.trim());
      } else if (selectedFiles.length > 1 && uploadTitle.trim()) {
        formData.append('title', `${uploadTitle.trim()} (${i + 1})`);
      }

      if (uploadDesc.trim()) formData.append('description', uploadDesc.trim());
      if (uploadCatId) formData.append('categoryId', uploadCatId);

      try {
        const res = await fetch('/api/admin/images', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.success) {
          successCount++;
        } else {
          errors.push(`${file.name}: ${data.error || 'Lỗi tải ảnh'}`);
        }
      } catch (err: any) {
        errors.push(`${file.name}: Lỗi kết nối`);
      }
    }

    setIsUploading(false);
    setUploadProgress(null);

    if (successCount > 0) {
      setUploadMessage({
        type: 'success',
        text: `Đã tải lên thành công ${successCount}/${selectedFiles.length} bức ảnh vào thư viện!`,
      });
      setSelectedFiles([]);
      setUploadTitle('');
      setUploadDesc('');
      loadImages();
      setTimeout(() => {
        setUploadModalOpen(false);
        setUploadMessage(null);
      }, 2500);
    } else {
      setUploadMessage({
        type: 'error',
        text: errors.length > 0 ? errors.slice(0, 3).join(', ') : 'Tất cả các ảnh tải lên đều thất bại',
      });
    }
  };

  // Open edit modal
  const handleOpenEdit = (image: ImageItem) => {
    setEditingImage(image);
    setEditTitle(image.title);
    setEditDesc(image.description || '');
    setEditCatId(image.categoryId || '');
  };

  // Save edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingImage) return;

    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/images/${editingImage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDesc,
          categoryId: editCatId || null,
        }),
      });

      if (res.ok) {
        setEditingImage(null);
        loadImages();
      } else {
        const data = await res.json();
        alert(data.error || 'Cập nhật thất bại');
      }
    } catch (err) {
      alert('Lỗi cập nhật ảnh');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete image
  const handleConfirmDelete = async () => {
    if (!deletingImage) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/images/${deletingImage.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDeletingImage(null);
        loadImages();
      } else {
        const data = await res.json();
        alert(data.error || 'Xóa ảnh thất bại');
      }
    } catch (err) {
      alert('Lỗi kết nối khi xóa ảnh');
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
            Quản lý thư viện ảnh
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tổng số {totalCount} hình ảnh được lưu trữ trực tiếp trên ổ D
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedFiles([]);
            setUploadTitle('');
            setUploadDesc('');
            setUploadMessage(null);
            setUploadModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all hover:scale-105"
        >
          <Upload className="w-4 h-4" />
          <span>Tải ảnh mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mô tả..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
          >
            <option value="all">Tất cả danh mục</option>
            <option value="unassigned">Chưa phân loại</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Photos Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all"
            >
              {/* Image Thumbnail */}
              <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <img
                  src={image.thumbDataUrl || `/api/images/${image.filename}?thumb=1`}
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {image.category && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 backdrop-blur-md text-emerald-400">
                    {image.category.name}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {image.title}
                  </h4>
                  {image.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {image.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{(image.size / (1024 * 1024)).toFixed(2)} MB</span>
                  <span>{new Date(image.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="px-3.5 pb-3.5 pt-0 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(image)}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Chỉnh sửa thông tin ảnh"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeletingImage(image)}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Xóa ảnh và tệp khỏi ổ D"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <ImageIcon className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Không tìm thấy ảnh</h3>
          <p className="text-xs text-slate-500 mt-1">
            Không có ảnh nào khớp với điều kiện lọc hiện tại.
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold px-4 text-slate-600 dark:text-slate-400">
            Trang {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-500" />
                <span>Tải ảnh lên máy chủ</span>
              </h3>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                  uploadMessage.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200'
                }`}
              >
                {uploadMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>{uploadMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Drag & Drop Area */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-950"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <ImageIcon className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Kéo thả ảnh vào đây hoặc nhấp để chọn tệp
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                  ✨ Hỗ trợ tải lên KHÔNG GIỚI HẠN số lượng ảnh (chọn hàng trăm ảnh cùng lúc)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Hỗ trợ mọi định dạng ảnh (JPEG, PNG, WebP, GIF, HEIC từ iPhone, tối đa 100MB/ảnh)
                </p>

                <div className="mt-3">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Chọn ảnh từ thiết bị</span>
                  </span>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                    <span>Đã chọn {selectedFiles.length} bức ảnh</span>
                    {!isUploading && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFiles([]);
                        }}
                        className="text-rose-500 hover:text-rose-700 font-bold text-xs underline"
                      >
                        Bỏ chọn
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Real-time upload progress bar */}
              {uploadProgress && (
                <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 space-y-2 animate-fade-in shadow-inner">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-200">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>Đang tải lên: {uploadProgress.current} / {uploadProgress.total} ảnh</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 text-[11px]">
                      {uploadProgress.percent}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300 shadow-sm"
                      style={{ width: `${uploadProgress.percent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                    Đang xử lý: {uploadProgress.currentFileName}
                  </p>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Tên / Tiêu đề ảnh (Áp dụng khi tải 1 ảnh hoặc làm tiền tố)
                </label>
                <input
                  type="text"
                  placeholder="Để trống sẽ tự động lấy theo tên tệp gốc"
                  value={uploadTitle}
                  disabled={isUploading}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Danh mục phân loại
                </label>
                <select
                  value={uploadCatId}
                  disabled={isUploading}
                  onChange={(e) => setUploadCatId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 disabled:opacity-50"
                >
                  <option value="">Chưa phân loại</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  rows={3}
                  placeholder="Nhập mô tả chung cho các bức ảnh..."
                  value={uploadDesc}
                  disabled={isUploading}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                >
                  Hủy
                </button>
                {selectedFiles.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Chọn ảnh để tải lên</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>
                          {uploadProgress
                            ? `Đang tải ${uploadProgress.current}/${uploadProgress.total} (${uploadProgress.percent}%)`
                            : 'Đang lưu ảnh...'}
                        </span>
                      </>
                    ) : (
                      <span>Tải lên {selectedFiles.length} ảnh</span>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Sửa thông tin ảnh
              </h3>
              <button
                onClick={() => setEditingImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Tên ảnh
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Danh mục
                </label>
                <select
                  value={editCatId}
                  onChange={(e) => setEditCatId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="">Chưa phân loại</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Mô tả
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingImage(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs disabled:opacity-50"
                >
                  {isSavingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Xác nhận xóa bức ảnh này?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bức ảnh "{deletingImage.title}" và các tệp gốc/thumbnail tương ứng trên ổ D sẽ bị xóa vĩnh viễn.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingImage(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs disabled:opacity-50"
              >
                {isDeleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
