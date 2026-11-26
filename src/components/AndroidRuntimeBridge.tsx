'use client';

import { useEffect, useRef } from 'react';
import { usePdfStore } from '@/store/usePdfStore';
import {
  configureAndroidStatusBar,
  exitAndroidApp,
  registerAndroidBackButton,
  registerAndroidIncomingPdfListener,
} from '@/core/native/androidBridge';

/**
 * مكوّن صامت يربط دورة حياة تطبيق أندرويد (Status Bar + زر الرجوع الفيزيائي +
 * استقبال ملفات PDF من خيار «فتح بواسطة / مشاركة») بحالة التطبيق.
 */
export function AndroidRuntimeBridge() {
  const lastBackPressRef = useRef<number>(0);

  useEffect(() => {
    let unregisterBack: (() => void) | null = null;
    let mounted = true;

    void configureAndroidStatusBar();

    // استقبال ملفات PDF الواردة من واتساب أو مدير الملفات عبر Intent
    const unregisterIncoming = registerAndroidIncomingPdfListener((incomingFiles) => {
      const store = usePdfStore.getState();
      void store.addFiles(incomingFiles);
    });

    void registerAndroidBackButton(() => {
      const state = usePdfStore.getState();

      // 1. إغلاق النوافذ المنبثقة المفتوحة أولاً
      if (state.signatureModalOpen) {
        state.setSignatureModalOpen(false);
        return;
      }

      if (state.infoModalOpen) {
        state.setInfoModalOpen(false);
        return;
      }

      // 2. إذا كان هناك تصدير جارٍ -> إلغاؤه
      if (state.isExporting) {
        state.cancelExport();
        return;
      }

      // 3. في وضع المحرر: إلغاء تحديد العنصر أولاً، ثم العودة لوضع الدمج والصفحات
      if (state.mode === 'editor') {
        if (state.selectedAnnotationId) {
          state.selectAnnotation(null);
          return;
        }
        state.setMode('organize');
        return;
      }

      // 4. في الشاشة الرئيسية مع وجود ملفات: طلب ضغطة ثانية خلال 2.5 ثانية لتجنب الخروج العرضي
      if (state.fileOrder.length > 0) {
        const now = Date.now();
        if (now - lastBackPressRef.current < 2500) {
          void exitAndroidApp();
        } else {
          lastBackPressRef.current = now;
          state.setStatusMessage('اضغط زر الرجوع مرة أخرى للخروج من التطبيق.');
        }
        return;
      }

      // 5. خروج نظيف إذا لم تكن هناك ملفات مفتوحة
      void exitAndroidApp();
    }).then((cleanup) => {
      if (mounted) {
        unregisterBack = cleanup;
      } else {
        cleanup();
      }
    });

    return () => {
      mounted = false;
      unregisterIncoming();
      unregisterBack?.();
    };
  }, []);

  return null;
}
