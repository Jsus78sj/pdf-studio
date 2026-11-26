import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const androidMain = path.join(root, 'android', 'app', 'src', 'main');
const templatesDir = path.join(root, 'android-templates');

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function copyTemplate(srcName, destRelative) {
  const srcPath = path.join(templatesDir, srcName);
  const destPath = path.join(androidMain, destRelative);
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.copyFile(srcPath, destPath);
  console.log(`✓ تم تحديث: android/app/src/main/${destRelative}`);
}

async function main() {
  if (!(await exists(androidMain))) {
    console.error(
      '✗ مجلد android/ غير موجود بعد. نفّذ أولاً: npm run android:init'
    );
    process.exit(1);
  }

  console.log('جارٍ تطبيق إعدادات المرحلة 3 على مشروع أندرويد...');

  // 1. AndroidManifest.xml (RTL + FileProvider + ACTION_VIEW / ACTION_SEND لملفات PDF)
  await copyTemplate('AndroidManifest.xml', 'AndroidManifest.xml');

  // 2. مسارات FileProvider لمشاركة الملفات بأمان على Android 11–15
  await copyTemplate('file_paths.xml', path.join('res', 'xml', 'file_paths.xml'));

  // 3. أسماء التطبيق الافتراضية والعربية
  await copyTemplate('strings.xml', path.join('res', 'values', 'strings.xml'));
  await copyTemplate('strings-ar.xml', path.join('res', 'values-ar', 'strings.xml'));

  // 4. MainActivity.java لاستقبال ملفات PDF من «فتح بواسطة» و«مشاركة»
  await copyTemplate(
    'MainActivity.java',
    path.join('java', 'com', 'pdfstudio', 'local', 'MainActivity.java')
  );

  console.log('\nاكتملت تهيئة ملفات المرحلة 3 بنجاح! الخطوة التالية: npm run android:assets');
}

main().catch((err) => {
  console.error('حدث خطأ أثناء تطبيق إعدادات المرحلة 3:', err);
  process.exit(1);
});
