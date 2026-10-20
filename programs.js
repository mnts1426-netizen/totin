/**
 * programs.js - إدارة البرامج (المدير فقط) — من الإعدادات > تبويب "البرامج"
 *
 *  - إضافة برنامج بمراحله، وتعديل اسمه ولونه ومراحله، وإغلاقه/فتحه.
 *  - الحذف: إن كان في البرنامج طلاب يُلزَم المدير إما بنقلهم كلهم لبرنامج آخر،
 *    أو بحذفهم نهائياً (بكتابة اسم البرنامج للتأكيد).
 *    الحذف "ناعم" (deleted: true): يختفي البرنامج من كل مكان، وتبقى السجلات القديمة سليمة،
 *    ولا يعود البرنامج للظهور من جهاز قديم.
 *  - نقل الطلاب (بدل الترقية): طالب واحد أو مجموعة محددة إلى أي برنامج وأي مرحلة.
 *
 * البيانات: db.programs [{ id, name, color, isClosed, deleted, updatedAt }]
 *           db.levels   [{ id, programId, name, order, deleted, updatedAt }]
 */

window.programsAdmin = (function () {
  const COLORS = ["#169BA2", "#0B2533", "#D4A359", "#9E1B48", "#8AA838", "#E59824", "#6D28D9", "#0369A1"];

  function isAdmin() {
    return Boolean(state.currentUser && state.currentUser.role === "admin");
  }
  function programs() {
    return getListedPrograms();
  }
  function findProgram(id) {
    return programs().find((p) => p.id === id) || null;
  }
  function levelsOf(pid) {
    return (db.levels || [])
      .filter((l) => l && l.programId === pid && !l.deleted)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  function studentsOf(pid, levelId) {
    return (db.users || []).filter(
      (u) =>
        u &&
        u.role === "student" &&
        u.currentProgramId === pid &&
        (!levelId || u.currentLevelId === levelId),
    );
  }
  function levelName(id) {
    const l = (db.levels || []).find((x) => x && x.id === id);
    return l ? l.name : "—";
  }
  function stamp(o) {
    o.updatedAt = Date.now();
    return o;
  }
  function cleanColor(c) {
    return /^#[0-9a-fA-F]{6}$/.test(String(c || "")) ? c : COLORS[0];
  }
  function sortByName(list) {
    return list.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), "ar", { numeric: true }),
    );
  }

  // ---------- الشاشة ----------
  function renderView() {
    if (!isAdmin()) return "";
    const list = programs();
    const cards = list
      .map((p) => {
        const lv = levelsOf(p.id);
        const n = studentsOf(p.id).length;
        return `
        <div class="p-4 rounded-2xl border ${p.isClosed ? "border-slate-200 bg-slate-50/60" : "border-slate-200 bg-white"} space-y-3">
          <div class="flex justify-between items-start gap-2">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-3.5 h-3.5 rounded-full shrink-0" style="background:${cleanColor(p.color)}"></span>
              <div class="min-w-0">
                <div class="font-black text-sm text-slate-800">${escHtml(p.name)}</div>
                <div class="text-[10px] text-slate-500">${n} طالب · ${lv.length} مرحلة</div>
              </div>
            </div>
            <span class="text-[10px] font-black px-2 py-0.5 rounded-lg border ${p.isClosed ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}">${p.isClosed ? "مغلق" : "مفتوح"}</span>
          </div>
          <div class="flex flex-wrap gap-1">
            ${lv.map((l) => `<span class="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">${escHtml(l.name)} (${studentsOf(p.id, l.id).length})</span>`).join("") || '<span class="text-[10px] text-rose-600">لا توجد مراحل</span>'}
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button onclick="programsAdmin.openEditor('${p.id}')" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-pen ml-1"></i> تعديل</button>
            <button onclick="programsAdmin.toggleClosed('${p.id}')" class="px-2.5 py-1.5 ${p.isClosed ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800" : "bg-amber-50 hover:bg-amber-100 text-amber-800"} rounded-xl text-[11px] font-bold"><i class="fa-solid ${p.isClosed ? "fa-lock-open" : "fa-lock"} ml-1"></i> ${p.isClosed ? "فتح" : "إغلاق"}</button>
            <button onclick="programsAdmin.openDelete('${p.id}')" class="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-[11px] font-bold"><i class="fa-solid fa-trash ml-1"></i> حذف</button>
          </div>
        </div>`;
      })
      .join("");

    return `
      <div class="space-y-4">
        <div class="bg-gradient-to-r from-[#0B2533] to-[#2B1736] rounded-3xl p-5 text-white border-t-4 border-t-[#D4A359] flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <span class="inline-block bg-[#D4A359] text-[#0B2533] text-[11px] font-black px-3 py-0.5 rounded-full mb-1.5">إدارة البرامج</span>
            <h2 class="text-xl font-black">البرامج ومراحلها</h2>
            <p class="text-xs text-slate-300 mt-0.5">أضف أو عدّل أو أغلق أو احذف أي برنامج، وانقل الطلاب بين البرامج والمراحل.</p>
          </div>
          <button onclick="programsAdmin.openEditor()" class="px-4 py-2.5 bg-[#D4A359] hover:bg-white text-[#0B2533] font-black rounded-xl text-xs transition shrink-0"><i class="fa-solid fa-plus ml-1"></i> برنامج جديد</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">${cards}</div>
        ${renderTransfer()}
      </div>`;
  }

  // ---------- إضافة / تعديل ----------
  function openEditor(pid) {
    if (!isAdmin()) return;
    const p = pid ? findProgram(pid) : null;
    const lv = p ? levelsOf(p.id) : [];
    const color = cleanColor(p ? p.color : COLORS[programs().length % COLORS.length]);
    closeModal("prog-editor-modal");
    const levelRow = (l, i) => `
      <div class="flex gap-2 items-center prog-level-row" data-level="${l ? l.id : ""}">
        <span class="text-[10px] font-black text-slate-400 w-4">${i + 1}</span>
        <input maxlength="60" value="${l ? escHtml(l.name) : ""}" placeholder="اسم المرحلة" class="flex-1 bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-800 text-xs">
        <button type="button" onclick="programsAdmin.removeLevelRow(this)" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-500"><i class="fa-solid fa-xmark text-[11px]"></i></button>
      </div>`;
    const html = `
      <div id="prog-editor-modal" data-program="${p ? p.id : ""}" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-start pt-10 px-4 overflow-y-auto">
        <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 border-t-[#D4A359] mb-8">
          <div class="bg-[#0B2533] text-white px-5 py-4 flex justify-between items-center border-b border-[#D4A359]">
            <h3 class="font-bold text-sm"><i class="fa-solid ${p ? "fa-pen" : "fa-plus"} text-[#D4A359] ml-1.5"></i> ${p ? "تعديل برنامج " + escHtml(p.name) : "برنامج جديد"}</h3>
            <button onclick="closeModal('prog-editor-modal')" class="text-slate-300 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="p-5 space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">اسم البرنامج:</label>
              <input id="pe-name" maxlength="40" value="${p ? escHtml(p.name) : ""}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">اللون:</label>
              <div class="flex flex-wrap gap-2">
                ${COLORS.map((c) => `<label class="cursor-pointer"><input type="radio" name="pe-color" value="${c}" class="peer hidden" ${c === color ? "checked" : ""}><span class="block w-8 h-8 rounded-xl border-4 border-white peer-checked:border-slate-800 shadow" style="background:${c}"></span></label>`).join("")}
              </div>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">المراحل (بالترتيب):</label>
              <div id="pe-levels" class="space-y-2">${(lv.length ? lv : [null]).map(levelRow).join("")}</div>
              <button type="button" onclick="programsAdmin.addLevelRow()" class="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"><i class="fa-solid fa-plus ml-1"></i> مرحلة</button>
              <p class="text-[10px] text-slate-400 mt-1.5">لا يمكن حذف مرحلة فيها طلاب — انقلهم أولاً من «نقل الطلاب».</p>
            </div>
            <button onclick="programsAdmin.saveEditor()" class="w-full py-2.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-black rounded-xl transition"><i class="fa-solid fa-check ml-1"></i> حفظ</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", html);
  }

  function renumberRows() {
    document.querySelectorAll("#pe-levels .prog-level-row").forEach((row, i) => {
      const n = row.querySelector("span");
      if (n) n.textContent = i + 1;
    });
  }

  function addLevelRow() {
    const box = document.getElementById("pe-levels");
    if (!box) return;
    box.insertAdjacentHTML(
      "beforeend",
      `<div class="flex gap-2 items-center prog-level-row" data-level="">
        <span class="text-[10px] font-black text-slate-400 w-4"></span>
        <input maxlength="60" placeholder="اسم المرحلة" class="flex-1 bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-800 text-xs">
        <button type="button" onclick="programsAdmin.removeLevelRow(this)" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-500"><i class="fa-solid fa-xmark text-[11px]"></i></button>
      </div>`,
    );
    renumberRows();
  }

  function removeLevelRow(btn) {
    const row = btn.closest(".prog-level-row");
    if (!row) return;
    const lid = row.getAttribute("data-level");
    const modal = document.getElementById("prog-editor-modal");
    const pid = modal ? modal.getAttribute("data-program") : "";
    if (lid && pid && studentsOf(pid, lid).length) {
      alert(`لا يمكن حذف هذه المرحلة: فيها (${studentsOf(pid, lid).length}) طالب. انقلهم أولاً.`);
      return;
    }
    if (document.querySelectorAll("#pe-levels .prog-level-row").length <= 1) {
      alert("يجب أن يبقى للبرنامج مرحلة واحدة على الأقل.");
      return;
    }
    row.remove();
    renumberRows();
  }

  function saveEditor() {
    if (!isAdmin()) return;
    const modal = document.getElementById("prog-editor-modal");
    const pid = modal ? modal.getAttribute("data-program") : "";
    const existing = pid ? findProgram(pid) : null;
    const name = cleanText((document.getElementById("pe-name") || {}).value || "", 40);
    if (!name) {
      alert("اكتب اسم البرنامج.");
      return;
    }
    if (programs().some((p) => p.name === name && (!existing || p.id !== existing.id))) {
      alert("يوجد برنامج بنفس الاسم.");
      return;
    }
    const colorEl = document.querySelector('input[name="pe-color"]:checked');
    const color = cleanColor(colorEl ? colorEl.value : "");
    const rows = Array.from(document.querySelectorAll("#pe-levels .prog-level-row")).map((row) => ({
      id: row.getAttribute("data-level") || "",
      name: cleanText((row.querySelector("input") || {}).value || "", 60),
    }));
    if (rows.some((r) => !r.name)) {
      alert("اكتب اسم كل مرحلة، أو احذف المرحلة الفارغة.");
      return;
    }
    if (!rows.length) {
      alert("أضف مرحلة واحدة على الأقل.");
      return;
    }

    if (!Array.isArray(db.programs)) db.programs = [];
    if (!Array.isArray(db.levels)) db.levels = [];
    let prog = existing;
    const oldName = existing ? existing.name : "";
    if (!prog) {
      prog = { id: makeUniqueId("prog"), isClosed: false, deleted: false };
      db.programs.push(prog);
    }
    prog.name = name;
    prog.color = color;
    stamp(prog);

    // المراحل: تعديل الموجود، إضافة الجديد، حذف (ناعم) ما أُزيل
    const keep = new Set();
    rows.forEach((r, i) => {
      let lvl = r.id ? (db.levels || []).find((l) => l.id === r.id) : null;
      if (!lvl) {
        lvl = { id: makeUniqueId("lvl"), programId: prog.id, deleted: false };
        db.levels.push(lvl);
      }
      lvl.name = r.name;
      lvl.order = i + 1;
      stamp(lvl);
      keep.add(lvl.id);
    });
    let removedWithStudents = false;
    levelsOf(prog.id).forEach((l) => {
      if (keep.has(l.id)) return;
      if (studentsOf(prog.id, l.id).length) {
        removedWithStudents = true;
        return;
      }
      l.deleted = true;
      stamp(l);
    });
    prog.levelsCount = levelsOf(prog.id).length;

    // مجموعة افتراضية لكل برنامج جديد (يحتاجها تسجيل الطلاب)
    if (!existing) {
      if (!Array.isArray(db.groups)) db.groups = [];
      db.groups.push({
        id: makeUniqueId("grp"),
        levelId: levelsOf(prog.id)[0].id,
        programId: prog.id,
        name: "المجموعة الأولى - " + name,
        supervisorId: null,
      });
    }

    persist("programs", "levels", "groups");
    logAudit(existing ? "تعديل برنامج" : "إضافة برنامج", existing && oldName !== name ? `${oldName} ← ${name}` : name);
    closeModal("prog-editor-modal");
    if (removedWithStudents) alert("لم تُحذف مرحلة فيها طلاب. انقلهم أولاً ثم احذفها.");
    navigateTo("programs-manage");
  }

  // ---------- إغلاق / فتح ----------
  function toggleClosed(pid) {
    if (!isAdmin()) return;
    const p = findProgram(pid);
    if (!p) return;
    if (!p.isClosed && getActivePrograms().length <= 1) {
      alert("لا يمكن إغلاق آخر برنامج مفتوح.");
      return;
    }
    const msg = p.isClosed
      ? `فتح برنامج ${p.name}؟ يستطيع طلابه الدخول مجدداً.`
      : `إغلاق برنامج ${p.name}؟\nلن يستطيع طلابه الدخول، وتبقى كل بياناته محفوظة ويمكن فتحه لاحقاً.`;
    if (!confirm(msg)) return;
    p.isClosed = !p.isClosed;
    stamp(p);
    persist("programs");
    logAudit(p.isClosed ? "إغلاق برنامج" : "فتح برنامج", p.name);
    navigateTo("programs-manage");
  }

  // ---------- الحذف ----------
  function levelOptions(pid) {
    return levelsOf(pid)
      .map((l) => `<option value="${l.id}">${escHtml(l.name)}</option>`)
      .join("");
  }

  function openDelete(pid) {
    if (!isAdmin()) return;
    const p = findProgram(pid);
    if (!p) return;
    const others = programs().filter((x) => x.id !== pid);
    if (!others.length) {
      alert("لا يمكن حذف آخر برنامج في المنصة.");
      return;
    }
    if (!p.isClosed && getActivePrograms().filter((x) => x.id !== pid).length === 0) {
      alert("لا يمكن حذف آخر برنامج مفتوح. افتح برنامجاً آخر أولاً.");
      return;
    }
    const n = studentsOf(pid).length;
    closeModal("prog-delete-modal");
    const html = `
      <div id="prog-delete-modal" data-program="${p.id}" class="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex justify-center items-start pt-10 px-4 overflow-y-auto">
        <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 border-t-rose-600 mb-8">
          <div class="bg-rose-700 text-white px-5 py-4 flex justify-between items-center">
            <h3 class="font-bold text-sm"><i class="fa-solid fa-trash ml-1.5"></i> حذف برنامج ${escHtml(p.name)}</h3>
            <button onclick="closeModal('prog-delete-modal')" class="text-rose-100 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="p-5 space-y-3 text-xs">
            ${
              n === 0
                ? `<p class="text-slate-600">لا يوجد طلاب في هذا البرنامج. سيُحذف البرنامج ويختفي من المنصة، وتبقى سجلاته القديمة محفوظة.</p>`
                : `
              <p class="font-bold text-slate-800">في هذا البرنامج (${n}) طالب. لا يُحذف البرنامج قبل أن تختار مصيرهم:</p>
              <label class="block rounded-2xl border border-slate-200 p-3 cursor-pointer has-[:checked]:border-[#0B2533] has-[:checked]:bg-slate-50">
                <div class="flex items-center gap-2 font-black text-slate-800"><input type="radio" name="pd-mode" value="move" checked onchange="programsAdmin.deleteModeChanged()"> نقلهم جميعاً إلى برنامج آخر</div>
                <div class="grid grid-cols-2 gap-2 mt-2">
                  <select id="pd-target" onchange="document.getElementById('pd-level').innerHTML = programsAdmin.levelOptions(this.value)" class="bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-700">
                    ${others.map((o) => `<option value="${o.id}">${escHtml(o.name)}${o.isClosed ? " (مغلق)" : ""}</option>`).join("")}
                  </select>
                  <select id="pd-level" class="bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-700">${levelOptions(others[0].id)}</select>
                </div>
              </label>
              <label class="block rounded-2xl border border-rose-200 p-3 cursor-pointer has-[:checked]:bg-rose-50">
                <div class="flex items-center gap-2 font-black text-rose-800"><input type="radio" name="pd-mode" value="purge" onchange="programsAdmin.deleteModeChanged()"> حذف الطلاب نهائياً مع حساباتهم وسجلات حضورهم</div>
                <div id="pd-purge-box" class="hidden mt-2 space-y-1">
                  <div class="text-[11px] text-rose-700">لا يمكن التراجع. للتأكيد اكتب اسم البرنامج: <b>${escHtml(p.name)}</b></div>
                  <input id="pd-confirm" class="w-full bg-white border border-rose-300 rounded-xl p-2 font-bold text-slate-800" placeholder="${escHtml(p.name)}">
                </div>
              </label>`
            }
            <button onclick="programsAdmin.confirmDelete()" class="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-black rounded-xl"><i class="fa-solid fa-trash ml-1"></i> حذف البرنامج</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", html);
  }

  function deleteModeChanged() {
    const m = document.querySelector('input[name="pd-mode"]:checked');
    const box = document.getElementById("pd-purge-box");
    if (box) box.classList.toggle("hidden", !m || m.value !== "purge");
  }

  function moveStudents(students, targetPid, targetLevelId) {
    const grp = getDefaultGroupId(targetPid);
    students.forEach((s) => {
      s.currentProgramId = targetPid;
      s.currentLevelId = targetLevelId || getDefaultLevelId(targetPid);
      s.groupId = grp;
    });
  }

  function confirmDelete() {
    if (!isAdmin()) return;
    const modal = document.getElementById("prog-delete-modal");
    const p = findProgram(modal ? modal.getAttribute("data-program") : "");
    if (!p) return;
    const students = studentsOf(p.id);
    let detail = "";

    if (students.length) {
      const mode = (document.querySelector('input[name="pd-mode"]:checked') || {}).value;
      if (mode === "move") {
        const target = findProgram((document.getElementById("pd-target") || {}).value);
        const lvl = (document.getElementById("pd-level") || {}).value;
        if (!target || target.id === p.id || !levelsOf(target.id).some((l) => l.id === lvl)) {
          alert("اختر البرنامج والمرحلة التي يُنقل إليها الطلاب.");
          return;
        }
        if (!confirm(`نقل (${students.length}) طالب إلى ${target.name} — ${levelName(lvl)} ثم حذف برنامج ${p.name}؟`)) return;
        moveStudents(students, target.id, lvl);
        detail = `ونقل ${students.length} طالب إلى ${target.name}`;
      } else if (mode === "purge") {
        const typed = cleanText((document.getElementById("pd-confirm") || {}).value || "", 40);
        if (typed !== p.name) {
          alert(`للتأكيد اكتب اسم البرنامج كما هو: ${p.name}`);
          return;
        }
        if (!confirm(`تأكيد أخير: حذف (${students.length}) طالب نهائياً مع حساباتهم وسجلات حضورهم؟`)) return;
        const ids = new Set(students.map((s) => s.id));
        const remainingStudents = (db.users || []).filter((u) => u.role === "student" && !ids.has(u.id)).length;
        // حماية المزامنة ترفض حذف كل الطلاب دفعة واحدة؛ هنا الحذف مقصود ومؤكَّد
        if (remainingStudents === 0) {
          window.__ALLOW_BULK_USER_DELETE = true;
          setTimeout(() => {
            window.__ALLOW_BULK_USER_DELETE = false;
          }, 20000);
        }
        db.users = db.users.filter((u) => !ids.has(u.id));
        db.attendanceRecords = (db.attendanceRecords || []).filter((r) => !ids.has(r.studentId));
        db.pendingProfileEdits = (db.pendingProfileEdits || []).filter((e) => !ids.has(e.userId || e.studentId));
        db.excuseRequests = (db.excuseRequests || []).filter((e) => !ids.has(e.studentId));
        detail = `وحذف ${students.length} طالب نهائياً`;
      } else {
        alert("اختر: نقل الطلاب أو حذفهم.");
        return;
      }
    } else if (!confirm(`حذف برنامج ${p.name}؟`)) {
      return;
    }

    // إزالة البرنامج من مهام المشرفين
    (db.users || []).forEach((u) => {
      if (u && Array.isArray(u.assignedPrograms) && u.assignedPrograms.includes(p.id)) {
        u.assignedPrograms = u.assignedPrograms.filter((x) => x !== p.id);
      }
    });
    p.deleted = true;
    p.isClosed = true;
    stamp(p);
    persist("programs", "users", "attendanceRecords", "pendingProfileEdits", "excuseRequests");
    logAudit("حذف برنامج", `${p.name} ${detail}`.trim());
    closeModal("prog-delete-modal");
    if (state.currentProgramId === p.id) state.currentProgramId = firstActiveProgramId();
    alert(`تم حذف برنامج ${p.name}${detail ? " " + detail : ""}.`);
    navigateTo("programs-manage");
  }

  // ---------- نقل الطلاب ----------
  function renderTransfer() {
    const list = programs();
    if (!list.length) return "";
    const src = list.some((p) => p.id === state.pmSource) ? state.pmSource : list[0].id;
    const srcLevel = levelsOf(src).some((l) => l.id === state.pmSourceLevel) ? state.pmSourceLevel : "";
    const students = sortByName(studentsOf(src, srcLevel));
    const tgt = list.some((p) => p.id === state.pmTarget) ? state.pmTarget : list[0].id;

    return `
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
        <div>
          <h3 class="font-black text-[#0B2533] text-sm"><i class="fa-solid fa-right-left text-[#D4A359] ml-1.5"></i> نقل الطلاب</h3>
          <p class="text-[11px] text-slate-500 mt-0.5">اختر طالباً أو أكثر، ثم انقلهم إلى أي برنامج وأي مرحلة. تبقى سجلات حضورهم ودرجاتهم كما هي.</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <select onchange="programsAdmin.setSource(this.value)" class="bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700">
            ${list.map((p) => `<option value="${p.id}" ${p.id === src ? "selected" : ""}>من: ${escHtml(p.name)}</option>`).join("")}
          </select>
          <select onchange="programsAdmin.setSourceLevel(this.value)" class="bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700">
            <option value="">كل المراحل</option>
            ${levelsOf(src).map((l) => `<option value="${l.id}" ${l.id === srcLevel ? "selected" : ""}>${escHtml(l.name)}</option>`).join("")}
          </select>
          <input id="pm-search" oninput="programsAdmin.filterStudents()" placeholder="بحث بالاسم..." class="bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800">
        </div>
        ${
          students.length === 0
            ? '<div class="text-center py-6 text-slate-400 text-xs">لا يوجد طلاب هنا</div>'
            : `
          <div class="rounded-2xl border border-slate-200 overflow-hidden">
            <label class="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-700 cursor-pointer">
              <input type="checkbox" id="pm-all" onchange="programsAdmin.toggleAll(this.checked)" class="accent-[#0B2533]"> تحديد الكل (${students.length})
            </label>
            <div class="max-h-72 overflow-y-auto divide-y divide-slate-100">
              ${students
                .map(
                  (s) => `
                <label class="pm-row flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-slate-50" data-name="${escHtml(String(s.name || "").toLowerCase())}">
                  <input type="checkbox" class="pm-check accent-[#0B2533]" value="${s.id}" onchange="programsAdmin.updateCount()">
                  <span class="font-bold text-slate-800 flex-1">${escHtml(s.name)}</span>
                  <span class="text-[10px] text-slate-400">${escHtml(levelName(s.currentLevelId))}</span>
                </label>`,
                )
                .join("")}
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <select id="pm-target" onchange="programsAdmin.setTarget(this.value)" class="bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700">
              ${list.map((p) => `<option value="${p.id}" ${p.id === tgt ? "selected" : ""}>إلى: ${escHtml(p.name)}${p.isClosed ? " (مغلق)" : ""}</option>`).join("")}
            </select>
            <select id="pm-target-level" class="bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700">${levelOptions(tgt)}</select>
            <button id="pm-go" onclick="programsAdmin.transferSelected()" class="py-2.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-black rounded-xl transition">نقل المحددين (0)</button>
          </div>`
        }
      </div>`;
  }

  function setSource(pid) {
    state.pmSource = pid;
    state.pmSourceLevel = "";
    navigateTo("programs-manage");
  }
  function setSourceLevel(lid) {
    state.pmSourceLevel = lid;
    navigateTo("programs-manage");
  }
  function setTarget(pid) {
    state.pmTarget = pid;
    const sel = document.getElementById("pm-target-level");
    if (sel) sel.innerHTML = levelOptions(pid);
  }
  function selectedIds() {
    return Array.from(document.querySelectorAll(".pm-check:checked")).map((c) => c.value);
  }
  function updateCount() {
    const btn = document.getElementById("pm-go");
    if (btn) btn.textContent = `نقل المحددين (${selectedIds().length})`;
  }
  function toggleAll(on) {
    document.querySelectorAll(".pm-row").forEach((row) => {
      if (row.style.display === "none") return;
      const c = row.querySelector(".pm-check");
      if (c) c.checked = on;
    });
    updateCount();
  }
  function filterStudents() {
    const q = String((document.getElementById("pm-search") || {}).value || "").trim().toLowerCase();
    document.querySelectorAll(".pm-row").forEach((row) => {
      row.style.display = !q || (row.getAttribute("data-name") || "").includes(q) ? "" : "none";
    });
  }

  function transferSelected() {
    if (!isAdmin()) return;
    const ids = selectedIds();
    if (!ids.length) {
      alert("حدد طالباً واحداً على الأقل.");
      return;
    }
    const target = findProgram((document.getElementById("pm-target") || {}).value);
    const lvl = (document.getElementById("pm-target-level") || {}).value;
    if (!target || !levelsOf(target.id).some((l) => l.id === lvl)) {
      alert("اختر البرنامج والمرحلة المستهدفة.");
      return;
    }
    const students = (db.users || []).filter((u) => u && u.role === "student" && ids.includes(u.id));
    if (!confirm(`نقل (${students.length}) طالب إلى ${target.name} — ${levelName(lvl)}؟`)) return;
    moveStudents(students, target.id, lvl);
    persist("users");
    logAudit("نقل طلاب", `${students.length} طالب إلى ${target.name} — ${levelName(lvl)}`);
    alert(`تم نقل (${students.length}) طالب ✓`);
    navigateTo("programs-manage");
  }

  return {
    renderView,
    openEditor,
    addLevelRow,
    removeLevelRow,
    saveEditor,
    toggleClosed,
    openDelete,
    deleteModeChanged,
    confirmDelete,
    levelOptions,
    setSource,
    setSourceLevel,
    setTarget,
    updateCount,
    toggleAll,
    filterStudents,
    transferSelected,
  };
})();
