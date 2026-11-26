# المرحلة 3: الهوية البصرية وإعدادات AndroidManifest ودعم «فتح بواسطة»

اكتملت كافة أصول الهوية البصرية وقوالب وإعدادات النظام الأصلية لأندرويد مع سكربت تهيئة آلي:

## ما تم تجهيزه
1. **أصول الهوية البصرية (`assets/` و`public/icons/`):**
   - `assets/icon-only.png` (`1024×1024`): أيقونة التطبيق الأساسية.
   - `assets/icon-foreground.png` + `assets/icon-background.png` (`1024×1024`): أصول الأيقونة المتكيفة (Android Adaptive Icon) وفق المنطقة الآمنة.
   - `assets/splash.png` + `assets/splash-dark.png` (`2732×2732`): شاشة بداية للوضعين الفاتح والداكن.
   - `public/icons/icon-192.png` + `icon-512.png` وربطها في `public/manifest.json`.
2. **قوالب أندرويد وسكربت التطبيق الآلي (`android-templates/` و`scripts/configure-android-phase3.mjs`):**
   - `AndroidManifest.xml`: تفعيل `android:supportsRtl="true"` و`android:allowBackup="false"` و`android:usesCleartextTraffic="false"`، وتكوين `FileProvider` آمن لمشاركة ملفات PDF على Android 11–15، مع إضافة `intent-filter` لـ `ACTION_VIEW` و`ACTION_SEND` و`ACTION_SEND_MULTIPLE`.
   - `res/xml/file_paths.xml`: تعريف مسارات `exports/` والكاش للمشاركة بدون أذونات تخزين خطيرة.
   - `res/values/strings.xml` و`res/values-ar/strings.xml`: تعريب اسم التطبيق (`محرر PDF المحلي`).
   - `MainActivity.java` + `androidBridge.ts`: استقبال ملفات PDF القادمة من واتساب ومدير الملفات عبر «فتح بواسطة / مشاركة» وتحميلها مباشرة داخل مساحة العمل.

## أوامر التنفيذ المحلية للمرحلة 3

```bash
# 1. تثبيت الاعتماديات المحدثة (تشمل @capacitor/splash-screen)
npm install

# 2. إذا لم تُنشئ مجلد android/ بعد، نفّذ مرة واحدة:
npm run android:init

# 3. بناء الواجهة + مزامنة Capacitor + تطبيق AndroidManifest/FileProvider/MainActivity + توليد جميع مقاسات الأيقونات وشاشة البداية:
npm run android:prepare
```

بعد نجاح `npm run android:prepare` تكون المرحلة 3 مكتملة بالكامل، ويبقى فقط **المرحلة 4** (بناء وتوقيع ملف `APK` محلياً أو تلقائياً عبر GitHub Actions).
