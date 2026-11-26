# المرحلة 1: تجهيز Capacitor وبناء مجلد الأندرويد

تمت تهيئة ملفات المشروع (`package.json` و`capacitor.config.ts` و`next.config.mjs` و`tsconfig.json` و`.gitignore`) لتكون جاهزة لتوليد مشروع أندرويد الأصلي عبر **Capacitor 6**.

## المتطلبات المسبقة على جهازك
- **Node.js 18 أو 20** (مع `npm`)
- **JDK 17** (للخطوات اللاحقة عند بناء Gradle)

## خطوات تنفيذ المرحلة 1 محلياً

نفّذ الأوامر التالية داخل مجلد `pdf-studio`:

```bash
# 1. تثبيت جميع الحزم (بما فيها حزم Capacitor وإضافات أندرويد)
npm install

# 2. بناء النسخة الثابتة في out/ وتوليد مجلد android/ الأصلي لأول مرة
npm run android:init

# 3. التحقق من جاهزية بيئة Capacitor والأندرويد
npm run android:doctor
```

## أوامر المزامنة اللاحقة (بعد أي تعديل في الكود)

```bash
# إعادة بناء مجلد out/ ومزامنته مع مشروع android/
npm run android:sync

# فتح مشروع android/ داخل Android Studio
npm run android:open
```

## ما الذي تحقق بنهاية المرحلة 1؟
- وجود مجلد `out/` يحتوي على ملفات Next.js الثابتة.
- وجود مجلد `android/` كامل وقابل للفتح في Android Studio أو البناء عبر Gradle.
- ربط Capacitor تلقائياً بإضافات النظام (`filesystem`, `share`, `app`, `status-bar`) استعداداً للمرحلة 2.
