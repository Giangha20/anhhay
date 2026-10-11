import React from 'react';

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
              {footerText || `© ${currentYear} PhotoWeb Gallery. Bộ sưu tập ảnh nghệ thuật trực tuyến.`}
            </p>
            {contactInfo && (
              <p className="text-xs text-slate-500 dark:text-slate-500">{contactInfo}</p>
            )}
          </div>

          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Chào mừng bạn đến với không gian thưởng thức ảnh nghệ thuật</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
