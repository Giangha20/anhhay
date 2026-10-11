import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { getSiteSettings } from '@/lib/settings';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: {
      template: `%s | ${settings.siteName}`,
      default: settings.seoTitle || settings.siteName,
    },
    description: settings.seoDescription,
    icons: settings.logoUrl ? [{ url: settings.logoUrl }] : undefined,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();

  return (
    <html lang="vi" suppressHydrationWarning className={settings.defaultTheme === 'dark' ? 'dark' : ''}>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --brand-primary: ${settings.primaryColor || '#10b981'};
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <ThemeProvider defaultTheme={settings.defaultTheme}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
