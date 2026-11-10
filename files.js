/**
 * files.js - رفع وتنزيل الملفات عبر دالة Supabase "files" (window.FILES_URL)
 *
 *  - الرفع: نطلب من الدالة رابط رفع موقّعاً لمسار محدد، ثم يرفع المتصفح الملف إليه مباشرة.
 *  - الفتح/التنزيل: نطلب رابطاً موقّعاً مؤقتاً (10 دقائق).
 *  - الصور تُصغَّر قبل الرفع (أقصى ضلع 1600 بكسل) لتوفير المساحة.
 */

window.filesApi = (function () {
  function endpoint() {
    return window.FILES_URL || "";
  }

  function available() {
    return Boolean(endpoint());
  }

  async function call(body) {
    if (!available()) throw new Error("رفع الملفات غير مفعّل بعد");
    const res = await fetch(endpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    let data = {};
    try {
      data = await res.json();
    } catch (e) {}
    if (!res.ok) {
      const err = new Error(data.error || "HTTP " + res.status);
      err.info = data;
      throw err;
    }
    return data;
  }

  // يرفع الملف إلى المسار المحدد. kind: "book" | "submission"
  async function upload(kind, path, file) {
    const meta = await call({
      action: "upload",
      kind,
      path,
      contentType: file.type,
      size: file.size,
    });
    const headers = { "x-upsert": "true" };
    if (meta.anonKey) {
      headers.apikey = meta.anonKey;
      headers.Authorization = "Bearer " + meta.anonKey;
    }
    const fd = new FormData();
    fd.append("cacheControl", "3600");
    fd.append("", file);
    const res = await fetch(meta.signedUrl, { method: "PUT", headers, body: fd });
    if (!res.ok) throw new Error("تعذّر رفع الملف (" + res.status + ")");
    return { path };
  }

  async function signedUrl(kind, path, download, filename) {
    const data = await call({ action: "sign", kind, path, download: Boolean(download), filename });
    return data.url;
  }

  // تصغير الصورة قبل الرفع (JPEG). غير الصور تُعاد كما هي.
  function compressImage(file, maxSide, quality) {
    maxSide = maxSide || 1600;
    quality = quality || 0.8;
    if (!/^image\//.test(file.type)) return Promise.resolve(file);
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) return resolve(file);
            resolve(new File([blob], (file.name || "image").replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }));
          },
          "image/jpeg",
          quality,
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  }

  function sizeText(bytes) {
    const n = Number(bytes) || 0;
    if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + " ميجا";
    return Math.max(1, Math.round(n / 1024)) + " كيلو";
  }

  return { available, upload, signedUrl, compressImage, sizeText };
})();
