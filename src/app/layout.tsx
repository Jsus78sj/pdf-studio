import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'محرر PDF المحلي — دمج وتعديل بخصوصية كاملة',
  description:
    'تطبيق ويب وأندرويد محلي لدمج وتعديل ملفات PDF دون إنترنت وبخصوصية كاملة مع دعم العربية والتوقيع والصور.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="overflow-x-hidden bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
