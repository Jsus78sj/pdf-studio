import { isMobileRuntime } from '@/core/native/androidBridge';

/** الحدود الافتراضية لمتصفح الحاسوب */
export const PDF_LIMITS = {
  MAX_FILE_SIZE_BYTES: 100 * 1024 * 1024, // 100 ميجابايت لكل ملف PDF
  MAX_TOTAL_MEMORY_BYTES: 250 * 1024 * 1024, // 250 ميجابايت إجمالي لملفات المشروع
  MEMORY_WARNING_RATIO: 0.65, // تنبيه عند استهلاك 65% من الذاكرة المخصصة
  MAX_IMAGE_SIZE_BYTES: 10 * 1024 * 1024, // 10 ميجابايت للصورة الواحدة
  MAX_TOTAL_PAGES: 300, // الحد الأقصى لمجموع الصفحات في المشروع
  PDF_MAGIC_HEADER: '%PDF-',
  MAX_HISTORY_STEPS: 60,
  MAX_THUMBNAIL_CACHE_ENTRIES: 80, // حد ذاكرة الكاش للمصغرات (LRU)
  MAX_CONCURRENT_THUMBNAIL_RENDERS: 3, // أقصى عدد عمليات رسم متزامنة
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 2.25,
  DEFAULT_ZOOM: 1,
} as const;

/** حدود متحفظة مخصصة لهواتف أندرويد لمنع امتلاء الذاكرة (OOM) داخل WebView */
export const MOBILE_PDF_LIMITS = {
  ...PDF_LIMITS,
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024, // 50 ميجابايت لكل ملف على الهاتف
  MAX_TOTAL_MEMORY_BYTES: 100 * 1024 * 1024, // 100 ميجابايت إجمالي على الهاتف
  MAX_TOTAL_PAGES: 150, // 150 صفحة كحد آمن على الهاتف
  MAX_HISTORY_STEPS: 30,
  MAX_THUMBNAIL_CACHE_ENTRIES: 30, // تقليل كاش المصغرات لحماية الذاكرة
  MAX_CONCURRENT_THUMBNAIL_RENDERS: 2, // رسم مصغرتين بالتوازي كحد أقصى
} as const;

export interface RuntimePdfLimits {
  readonly MAX_FILE_SIZE_BYTES: number;
  readonly MAX_TOTAL_MEMORY_BYTES: number;
  readonly MEMORY_WARNING_RATIO: number;
  readonly MAX_IMAGE_SIZE_BYTES: number;
  readonly MAX_TOTAL_PAGES: number;
  readonly PDF_MAGIC_HEADER: string;
  readonly MAX_HISTORY_STEPS: number;
  readonly MAX_THUMBNAIL_CACHE_ENTRIES: number;
  readonly MAX_CONCURRENT_THUMBNAIL_RENDERS: number;
  readonly MIN_ZOOM: number;
  readonly MAX_ZOOM: number;
  readonly DEFAULT_ZOOM: number;
  readonly isMobileProfile: boolean;
}

/**
 * إرجاع حدود الذاكرة والأداء المناسبة تلقائياً لبيئة التشغيل الحالية (أندرويد/هاتف مقابل حاسوب)
 */
export function getRuntimePdfLimits(forceMobile?: boolean): RuntimePdfLimits {
  const mobile = forceMobile ?? isMobileRuntime();
  return {
    ...(mobile ? MOBILE_PDF_LIMITS : PDF_LIMITS),
    isMobileProfile: mobile,
  };
}

export const FILE_COLOR_TAGS = [
  '#2563eb', // أزرق
  '#059669', // زمردي
  '#d97706', // كهرماني
  '#7c3aed', // بنفسجي
  '#e11d48', // وردي داكن
  '#0891b2', // سماوي داكن
  '#4f46e5', // نيلي
  '#ca8a04', // ذهبي
] as const;

export const TEXT_COLOR_PRESETS = [
  '#0f172a',
  '#1d4ed8',
  '#dc2626',
  '#047857',
  '#7c3aed',
  '#b45309',
] as const;
