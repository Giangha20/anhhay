'use client';

import React, { useState } from 'react';
import { LightboxImage } from './LightboxModal';
import { Maximize2, Layers } from 'lucide-react';

interface PhotoCardProps {
  image: LightboxImage;
  onClick: () => void;
  cardSize?: 'small' | 'medium' | 'large';
}

export function PhotoCard({ image, onClick, cardSize = 'medium' }: PhotoCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const thumbUrl = image.thumbDataUrl || `/api/images/${image.filename}?thumb=1`;

  const sizeClasses = {
    small: 'h-48 sm:h-56',
    medium: 'h-64 sm:h-72',
    large: 'h-80 sm:h-96',
  }[cardSize];

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 ${sizeClasses}`}
    >
      {/* Loading Skeleton */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse" />
      )}

      {/* Error state */}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center bg-slate-100 dark:bg-slate-900 text-slate-400 text-xs">
          Ảnh không khả dụng
        </div>
      ) : (
        <img
          src={thumbUrl}
          alt={image.title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-white">
        <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          {image.category && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 mb-1.5 text-xs font-medium rounded-full bg-emerald-500/80 backdrop-blur-sm text-white">
              <Layers className="w-3 h-3" />
              <span>{image.category.name}</span>
            </span>
          )}
          <h4 className="text-base font-bold text-white line-clamp-1">{image.title}</h4>
          {image.description && (
            <p className="text-xs text-slate-200 line-clamp-1 mt-0.5">{image.description}</p>
          )}
        </div>

        {/* View icon badge */}
        <div className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
