package com.pdfstudio.local;

import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.webkit.JavascriptInterface;

import com.getcapacitor.BridgeActivity;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * النشاط الرئيسي لتطبيق «محرر PDF المحلي» مع دعم استقبال ملفات PDF القادمة
 * عبر خيار «فتح بواسطة / Open With» أو «مشاركة / Share» من واتساب ومدير الملفات.
 */
public class MainActivity extends BridgeActivity {
    private static final int MAX_INCOMING_PDF_BYTES = 50 * 1024 * 1024; // 50MB
    private final List<JSONObject> pendingIncomingPdfs = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new PdfIntentJsBridge(), "AndroidPdfIntent");
        }

        handleIncomingIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncomingIntent(intent);
    }

    private void handleIncomingIntent(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (action == null) return;

        List<Uri> uris = new ArrayList<>();
        if (Intent.ACTION_VIEW.equals(action)) {
            Uri data = intent.getData();
            if (data != null) uris.add(data);
        } else if (Intent.ACTION_SEND.equals(action)) {
            Uri stream = getParcelableUri(intent, Intent.EXTRA_STREAM);
            if (stream != null) uris.add(stream);
        } else if (Intent.ACTION_SEND_MULTIPLE.equals(action)) {
            ArrayList<Uri> streams = getParcelableUriList(intent, Intent.EXTRA_STREAM);
            if (streams != null) uris.addAll(streams);
        }

        if (uris.isEmpty()) return;

        int addedCount = 0;
        synchronized (pendingIncomingPdfs) {
            for (Uri uri : uris) {
                JSONObject item = readPdfUriAsJson(uri);
                if (item != null) {
                    pendingIncomingPdfs.add(item);
                    addedCount++;
                }
            }
        }

        if (addedCount > 0) {
            notifyWebViewIncomingPdfs();
        }
    }

    @SuppressWarnings("deprecation")
    private Uri getParcelableUri(Intent intent, String key) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return intent.getParcelableExtra(key, Uri.class);
        }
        return intent.getParcelableExtra(key);
    }

    @SuppressWarnings("deprecation")
    private ArrayList<Uri> getParcelableUriList(Intent intent, String key) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return intent.getParcelableArrayListExtra(key, Uri.class);
        }
        return intent.getParcelableArrayListExtra(key);
    }

    private JSONObject readPdfUriAsJson(Uri uri) {
        try (InputStream is = getContentResolver().openInputStream(uri)) {
            if (is == null) return null;

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buffer = new byte[16384];
            int total = 0;
            int read;
            while ((read = is.read(buffer)) != -1) {
                total += read;
                if (total > MAX_INCOMING_PDF_BYTES) {
                    return null;
                }
                baos.write(buffer, 0, read);
            }

            byte[] bytes = baos.toByteArray();
            if (bytes.length < 5) return null;

            String name = resolveDisplayName(uri);
            String base64 = Base64.encodeToString(bytes, Base64.NO_WRAP);

            JSONObject obj = new JSONObject();
            obj.put("name", name);
            obj.put("base64", base64);
            obj.put("sizeBytes", bytes.length);
            return obj;
        } catch (Exception ignored) {
            return null;
        }
    }

    private String resolveDisplayName(Uri uri) {
        String name = "shared-document.pdf";
        if ("content".equals(uri.getScheme())) {
            try (Cursor cursor = getContentResolver().query(uri, null, null, null, null)) {
                if (cursor != null && cursor.moveToFirst()) {
                    int idx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    if (idx >= 0) {
                        String candidate = cursor.getString(idx);
                        if (candidate != null && !candidate.trim().isEmpty()) {
                            name = candidate.trim();
                        }
                    }
                }
            } catch (Exception ignored) {
                // fallback to default name
            }
        } else if (uri.getLastPathSegment() != null) {
            name = uri.getLastPathSegment();
        }
        return name.toLowerCase().endsWith(".pdf") ? name : name + ".pdf";
    }

    private void notifyWebViewIncomingPdfs() {
        runOnUiThread(() -> {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('android-incoming-pdf'));",
                    null
                );
            }
        });
    }

    private class PdfIntentJsBridge {
        @JavascriptInterface
        public String consumePendingPdfs() {
            JSONArray arr = new JSONArray();
            synchronized (pendingIncomingPdfs) {
                for (JSONObject item : pendingIncomingPdfs) {
                    arr.put(item);
                }
                pendingIncomingPdfs.clear();
            }
            return arr.toString();
        }
    }
}
