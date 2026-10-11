import React from 'react';
import Link from 'next/link';
import { Shield, HardDrive, Heart } from 'lucide-react';

interface FooterProps {
  footerText?: string;
  contactInfo?: string | null;
}

export function Footer({ footerText, contactInfo }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {footerText || `© ${currentYear} PhotoWeb Gallery. Vận hành trên máy chủ Windows.`}
            </p>
            {contactInfo && (
              <p className="text-xs text-slate-500 dark:text-slate-500">{contactInfo}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
              <span>D:\PhotoWeb Storage</span>
            </span>

            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:text-emerald-500 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Quản trị hệ thống</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
