import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const mode = process.argv[2] || 'debug'; // debug | release-apk | release-aab
const root = process.cwd();
const androidDir = path.join(root, 'android');
const distDir = path.join(root, 'dist-apk');
const isWin = process.platform === 'win32';

function run(cmd, args, cwd = root) {
  console.log(`\n▶ ${cmd} ${args.join(' ')}`);
  const res = spawnSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: isWin,
  });
  if (res.error) {
    console.error(`✗ تعذر تشغيل ${cmd}:`, res.error.message);
    process.exit(1);
  }
  if (res.status !== 0) {
    console.error(`✗ فشل الأمر (${cmd}) برمز خروج ${res.status}`);
    process.exit(res.status || 1);
  }
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function sha256File(filePath) {
  const buf = await fs.readFile(filePath);
  return {
    sizeBytes: buf.byteLength,
    sha256: crypto.createHash('sha256').update(buf).digest('hex'),
  };
}

async function main() {
  const npmCmd = isWin ? 'npm.cmd' : 'npm';
  const npxCmd = isWin ? 'npx.cmd' : 'npx';
  const gradleCmd = isWin ? 'gradlew.bat' : './gradlew';

  // 1. بناء ملفات Next.js الثابتة في out/
  run(npmCmd, ['run', 'build']);

  // 2. توليد مجلد android/ تلقائياً إذا لم يكن موجوداً
  if (!(await exists(androidDir))) {
    console.log('\nℹ مجلد android/ غير موجود؛ جارٍ توليده عبر Capacitor...');
    run(npxCmd, ['cap', 'add', 'android']);
  }

  // 3. مزامنة Capacitor وتطبيق إعدادات المرحلتين 3 و4 + توليد الأيقونات
  run(npxCmd, ['cap', 'sync', 'android']);
  run('node', ['scripts/configure-android-phase3.mjs']);
  run('node', ['scripts/configure-android-signing.mjs']);
  run(npxCmd, ['capacitor-assets', 'generate', '--android']);

  // 4. فحص وجود مفتاح التوقيع عند طلب بناء Release
  if (mode !== 'debug') {
    const hasProps = await exists(path.join(androidDir, 'keystore.properties'));
    const hasEnv = Boolean(
      process.env.ANDROID_KEYSTORE_PATH &&
        process.env.ANDROID_KEYSTORE_PASSWORD &&
        process.env.ANDROID_KEY_ALIAS &&
        process.env.ANDROID_KEY_PASSWORD
    );
    if (!hasProps && !hasEnv) {
      console.error(
        '\n✗ لبناء نسخة Release موقّعة، أنشئ مفتاح التوقيع أولاً عبر: npm run android:keystore'
      );
      process.exit(1);
    }
  }

  // 5. تشغيل Gradle لبناء APK أو AAB
  const taskMap = {
    debug: {
      gradleTask: 'assembleDebug',
      outputRelative: path.join('app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
      distName: 'pdf-studio-debug.apk',
    },
    'release-apk': {
      gradleTask: 'assembleRelease',
      outputRelative: path.join('app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
      distName: 'pdf-studio-release.apk',
    },
    'release-aab': {
      gradleTask: 'bundleRelease',
      outputRelative: path.join('app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab'),
      distName: 'pdf-studio-release.aab',
    },
  };

  const selected = taskMap[mode];
  if (!selected) {
    console.error(`✗ وضع البناء غير معروف: "${mode}". استخدم: debug أو release-apk أو release-aab`);
    process.exit(1);
  }

  if (!isWin) {
    try {
      await fs.chmod(path.join(androidDir, 'gradlew'), 0o755);
    } catch {
      // تجاهل
    }
  }

  run(gradleCmd, [selected.gradleTask], androidDir);

  const builtArtifact = path.join(androidDir, selected.outputRelative);
  if (!(await exists(builtArtifact))) {
    console.error('✗ لم يُعثر على الملف الناتج في:', builtArtifact);
    process.exit(1);
  }

  await fs.mkdir(distDir, { recursive: true });
  const finalDest = path.join(distDir, selected.distName);
  await fs.copyFile(builtArtifact, finalDest);

  const info = await sha256File(finalDest);
  const sizeMb = (info.sizeBytes / (1024 * 1024)).toFixed(2);

  console.log('\n================================================');
  console.log('✓ اكتمل بناء تطبيق أندرويد بنجاح!');
  console.log(`• الملف الجاهز: dist-apk/${selected.distName}`);
  console.log(`• الحجم: ${sizeMb} ميجابايت`);
  console.log(`• SHA-256: ${info.sha256}`);
  console.log('================================================');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
