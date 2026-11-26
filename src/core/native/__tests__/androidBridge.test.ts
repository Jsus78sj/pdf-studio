import { describe, expect, it } from 'vitest';
import {
  base64ToUint8Array,
  createFileFromIncomingPayload,
  isNativeAndroid,
  isNativePlatform,
  sanitizeExportFilename,
  uint8ArrayToBase64,
} from '../androidBridge';
import { getRuntimePdfLimits, MOBILE_PDF_LIMITS, PDF_LIMITS } from '@/core/pdf/limits';

describe('Android Phase 2 & 3 Bridge, Incoming Intents & Mobile Limits', () => {
  it('يحوّل مصفوفات البايت الصغيرة والكبيرة (أكثر من 32KB) إلى Base64 ويعيدها بدقة مطابقة', () => {
    expect(uint8ArrayToBase64(new Uint8Array([]))).toBe('');
    expect(base64ToUint8Array('').byteLength).toBe(0);

    const small = new TextEncoder().encode('%PDF-1.7 مرحبا 2026');
    const encodedSmall = uint8ArrayToBase64(small);
    expect(encodedSmall).toBe(Buffer.from(small).toString('base64'));
    expect(Array.from(base64ToUint8Array(encodedSmall))).toEqual(Array.from(small));

    const large = new Uint8Array(100_000);
    for (let i = 0; i < large.length; i++) {
      large[i] = i % 256;
    }
    const encodedLarge = uint8ArrayToBase64(large);
    expect(encodedLarge).toBe(Buffer.from(large).toString('base64'));
    expect(base64ToUint8Array(encodedLarge).byteLength).toBe(100_000);
  });

  it('يحوّل حمولة ملف PDF القادم من Android Intent (Open With / Share) إلى كائن File سليم', async () => {
    const sampleBytes = new TextEncoder().encode('%PDF-1.7\n%sample');
    const file = createFileFromIncomingPayload({
      name: 'عقد:2026/نسخة',
      base64: uint8ArrayToBase64(sampleBytes),
    });

    expect(file.name).toBe('عقد_2026_نسخة.pdf');
    expect(file.type).toBe('application/pdf');
    expect(file.size).toBe(sampleBytes.byteLength);
    const readBack = new Uint8Array(await file.arrayBuffer());
    expect(Array.from(readBack)).toEqual(Array.from(sampleBytes));
  });

  it('ينظّف اسم الملف المصدّر ليكون آمناً على نظام ملفات أندرويد', () => {
    expect(sanitizeExportFilename('تقرير 2026')).toBe('تقرير 2026.pdf');
    expect(sanitizeExportFilename('  invoice:01/2026*.PDF  ')).toBe('invoice_01_2026_.PDF');
    expect(sanitizeExportFilename('')).toBe('merged-document.pdf');
  });

  it('يطبق حدوداً متحفظة للذاكرة وكاش المصغرات على ملف تعريف الهاتف/أندرويد', () => {
    const desktop = getRuntimePdfLimits(false);
    const mobile = getRuntimePdfLimits(true);

    expect(desktop.isMobileProfile).toBe(false);
    expect(desktop.MAX_TOTAL_MEMORY_BYTES).toBe(PDF_LIMITS.MAX_TOTAL_MEMORY_BYTES);
    expect(desktop.MAX_THUMBNAIL_CACHE_ENTRIES).toBe(80);

    expect(mobile.isMobileProfile).toBe(true);
    expect(mobile.MAX_TOTAL_MEMORY_BYTES).toBe(MOBILE_PDF_LIMITS.MAX_TOTAL_MEMORY_BYTES);
    expect(mobile.MAX_TOTAL_MEMORY_BYTES).toBeLessThan(desktop.MAX_TOTAL_MEMORY_BYTES);
    expect(mobile.MAX_THUMBNAIL_CACHE_ENTRIES).toBe(30);
    expect(mobile.MAX_CONCURRENT_THUMBNAIL_RENDERS).toBe(2);
  });

  it('يعيد false لبيئة Capacitor الأصلية أثناء اختبارات Node', () => {
    expect(isNativePlatform()).toBe(false);
    expect(isNativeAndroid()).toBe(false);
  });
});
