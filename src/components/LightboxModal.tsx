'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Calendar,
  Layers,
  FileText,
  AlertCircle,
} from 'lucide-react';

export interface LightboxImage {
  id: string;
  title: string;
  description?: string | null;
  filename: string;
  format?: string;
  width?: number | null;
  height?: number | null;
  size?: number;
  thumbDataUrl?: string | null;
  dataUrl?: string | null;
  createdAt?: string | Date;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface LightboxModalProps {
  images: LightboxImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

export function LightboxModal({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: LightboxModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const currentImage = images[currentIndex];

  // Reset zoom & error state on index change
  useEffect(() => {
    setIsZoomed(false);
    setLoadError(false);
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) onNavigate(currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < images.length - 1) onNavigate(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Lock body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, currentIndex, images.length, onClose, onNavigate]);

  if (!isOpen || !currentImage) return null;

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    // Minimum swipe threshold
    if (diff > 50 && currentIndex < images.length - 1) {
      onNavigate(currentIndex + 1); // Swipe left -> Next image
    } else if (diff < -50 && currentIndex > 0) {
      onNavigate(currentIndex - 1); // Swipe right -> Prev image
    }
    setTouchStartX(null);
  };

  const imageUrl = currentImage.dataUrl || `/api/images/${currentImage.filename}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      {/* Top toolbar */}
      <div
        className="absolute top-0 inset-x-0 h-16 px-4 flex items-center justify-between text-white bg-gradient-to-b from-black/80 to-transparent z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-300">
            {currentIndex + 1} / {images.length}
          </span>
          <h3 className="text-sm md:text-base font-semibold text-white truncate max-w-xs md:max-w-md">
            {currentImage.title}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title={isZoomed ? 'Thu nhỏ' : 'Phóng to'}
          >
            {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>
          <a
            href={imageUrl}
            download={currentImage.filename}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="Tải ảnh gốc về máy"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 text-slate-300 hover:text-white transition-colors ml-2"
            title="Đóng (Escape)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="relative w-full h-full flex items-center justify-center p-4 md:p-12"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {loadError ? (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-900/80 rounded-2xl border border-slate-800 text-slate-300 max-w-md">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
            <h4 className="text-lg font-bold text-white mb-1">Không thể tải ảnh</h4>
            <p className="text-sm text-slate-400">
              Tệp ảnh không tồn tại trên ổ D hoặc đã bị xóa khỏi hệ thống lưu trữ.
            </p>
          </div>
        ) : (
          <div
            className={`relative transition-transform duration-200 ease-out flex items-center justify-center ${
              isZoomed ? 'cursor-zoom-out scale-125 md:scale-150' : 'cursor-zoom-in max-h-[82vh] max-w-[90vw]'
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt={currentImage.title}
              onError={() => setLoadError(true)}
              className="max-h-[80vh] max-w-[88vw] object-contain rounded-lg shadow-2xl transition-all"
            />
          </div>
        )}

        {/* Prev Button */}
        {currentIndex > 0 && (
          <button
            onClick={() => onNavigate(currentIndex - 1)}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm transition-all hover:scale-110"
            title="Ảnh trước (Mũi tên trái)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Button */}
        {currentIndex < images.length - 1 && (
          <button
            onClick={() => onNavigate(currentIndex + 1)}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm transition-all hover:scale-110"
            title="Ảnh tiếp theo (Mũi tên phải)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Info Bar */}
      <div
        className="absolute bottom-0 inset-x-0 px-6 py-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs md:text-sm text-slate-300">
          <div>
            <h4 className="text-base md:text-lg font-bold text-white mb-0.5">
              {currentImage.title}
            </h4>
            {currentImage.description && (
              <p className="text-slate-300 line-clamp-2">{currentImage.description}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {currentImage.category && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Layers className="w-3.5 h-3.5" />
                <span>{currentImage.category.name}</span>
              </span>
            )}
            {currentImage.width && currentImage.height && (
              <span className="flex items-center gap-1 text-slate-400">
                <FileText className="w-3.5 h-3.5" />
                <span>
                  {currentImage.width} × {currentImage.height} px
                </span>
              </span>
            )}
            {currentImage.createdAt && (
              <span className="flex items-center gap-1 text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(currentImage.createdAt).toLocaleDateString('vi-VN')}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
