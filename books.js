/**
 * books.js - خانة الكتب
 *
 *  - المدير والمشرف يضيفان كتاب PDF (يُرفع إلى تخزين Supabase الخاص) ويحددان برامجه،
 *    ومعه خيار "قابل للتنزيل".
 *  - الطالب يرى كتب برنامجه: يقرؤها داخل المنصة دائماً، ويظهر زر "تنزيل" فقط للكتب
 *    القابلة للتنزيل (ولا تظهر له أي عبارة عن المنع).
 *  - القارئ يرسم الصفحات داخل المنصة (pdf.js) بلا زر تنزيل، وتُرسم الصفحة عند الوصول إليها.
 *
 * db.books : [{ id, title, description, programIds: [] (فارغ = كل البرامج), downloadable,
 *              path, size, fileName, createdBy, createdByName, ts, archived }]
 */

window.books = (function () {
  const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  function me() {
    return state.currentUser;
  }
  function isStaff() {
    const r = me() ? me().role : "";
    return r === "admin" || r === "supervisor";
  }
  function all() {
    if (!Array.isArray(db.books)) db.books = [];
    return db.books;
  }
  function find(id) {
    return all().find((b) => b && b.id === id) || null;
  }
  function visibleBooks() {
    const u = me();
    const list = all().filter((b) => b && !b.archived);
    if (!u) return [];
    if (u.role === "admin") return list;
    if (u.role === "supervisor") {
      const progs = u.assignedPrograms || [];
      return list.filter((b) => !(b.programIds || []).length || (b.programIds || []).some((p) => progs.includes(p)));
    }
    if (u.role === "student") {
      return list.filter((b) => !(b.programIds || []).length || (b.programIds || []).includes(u.currentProgramId));
    }
    return [];
  }
  function canEdit(b) {
    const u = me();
    return Boolean(b && u && (u.role === "admin" || b.createdBy === u.id));
  }
  function programsText(b) {
    const ids = b.programIds || [];
    return ids.length ? ids.map((p) => getProgramName(p)).join("، ") : "كل البرامج";
  }

  // ---------- الشاشة ----------
  function renderView() {
    const list = visibleBooks().sort((a, b) => compareNames(a.title, b.title));
    const staff = isStaff();
    const cards = list
      .map(
        (b) => `
      <div class="p-4 rounded-2xl border border-slate-200 bg-white flex gap-3">
        <div class="w-12 h-16 rounded-xl bg-gradient-to-b from-[#0B2533] to-[#2B1736] text-[#D4A359] flex items-center justify-center shrink-0"><i class="fa-solid fa-book text-lg"></i></div>
        <div class="flex-1 min-w-0 space-y-1.5">
          <div class="font-black text-sm text-slate-800">${escHtml(b.title)}</div>
          ${b.description ? `<div class="text-[11px] text-slate-500 line-clamp-2">${escHtml(b.description)}</div>` : ""}
          <div class="text-[10px] text-slate-400">${staff ? escHtml(programsText(b)) + " · " : ""}${escHtml(filesApi.sizeText(b.size))}${staff ? ` · ${b.downloadable ? "قابل للتنزيل" : "قراءة فقط"}` : ""}</div>
          <div class="flex flex-wrap gap-1.5 pt-1">
            <button onclick="books.openReader('${b.id}')" class="px-3 py-1.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white text-[11px] font-black rounded-xl transition"><i class="fa-solid fa-book-open ml-1"></i> قراءة</button>
            ${b.downloadable ? `<button onclick="books.download('${b.id}')" class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-black rounded-xl"><i class="fa-solid fa-download ml-1"></i> تنزيل</button>` : ""}
            ${canEdit(b) ? `<button onclick="books.openEditor('${b.id}')" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl"><i class="fa-solid fa-pen"></i></button>
            <button onclick="books.archive('${b.id}')" class="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-700 text-[11px] font-bold rounded-xl"><i class="fa-solid fa-eye-slash"></i></button>` : ""}
          </div>
        </div>
      </div>`,
      )
      .join("");

    return `
      <div class="space-y-4">
        <div class="bg-gradient-to-r from-[#0B2533] to-[#2B1736] rounded-3xl p-5 text-white border-t-4 border-t-[#D4A359] flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <span class="inline-block bg-[#D4A359] text-[#0B2533] text-[11px] font-black px-3 py-0.5 rounded-full mb-1.5">${staff ? "الكتب" : "كتبي"}</span>
            <h2 class="text-xl font-black">${list.length} كتاب</h2>
            <p class="text-xs text-slate-300 mt-0.5">${staff ? "أضف كتب البرامج بصيغة PDF، وحدد القابل منها للتنزيل." : "كتب برنامجك."}</p>
          </div>
          ${staff ? `<button onclick="books.openEditor()" class="px-4 py-2.5 bg-[#D4A359] hover:bg-white text-[#0B2533] font-black rounded-xl text-xs transition shrink-0"><i class="fa-solid fa-plus ml-1"></i> إضافة كتاب</button>` : ""}
        </div>
        ${
          !filesApi.available() && staff
            ? '<div class="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900"><i class="fa-solid fa-circle-info ml-1"></i> رفع الملفات لم يُفعّل بعد (يحتاج تفعيل دالة الملفات في Supabase).</div>'
            : ""
        }
        ${
          list.length
            ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-3">${cards}</div>`
            : '<div class="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-400 text-xs">لا توجد كتب بعد</div>'
        }
      </div>`;
  }

  // ---------- إضافة / تعديل ----------
  function openEditor(id) {
    if (!isStaff()) return;
    const b = id ? find(id) : null;
    if (b && !canEdit(b)) return;
    const u = me();
    const progs = u.role === "admin" ? getActivePrograms() : getActivePrograms().filter((p) => (u.assignedPrograms || []).includes(p.id));
    const sel = new Set((b && b.programIds) || []);
    closeModal("book-editor-modal");
    const html = `
      <div id="book-editor-modal" data-book="${b ? b.id : ""}" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-start pt-10 px-4 overflow-y-auto">
        <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 border-t-[#D4A359] mb-8">
          <div class="bg-[#0B2533] text-white px-5 py-4 flex justify-between items-center border-b border-[#D4A359]">
            <h3 class="font-bold text-sm"><i class="fa-solid fa-book text-[#D4A359] ml-1.5"></i> ${b ? "تعديل كتاب" : "إضافة كتاب"}</h3>
            <button onclick="closeModal('book-editor-modal')" class="text-slate-300 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="p-5 space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">اسم الكتاب:</label>
              <input id="bk-title" maxlength="120" value="${b ? escHtml(b.title) : ""}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">نبذة (اختياري):</label>
              <textarea id="bk-desc" rows="2" maxlength="400" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800">${b ? escHtml(b.description || "") : ""}</textarea>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">البرامج (اتركها كلها بلا تحديد = كل البرامج):</label>
              <div class="flex flex-wrap gap-2">
                ${progs.map((p) => `<label class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 cursor-pointer"><input type="checkbox" class="bk-prog accent-[#D4A359]" value="${p.id}" ${sel.has(p.id) ? "checked" : ""}> ${escHtml(p.name)}</label>`).join("")}
              </div>
            </div>
            <label class="flex items-center gap-2 font-black text-slate-800 cursor-pointer bg-emerald-50/60 border border-emerald-200 rounded-xl p-2.5">
              <input id="bk-dl" type="checkbox" class="accent-emerald-700" ${!b || b.downloadable ? "checked" : ""}> قابل للتنزيل
              <span class="text-[10px] font-normal text-slate-500">(إن أزلته يُقرأ داخل المنصة فقط)</span>
            </label>
            <div>
              <label class="block font-bold text-slate-700 mb-1">${b ? "استبدال الملف (اختياري):" : "ملف الكتاب (PDF حتى 50 ميجا):"}</label>
              <input id="bk-file" type="file" accept="application/pdf" class="w-full text-xs">
            </div>
            <div id="bk-progress" class="hidden text-[11px] font-bold text-[#169BA2]"><i class="fa-solid fa-spinner fa-spin ml-1"></i> جارِ رفع الملف...</div>
            <button id="bk-save" onclick="books.saveEditor()" class="w-full py-2.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-black rounded-xl transition"><i class="fa-solid fa-check ml-1"></i> حفظ</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", html);
  }

  async function saveEditor() {
    if (!isStaff()) return;
    const modal = document.getElementById("book-editor-modal");
    const id = modal ? modal.getAttribute("data-book") : "";
    const existing = id ? find(id) : null;
    const title = cleanText((document.getElementById("bk-title") || {}).value || "", 120);
    if (!title) {
      alert("اكتب اسم الكتاب.");
      return;
    }
    const fileEl = document.getElementById("bk-file");
    const file = fileEl && fileEl.files ? fileEl.files[0] : null;
    if (!existing && !file) {
      alert("اختر ملف الكتاب (PDF).");
      return;
    }
    if (file && file.type !== "application/pdf") {
      alert("الكتاب يجب أن يكون بصيغة PDF.");
      return;
    }
    if (file && file.size > 50 * 1024 * 1024) {
      alert("حجم الملف أكبر من 50 ميجا.");
      return;
    }
    const book = existing || {
      id: makeUniqueId("bk"),
      createdBy: me().id,
      createdByName: cleanText(me().name, 80),
      ts: Date.now(),
      archived: false,
    };
    if (file) {
      const btn = document.getElementById("bk-save");
      const prog = document.getElementById("bk-progress");
      if (btn) btn.disabled = true;
      if (prog) prog.classList.remove("hidden");
      try {
        const path = `books/${book.id}${existing ? "_" + Date.now().toString(36) : ""}.pdf`;
        await filesApi.upload("book", path, file);
        book.path = path;
        book.size = file.size;
        book.fileName = cleanText(file.name, 120);
      } catch (e) {
        if (btn) btn.disabled = false;
        if (prog) prog.classList.add("hidden");
        alert("تعذّر رفع الكتاب: " + (e && e.message ? e.message : "") + "\nتأكد من الاتصال وحاول مجدداً.");
        return;
      }
    }
    book.title = title;
    book.description = cleanText((document.getElementById("bk-desc") || {}).value || "", 400);
    book.programIds = Array.from(document.querySelectorAll(".bk-prog:checked")).map((c) => c.value);
    book.downloadable = Boolean((document.getElementById("bk-dl") || {}).checked);
    if (!existing) all().push(book);
    persist("books");
    logAudit(existing ? "تعديل كتاب" : "إضافة كتاب", title);
    closeModal("book-editor-modal");
    navigateTo("books");
  }

  function archive(id) {
    const b = find(id);
    if (!canEdit(b)) return;
    if (!confirm(`إخفاء كتاب «${b.title}» عن الطلاب؟`)) return;
    b.archived = true;
    persist("books");
    logAudit("إخفاء كتاب", b.title);
    navigateTo("books");
  }

  // ---------- التنزيل ----------
  async function download(id) {
    const b = find(id);
    if (!b || !b.downloadable || !visibleBooks().some((x) => x.id === id)) return;
    try {
      const url = await filesApi.signedUrl("book", b.path, true, (b.title || "book") + ".pdf");
      window.open(url, "_blank", "noopener");
    } catch (e) {
      alert("تعذّر تنزيل الكتاب. حاول مجدداً.");
    }
  }

  // ---------- القارئ داخل المنصة ----------
  let pdfjsLoading = null;
  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (pdfjsLoading) return pdfjsLoading;
    pdfjsLoading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = PDFJS;
      s.onload = () => {
        try {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
          resolve(window.pdfjsLib);
        } catch (e) {
          reject(e);
        }
      };
      s.onerror = () => {
        pdfjsLoading = null;
        reject(new Error("pdfjs"));
      };
      document.head.appendChild(s);
    });
    return pdfjsLoading;
  }

  let readerObserver = null;
  function closeReader() {
    if (readerObserver) {
      readerObserver.disconnect();
      readerObserver = null;
    }
    closeModal("book-reader-modal");
  }

  async function openReader(id) {
    const b = find(id);
    if (!b || !visibleBooks().some((x) => x.id === id)) return;
    closeReader();
    const html = `
      <div id="book-reader-modal" class="fixed inset-0 bg-slate-900/90 z-[60] flex flex-col" oncontextmenu="return false">
        <div class="bg-[#0B2533] text-white px-4 py-3 flex justify-between items-center gap-2">
          <div class="min-w-0">
            <div class="font-black text-sm truncate">${escHtml(b.title)}</div>
            <div id="book-reader-status" class="text-[10px] text-[#D4A359]">جارِ فتح الكتاب...</div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            ${b.downloadable ? `<button onclick="books.download('${b.id}')" class="px-3 py-1.5 bg-[#D4A359] text-[#0B2533] text-[11px] font-black rounded-lg"><i class="fa-solid fa-download ml-1"></i> تنزيل</button>` : ""}
            <button onclick="books.closeReader()" class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
        <div id="book-reader-pages" class="flex-1 overflow-y-auto p-3 space-y-3 select-none" style="-webkit-user-select:none"></div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", html);
    const status = (t) => {
      const el = document.getElementById("book-reader-status");
      if (el) el.textContent = t;
    };
    try {
      const [lib, url] = await Promise.all([loadPdfJs(), filesApi.signedUrl("book", b.path, false)]);
      const pdf = await lib.getDocument({ url }).promise;
      const box = document.getElementById("book-reader-pages");
      if (!box) return;
      status(`${pdf.numPages} صفحة`);
      for (let i = 1; i <= pdf.numPages; i++) {
        box.insertAdjacentHTML(
          "beforeend",
          `<div class="book-page mx-auto bg-white rounded-lg shadow max-w-3xl min-h-[60vh] flex items-center justify-center text-slate-300 text-xs" data-page="${i}">صفحة ${i}</div>`,
        );
      }
      const render = async (el) => {
        if (el.getAttribute("data-done")) return;
        el.setAttribute("data-done", "1");
        const page = await pdf.getPage(Number(el.getAttribute("data-page")));
        const width = Math.min(box.clientWidth - 24, 900);
        const base = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: (width / base.width) * (window.devicePixelRatio || 1) });
        const c = document.createElement("canvas");
        c.width = vp.width;
        c.height = vp.height;
        c.style.width = "100%";
        c.style.height = "auto";
        await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
        el.innerHTML = "";
        el.classList.remove("min-h-[60vh]");
        el.appendChild(c);
      };
      const pages = Array.from(box.querySelectorAll(".book-page"));
      // أول 3 صفحات تُرسم فوراً، والبقية عند الوصول إليها
      for (const el of pages.slice(0, 3)) {
        try {
          await render(el);
        } catch (e) {
          console.warn(e);
        }
      }
      if ("IntersectionObserver" in window) {
        readerObserver = new IntersectionObserver(
          (entries) => entries.forEach((en) => en.isIntersecting && render(en.target)),
          { root: box, rootMargin: "600px 0px" },
        );
        pages.slice(3).forEach((el) => readerObserver.observe(el));
      } else {
        for (const el of pages.slice(3)) await render(el);
      }
    } catch (e) {
      console.warn(e);
      status("تعذّر فتح الكتاب. تأكد من الاتصال وحاول مجدداً.");
    }
  }

  return { renderView, openEditor, saveEditor, archive, download, openReader, closeReader, visibleBooks };
})();
