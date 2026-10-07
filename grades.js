/**
 * grades.js - الدرجات
 *
 *  - المدير يحدد "بنود الدرجات": اسم البند + درجته بالموجب (تُضاف) أو بالسالب (تُخصم)،
 *    لكل البرامج أو لبرنامج محدد.
 *  - المشرف (أو المدير) يضيف البند للطالب، ويمكن تكراره (مثلاً: تأخّر 3 مرات = −6).
 *  - مجموع الطالب يُحسب تلقائياً، ويظهر للطالب في "تقريري".
 *  - استيراد من Excel متاح فقط بعد وجود بنود: لكل عمود يُختار البند وهل الرقم "درجة" أم "عدد مرات".
 *
 * البيانات (حجمها محدود مهما كثر الرصد):
 *  appSettings.app.gradeItems : [{ id, name, value, programId|null, archived, createdAt }]
 *  db.gradeTotals : مجموع لكل (فصل، طالب، بند) { id, termId, studentId, itemId, count, points, updatedAt }
 *  db.gradeLog    : آخر 1500 عملية رصد (للعرض والتراجع) { id, termId, studentId, itemId, itemName,
 *                   value, times, points, note, by, byName, batchId, ts, updatedAt, undone }
 */

window.grades = (function () {
  const LOG_MAX = 1500;
  const MAX_ABS_VALUE = 1000;

  // ---------- أدوات ----------
  function fmt(n) {
    const v = Math.round((Number(n) || 0) * 100) / 100;
    return (v > 0 ? "+" : "") + v;
  }

  function badgeClass(n) {
    if (n > 0) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (n < 0) return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  }

  function toNumber(v) {
    const s = normalizeDigits(String(v == null ? "" : v))
      .replace(/[٫,]/g, ".")
      .replace(/[^\d.\-−]/g, "")
      .replace("−", "-");
    if (s === "" || s === "-" || s === ".") return NaN;
    return Number(s);
  }

  function me() {
    return state.currentUser;
  }

  function isAdmin() {
    return Boolean(me() && me().role === "admin");
  }

  function termId() {
    const t = getAppSettings().currentTerm;
    return (t && t.id) || "default";
  }

  function programName(pid) {
    const p = (db.programs || []).find((x) => x.id === pid);
    return p ? p.name : "";
  }

  // ---------- البنود ----------
  function allItems() {
    const app = getAppSettings();
    if (!Array.isArray(app.gradeItems)) app.gradeItems = [];
    return app.gradeItems;
  }

  function activeItems() {
    return allItems().filter((i) => i && !i.archived);
  }

  function itemsForStudent(student) {
    const pid = student && student.currentProgramId;
    return activeItems().filter((i) => !i.programId || i.programId === pid);
  }

  function findItem(id) {
    return allItems().find((i) => i && i.id === id) || null;
  }

  function addItem() {
    if (!isAdmin()) return;
    const nameEl = document.getElementById("gi-name");
    const valEl = document.getElementById("gi-value");
    const progEl = document.getElementById("gi-program");
    const name = cleanText(nameEl ? nameEl.value : "", 60);
    const value = Math.round(toNumber(valEl ? valEl.value : "") * 100) / 100;
    const programId = progEl && progEl.value ? progEl.value : null;

    if (!name) {
      alert("اكتب اسم البند.");
      return;
    }
    if (!isFinite(value) || value === 0) {
      alert("اكتب درجة البند: رقم موجب (يُضاف) أو سالب (يُخصم)، مثل 5 أو -2.");
      return;
    }
    if (Math.abs(value) > MAX_ABS_VALUE) {
      alert(`الدرجة كبيرة جداً (الحد ${MAX_ABS_VALUE}).`);
      return;
    }
    const dup = activeItems().some(
      (i) => i.name === name && (i.programId || null) === programId,
    );
    if (dup) {
      alert("يوجد بند بنفس الاسم لنفس البرنامج.");
      return;
    }
    allItems().push({
      id: makeUniqueId("gi"),
      name,
      value,
      programId,
      archived: false,
      createdAt: Date.now(),
    });
    persist("appSettings");
    logAudit("إضافة بند درجات", `${name} (${fmt(value)})`);
    navigateTo("grades");
  }

  // الحذف يُخفي البند فقط؛ الدرجات المرصودة به تبقى محسوبة في مجموع الطلاب
  function removeItem(id) {
    if (!isAdmin()) return;
    const it = findItem(id);
    if (!it) return;
    if (
      !confirm(
        `حذف البند «${it.name}»؟\nلن يظهر للرصد بعد الآن، وتبقى الدرجات التي رُصدت به سابقاً محسوبة.`,
      )
    )
      return;
    it.archived = true;
    persist("appSettings");
    logAudit("حذف بند درجات", it.name);
    navigateTo("grades");
  }

  // ---------- الطلاب والصلاحيات ----------
  function visibleStudents() {
    const u = me();
    if (!u) return [];
    const students = (db.users || []).filter((x) => x && x.role === "student");
    if (u.role === "admin") return students;
    if (u.role === "supervisor") {
      const progs = u.assignedPrograms || [];
      return students.filter((s) => progs.includes(s.currentProgramId));
    }
    return [];
  }

  function canGrade(student) {
    const u = me();
    if (!u || !student) return false;
    if (u.role === "admin") return true;
    if (u.role === "supervisor")
      return (u.assignedPrograms || []).includes(student.currentProgramId);
    return false;
  }

  // ---------- الحساب ----------
  function totalsOf(studentId, tId) {
    const t = tId || termId();
    return (db.gradeTotals || []).filter(
      (x) => x && x.studentId === studentId && x.termId === t,
    );
  }

  function studentTotal(studentId, tId) {
    return totalsOf(studentId, tId).reduce((s, x) => s + (Number(x.points) || 0), 0);
  }

  function studentOpsCount(studentId, tId) {
    return totalsOf(studentId, tId).reduce((s, x) => s + (Number(x.count) || 0), 0);
  }

  // التعديل الفعلي على المجاميع والسجل (بدون حفظ) — يُستدعى من الرصد والاستيراد
  function applyRaw(student, item, times, points, note, batchId) {
    if (!Array.isArray(db.gradeTotals)) db.gradeTotals = [];
    if (!Array.isArray(db.gradeLog)) db.gradeLog = [];
    const t = termId();
    const now = Date.now();
    const key = `${t}|${student.id}|${item.id}`;
    let tot = db.gradeTotals.find((x) => x && x.id === key);
    if (!tot) {
      tot = { id: key, termId: t, studentId: student.id, itemId: item.id, count: 0, points: 0 };
      db.gradeTotals.push(tot);
    }
    tot.count = (Number(tot.count) || 0) + times;
    tot.points = Math.round(((Number(tot.points) || 0) + points) * 100) / 100;
    tot.updatedAt = now;

    db.gradeLog.unshift({
      id: makeUniqueId("gl"),
      termId: t,
      studentId: student.id,
      studentName: student.name,
      itemId: item.id,
      itemName: item.name,
      value: item.value,
      times,
      points,
      note: note || "",
      by: me().id,
      byName: me().name,
      batchId: batchId || null,
      ts: now,
      updatedAt: now,
      undone: false,
    });
    if (db.gradeLog.length > LOG_MAX) db.gradeLog = db.gradeLog.slice(0, LOG_MAX);
  }

  function canUndo(entry) {
    const u = me();
    if (!u || !entry || entry.undone) return false;
    return u.role === "admin" || entry.by === u.id;
  }

  function undoRaw(entry) {
    const tot = (db.gradeTotals || []).find(
      (x) => x && x.id === `${entry.termId}|${entry.studentId}|${entry.itemId}`,
    );
    const now = Date.now();
    if (tot) {
      tot.count = Math.max(0, (Number(tot.count) || 0) - (Number(entry.times) || 0));
      tot.points =
        Math.round(((Number(tot.points) || 0) - (Number(entry.points) || 0)) * 100) / 100;
      tot.updatedAt = now;
    }
    entry.undone = true;
    entry.undoneBy = me().name;
    entry.updatedAt = now;
  }

  function undo(entryId) {
    const e = (db.gradeLog || []).find((x) => x && x.id === entryId);
    if (!canUndo(e)) return;
    if (!confirm(`التراجع عن «${e.itemName}» (${fmt(e.points)}) للطالب ${e.studentName}؟`))
      return;
    undoRaw(e);
    persist("gradeTotals", "gradeLog");
    logAudit("تراجع عن درجة", `${e.studentName}: ${e.itemName} ${fmt(e.points)}`);
    refreshOpenStudentModal(e.studentId);
    navigateTo(state.currentView);
  }

  function undoBatch(batchId) {
    if (!isAdmin() || !batchId) return;
    const entries = (db.gradeLog || []).filter((x) => x && x.batchId === batchId && !x.undone);
    if (!entries.length) return;
    if (!confirm(`التراجع عن الاستيراد كاملاً (${entries.length} عملية)؟`)) return;
    entries.forEach(undoRaw);
    persist("gradeTotals", "gradeLog");
    logAudit("تراجع عن استيراد درجات", `${entries.length} عملية`);
    navigateTo("grades");
  }

  // ---------- الرصد لطالب ----------
  function openApplyModal(studentId) {
    const st = (db.users || []).find((u) => u.id === studentId);
    if (!canGrade(st)) return;
    const items = itemsForStudent(st);
    if (!items.length) {
      alert(
        isAdmin()
          ? "لا توجد بنود درجات لبرنامج هذا الطالب. أضف البنود أولاً من أعلى الصفحة."
          : "لم يحدد المدير بنود الدرجات بعد.",
      );
      return;
    }
    closeModal("grade-apply-modal");
    const html = `
      <div id="grade-apply-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden border-t-4 border-t-[#D4A359]">
          <div class="bg-[#0B2533] text-white p-4 flex justify-between items-center border-b border-[#D4A359]">
            <div>
              <div class="text-[10px] text-[#D4A359] font-bold">إضافة بند درجات</div>
              <h3 class="font-bold text-sm">${escHtml(st.name)}</h3>
            </div>
            <button onclick="closeModal('grade-apply-modal')" class="text-slate-300 hover:text-white text-lg"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="p-5 space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">البند:</label>
              <select id="ga-item" onchange="grades.updateApplyPreview()" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800">
                ${items
                  .map(
                    (i) =>
                      `<option value="${i.id}" data-value="${i.value}">${escHtml(i.name)} (${fmt(i.value)})</option>`,
                  )
                  .join("")}
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">عدد المرات:</label>
                <input id="ga-times" type="number" min="1" max="50" value="1" oninput="grades.updateApplyPreview()" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800">
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">النتيجة:</label>
                <div id="ga-preview" class="w-full rounded-xl p-2.5 font-black text-center border"></div>
              </div>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">ملاحظة (اختياري):</label>
              <input id="ga-note" maxlength="120" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800" placeholder="مثال: مشاركة متميزة في الدرس">
            </div>
            <button onclick="grades.confirmApply('${st.id}')" class="w-full py-2.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-black rounded-xl transition">
              <i class="fa-solid fa-check ml-1"></i> اعتماد
            </button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", html);
    updateApplyPreview();
  }

  function readApplyForm() {
    const sel = document.getElementById("ga-item");
    const item = sel ? findItem(sel.value) : null;
    let times = parseInt(normalizeDigits((document.getElementById("ga-times") || {}).value || "1"), 10);
    if (!isFinite(times) || times < 1) times = 1;
    if (times > 50) times = 50;
    return { item, times };
  }

  function updateApplyPreview() {
    const box = document.getElementById("ga-preview");
    if (!box) return;
    const { item, times } = readApplyForm();
    const pts = item ? item.value * times : 0;
    box.textContent = fmt(pts);
    box.className = "w-full rounded-xl p-2.5 font-black text-center border " + badgeClass(pts);
  }

  function confirmApply(studentId) {
    const st = (db.users || []).find((u) => u.id === studentId);
    if (!canGrade(st)) return;
    const { item, times } = readApplyForm();
    if (!item || item.archived) {
      alert("اختر بنداً صحيحاً.");
      return;
    }
    const note = cleanText((document.getElementById("ga-note") || {}).value || "", 120);
    const points = Math.round(item.value * times * 100) / 100;
    applyRaw(st, item, times, points, note, null);
    persist("gradeTotals", "gradeLog");
    logAudit("رصد درجة", `${st.name}: ${item.name} ×${times} (${fmt(points)})`);
    closeModal("grade-apply-modal");
    refreshOpenStudentModal(st.id);
    navigateTo(state.currentView);
  }

  // ---------- تفاصيل طالب ----------
  function studentDetailsHtml(studentId) {
    const st = (db.users || []).find((u) => u.id === studentId);
    if (!st) return "";
    const tots = totalsOf(studentId).filter((x) => (Number(x.count) || 0) > 0 || (Number(x.points) || 0) !== 0);
    const total = studentTotal(studentId);
    const log = (db.gradeLog || [])
      .filter((x) => x && x.studentId === studentId && x.termId === termId())
      .slice(0, 30);
    return `
      <div class="flex items-center justify-between bg-slate-50 rounded-2xl border border-slate-200 p-3">
        <span class="font-bold text-slate-600">المجموع الحالي</span>
        <span class="text-xl font-black px-3 py-0.5 rounded-xl border ${badgeClass(total)}">${fmt(total)}</span>
      </div>
      <div>
        <div class="font-bold text-slate-700 mb-1.5">حسب البند:</div>
        ${
          tots.length === 0
            ? '<div class="text-slate-400">لا توجد درجات مرصودة بعد</div>'
            : tots
                .map((x) => {
                  const it = findItem(x.itemId);
                  return `
          <div class="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
            <span class="text-slate-800 font-bold">${escHtml(it ? it.name : "بند محذوف")} <span class="text-slate-400 font-normal">× ${x.count}</span></span>
            <span class="text-[11px] font-black px-2 py-0.5 rounded-lg border ${badgeClass(x.points)}">${fmt(x.points)}</span>
          </div>`;
                })
                .join("")
        }
      </div>
      <div>
        <div class="font-bold text-slate-700 mb-1.5">آخر العمليات:</div>
        ${
          log.length === 0
            ? '<div class="text-slate-400">لا يوجد</div>'
            : log.map((e) => logRowHtml(e, false)).join("")
        }
      </div>`;
  }

  function openStudentModal(studentId) {
    const st = (db.users || []).find((u) => u.id === studentId);
    if (!st) return;
    closeModal("grade-student-modal");
    const html = `
      <div id="grade-student-modal" data-student="${st.id}" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-start pt-10 px-4 overflow-y-auto">
        <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden border-t-4 border-t-[#D4A359] mb-8">
          <div class="bg-[#0B2533] text-white p-4 flex justify-between items-center border-b border-[#D4A359]">
            <div>
              <div class="text-[10px] text-[#D4A359] font-bold">تفاصيل الدرجات</div>
              <h3 class="font-bold text-sm">${escHtml(st.name)}</h3>
            </div>
            <div class="flex items-center gap-2">
              ${canGrade(st) ? `<button onclick="grades.openApplyModal('${st.id}')" class="px-3 py-1 bg-[#D4A359] text-[#0B2533] rounded-lg text-[11px] font-black"><i class="fa-solid fa-plus ml-1"></i> إضافة بند</button>` : ""}
              <button onclick="closeModal('grade-student-modal')" class="text-slate-300 hover:text-white text-lg"><i class="fa-solid fa-xmark"></i></button>
            </div>
          </div>
          <div id="grade-student-body" class="p-5 space-y-4 text-xs">${studentDetailsHtml(st.id)}</div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", html);
  }

  function refreshOpenStudentModal(studentId) {
    const m = document.getElementById("grade-student-modal");
    const body = document.getElementById("grade-student-body");
    if (m && body && m.getAttribute("data-student") === studentId) {
      body.innerHTML = studentDetailsHtml(studentId);
    }
  }

  function logRowHtml(e, showStudent) {
    const when = new Date(e.ts || 0).toLocaleString("ar-SA", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
    return `
      <div class="flex justify-between items-start gap-2 py-1.5 border-b border-slate-100 last:border-0 ${e.undone ? "opacity-50" : ""}">
        <div class="min-w-0">
          <div class="font-bold text-slate-800 ${e.undone ? "line-through" : ""}">
            ${showStudent ? escHtml(e.studentName || "") + " — " : ""}${escHtml(e.itemName || "")}${e.times > 1 ? ` × ${e.times}` : ""}
          </div>
          <div class="text-[10px] text-slate-400">${escHtml(e.byName || "")} · ${escHtml(when)}${e.note ? " · " + escHtml(e.note) : ""}${e.undone ? " · تم التراجع" : ""}</div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="text-[11px] font-black px-2 py-0.5 rounded-lg border ${badgeClass(e.points)}">${fmt(e.points)}</span>
          ${canUndo(e) ? `<button onclick="grades.undo('${e.id}')" title="تراجع" class="w-6 h-6 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700"><i class="fa-solid fa-rotate-left text-[10px]"></i></button>` : ""}
        </div>
      </div>`;
  }

  // ---------- الشاشة الرئيسية للدرجات (المدير والمشرف) ----------
  function renderView() {
    const u = me();
    const admin = isAdmin();
    const app = getAppSettings();
    const termName = (app.currentTerm && app.currentTerm.name) || "";
    const items = activeItems();
    const students = visibleStudents().sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), "ar", { numeric: true }),
    );
    const programs = getActivePrograms().filter(
      (p) => admin || (u.assignedPrograms || []).includes(p.id),
    );
    const recent = (db.gradeLog || [])
      .filter((e) => e && e.termId === termId())
      .filter((e) => admin || students.some((s) => s.id === e.studentId))
      .slice(0, 15);
    const lastBatch = admin
      ? (db.gradeLog || []).find((e) => e && e.batchId && !e.undone && e.termId === termId())
      : null;

    const itemsCard = admin
      ? `
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
        <div>
          <h3 class="font-black text-[#0B2533] text-sm"><i class="fa-solid fa-list-ol text-[#D4A359] ml-1.5"></i> بنود الدرجات</h3>
          <p class="text-[11px] text-slate-500 mt-0.5">الدرجة الموجبة تُضاف للطالب، والسالبة تُخصم منه. المشرف يرصد البند للطالب ويمكنه تكراره.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          ${
            items.length === 0
              ? '<div class="text-slate-400 text-xs">لا توجد بنود بعد — أضف أول بند بالأسفل.</div>'
              : items
                  .map(
                    (i) => `
            <div class="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-xl border ${badgeClass(i.value)} text-xs">
              <span class="font-black">${escHtml(i.name)}</span>
              <span class="font-black">${fmt(i.value)}</span>
              <span class="text-[10px] opacity-70">${i.programId ? escHtml(programName(i.programId)) : "كل البرامج"}</span>
              <button onclick="grades.removeItem('${i.id}')" title="حذف البند" class="w-5 h-5 rounded-md hover:bg-white/70"><i class="fa-solid fa-xmark text-[10px]"></i></button>
            </div>`,
                  )
                  .join("")
          }
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs pt-1">
          <input id="gi-name" maxlength="60" placeholder="اسم البند (مثال: مشاركة)" class="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800">
          <input id="gi-value" inputmode="decimal" placeholder="الدرجة (5 أو -2)" class="bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800">
          <select id="gi-program" class="bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700">
            <option value="">كل البرامج</option>
            ${getActivePrograms().map((p) => `<option value="${p.id}">${escHtml(p.name)}</option>`).join("")}
          </select>
          <button onclick="grades.addItem()" class="sm:col-span-4 py-2.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-black rounded-xl transition">
            <i class="fa-solid fa-plus ml-1"></i> إضافة البند
          </button>
        </div>
      </div>`
      : "";

    const importBtn = items.length
      ? `<label class="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl cursor-pointer text-xs flex items-center">
           <i class="fa-solid fa-file-excel ml-1.5"></i> استيراد درجات من Excel
           <input type="file" accept=".xlsx,.xls,.csv" class="hidden" onchange="grades.handleExcel(event)">
         </label>`
      : `<span class="px-3 py-2 bg-slate-100 text-slate-400 font-bold rounded-xl text-xs cursor-not-allowed" title="يحدد المدير بنود الدرجات أولاً">
           <i class="fa-solid fa-file-excel ml-1.5"></i> استيراد درجات من Excel (بعد إضافة البنود)
         </span>`;

    const rows = students
      .map((s) => {
        const total = studentTotal(s.id);
        return `
        <tr class="border-t border-slate-100 grade-row" data-name="${escHtml(String(s.name || "").toLowerCase())}" data-program="${escHtml(s.currentProgramId || "")}">
          <td class="p-2.5 font-bold text-slate-800">${escHtml(s.name)}</td>
          <td class="p-2.5 text-slate-500 hidden sm:table-cell">${escHtml(programName(s.currentProgramId))}</td>
          <td class="p-2.5 text-center"><span class="inline-block min-w-[3rem] text-[12px] font-black px-2 py-0.5 rounded-lg border ${badgeClass(total)}">${fmt(total)}</span></td>
          <td class="p-2.5">
            <div class="flex gap-1.5 justify-end">
              <button onclick="grades.openApplyModal('${s.id}')" class="px-2.5 py-1 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white rounded-lg text-[11px] font-bold transition"><i class="fa-solid fa-plus ml-1"></i> بند</button>
              <button onclick="grades.openStudentModal('${s.id}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold">التفاصيل</button>
            </div>
          </td>
        </tr>`;
      })
      .join("");

    return `
      <div class="space-y-4">
        <div class="bg-gradient-to-r from-[#0B2533] to-[#2B1736] rounded-3xl p-5 text-white border-t-4 border-t-[#D4A359]">
          <span class="inline-block bg-[#D4A359] text-[#0B2533] text-[11px] font-black px-3 py-0.5 rounded-full mb-1.5">الدرجات${termName ? " — " + escHtml(termName) : ""}</span>
          <h2 class="text-xl font-black">رصد درجات الطلاب</h2>
          <p class="text-xs text-slate-300 mt-0.5">${admin ? "حدد البنود ودرجاتها، ثم يرصدها المشرفون للطلاب." : "اختر الطالب وأضف له البند المناسب."}</p>
        </div>

        ${itemsCard}

        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
          <div class="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <h3 class="font-black text-[#0B2533] text-sm"><i class="fa-solid fa-user-graduate text-[#D4A359] ml-1.5"></i> الطلاب (${students.length})</h3>
            <div class="flex flex-wrap gap-2">
              ${importBtn}
              ${lastBatch ? `<button onclick="grades.undoBatch('${lastBatch.batchId}')" class="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs"><i class="fa-solid fa-rotate-left ml-1"></i> التراجع عن آخر استيراد</button>` : ""}
            </div>
          </div>
          <div class="flex flex-col sm:flex-row gap-2">
            <input id="grades-search" oninput="grades.filterRows()" placeholder="بحث باسم الطالب..." class="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800">
            ${
              programs.length > 1
                ? `<select id="grades-prog" onchange="grades.filterRows()" class="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700">
                     <option value="">كل البرامج</option>
                     ${programs.map((p) => `<option value="${p.id}">${escHtml(p.name)}</option>`).join("")}
                   </select>`
                : ""
            }
          </div>
          ${
            students.length === 0
              ? '<div class="text-slate-400 text-xs py-4 text-center">لا يوجد طلاب</div>'
              : `<div class="overflow-x-auto rounded-2xl border border-slate-200">
                  <table class="w-full text-xs text-right">
                    <thead class="bg-slate-50 text-slate-500">
                      <tr>
                        <th class="p-2.5 font-bold">الطالب</th>
                        <th class="p-2.5 font-bold hidden sm:table-cell">البرنامج</th>
                        <th class="p-2.5 font-bold text-center">المجموع</th>
                        <th class="p-2.5"></th>
                      </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                  </table>
                </div>`
          }
        </div>

        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <h3 class="font-black text-[#0B2533] text-sm mb-2"><i class="fa-solid fa-clock-rotate-left text-[#D4A359] ml-1.5"></i> آخر عمليات الرصد</h3>
          <div class="text-xs">
            ${recent.length === 0 ? '<div class="text-slate-400">لا يوجد بعد</div>' : recent.map((e) => logRowHtml(e, true)).join("")}
          </div>
        </div>
      </div>`;
  }

  // تصفية الجدول دون إعادة رسم الشاشة (لا يضيع مؤشر الكتابة في حقل البحث)
  function filterRows() {
    const q = String((document.getElementById("grades-search") || {}).value || "")
      .trim()
      .toLowerCase();
    const prog = (document.getElementById("grades-prog") || {}).value || "";
    document.querySelectorAll("tr.grade-row").forEach((tr) => {
      const okName = !q || (tr.getAttribute("data-name") || "").includes(q);
      const okProg = !prog || tr.getAttribute("data-program") === prog;
      tr.style.display = okName && okProg ? "" : "none";
    });
  }

  // ---------- بطاقة الطالب في "تقريري" ----------
  function renderStudentCard(studentId, title) {
    const tots = totalsOf(studentId).filter((x) => (Number(x.count) || 0) > 0 || (Number(x.points) || 0) !== 0);
    const total = studentTotal(studentId);
    const log = (db.gradeLog || [])
      .filter((x) => x && x.studentId === studentId && x.termId === termId() && !x.undone)
      .slice(0, 5);
    return `
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-black text-[#0B2533] text-sm"><i class="fa-solid fa-star-half-stroke text-[#D4A359] ml-1.5"></i> ${escHtml(title || "درجاتي")}</h3>
          <span class="text-lg font-black px-3 py-0.5 rounded-xl border ${badgeClass(total)}">${fmt(total)}</span>
        </div>
        ${
          tots.length === 0
            ? '<div class="text-slate-400 text-xs">لا توجد درجات مرصودة بعد</div>'
            : `<div class="flex flex-wrap gap-1.5 mb-2">${tots
                .map((x) => {
                  const it = findItem(x.itemId);
                  return `<span class="text-[11px] font-bold px-2 py-1 rounded-lg border ${badgeClass(x.points)}">${escHtml(it ? it.name : "بند")} × ${x.count} = ${fmt(x.points)}</span>`;
                })
                .join("")}</div>`
        }
        ${
          log.length
            ? `<div class="text-xs border-t border-slate-100 pt-2">${log
                .map(
                  (e) => `
          <div class="flex justify-between py-1">
            <span class="text-slate-600">${escHtml(e.itemName)}${e.times > 1 ? ` × ${e.times}` : ""}${e.note ? ` <span class="text-slate-400">— ${escHtml(e.note)}</span>` : ""}</span>
            <span class="font-black ${e.points >= 0 ? "text-emerald-700" : "text-rose-700"}">${fmt(e.points)}</span>
          </div>`,
                )
                .join("")}</div>`
            : ""
        }
      </div>`;
  }

  // ---------- استيراد من Excel ----------
  function handleExcel(event) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = "";
    if (!activeItems().length) {
      alert("يحدد المدير بنود الدرجات أولاً، ثم يمكن الاستيراد.");
      return;
    }
    parseImportFile(file, (rows) => {
      if (!rows.length) {
        alert("الملف فارغ أو تعذّرت قراءته.");
        return;
      }
      openImportModal(rows);
    });
  }

  function openImportModal(rows) {
    closeModal("grade-import-modal");
    window.__gradeImportRows = rows;
    const headers = Object.keys(rows[0] || {});
    const items = activeItems();
    const studentGuess = guessColumnKey(headers, ["الاسم", "اسم", "الطالب", "name", "الجوال", "الهوية"]);
    const preview = rows.slice(0, 3);

    const itemOptions = (header) => {
      const exact = items.find(
        (i) => i.name.replace(/\s+/g, "") === String(header).replace(/\s+/g, ""),
      );
      return (
        `<option value="">— تجاهل هذا العمود —</option>` +
        items
          .map(
            (i) =>
              `<option value="${i.id}" ${exact && exact.id === i.id ? "selected" : ""}>${escHtml(i.name)} (${fmt(i.value)})${i.programId ? " — " + escHtml(programName(i.programId)) : ""}</option>`,
          )
          .join("")
      );
    };

    const html = `
      <div id="grade-import-modal" class="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex justify-center items-start pt-8 px-4 overflow-y-auto">
        <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-6">
          <div class="bg-[#0B2533] text-white px-5 py-4 flex justify-between items-center border-b border-[#D4A359]">
            <h3 class="font-bold text-sm"><i class="fa-solid fa-table-columns text-[#D4A359] ml-1.5"></i> استيراد درجات: اربط أعمدة الملف بالبنود</h3>
            <button onclick="closeModal('grade-import-modal')" class="text-slate-300 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="p-5 space-y-3 text-xs">
            <p class="text-[11px] text-slate-500">وجدنا (${rows.length}) صفاً. اختر عمود الطالب، ثم لكل عمود: أي بند يقابله، وهل الرقم فيه <b>درجة</b> (تُضاف كما هي) أم <b>عدد مرات</b> (تُضرب في درجة البند).</p>

            <div class="grid grid-cols-2 gap-2 items-center bg-amber-50 border border-amber-200 rounded-2xl p-3">
              <label class="font-black text-slate-800">عمود الطالب <span class="text-rose-600">*</span><div class="text-[10px] font-normal text-slate-500">الاسم أو الجوال أو الهوية</div></label>
              <select id="gimp-student" class="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-700">
                <option value="">— اختر —</option>
                ${headers.map((h) => `<option value="${escHtml(h)}" ${h === studentGuess ? "selected" : ""}>${escHtml(h)}</option>`).join("")}
              </select>
            </div>

            <div class="bg-slate-50 rounded-2xl border border-slate-200 p-3 space-y-2">
              ${headers
                .map(
                  (h, idx) => `
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center gimp-col" data-col="${escHtml(h)}">
                  <div class="font-bold text-slate-700 truncate" title="${escHtml(h)}">${escHtml(h)}</div>
                  <select id="gimp-item-${idx}" class="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-700">${itemOptions(h)}</select>
                  <select id="gimp-mode-${idx}" class="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-700">
                    <option value="score">الرقم = درجة</option>
                    <option value="count">الرقم = عدد مرات</option>
                  </select>
                </div>`,
                )
                .join("")}
            </div>

            <div>
              <div class="font-bold text-slate-600 mb-1">معاينة أول ${preview.length} صفوف:</div>
              <div class="overflow-x-auto rounded-xl border border-slate-200">
                <table class="w-full text-[10px] text-right">
                  <thead class="bg-slate-100"><tr>${headers.map((h) => `<th class="p-1.5 font-bold text-slate-600 whitespace-nowrap">${escHtml(h)}</th>`).join("")}</tr></thead>
                  <tbody>${preview.map((r) => `<tr class="border-t border-slate-100">${headers.map((h) => `<td class="p-1.5 text-slate-700 whitespace-nowrap">${escHtml(String(r[h] ?? ""))}</td>`).join("")}</tr>`).join("")}</tbody>
                </table>
              </div>
            </div>

            <button onclick="grades.confirmImport()" class="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl">
              <i class="fa-solid fa-check ml-1"></i> استيراد الدرجات
            </button>
            <p class="text-[10px] text-slate-400 text-center">يمكن التراجع عن الاستيراد كاملاً بعد تنفيذه من زر «التراجع عن آخر استيراد».</p>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", html);
  }

  function matchStudent(raw, pool) {
    const v = String(raw == null ? "" : raw).trim();
    if (!v) return null;
    const digits = normalizeDigits(v).replace(/\D/g, "");
    if (digits.length >= 5) {
      const byNum = pool.find(
        (s) =>
          normalizeDigits(s.phone || "").replace(/\D/g, "") === digits ||
          normalizeDigits(s.nationalId || "").replace(/\D/g, "") === digits,
      );
      if (byNum) return byNum;
    }
    const norm = (s) =>
      cleanText(s, 80).replace(/\s+/g, " ").replace(/[أإآ]/g, "ا").replace(/ة$/g, "ه").trim();
    const n = norm(v);
    const same = pool.filter((s) => norm(s.name || "") === n);
    return same.length === 1 ? same[0] : null; // اسم مكرر => لا نخمّن
  }

  function confirmImport() {
    const rows = window.__gradeImportRows || [];
    const studentCol = (document.getElementById("gimp-student") || {}).value || "";
    if (!studentCol) {
      alert("اختر عمود الطالب.");
      return;
    }
    const headers = Object.keys(rows[0] || {});
    const maps = [];
    headers.forEach((h, idx) => {
      if (h === studentCol) return;
      const itemId = (document.getElementById("gimp-item-" + idx) || {}).value || "";
      if (!itemId) return;
      const item = findItem(itemId);
      if (!item || item.archived) return;
      const mode = (document.getElementById("gimp-mode-" + idx) || {}).value || "score";
      maps.push({ col: h, item, mode });
    });
    if (!maps.length) {
      alert("اربط عموداً واحداً على الأقل ببند.");
      return;
    }

    const pool = visibleStudents();
    const batchId = makeUniqueId("gbatch");
    let entries = 0;
    let matchedRows = 0;
    const unmatched = [];
    const skippedProgram = [];

    rows.forEach((row) => {
      const st = matchStudent(row[studentCol], pool);
      if (!st) {
        const label = String(row[studentCol] || "").trim();
        if (label) unmatched.push(label);
        return;
      }
      let used = false;
      maps.forEach((m) => {
        const num = toNumber(row[m.col]);
        if (!isFinite(num) || num === 0) return;
        if (m.item.programId && m.item.programId !== st.currentProgramId) {
          skippedProgram.push(`${st.name} (${m.item.name})`);
          return;
        }
        let times;
        let points;
        if (m.mode === "count") {
          times = Math.round(num);
          if (times === 0) return;
          points = Math.round(m.item.value * times * 100) / 100;
        } else {
          times = 1;
          points = Math.round(num * 100) / 100;
        }
        applyRaw(st, m.item, times, points, "استيراد Excel", batchId);
        entries++;
        used = true;
      });
      if (used) matchedRows++;
    });

    if (entries === 0) {
      alert(
        "لم تُستورد أي درجة." +
          (unmatched.length ? `\nطلاب لم نتعرف عليهم: ${unmatched.slice(0, 10).join("، ")}` : ""),
      );
      return;
    }
    persist("gradeTotals", "gradeLog");
    logAudit("استيراد درجات Excel", `${entries} عملية لـ ${matchedRows} طالب`);
    closeModal("grade-import-modal");
    let msg = `تم استيراد (${entries}) درجة لـ (${matchedRows}) طالب.`;
    if (unmatched.length)
      msg += `\n\nلم نتعرف على (${unmatched.length}) صف: ${unmatched.slice(0, 10).join("، ")}${unmatched.length > 10 ? "…" : ""}`;
    if (skippedProgram.length)
      msg += `\n\nتُجوهلت (${skippedProgram.length}) درجة لبنود لا تخص برنامج الطالب.`;
    alert(msg);
    navigateTo("grades");
  }

  return {
    renderView,
    renderStudentCard,
    addItem,
    removeItem,
    openApplyModal,
    updateApplyPreview,
    confirmApply,
    openStudentModal,
    undo,
    undoBatch,
    filterRows,
    handleExcel,
    confirmImport,
    // للاستخدام من أجزاء أخرى (التقارير / ولي الأمر لاحقاً)
    studentTotal,
    activeItems,
  };
})();
