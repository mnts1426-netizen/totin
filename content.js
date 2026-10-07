/**
 * content.js - الدروس والتكاليف
 *
 * ثلاثة أنواع يضيفها المشرف أو المدير لطلاب برنامج:
 *  1) ورقة تكليف (sheet): رابط الورقة + طريقة التسليم: ورقياً (يطبعها ويسلّمها، والمشرف
 *     يعلّم "استُلمت") و/أو إلكترونياً (أسئلة يكتبها المشرف ويجيب الطالب داخل المنصة).
 *  2) مقاطع (media): روابط يوتيوب (غير مُدرجة) تُعرض داخل المنصة، ويُعرف كم شاهد الطالب
 *     من كل مقطع ("أنهى 1 من 3"). الروابط الأخرى تُفتح خارجياً مع زر "أنهيت".
 *  3) قراءة قبلية (reading): الصفحات وعددها ومحتوياتها وموعد البرنامج، وتنبيه قبل الموعد،
 *     والطالب يضغط "قرأت" فيعرف المشرف من قرأ.
 *
 * التخزين:
 *  - db.contentItems (متزامن مع الجميع): تعريف الدروس والتكاليف فقط (صغير).
 *  - تقدّم كل طالب في وثيقة مستقلة: totin_progress/{studentId}
 *    { items: { [itemId]: {...} } } — لا تكبر وثيقة واحدة مهما كثرت الواجبات،
 *    والطالب يقرأ وثيقته فقط، والمشرف يقرأ وثائق طلاب البرنامج عند فتح الشاشة.
 */

window.content = (function () {
  const PROG_COL = "totin_progress";
  const LOCAL_KEY = "totin_progress_local";
  const DONE_PCT = 0.9; // مشاهدة 90% من المقطع = أنهاه

  const TYPES = {
    sheet: { label: "ورقة تكليف", icon: "fa-file-pen", color: "#D4A359" },
    media: { label: "مقاطع مسموعة / مرئية", icon: "fa-circle-play", color: "#9E1B48" },
    reading: { label: "قراءة قبلية", icon: "fa-book-open-reader", color: "#169BA2" },
  };

  // عنوان إشعار الإضافة لكل نوع
  const NEW_TITLE = {
    sheet: "ورقة تكليف جديدة",
    media: "مقاطع جديدة",
    reading: "قراءة قبلية جديدة",
  };

  // ---------- أدوات عامة ----------
  function me() {
    return state.currentUser;
  }
  function isStaff() {
    const r = me() ? me().role : "";
    return r === "admin" || r === "supervisor";
  }
  function clone(o) {
    return JSON.parse(JSON.stringify(o || {}));
  }
  function deepMerge(t, src) {
    Object.keys(src || {}).forEach((k) => {
      const v = src[k];
      if (v && typeof v === "object" && !Array.isArray(v) && t[k] && typeof t[k] === "object" && !Array.isArray(t[k])) {
        deepMerge(t[k], v);
      } else {
        t[k] = v;
      }
    });
    return t;
  }
  function safeUrl(u) {
    const s = String(u || "").trim();
    return /^https?:\/\//i.test(s) ? s : "";
  }
  function youtubeId(url) {
    const m = String(url || "").match(
      /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{11})/,
    );
    return m ? m[1] : "";
  }
  function multiline(v, maxLen) {
    let t = String(v == null ? "" : v)
      .replace(/\r/g, "")
      .replace(/[<>`]/g, "")
      .replace(/javascript:/gi, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (maxLen && t.length > maxLen) t = t.slice(0, maxLen);
    return t;
  }
  function dateText(iso) {
    if (!iso) return "";
    try {
      return new Date(iso + "T00:00:00").toLocaleDateString("ar-SA", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    } catch (e) {
      return iso;
    }
  }
  function programName(pid) {
    const p = (db.programs || []).find((x) => x.id === pid);
    return p ? p.name : "";
  }

  // ---------- البرامج والطلاب المسموح بهم ----------
  function staffPrograms() {
    const u = me();
    if (!u) return [];
    if (u.role === "admin") return getActivePrograms();
    if (u.role === "supervisor")
      return getActivePrograms().filter((p) => (u.assignedPrograms || []).includes(p.id));
    return [];
  }
  function canManage(item) {
    return Boolean(item) && staffPrograms().some((p) => p.id === item.programId);
  }
  function programStudents(pid) {
    return (db.users || [])
      .filter((u) => u && u.role === "student" && u.currentProgramId === pid && !u.isRestricted)
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "ar", { numeric: true }));
  }

  // ---------- التعريفات ----------
  function allItems() {
    if (!Array.isArray(db.contentItems)) db.contentItems = [];
    return db.contentItems;
  }
  function findItem(id) {
    return allItems().find((x) => x && x.id === id) || null;
  }
  function itemsForProgram(pid) {
    return allItems()
      .filter((x) => x && !x.archived && x.programId === pid)
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }

  // ---------- التقدّم (وثيقة لكل طالب) ----------
  const cache = {}; // studentId -> { items: {} }
  const loaded = {}; // studentId -> true

  function cloud() {
    return window.dbFirestore || null;
  }
  function loadLocalAll() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }
  function saveLocalAll(all) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
    } catch (e) {}
  }

  async function loadProgress(studentIds, force) {
    const need = (studentIds || []).filter((id) => id && (force || !loaded[id]));
    if (!need.length) return;
    if (!cloud()) {
      const all = loadLocalAll();
      need.forEach((id) => {
        cache[id] = all[id] || { items: {} };
        loaded[id] = true;
      });
      return;
    }
    await Promise.all(
      need.map((id) =>
        cloud()
          .collection(PROG_COL)
          .doc(id)
          .get()
          .then((d) => {
            const data = d.exists ? d.data() || {} : {};
            if (!data.items || typeof data.items !== "object") data.items = {};
            cache[id] = data;
            loaded[id] = true;
          })
          .catch((e) => {
            console.warn("تعذّر تحميل تقدّم الطالب:", e && e.code);
            if (!cache[id]) cache[id] = { items: {} };
          }),
      ),
    );
  }

  function entry(studentId, itemId) {
    return ((cache[studentId] || {}).items || {})[itemId] || null;
  }

  async function saveEntry(studentId, itemId, patch) {
    if (!cache[studentId]) cache[studentId] = { items: {} };
    const cur = cache[studentId].items[itemId] || {};
    cache[studentId].items[itemId] = deepMerge(clone(cur), clone(patch));
    const now = Date.now();
    if (!cloud()) {
      const all = loadLocalAll();
      all[studentId] = cache[studentId];
      saveLocalAll(all);
      return true;
    }
    try {
      await cloud()
        .collection(PROG_COL)
        .doc(studentId)
        .set({ studentId, updatedAt: now, items: { [itemId]: patch } }, { merge: true });
      return true;
    } catch (e) {
      console.warn("تعذّر حفظ التقدّم:", e && e.code);
      alert("تعذّر الحفظ. تأكد من اتصالك بالإنترنت ثم أعد المحاولة.");
      return false;
    }
  }

  // حالة إنجاز طالب لعنصر: { done, label, pct }
  function statusOf(item, studentId) {
    const e = entry(studentId, item.id) || {};
    if (item.type === "sheet") {
      if (e.paperReceivedAt) return { done: true, label: "استُلمت ورقياً", pct: 1 };
      if (e.submittedAt) return { done: true, label: "سُلّم إلكترونياً", pct: 1 };
      return { done: false, label: "لم يُسلَّم", pct: 0 };
    }
    if (item.type === "media") {
      const clips = item.clips || [];
      const doneCount = clips.filter((c) => {
        const ce = (e.clips || {})[c.id] || {};
        return ce.doneAt || (ce.pct || 0) >= DONE_PCT;
      }).length;
      const started = clips.some((c) => ((e.clips || {})[c.id] || {}).pct > 0) || e.openedAt;
      return {
        done: clips.length > 0 && doneCount === clips.length,
        label: `أنهى ${doneCount} من ${clips.length}${!doneCount && started ? " (بدأ)" : ""}`,
        pct: clips.length ? doneCount / clips.length : 0,
      };
    }
    if (item.type === "reading") {
      return e.readAt
        ? { done: true, label: "قرأ", pct: 1 }
        : { done: false, label: "لم يقرأ", pct: 0 };
    }
    return { done: false, label: "", pct: 0 };
  }

  // ---------- إشعارات ----------
  function notifyStudents(pid, title, message, idPrefix) {
    if (!Array.isArray(db.notifications)) db.notifications = [];
    const have = new Set(db.notifications.map((n) => n && n.id));
    programStudents(pid).forEach((s) => {
      const id = idPrefix ? `${idPrefix}_${s.id}` : makeUniqueId("notif");
      if (have.has(id)) return;
      db.notifications.unshift({
        id,
        userId: s.id,
        category: "الدروس والتكاليف",
        title: cleanText(title, 150),
        message: cleanText(message, 300),
        date: "الآن",
        isRead: false,
      });
    });
  }

  // تذكير القراءة القبلية: يُرسل مرة واحدة قبل الموعد بيوم (أو يوم الموعد إن فات)
  // يعمل من جهاز أي مشرف/مدير يفتح المنصة — لا يحتاج خادماً.
  function runReadingReminders() {
    if (!isStaff()) return;
    if (window.store && window.store.isCloudConnected() && !window.store.firstSyncDone()) return;
    const today = todayStr();
    const t = new Date();
    t.setDate(t.getDate() + 1);
    const tomorrow = localDateStr(t);
    let changed = false;
    allItems().forEach((it) => {
      if (!it || it.archived || it.type !== "reading" || !it.dueDate || it.reminderSentAt) return;
      if (!canManage(it)) return;
      if (it.dueDate !== tomorrow && it.dueDate !== today) return;
      const when = it.dueDate === today ? "اليوم" : "غداً";
      notifyStudents(
        it.programId,
        `تذكير: قراءة قبلية ${when}`,
        `${it.title}${it.pagesCount ? ` — ${it.pagesCount} صفحة` : ""}${it.pagesRange ? ` (${it.pagesRange})` : ""}`,
        `notif_rem_${it.id}`,
      );
      it.reminderSentAt = Date.now();
      it.updatedAt = Date.now();
      changed = true;
    });
    if (changed) persist("contentItems", "notifications");
  }

  // =====================================================================
  // إنشاء وتعديل (المشرف والمدير)
  // =====================================================================
  function openEditor(itemId) {
    const progs = staffPrograms();
    if (!progs.length) {
      alert("لا توجد برامج مسندة إليك.");
      return;
    }
    const it = itemId ? findItem(itemId) : null;
    if (it && !canManage(it)) return;
    const type = it ? it.type : state.contentNewType || "sheet";
    const selProg =
      (it && it.programId) ||
      state.contentProgram ||
      (progs.some((p) => p.id === state.currentProgramId) ? state.currentProgramId : progs[0].id);
    const v = (k, d) => escHtml(it && it[k] != null ? it[k] : d || "");
    closeModal("content-editor-modal");

    const html = `
      <div id="content-editor-modal" data-item="${it ? it.id : ""}" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-start pt-8 px-4 overflow-y-auto">
        <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden border-t-4 border-t-[#D4A359] mb-8">
          <div class="bg-[#0B2533] text-white px-5 py-4 flex justify-between items-center border-b border-[#D4A359]">
            <h3 class="font-bold text-sm"><i class="fa-solid ${it ? "fa-pen" : "fa-plus"} text-[#D4A359] ml-1.5"></i> ${it ? "تعديل" : "إضافة درس أو تكليف"}</h3>
            <button onclick="closeModal('content-editor-modal')" class="text-slate-300 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="p-5 space-y-3 text-xs">
            <div class="grid grid-cols-3 gap-2">
              ${Object.keys(TYPES)
                .map(
                  (k) => `
                <label class="cursor-pointer">
                  <input type="radio" name="ce-type" value="${k}" class="peer hidden" ${k === type ? "checked" : ""} ${it ? "disabled" : ""} onchange="content.switchEditorType(this.value)">
                  <div class="rounded-2xl border-2 border-slate-200 peer-checked:border-[#D4A359] peer-checked:bg-amber-50 p-2.5 text-center transition ${it && k !== type ? "opacity-40" : ""}">
                    <i class="fa-solid ${TYPES[k].icon} text-lg" style="color:${TYPES[k].color}"></i>
                    <div class="font-black text-[11px] mt-1 text-slate-700">${TYPES[k].label}</div>
                  </div>
                </label>`,
                )
                .join("")}
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-bold text-slate-700 mb-1">البرنامج:</label>
                <select id="ce-program" ${it ? "disabled" : ""} class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700">
                  ${progs.map((p) => `<option value="${p.id}" ${p.id === selProg ? "selected" : ""}>${escHtml(p.name)}</option>`).join("")}
                </select>
              </div>
              <div>
                <label id="ce-due-label" class="block font-bold text-slate-700 mb-1">${type === "reading" ? "موعد البرنامج:" : "آخر موعد (اختياري):"}</label>
                <input id="ce-due" type="date" value="${v("dueDate")}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-700">
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">العنوان:</label>
              <input id="ce-title" maxlength="120" value="${v("title")}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800" placeholder="مثال: الدرس الثالث — أحكام النون الساكنة">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">وصف / تعليمات (اختياري):</label>
              <textarea id="ce-desc" rows="2" maxlength="800" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800">${v("description")}</textarea>
            </div>

            <div id="ce-sec-sheet" class="${type === "sheet" ? "" : "hidden"} space-y-2.5 bg-amber-50/50 border border-amber-200 rounded-2xl p-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">رابط الورقة (PDF أو Google Drive):</label>
                <input id="ce-sheet-url" dir="ltr" value="${v("sheetUrl")}" class="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800" placeholder="https://...">
              </div>
              <div class="font-bold text-slate-700">طريقة التسليم (واحدة أو الاثنتين):</div>
              <label class="flex items-center gap-2 font-bold text-slate-700 cursor-pointer"><input id="ce-mode-paper" type="checkbox" class="accent-[#D4A359]" ${!it || (it.modes || {}).paper ? "checked" : ""}> ورقياً: يطبعها الطالب ويعبّئها ويسلّمها للمشرف</label>
              <label class="flex items-center gap-2 font-bold text-slate-700 cursor-pointer"><input id="ce-mode-online" type="checkbox" class="accent-[#D4A359]" ${it && (it.modes || {}).online ? "checked" : ""} onchange="document.getElementById('ce-q-wrap').classList.toggle('hidden', !this.checked)"> إلكترونياً: يجيب على الأسئلة داخل المنصة</label>
              <div id="ce-q-wrap" class="${it && (it.modes || {}).online ? "" : "hidden"}">
                <label class="block font-bold text-slate-700 mb-1">الأسئلة (سؤال في كل سطر):</label>
                <textarea id="ce-questions" rows="4" class="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800" placeholder="ما تعريف الإظهار؟&#10;اذكر حروف الإخفاء.">${escHtml(((it && it.questions) || []).map((q) => q.text).join("\n"))}</textarea>
              </div>
            </div>

            <div id="ce-sec-media" class="${type === "media" ? "" : "hidden"} space-y-2 bg-rose-50/40 border border-rose-200 rounded-2xl p-3">
              <label class="block font-bold text-slate-700">المقاطع — مقطع في كل سطر بالشكل: العنوان | الرابط</label>
              <textarea id="ce-clips" rows="4" dir="auto" class="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800" placeholder="المقطع الأول | https://youtu.be/xxxxxxxxxxx&#10;المقطع الثاني | https://youtu.be/yyyyyyyyyyy">${escHtml(((it && it.clips) || []).map((c) => `${c.title} | ${c.url}`).join("\n"))}</textarea>
              <p class="text-[10px] text-slate-500 leading-relaxed"><i class="fa-brands fa-youtube text-rose-600 ml-1"></i>روابط يوتيوب تُعرض داخل المنصة ويُحسب كم شاهد الطالب — ارفع المقطع على يوتيوب كـ<b>«غير مُدرج»</b> (وليس «خاص»). الروابط الأخرى تُفتح خارج المنصة.</p>
            </div>

            <div id="ce-sec-reading" class="${type === "reading" ? "" : "hidden"} space-y-2 bg-teal-50/40 border border-teal-200 rounded-2xl p-3">
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">عدد الصفحات:</label>
                  <input id="ce-pages-count" type="number" min="0" value="${v("pagesCount")}" class="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-800" placeholder="12">
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">الصفحات:</label>
                  <input id="ce-pages-range" maxlength="60" value="${v("pagesRange")}" class="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-800" placeholder="من ص 10 إلى ص 22">
                </div>
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">المحتويات:</label>
                <textarea id="ce-reading-content" rows="3" maxlength="1500" class="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800" placeholder="الموضوعات التي يجب قراءتها...">${v("contentText")}</textarea>
              </div>
              <p class="text-[10px] text-slate-500"><i class="fa-solid fa-bell text-teal-600 ml-1"></i>يصل الطلاب تنبيه عند الإضافة، وتذكير قبل موعد البرنامج بيوم.</p>
            </div>

            <button onclick="content.saveEditor()" class="w-full py-2.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-black rounded-xl transition">
              <i class="fa-solid fa-check ml-1"></i> ${it ? "حفظ التعديل" : "نشر للطلاب"}
            </button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", html);
  }

  function switchEditorType(type) {
    state.contentNewType = type;
    ["sheet", "media", "reading"].forEach((k) => {
      const el = document.getElementById("ce-sec-" + k);
      if (el) el.classList.toggle("hidden", k !== type);
    });
    const lbl = document.getElementById("ce-due-label");
    if (lbl) lbl.textContent = type === "reading" ? "موعد البرنامج:" : "آخر موعد (اختياري):";
  }

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
  }

  function saveEditor() {
    const modal = document.getElementById("content-editor-modal");
    const editingId = modal ? modal.getAttribute("data-item") : "";
    const existing = editingId ? findItem(editingId) : null;
    if (existing && !canManage(existing)) return;

    const typeEl = document.querySelector('input[name="ce-type"]:checked');
    const type = existing ? existing.type : typeEl ? typeEl.value : "sheet";
    const programId = existing ? existing.programId : val("ce-program");
    if (!staffPrograms().some((p) => p.id === programId)) {
      alert("اختر برنامجاً من برامجك.");
      return;
    }
    const title = cleanText(val("ce-title"), 120);
    if (!title) {
      alert("اكتب العنوان.");
      return;
    }
    const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(val("ce-due")) ? val("ce-due") : "";
    const now = Date.now();
    const item = existing || {
      id: makeUniqueId("cnt"),
      type,
      programId,
      createdBy: me().id,
      createdByName: cleanText(me().name, 80),
      ts: now,
      archived: false,
    };
    item.title = title;
    item.description = multiline(val("ce-desc"), 800);
    item.dueDate = dueDate;

    if (type === "sheet") {
      const paper = (document.getElementById("ce-mode-paper") || {}).checked;
      const online = (document.getElementById("ce-mode-online") || {}).checked;
      if (!paper && !online) {
        alert("اختر طريقة تسليم واحدة على الأقل.");
        return;
      }
      const url = val("ce-sheet-url").trim();
      if (url && !safeUrl(url)) {
        alert("رابط الورقة يجب أن يبدأ بـ https://");
        return;
      }
      const lines = multiline(val("ce-questions"), 3000)
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 20);
      if (online && !lines.length) {
        alert("اكتب سؤالاً واحداً على الأقل للتعبئة الإلكترونية.");
        return;
      }
      const old = item.questions || [];
      item.sheetUrl = safeUrl(url);
      item.modes = { paper: Boolean(paper), online: Boolean(online) };
      // نُبقي معرّفات الأسئلة الموجودة حتى لا تضيع إجابات سابقة
      item.questions = online
        ? lines.map((text, i) => ({ id: (old[i] && old[i].id) || "q" + (i + 1) + "_" + now.toString(36), text: cleanText(text, 300) }))
        : old;
    } else if (type === "media") {
      const lines = String(val("ce-clips") || "")
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 30);
      const old = item.clips || [];
      const clips = [];
      for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/https?:\/\/\S+/i);
        if (!m) {
          alert(`السطر ${i + 1} لا يحتوي على رابط يبدأ بـ https://`);
          return;
        }
        const url = m[0];
        let t = cleanText(lines[i].replace(url, "").replace(/[|\-–—:]+\s*$/, "").replace(/^\s*[|\-–—:]+/, ""), 120);
        if (!t) t = `المقطع ${i + 1}`;
        const prev = old.find((c) => c.url === url);
        clips.push({ id: prev ? prev.id : "c" + (i + 1) + "_" + now.toString(36), title: t, url, ytId: youtubeId(url) });
      }
      if (!clips.length) {
        alert("أضف رابط مقطع واحد على الأقل.");
        return;
      }
      item.clips = clips;
    } else if (type === "reading") {
      const pc = parseInt(normalizeDigits(val("ce-pages-count")), 10);
      item.pagesCount = isFinite(pc) && pc > 0 ? pc : null;
      item.pagesRange = cleanText(val("ce-pages-range"), 60);
      item.contentText = multiline(val("ce-reading-content"), 1500);
      if (!dueDate) {
        alert("حدد موعد البرنامج حتى يصل التذكير للطلاب قبله.");
        return;
      }
      if (existing && existing.dueDate !== dueDate) item.reminderSentAt = null;
    }
    item.updatedAt = now;

    if (!existing) {
      allItems().push(item);
      notifyStudents(
        programId,
        `${NEW_TITLE[type]}: ${title}`,
        type === "reading"
          ? `موعد البرنامج: ${dateText(dueDate)}${item.pagesCount ? ` — ${item.pagesCount} صفحة` : ""}`
          : item.description || "افتح «دروسي وتكاليفي» في المنصة",
        null,
      );
      persist("contentItems", "notifications");
      logAudit("إضافة " + TYPES[type].label, title);
    } else {
      persist("contentItems");
      logAudit("تعديل " + TYPES[type].label, title);
    }
    state.contentProgram = programId;
    closeModal("content-editor-modal");
    runReadingReminders();
    navigateTo("content");
  }

  function archiveItem(id) {
    const it = findItem(id);
    if (!canManage(it)) return;
    if (!confirm(`إخفاء «${it.title}» عن الطلاب؟\nيبقى تقدّم الطلاب محفوظاً.`)) return;
    it.archived = true;
    it.updatedAt = Date.now();
    persist("contentItems");
    logAudit("إخفاء درس/تكليف", it.title);
    navigateTo("content");
  }

  // =====================================================================
  // الشاشة الرئيسية
  // =====================================================================
  function renderView() {
    return isStaff() ? renderStaff() : renderStudent();
  }

  function typeChip(type) {
    const t = TYPES[type] || TYPES.sheet;
    return `<span class="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600"><i class="fa-solid ${t.icon}" style="color:${t.color}"></i>${t.label}</span>`;
  }

  function renderStaff() {
    const progs = staffPrograms();
    if (!progs.length) {
      return '<div class="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 text-xs">لا توجد برامج مسندة إليك.</div>';
    }
    let pid = state.contentProgram;
    if (!progs.some((p) => p.id === pid)) {
      pid = progs.some((p) => p.id === state.currentProgramId) ? state.currentProgramId : progs[0].id;
      state.contentProgram = pid;
    }
    const items = itemsForProgram(pid);
    const students = programStudents(pid);
    const ids = students.map((s) => s.id);
    const ready = ids.every((id) => loaded[id]);
    if (!ready) {
      loadProgress(ids).then(() => {
        if (state.currentView === "content") navigateTo("content");
      });
    }

    const cards = items
      .map((it) => {
        const doneN = ready ? students.filter((s) => statusOf(it, s.id).done).length : null;
        const pct = ready && students.length ? Math.round((doneN / students.length) * 100) : 0;
        return `
        <div class="p-4 rounded-2xl border border-slate-200 bg-white space-y-2.5">
          <div class="flex justify-between items-start gap-2">
            <div class="min-w-0">
              ${typeChip(it.type)}
              <h4 class="font-black text-sm text-slate-800 mt-1.5">${escHtml(it.title)}</h4>
              <div class="text-[10px] text-slate-400 mt-0.5">${escHtml(it.createdByName || "")}${it.dueDate ? ` · ${it.type === "reading" ? "موعد البرنامج" : "آخر موعد"}: ${escHtml(dateText(it.dueDate))}` : ""}</div>
            </div>
            <div class="flex gap-1 shrink-0">
              <button onclick="content.openEditor('${it.id}')" title="تعديل" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"><i class="fa-solid fa-pen text-[10px]"></i></button>
              <button onclick="content.archiveItem('${it.id}')" title="إخفاء" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600"><i class="fa-solid fa-eye-slash text-[10px]"></i></button>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
              <span>${it.type === "reading" ? "قرأ" : it.type === "media" ? "أنهى المشاهدة" : "سلّم"}</span>
              <span>${ready ? `${doneN} من ${students.length}` : "جارِ التحميل..."}</span>
            </div>
            <div class="h-2 rounded-full bg-slate-100 overflow-hidden"><div class="h-full rounded-full" style="width:${pct}%;background:${(TYPES[it.type] || TYPES.sheet).color}"></div></div>
          </div>
          <button onclick="content.openProgress('${it.id}')" class="w-full py-2 bg-slate-50 hover:bg-[#0B2533] hover:text-white text-slate-700 text-[11px] font-black rounded-xl border border-slate-200 transition">
            <i class="fa-solid fa-users ml-1"></i> متابعة الطلاب
          </button>
        </div>`;
      })
      .join("");

    return `
      <div class="space-y-4">
        <div class="bg-gradient-to-r from-[#0B2533] to-[#2B1736] rounded-3xl p-5 text-white border-t-4 border-t-[#D4A359] flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <span class="inline-block bg-[#D4A359] text-[#0B2533] text-[11px] font-black px-3 py-0.5 rounded-full mb-1.5">الدروس والتكاليف</span>
            <h2 class="text-xl font-black">أوراق التكاليف · المقاطع · القراءات القبلية</h2>
            <p class="text-xs text-slate-300 mt-0.5">أضف للطلاب وتابع من سلّم ومن شاهد ومن قرأ.</p>
          </div>
          <button onclick="content.openEditor()" class="px-4 py-2.5 bg-[#D4A359] hover:bg-white text-[#0B2533] font-black rounded-xl text-xs transition shrink-0"><i class="fa-solid fa-plus ml-1"></i> إضافة جديد</button>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          ${
            progs.length > 1
              ? `<select onchange="content.setProgram(this.value)" class="bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700">
                  ${progs.map((p) => `<option value="${p.id}" ${p.id === pid ? "selected" : ""}>برنامج ${escHtml(p.name)}</option>`).join("")}
                </select>`
              : `<span class="text-xs font-black text-slate-600">برنامج ${escHtml(programName(pid))}</span>`
          }
          <span class="text-[11px] text-slate-400">${students.length} طالب</span>
          <button onclick="content.refresh()" class="mr-auto px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-rotate ml-1"></i> تحديث المتابعة</button>
        </div>

        ${
          items.length === 0
            ? `<div class="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center">
                <i class="fa-solid fa-book-open text-3xl text-slate-300"></i>
                <div class="text-slate-500 text-xs font-bold mt-2">لا توجد دروس أو تكاليف لهذا البرنامج بعد</div>
                <button onclick="content.openEditor()" class="mt-3 px-4 py-2 bg-[#0B2533] text-white text-xs font-bold rounded-xl">إضافة أول عنصر</button>
              </div>`
            : `<div class="grid grid-cols-1 md:grid-cols-2 gap-3">${cards}</div>`
        }
      </div>`;
  }

  function setProgram(pid) {
    state.contentProgram = pid;
    navigateTo("content");
  }

  function refresh() {
    const pid = state.contentProgram;
    const ids = programStudents(pid).map((s) => s.id);
    loadProgress(ids, true).then(() => {
      if (state.currentView === "content") navigateTo("content");
      const m = document.getElementById("content-progress-modal");
      if (m) openProgress(m.getAttribute("data-item"));
    });
  }

  // متابعة طلاب عنصر واحد (المشرف)
  function openProgress(itemId) {
    const it = findItem(itemId);
    if (!canManage(it)) return;
    const students = programStudents(it.programId);
    const ids = students.map((s) => s.id);
    if (!ids.every((id) => loaded[id])) {
      loadProgress(ids).then(() => openProgress(itemId));
      return;
    }
    closeModal("content-progress-modal");
    const rows = students
      .map((s) => {
        const st = statusOf(it, s.id);
        const e = entry(s.id, it.id) || {};
        let actions = "";
        if (it.type === "sheet") {
          if ((it.modes || {}).paper) {
            actions += e.paperReceivedAt
              ? `<button onclick="content.markPaper('${it.id}','${s.id}',false)" class="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black"><i class="fa-solid fa-check ml-1"></i>استُلمت</button>`
              : `<button onclick="content.markPaper('${it.id}','${s.id}',true)" class="px-2 py-1 rounded-lg bg-slate-100 hover:bg-[#0B2533] hover:text-white text-slate-600 text-[10px] font-black">تعليم كمستلمة</button>`;
          }
          if ((it.modes || {}).online && e.submittedAt) {
            actions += `<button onclick="content.viewAnswers('${it.id}','${s.id}')" class="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black">الإجابات</button>`;
          }
        }
        return `
        <tr class="border-t border-slate-100">
          <td class="p-2 font-bold text-slate-800">${escHtml(s.name)}</td>
          <td class="p-2"><span class="text-[10px] font-black px-2 py-0.5 rounded-lg border ${st.done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : st.pct > 0 || /بدأ/.test(st.label) ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-slate-50 text-slate-500 border-slate-200"}">${escHtml(st.label)}</span></td>
          <td class="p-2"><div class="flex gap-1 justify-end">${actions}</div></td>
        </tr>`;
      })
      .join("");
    const doneN = students.filter((s) => statusOf(it, s.id).done).length;
    const html = `
      <div id="content-progress-modal" data-item="${it.id}" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-start pt-8 px-4 overflow-y-auto">
        <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full overflow-hidden border-t-4 border-t-[#D4A359] mb-8">
          <div class="bg-[#0B2533] text-white px-5 py-4 flex justify-between items-center border-b border-[#D4A359]">
            <div>
              <div class="text-[10px] text-[#D4A359] font-bold">${escHtml((TYPES[it.type] || {}).label || "")} · ${doneN} من ${students.length}</div>
              <h3 class="font-bold text-sm">${escHtml(it.title)}</h3>
            </div>
            <button onclick="closeModal('content-progress-modal')" class="text-slate-300 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="p-4">
            ${
              students.length === 0
                ? '<div class="text-center py-6 text-slate-400 text-xs">لا يوجد طلاب في هذا البرنامج</div>'
                : `<div class="overflow-x-auto rounded-2xl border border-slate-200"><table class="w-full text-xs text-right"><tbody>${rows}</tbody></table></div>`
            }
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", html);
  }

  async function markPaper(itemId, studentId, received) {
    const it = findItem(itemId);
    if (!canManage(it)) return;
    const ok = await saveEntry(studentId, itemId, {
      paperReceivedAt: received ? Date.now() : null,
      paperReceivedBy: received ? cleanText(me().name, 80) : null,
    });
    if (ok) {
      openProgress(itemId);
      if (state.currentView === "content") navigateTo("content");
    }
  }

  function viewAnswers(itemId, studentId) {
    const it = findItem(itemId);
    if (!canManage(it)) return;
    const st = (db.users || []).find((u) => u.id === studentId);
    const e = entry(studentId, itemId) || {};
    closeModal("content-answers-modal");
    const html = `
      <div id="content-answers-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-start pt-10 px-4 overflow-y-auto">
        <div class="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border-t-4 border-t-[#D4A359] mb-8">
          <div class="bg-[#0B2533] text-white px-5 py-4 flex justify-between items-center">
            <div>
              <div class="text-[10px] text-[#D4A359] font-bold">إجابات ${escHtml(st ? st.name : "")}</div>
              <h3 class="font-bold text-sm">${escHtml(it.title)}</h3>
            </div>
            <button onclick="closeModal('content-answers-modal')" class="text-slate-300 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="p-5 space-y-3 text-xs">
            ${(it.questions || [])
              .map(
                (q, i) => `
              <div>
                <div class="font-black text-slate-700 mb-1">${i + 1}. ${escHtml(q.text)}</div>
                <div class="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 whitespace-pre-line">${escHtml(((e.answers || {})[q.id]) || "—")}</div>
              </div>`,
              )
              .join("")}
            <div class="text-[10px] text-slate-400">سُلّمت: ${e.submittedAt ? escHtml(new Date(e.submittedAt).toLocaleString("ar-SA")) : "—"}</div>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", html);
  }

  // =====================================================================
  // الطالب
  // =====================================================================
  function renderStudent() {
    const u = me();
    const pid = u.currentProgramId;
    const items = itemsForProgram(pid);
    if (!loaded[u.id]) {
      loadProgress([u.id]).then(() => {
        if (state.currentView === "content") navigateTo("content");
      });
    }
    const ready = Boolean(loaded[u.id]);
    const pending = ready ? items.filter((it) => !statusOf(it, u.id).done) : items;
    const done = ready ? items.filter((it) => statusOf(it, u.id).done) : [];

    const card = (it) => {
      const st = ready ? statusOf(it, u.id) : { done: false, label: "...", pct: 0 };
      const overdue = !st.done && it.dueDate && it.dueDate < todayStr();
      return `
        <button onclick="content.openStudentItem('${it.id}')" class="w-full text-right p-4 rounded-2xl border ${st.done ? "border-emerald-200 bg-emerald-50/30" : overdue ? "border-rose-200 bg-rose-50/30" : "border-slate-200 bg-white"} hover:shadow-md transition space-y-2">
          <div class="flex justify-between items-center gap-2">
            ${typeChip(it.type)}
            <span class="text-[10px] font-black ${st.done ? "text-emerald-700" : overdue ? "text-rose-700" : "text-slate-500"}">${st.done ? '<i class="fa-solid fa-circle-check ml-1"></i>' : ""}${escHtml(st.label)}</span>
          </div>
          <div class="font-black text-sm text-slate-800">${escHtml(it.title)}</div>
          ${it.dueDate ? `<div class="text-[10px] ${overdue ? "text-rose-600 font-bold" : "text-slate-400"}">${it.type === "reading" ? "موعد البرنامج" : "آخر موعد"}: ${escHtml(dateText(it.dueDate))}</div>` : ""}
          ${it.type === "media" && ready ? `<div class="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div class="h-full rounded-full bg-[#9E1B48]" style="width:${Math.round(st.pct * 100)}%"></div></div>` : ""}
        </button>`;
    };

    return `
      <div class="space-y-4">
        <div class="bg-gradient-to-r from-[#0B2533] to-[#2B1736] rounded-3xl p-5 text-white border-t-4 border-t-[#D4A359]">
          <span class="inline-block bg-[#D4A359] text-[#0B2533] text-[11px] font-black px-3 py-0.5 rounded-full mb-1.5">دروسي وتكاليفي</span>
          <h2 class="text-xl font-black">${ready ? `أنجزت ${done.length} من ${items.length}` : "مرحباً بك"}</h2>
          <p class="text-xs text-slate-300 mt-0.5">أوراق التكاليف والمقاطع والقراءات القبلية الخاصة ببرنامجك.</p>
        </div>
        ${
          items.length === 0
            ? '<div class="bg-white rounded-3xl border border-slate-200 p-10 text-center text-slate-400 text-xs">لا توجد دروس أو تكاليف حالياً</div>'
            : `
          ${pending.length ? `<div><h3 class="font-black text-[#0B2533] text-sm mb-2"><i class="fa-solid fa-hourglass-half text-[#D4A359] ml-1.5"></i> مطلوب منك (${pending.length})</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-3">${pending.map(card).join("")}</div></div>` : ""}
          ${done.length ? `<div><h3 class="font-black text-emerald-800 text-sm mb-2"><i class="fa-solid fa-circle-check ml-1.5"></i> أنجزته (${done.length})</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-3">${done.map(card).join("")}</div></div>` : ""}`
        }
      </div>`;
  }

  function openStudentItem(itemId) {
    const u = me();
    const it = findItem(itemId);
    if (!it || it.archived || it.programId !== u.currentProgramId) return;
    closeStudentItem();
    const e = entry(u.id, it.id) || {};
    let body = "";

    if (it.description) {
      body += `<div class="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 rounded-2xl border border-slate-200 p-3">${escHtml(it.description)}</div>`;
    }

    if (it.type === "sheet") {
      const modes = it.modes || {};
      if (it.sheetUrl) {
        body += `<a href="${escHtml(it.sheetUrl)}" target="_blank" rel="noopener" class="flex items-center justify-center gap-2 w-full py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-black rounded-xl text-xs"><i class="fa-solid fa-file-arrow-down"></i> فتح الورقة / طباعتها</a>`;
      }
      if (modes.paper) {
        body += `
          <div class="rounded-2xl border p-3 text-xs ${e.paperReceivedAt ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-white border-slate-200 text-slate-600"}">
            <i class="fa-solid fa-print ml-1"></i>
            ${e.paperReceivedAt ? `استلم المشرف ورقتك ✓ (${escHtml(e.paperReceivedBy || "")})` : "التسليم الورقي: اطبع الورقة وعبّئها ثم سلّمها لمشرفك."}
          </div>`;
      }
      if (modes.online) {
        body += `
          <div class="space-y-3">
            <div class="font-black text-slate-800 text-xs"><i class="fa-solid fa-keyboard text-[#D4A359] ml-1"></i> التعبئة الإلكترونية${e.submittedAt ? ' <span class="text-emerald-700">— سُلّمت ✓ (يمكنك التعديل)</span>' : ""}</div>
            ${(it.questions || [])
              .map(
                (q, i) => `
              <div>
                <label class="block font-bold text-slate-700 text-xs mb-1">${i + 1}. ${escHtml(q.text)}</label>
                <textarea id="ans-${q.id}" rows="2" maxlength="1500" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#D4A359]">${escHtml(((e.answers || {})[q.id]) || "")}</textarea>
              </div>`,
              )
              .join("")}
            <button onclick="content.submitAnswers('${it.id}')" class="w-full py-2.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-black rounded-xl text-xs transition"><i class="fa-solid fa-paper-plane ml-1"></i> ${e.submittedAt ? "تحديث الإجابات" : "تسليم الإجابات"}</button>
          </div>`;
      }
    } else if (it.type === "media") {
      body += (it.clips || [])
        .map((c, i) => {
          const ce = (e.clips || {})[c.id] || {};
          const done = ce.doneAt || (ce.pct || 0) >= DONE_PCT;
          const pct = Math.round(Math.min(1, ce.pct || 0) * 100);
          return `
          <div class="rounded-2xl border border-slate-200 overflow-hidden">
            <div class="flex justify-between items-center px-3 py-2 bg-slate-50">
              <span class="font-black text-xs text-slate-800">${i + 1}. ${escHtml(c.title)}</span>
              <span id="clip-st-${c.id}" class="text-[10px] font-black ${done ? "text-emerald-700" : "text-slate-500"}">${done ? "✓ أنهيته" : pct ? pct + "%" : "لم يبدأ"}</span>
            </div>
            ${
              c.ytId
                ? `<div class="aspect-video bg-black"><div id="yt-${c.id}" data-yt="${escHtml(c.ytId)}" data-clip="${c.id}" class="w-full h-full"></div></div>`
                : `<div class="p-3 flex gap-2">
                    <a href="${escHtml(safeUrl(c.url))}" target="_blank" rel="noopener" onclick="content.markOpened('${it.id}')" class="flex-1 text-center py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-black rounded-xl text-xs"><i class="fa-solid fa-up-right-from-square ml-1"></i> فتح المقطع</a>
                    ${done ? "" : `<button onclick="content.markClipDone('${it.id}','${c.id}')" class="px-3 py-2 bg-[#0B2533] text-white font-black rounded-xl text-xs">أنهيته</button>`}
                  </div>`
            }
          </div>`;
        })
        .join("");
    } else if (it.type === "reading") {
      body += `
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="rounded-2xl bg-teal-50 border border-teal-200 p-3 text-center"><div class="text-[10px] text-teal-700 font-bold">عدد الصفحات</div><div class="text-lg font-black text-teal-900">${it.pagesCount || "—"}</div></div>
          <div class="rounded-2xl bg-teal-50 border border-teal-200 p-3 text-center"><div class="text-[10px] text-teal-700 font-bold">الصفحات</div><div class="text-sm font-black text-teal-900">${escHtml(it.pagesRange || "—")}</div></div>
        </div>
        ${it.contentText ? `<div><div class="font-black text-slate-700 text-xs mb-1">المحتويات:</div><div class="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 rounded-2xl border border-slate-200 p-3">${escHtml(it.contentText)}</div></div>` : ""}
        ${
          e.readAt
            ? `<button onclick="content.markRead('${it.id}', false)" class="w-full py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-black rounded-xl text-xs"><i class="fa-solid fa-circle-check ml-1"></i> قرأتها ✓ (اضغط للتراجع)</button>`
            : `<button onclick="content.markRead('${it.id}', true)" class="w-full py-2.5 bg-[#0B2533] hover:bg-[#169BA2] text-white font-black rounded-xl text-xs transition"><i class="fa-solid fa-check ml-1"></i> قرأت</button>`
        }`;
    }

    const html = `
      <div id="content-student-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-start pt-8 px-4 overflow-y-auto">
        <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden border-t-4 border-t-[#D4A359] mb-8">
          <div class="bg-[#0B2533] text-white px-5 py-4 flex justify-between items-center border-b border-[#D4A359]">
            <div>
              <div class="text-[10px] text-[#D4A359] font-bold">${escHtml((TYPES[it.type] || {}).label || "")}${it.dueDate ? ` · ${it.type === "reading" ? "موعد البرنامج" : "آخر موعد"}: ${escHtml(dateText(it.dueDate))}` : ""}</div>
              <h3 class="font-bold text-sm">${escHtml(it.title)}</h3>
            </div>
            <button onclick="content.closeStudentItem()" class="text-slate-300 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="p-5 space-y-3">${body}</div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", html);
    if (it.type === "media") mountPlayers(it);
  }

  function closeStudentItem() {
    destroyPlayers();
    closeModal("content-student-modal");
    if (state.currentView === "content") navigateTo("content");
  }

  async function submitAnswers(itemId) {
    const u = me();
    const it = findItem(itemId);
    if (!it || it.type !== "sheet" || it.programId !== u.currentProgramId) return;
    const answers = {};
    let filled = 0;
    (it.questions || []).forEach((q) => {
      const el = document.getElementById("ans-" + q.id);
      const a = multiline(el ? el.value : "", 1500);
      answers[q.id] = a;
      if (a) filled++;
    });
    if (!filled) {
      alert("اكتب إجابتك أولاً.");
      return;
    }
    if (filled < (it.questions || []).length && !confirm("بعض الأسئلة بلا إجابة. هل تريد التسليم؟")) return;
    const ok = await saveEntry(u.id, it.id, { answers, submittedAt: Date.now() });
    if (ok) {
      alert("تم تسليم إجاباتك ✓");
      closeStudentItem();
    }
  }

  async function markRead(itemId, read) {
    const u = me();
    const it = findItem(itemId);
    if (!it || it.type !== "reading" || it.programId !== u.currentProgramId) return;
    const ok = await saveEntry(u.id, it.id, { readAt: read ? Date.now() : null });
    if (ok) {
      closeStudentItem();
      openStudentItem(itemId);
    }
  }

  function markOpened(itemId) {
    const u = me();
    const e = entry(u.id, itemId) || {};
    if (!e.openedAt) saveEntry(u.id, itemId, { openedAt: Date.now() });
  }

  async function markClipDone(itemId, clipId) {
    const u = me();
    const ok = await saveEntry(u.id, itemId, {
      openedAt: (entry(u.id, itemId) || {}).openedAt || Date.now(),
      clips: { [clipId]: { pct: 1, doneAt: Date.now() } },
    });
    if (ok) {
      closeStudentItem();
      openStudentItem(itemId);
    }
  }

  // ---------- مشغّل يوتيوب داخل المنصة مع تتبّع المشاهدة ----------
  const yt = { loading: null, players: [], timers: [] };

  function loadYouTubeApi() {
    if (window.YT && window.YT.Player) return Promise.resolve();
    if (yt.loading) return yt.loading;
    yt.loading = new Promise((resolve, reject) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prev === "function") {
          try {
            prev();
          } catch (e) {}
        }
        resolve();
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.onerror = () => {
        yt.loading = null;
        reject(new Error("yt-load"));
      };
      document.head.appendChild(s);
      setTimeout(() => reject(new Error("yt-timeout")), 15000);
    });
    return yt.loading;
  }

  function mountPlayers(it) {
    const holders = Array.from(document.querySelectorAll("#content-student-modal [data-yt]"));
    if (!holders.length) return;
    loadYouTubeApi()
      .then(() => {
        holders.forEach((h) => {
          if (!document.body.contains(h)) return;
          const clipId = h.getAttribute("data-clip");
          let best = (((entry(me().id, it.id) || {}).clips || {})[clipId] || {}).pct || 0;
          let savedStep = Math.floor(best * 4); // نحفظ عند كل ربع
          let timer = null;
          const update = (player, force) => {
            try {
              const d = player.getDuration();
              const t = player.getCurrentTime();
              if (!d) return;
              const p = Math.min(1, t / d);
              if (p > best) best = p;
              const lbl = document.getElementById("clip-st-" + clipId);
              if (lbl) {
                const done = best >= DONE_PCT;
                lbl.textContent = done ? "✓ أنهيته" : Math.round(best * 100) + "%";
                lbl.className = "text-[10px] font-black " + (done ? "text-emerald-700" : "text-slate-500");
              }
              const step = best >= DONE_PCT ? 4 : Math.floor(best * 4);
              if (force || step > savedStep) {
                savedStep = step;
                const patch = { clips: { [clipId]: { pct: Math.round(best * 100) / 100 } } };
                if (best >= DONE_PCT) patch.clips[clipId].doneAt = Date.now();
                if (!(entry(me().id, it.id) || {}).openedAt) patch.openedAt = Date.now();
                saveEntry(me().id, it.id, patch);
              }
            } catch (e) {}
          };
          const player = new window.YT.Player(h.id, {
            videoId: h.getAttribute("data-yt"),
            width: "100%",
            height: "100%",
            playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
            events: {
              onStateChange: (ev) => {
                if (ev.data === 1) {
                  if (!timer) {
                    timer = setInterval(() => update(player, false), 3000);
                    yt.timers.push(timer);
                  }
                } else {
                  if (timer) {
                    clearInterval(timer);
                    timer = null;
                  }
                  if (ev.data === 0) {
                    best = 1;
                    update(player, true);
                  } else if (ev.data === 2) {
                    update(player, false);
                  }
                }
              },
            },
          });
          yt.players.push(player);
        });
      })
      .catch(() => {
        // تعذّر تحميل مشغّل يوتيوب: نعرض المقطع عادياً مع زر "أنهيته" اليدوي
        holders.forEach((h) => {
          const clipId = h.getAttribute("data-clip");
          const id = h.getAttribute("data-yt");
          h.outerHTML = `<iframe class="w-full h-full" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}" allowfullscreen></iframe>
            <button onclick="content.markClipDone('${it.id}','${clipId}')" class="w-full py-2 bg-[#0B2533] text-white text-xs font-black">أنهيت هذا المقطع</button>`;
        });
      });
  }

  function destroyPlayers() {
    yt.timers.forEach((t) => clearInterval(t));
    yt.timers = [];
    yt.players.forEach((p) => {
      try {
        p.destroy();
      } catch (e) {}
    });
    yt.players = [];
  }

  // ملخص إنجاز طالب (لولي الأمر): يحمّل وثيقة تقدّمه مرة واحدة ثم يعيد رسم الشاشة
  function studentSummary(student) {
    if (!student) return { ready: false, done: 0, total: 0 };
    const items = itemsForProgram(student.currentProgramId);
    if (!loaded[student.id]) {
      const view = state.currentView;
      loadProgress([student.id]).then(() => {
        if (state.currentView === view) navigateTo(view);
      });
      return { ready: false, done: 0, total: items.length };
    }
    return {
      ready: true,
      done: items.filter((it) => statusOf(it, student.id).done).length,
      total: items.length,
    };
  }

  return {
    studentSummary,
    renderView,
    openEditor,
    switchEditorType,
    saveEditor,
    archiveItem,
    setProgram,
    refresh,
    openProgress,
    markPaper,
    viewAnswers,
    openStudentItem,
    closeStudentItem,
    submitAnswers,
    markRead,
    markOpened,
    markClipDone,
    runReadingReminders,
  };
})();
