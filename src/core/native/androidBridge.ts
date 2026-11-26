import { Capacitor } from '@capacitor/core';

export interface NativePdfSaveResult {
  fileName: string;
  cacheUri: string;
  savedToDocuments: boolean;
  shared: boolean;
}

/** التحقق هل التطبيق يعمل داخل غلاف Capacitor الأصلي (APK / iOS) */
export function isNativePlatform(): boolean {
  try {
    return typeof window !== 'undefined' && Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/** التحقق هل المنصة الحالية هي أندرويد أصلي */
export function isNativeAndroid(): boolean {
  try {
    return isNativePlatform() && Capacitor.getPlatform() === 'android';
  } catch {
    return false;
  }
}

/** التحقق هل الجهاز هاتف محمول (سواء عبر APK أو متصفح الهاتف) */
export function isMobileRuntime(): boolean {
  if (isNativePlatform()) return true;
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

/** تنظيف اسم الملف الناتج ليكون آمناً على نظام ملفات أندرويد والويب */
export function sanitizeExportFilename(filename = 'merged-document.pdf'): string {
  const cleaned = filename
    .trim()
    .replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_')
    .replace(/\s+/g, ' ');

  const base = cleaned || 'merged-document';
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
}

/**
 * تحويل Uint8Array إلى Base64 على دفعات (32KB) لتفادي خطأ تجاوز مكدس الاستدعاءات
 * مع الملفات الكبيرة على Android WebView.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (bytes.byteLength === 0) return '';

  if (typeof Buffer !== 'undefined' && typeof btoa !== 'function') {
    return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');
  }

  const chunkSize = 0x8000; // 32KB
  const chunks: string[] = [];

  for (let offset = 0; offset < bytes.byteLength; offset += chunkSize) {
    const slice = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.byteLength));
    let binary = '';
    for (let i = 0; i < slice.length; i++) {
      binary += String.fromCharCode(slice[i]);
    }
    chunks.push(binary);
  }

  return btoa(chunks.join(''));
}

/**
 * حفظ ملف PDF الناتج على نظام ملفات أندرويد ثم فتح نافذة المشاركة/الفتح الأصلية
 * حتى يتمكن المستخدم من فتحه في أي قارئ PDF أو حفظه أو مشاركته عبر واتساب والبريد.
 */
export async function saveAndSharePdfOnAndroid(
  bytes: Uint8Array,
  filename = 'merged-document.pdf'
): Promise<NativePdfSaveResult> {
  const safeName = sanitizeExportFilename(filename);
  const base64Data = uint8ArrayToBase64(bytes);

  const [{ Filesystem, Directory }, { Share }] = await Promise.all([
    import('@capacitor/filesystem'),
    import('@capacitor/share'),
  ]);

  // 1. الحفظ في مجلد الكاش الآمن للمشاركة الفورية عبر FileProvider (يعمل على Android 10–15 بلا أذونات خطيرة)
  const cachePath = `exports/${safeName}`;
  const writtenCache = await Filesystem.writeFile({
    path: cachePath,
    data: base64Data,
    directory: Directory.Cache,
    recursive: true,
  });

  let cacheUri = writtenCache.uri;
  if (!cacheUri) {
    const uriRes = await Filesystem.getUri({
      path: cachePath,
      directory: Directory.Cache,
    });
    cacheUri = uriRes.uri;
  }

  // 2. محاولة حفظ نسخة دائمة داخل Documents/PDFStudio (اختيارية دون تعطيل المشاركة لو رفضها النظام)
  let savedToDocuments = false;
  try {
    await Filesystem.writeFile({
      path: `PDFStudio/${safeName}`,
      data: base64Data,
      directory: Directory.Documents,
      recursive: true,
    });
    savedToDocuments = true;
  } catch {
    savedToDocuments = false;
  }

  // 3. فتح نافذة المشاركة/الفتح الأصلية في أندرويد
  let shared = false;
  try {
    const canShareRes = await Share.canShare();
    if (canShareRes.value) {
      await Share.share({
        title: safeName,
        text: `تم إنشاء ملف PDF محلياً: ${safeName}`,
        files: [cacheUri],
        dialogTitle: 'حفظ أو مشاركة ملف PDF',
      });
      shared = true;
    }
  } catch (err) {
    // تجاهل إغلاق المستخدم لنافذة المشاركة يدوياً
    const msg = err instanceof Error ? err.message.toLowerCase() : '';
    if (!msg.includes('cancel') && !msg.includes('dismiss')) {
      // محاولة بديلة باستخدام حقل url للأجهزة الأقدم
      try {
        await Share.share({
          title: safeName,
          url: cacheUri,
          dialogTitle: 'حفظ أو مشاركة ملف PDF',
        });
        shared = true;
      } catch {
        shared = false;
      }
    }
  }

  return {
    fileName: safeName,
    cacheUri,
    savedToDocuments,
    shared,
  };
}

/**
 * تهيئة شريط الحالة (Status Bar) في أندرويد ليتناسق مع التصميم الفاتح للتطبيق
 */
export async function configureAndroidStatusBar(): Promise<void> {
  if (!isNativeAndroid()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setBackgroundColor({ color: '#ffffff' });
    await StatusBar.setStyle({ style: Style.Light });
  } catch {
    // تجاهل في حال عدم توفر الإضافة
  }
}

/**
 * تسجيل مستمع لزر الرجوع الفيزيائي في أندرويد
 * يعيد دالة تنظيف لإزالة المستمع عند تفكيك المكوّن.
 */
export async function registerAndroidBackButton(
  onBackPress: () => void
): Promise<() => void> {
  if (!isNativeAndroid()) {
    return () => {};
  }

  try {
    const { App } = await import('@capacitor/app');
    const listener = await App.addListener('backButton', () => {
      onBackPress();
    });
    return () => {
      void listener.remove();
    };
  } catch {
    return () => {};
  }
}

/** إغلاق تطبيق أندرويد بشكل نظيف */
export async function exitAndroidApp(): Promise<void> {
  if (!isNativeAndroid()) return;
  try {
    const { App } = await import('@capacitor/app');
    await App.exitApp();
  } catch {
    // تجاهل
  }
}

export interface IncomingAndroidPdfPayload {
  name: string;
  base64: string;
  sizeBytes?: number;
}

interface AndroidPdfIntentBridge {
  consumePendingPdfs?: () => string;
}

/** تحويل سلسلة Base64 إلى Uint8Array (تُستخدم لاستقبال ملفات PDF من Intent في أندرويد) */
export function base64ToUint8Array(base64: string): Uint8Array {
  if (!base64) return new Uint8Array(0);

  if (typeof atob === 'function') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  const buf = Buffer.from(base64, 'base64');
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

/** تحويل حمولة PDF واردة من Android Intent إلى كائن File قياسي */
export function createFileFromIncomingPayload(
  payload: IncomingAndroidPdfPayload
): File {
  const safeName = sanitizeExportFilename(payload.name || 'shared-document.pdf');
  const bytes = base64ToUint8Array(payload.base64);
  return new File([bytes.buffer as ArrayBuffer], safeName, {
    type: 'application/pdf',
  });
}

/** قراءة واستهلاك أي ملفات PDF أُرسلت للتطبيق عبر «فتح بواسطة / مشاركة» */
export function consumePendingAndroidPdfs(): File[] {
  if (typeof window === 'undefined') return [];

  const bridge = (window as unknown as { AndroidPdfIntent?: AndroidPdfIntentBridge })
    .AndroidPdfIntent;
  if (!bridge || typeof bridge.consumePendingPdfs !== 'function') {
    return [];
  }

  try {
    const rawJson = bridge.consumePendingPdfs();
    if (!rawJson) return [];
    const parsed = JSON.parse(rawJson) as IncomingAndroidPdfPayload[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.base64 === 'string' && item.base64.length > 0)
      .map(createFileFromIncomingPayload);
  } catch {
    return [];
  }
}

/**
 * الاشتراك في استقبال ملفات PDF القادمة من تطبيقات أندرويد (واتساب / مدير الملفات)
 * سواء عند فتح التطبيق لأول مرة (Cold Start) أو وهو يعمل بالخلفية (onNewIntent).
 */
export function registerAndroidIncomingPdfListener(
  onFilesReceived: (files: File[]) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const flushPending = () => {
    const files = consumePendingAndroidPdfs();
    if (files.length > 0) {
      onFilesReceived(files);
    }
  };

  // قراءة الملفات المعلّقة عند تشغيل التطبيق مباشرة عبر «فتح بواسطة»
  flushPending();

  const handleEvent = () => flushPending();
  window.addEventListener('android-incoming-pdf', handleEvent);

  return () => {
    window.removeEventListener('android-incoming-pdf', handleEvent);
  };
}
