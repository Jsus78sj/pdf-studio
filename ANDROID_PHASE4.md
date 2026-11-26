# المرحلة 4: بناء ملف APK وتوقيعه واختباره على أندرويد

أصبح المشروع مكتملاً (المراحل 1 إلى 4) لبناء ملف **APK** جاهز للتثبيت على هواتف أندرويد عبر طريقتين: **البناء السحابي التلقائي بدون Android Studio** أو **البناء المحلي عبر Gradle**.

---

## الطريقة 1 (الأسهل — بدون تثبيت Android Studio أو SDK)
استخدم مسار **GitHub Actions** الجاهز في `.github/workflows/android-apk.yml`:

1. أنشئ مستودعاً على **GitHub** وارفع مجلد المشروع إليه (على فرع `main`).
2. افتح تبويب **Actions** في المستودع، واختر مسار **Build Android APK (Capacitor)**.
3. سيعمل البناء تلقائياً (أو اضغط **Run workflow** واختر `debug`).
4. بعد نحو 3–5 دقائق، نزّل ملف **`pdf-studio-debug-apk`** من قسم **Artifacts**، فك ضغطه، وانقل `pdf-studio-debug.apk` إلى هاتفك الأندرويد لتثبيته وتجربته مباشرة.

### لبناء نسخة إصدار نهائية موقّعة (`release-apk` أو `release-aab`) عبر GitHub Actions:
أضف الأسرار الأربعة التالية في إعدادات المستودع (`Settings → Secrets and variables → Actions`):
- `ANDROID_KEYSTORE_BASE64`: محتوى ملف `.jks` محوّلاً إلى Base64 (`base64 -w 0 android/release-keystore.jks`).
- `ANDROID_KEYSTORE_PASSWORD`: كلمة مرور مخزن المفاتيح.
- `ANDROID_KEY_ALIAS`: اسم المفتاح (مثلاً `pdfstudio-release`).
- `ANDROID_KEY_PASSWORD`: كلمة مرور المفتاح.

ثم شغّل **Run workflow** واختر `release-apk` أو `release-aab` (لرفع التطبيق على Google Play).

---

## الطريقة 2 (البناء المحلي على جهازك عبر Gradle / Android Studio)

المتطلبات: **Node.js 20** + **JDK 17** + **Android SDK** (مع ضبط `ANDROID_HOME`).

```bash
# 1. تثبيت الاعتماديات
npm install

# 2. بناء نسخة اختبار سريعة (تُحفظ تلقائياً في dist-apk/pdf-studio-debug.apk مع بصمة SHA-256)
npm run android:apk:debug
```

### لبناء نسخة إصدار موقّعة محلياً (`app-release.apk` أو `app-release.aab`):

```bash
# 1. توليد مفتاح التوقيع الرقمي وإعداد android/keystore.properties تلقائياً (مرة واحدة فقط)
npm run android:keystore

# 2. بناء APK نهائي موقّع (يُحفظ في dist-apk/pdf-studio-release.apk)
npm run android:apk:release

# 3. أو بناء حزمة Google Play الموقّعة (تُحفظ في dist-apk/pdf-studio-release.aab)
npm run android:aab:release
```

---

## قائمة التحقق قبل التوزيع على هاتف حقيقي

- [ ] **العمل بدون إنترنت (وضع الطيران):** فعّل وضع الطيران على الهاتف، افتح التطبيق، وتأكد من تحميل الواجهة والخطوط العربية ودمج وتصدير ملف PDF بنجاح.
- [ ] **التصدير والمشاركة:** صدّر ملفاً يحتوي على نص عربي متجه + توقيع، وتأكد من ظهور نافذة المشاركة الأصلية وحفظ نسخة في `Documents/PDFStudio`.
- [ ] **«فتح بواسطة / Open With»:** افتح ملف PDF من واتساب أو مدير الملفات واختر «محرر PDF المحلي» وتأكد من تحميله فوراً داخل التطبيق.
- [ ] **زر الرجوع الفيزيائي:** جرّب الرجوع من لوحة التوقيع ← المحرر ← الدمج ← تأكيد الخروج بضغطتين.
- [ ] **الملفات التالفة والكبيرة:** جرّب رفع ملف تالف وملف بحجم ~20MB للتحقق من استقرار الذاكرة.
