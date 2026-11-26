import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const root = process.cwd();
const androidDir = path.join(root, 'android');
const keystorePath = path.join(androidDir, 'release-keystore.jks');
const propsPath = path.join(androidDir, 'keystore.properties');

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(androidDir))) {
    await fs.mkdir(androidDir, { recursive: true });
  }

  if (await exists(keystorePath)) {
    console.log('! مفتاح التوقيع موجود بالفعل في:', keystorePath);
    console.log('  احذفه يدوياً فقط إذا كنت متأكداً أنك تريد توليد مفتاح جديد.');
    return;
  }

  const rl = readline.createInterface({ input, output });
  try {
    console.log('=== إنشاء مفتاح توقيع رقمي لإصدار APK النهائي ===\n');
    const alias = (await rl.question('اسم المفتاح (Alias) [pdfstudio-release]: ')).trim() || 'pdfstudio-release';
    const storePass = (await rl.question('كلمة مرور المخزن (6 أحرف على الأقل): ')).trim();
    const keyPass = (await rl.question('كلمة مرور المفتاح [اتركه فارغاً لمطابقة كلمة مرور المخزن]: ')).trim() || storePass;
    const cn = (await rl.question('الاسم أو الجهة (CN) [PDF Studio Local]: ')).trim() || 'PDF Studio Local';
    const country = (await rl.question('رمز الدولة (مثال YE أو SA) [YE]: ')).trim() || 'YE';

    if (storePass.length < 6) {
      console.error('✗ يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.');
      process.exit(1);
    }

    const dname = `CN=${cn}, OU=Mobile, O=${cn}, C=${country}`;
    const args = [
      '-genkeypair',
      '-v',
      '-keystore', keystorePath,
      '-keyalg', 'RSA',
      '-keysize', '2048',
      '-validity', '10000',
      '-alias', alias,
      '-storepass', storePass,
      '-keypass', keyPass,
      '-dname', dname,
    ];

    const res = spawnSync('keytool', args, { stdio: 'inherit' });
    if (res.error || res.status !== 0) {
      console.error('\n✗ تعذر تشغيل أداة keytool. تأكد من تثبيت JDK 17 وإضافته إلى PATH.');
      process.exit(1);
    }

    const propsContent = [
      `storeFile=../release-keystore.jks`,
      `storePassword=${storePass}`,
      `keyAlias=${alias}`,
      `keyPassword=${keyPass}`,
      '',
    ].join('\n');

    await fs.writeFile(propsPath, propsContent, 'utf-8');

    console.log('\n✓ تم إنشاء المفتاح بنجاح في:', keystorePath);
    console.log('✓ تم حفظ الإعدادات المحلية في:', propsPath);
    console.log('\n⚠ احتفظ بنسخة احتياطية آمنة من ملف release-keystore.jks وكلمات المرور.');
    console.log('  وللرفع إلى GitHub Secrets حوّل المفتاح إلى Base64 بالأمر:');
    console.log('  base64 -w 0 android/release-keystore.jks');
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
