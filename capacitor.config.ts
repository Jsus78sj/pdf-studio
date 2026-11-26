import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pdfstudio.local',
  appName: 'محرر PDF المحلي',
  webDir: 'out',
  server: {
    // استخدام https يضمن عمل Web Crypto API وWeb Workers وتحميل الخطوط المحلية داخل Android WebView
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#f8fafc',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      launchFadeOutDuration: 250,
      backgroundColor: '#f8fafc',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;
