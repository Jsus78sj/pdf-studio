import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const androidAppDir = path.join(root, 'android', 'app');
const buildGradlePath = path.join(androidAppDir, 'build.gradle');
const signingSrc = path.join(root, 'android-templates', 'signing.gradle');
const signingDest = path.join(androidAppDir, 'signing.gradle');
const pkgPath = path.join(root, 'package.json');

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(buildGradlePath))) {
    console.error('✗ لم يُعثر على android/app/build.gradle. نفّذ أولاً: npm run android:init');
    process.exit(1);
  }

  // 1. نسخ ملف إعدادات التوقيع signing.gradle إلى android/app/
  await fs.copyFile(signingSrc, signingDest);
  console.log('✓ تم نسخ: android/app/signing.gradle');

  // 2. ربط signing.gradle داخل android/app/build.gradle بشكل آمن دون تكرار
  let gradleContent = await fs.readFile(buildGradlePath, 'utf-8');
  const applyLine = "apply from: 'signing.gradle'";

  if (!gradleContent.includes(applyLine)) {
    gradleContent = `${gradleContent.trimEnd()}\n\n// إعدادات التوقيع التلقائي للمرحلة 4\n${applyLine}\n`;
  }

  // 3. مزامنة versionName مع package.json
  const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
  if (pkg.version) {
    gradleContent = gradleContent.replace(
      /versionName\s+"[^"]+"/,
      `versionName "${pkg.version}"`
    );
  }

  await fs.writeFile(buildGradlePath, gradleContent, 'utf-8');
  console.log(`✓ تم تحديث android/app/build.gradle (versionName = "${pkg.version}")`);
}

main().catch((err) => {
  console.error('✗ فشل إعداد التوقيع:', err);
  process.exit(1);
});
