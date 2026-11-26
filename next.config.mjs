/** @type {import('next').NextConfig} */
const nextConfig = {
  // التصدير الثابت إلى مجلد out/ المطلوب لـ Capacitor (webDir) وللنشر الثابت
  output: 'export',
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // منع أخطاء حزمة canvas الاختيارية عند استخدام pdfjs-dist في المتصفح وWebView
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
