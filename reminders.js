/**
 * reminders.js - التذكيرات المجدولة (المدير والمشرف) — من "التواصل" > "التذكيرات"
 *
 *  - تذكير بنص يصل للطلاب (وأولياء أمورهم اختيارياً) في وقت محدد:
 *    مرة واحدة (تاريخ + وقت)، أو أسبوعياً (أيام + وقت) حتى تاريخ معيّن.
 *  - الإرسال في وقته تتولاه دالة Supabase "send-reminders" (كل 5 دقائق)،
 *    فيصل حتى لو لم يفتح أحد المنصة. الأوقات بتوقيت السعودية.
 *
 * db.reminders : [{ id, title, message, target: { type: "program"|"students"|"allStudents",
 *                  programId, studentIds }, includeParents, mode: "once"|"weekly",
 *                  date, days, time, startDate, endDate, active, archived, createdBy, createdByName, ts }]
 */

window.reminders = (function () {
  const DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  function me() {
    return state.currentUser;
  }
  function isAdmin() {
    return Boolean(me() && me().role === "admin");
  }
  function isStaff() {
    const r = me() ? me().role : "";
    return r === "admin" || r === "supervisor";
  }
  function all() {
    if (!Array.isArray(db.reminders)) db.reminders = [];
    return db.reminders;
  }
  function find(id) {
    return all().find((x) => x && x.id === id) || null;
  }
  function myPrograms() {
    return isAdmin()
      ? getActivePrograms()
      : getActivePrograms().filter((p) => (me().assignedPrograms || []).includes(p.id));
  }
  function myStudents() {
    const progs = new Set(myPrograms().map((p) => p.id));
    return (db.users || []).filter((u) => u && u.role === "student" && !u.isRestricted && progs.has(u.currentProgramId));
  }
  function canEdit(r) {
    return Boolean(r && me() && (isAdmin() || r.createdBy === me().id));
  }
  function visible() {
    return all().filter((r) => r && !r.archived && (isAdmin() || r.createdBy === me().id));
  }

  function whenText(r) {
    if (r.mode === "once") {
      const d = r.date ? DAYS[new Date(r.date + "T00:00:00").getDay()] : "";
      return `مرة واحدة: ${d} ${r.date || ""} الساعة ${r.time || ""}`;
    }
    const days = (r.days || []).slice().sort().map((d) => DAYS[d]).join(" و");
    return `كل ${days} الساعة ${r.time || ""}${r.endDate ? ` حتى ${r.endDate}` : ""}`;
  }
  function targetText(r) {
    const t = r.target || {};
    let s = t.type === "allStudents" ? "كل الطلاب" : t.type === "program" ? `طلاب برنامج ${getProgramName(t.programId)}` : `${(t.studentIds || []).length} طالب محدد`;
    if (r.includeParents) s += " + أولياء أمورهم";
    return s;
  }
  function isFinished(r) {
    const today = todayStr();
    if (r.mode === "once") return r.date < today;
    return Boolean(r.endDate && r.endDate < today);
  }

  // ---------- الشاشة ----------
  function renderView() {
    if (!isStaff()) return "";
    const list = visible().sort((a, b) => (b.ts || 0) - (a.ts || 0));
    const rows = list
      .map((r) => {
        const finished = isFinished(r);
        const badge = finished
          ? '<span class="text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">انتهى</span>'
          : r.active === false
            ? '<span class="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">موقوف</span>'
            : '<span class="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">فعّال</span>';
        return `
        <div class="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
          <div class="flex justify-between items-start gap-2">
            <div class="min-w-0">
              <div class="font-black text-sm text-slate-800">${escHtml(r.title)}</div>
              ${r.message ? `<div class="text-[11px] text-slate-500 mt-0.5 whitespace-pre-line">${escHtml(r.message)}</div>` : ""}
            </div>
            ${badge}
          </div>
          <div class="text-[11px] text-slate-600"><i class="fa-regular fa-clock text-[#D4A359] ml-1"></i>${escHtml(whenText(r))}</div>
          <div class="text-[11px] text-slate-600"><i class="fa-solid fa-users text-[#D4A359] ml-1"></i>${escHtml(targetText(r))}</div>
          ${
            canEdit(r)
              ? `<div class="flex flex-wrap gap-1.5 pt-1">
              <button onclick="reminders.openEditor('${r.id}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold"><i class="fa-solid fa-pen ml-1"></i>تعديل</button>
              ${finished ? "" : `<button onclick="reminders.toggle('${r.id}')" class="px-2.5 py-1 ${r.active === false ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"} rounded-lg text-[11px] font-bold">${r.active === false ? "تشغيل" : "إيقاف"}</button>`}
              <button onclick="reminders.remove('${r.id}')" class="px-2.5 py-1 bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-700 rounded-lg text-[11px] font-bold"><i class="fa-solid fa-trash ml-1"></i>حذف</button>
            </div>`
              : ""
          }
        </div>`;
      })
      .join("");

    return `
      <div class="space-y-4">
        <div class="bg-gradient-to-r from-[#0B2533] to-[#2B1736] rounded-3xl p-5 text-white border-t-4 border-t-[#D4A359] flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <span class="inline-block bg-[#D4A359] text-[#0B2533] text-[11px] font-black px-3 py-0.5 rounded-full mb-1.5">التذكيرات</span>
            <h2 class="text-xl font-black">تذكير الطلاب في وقت محدد</h2>
            <p class="text-xs text-slate-300 mt-0.5">مرة واحدة أو أسبوعياً حتى تاريخ تحدده — يصل في وقته تلقائياً (بتوقيت السعودية).</p>
          </div>
          <button onclick="reminders.openEditor()" class="px-4 py-2.5 bg-[#D4A359] hover:bg-white text-[#0B2533] font-black rounded-xl text-xs transition shrink-0"><i class="fa-solid fa-plus ml-1"></i> تذكير جديد</button>
        </div>
        ${
          list.length
            ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-3">${rows}</div>`
            : '<div class="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-400 text-xs">لا توجد تذكيرات بعد</div>'
        }
      </div>`;
  }

  // ---------- إضافة / تعديل ----------
  function openEditor(id) {
    if (!isStaff()) return;
    const r = id ? find(id) : null;
    if (r && !canEdit(r)) return;
    const progs = myPrograms();
    if (!progs.length) {
      alert("لا توجد برامج مسندة إليك.");
      return;
    }
    const t = (r && r.target) || { type: "program", programId: progs[0].id };
    const mode = (r && r.mode) || "once";
    const chosen = new Set(t.studentIds || []);
    const students = myStudents().sort((a, b) => compareNames(a.name, b.name));
    const days = new Set((r && r.days) || []);
    closeModal("reminder-modal");
    const html = `
      <div id="reminder-modal" data-id="${r ? r.id : ""}" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-start pt-8 px-4 overflow-y-auto">
        <div class="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border-t-4 border-t-[#D4A359] mb-8">
          <div class="bg-[#0B2533] text-white px-5 py-4 flex justify-between items-center border-b border-[#D4A359]">
            <h3 class="font-bold text-sm"><i class="fa-regular fa-bell text-[#D4A359] ml-1.5"></i> ${r ? "تعديل تذكير" : "تذكير جديد"}</h3>
            <button onclick="closeModal('reminder-modal')" class="text-slate-300 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="p-5 space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">العنوان:</label>
              <input id="rm-title" maxlength="100" value="${r ? escHtml(r.title) : ""}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800" placeholder="مثال: تذكير بالبرنامج">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">النص:</label>
              <textarea id="rm-msg" rows="2" maxlength="300" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800" placeholder="مثال: البرنامج اليوم الساعة 4 عصراً، لا تنسَ كتابك">${r ? escHtml(r.message || "") : ""}</textarea>
            </div>

            <div class="bg-slate-50 rounded-2xl border border-slate-200 p-3 space-y-2">
              <div class="font-black text-slate-700">لمن يصل؟</div>
              <select id="rm-target" onchange="reminders.targetChanged()" class="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-700">
                <option value="program" ${t.type === "program" ? "selected" : ""}>طلاب برنامج</option>
                <option value="students" ${t.type === "students" ? "selected" : ""}>طلاب محددون</option>
                ${isAdmin() ? `<option value="allStudents" ${t.type === "allStudents" ? "selected" : ""}>كل الطلاب</option>` : ""}
              </select>
              <select id="rm-program" class="${t.type === "program" ? "" : "hidden"} w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-700">
                ${progs.map((p) => `<option value="${p.id}" ${p.id === t.programId ? "selected" : ""}>${escHtml(p.name)}</option>`).join("")}
              </select>
              <div id="rm-students" class="${t.type === "students" ? "" : "hidden"} max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
                ${students.map((s) => `<label class="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer"><input type="checkbox" class="rm-st accent-[#0B2533]" value="${s.id}" ${chosen.has(s.id) ? "checked" : ""}> ${escHtml(s.name)} <span class="text-[10px] text-slate-400">${escHtml(getProgramName(s.currentProgramId))}</span></label>`).join("")}
              </div>
              <label class="flex items-center gap-2 font-bold text-slate-700 cursor-pointer"><input id="rm-parents" type="checkbox" class="accent-[#D4A359]" ${r && r.includeParents ? "checked" : ""}> يصل لأولياء أمورهم أيضاً</label>
            </div>

            <div class="bg-slate-50 rounded-2xl border border-slate-200 p-3 space-y-2">
              <div class="font-black text-slate-700">متى؟</div>
              <div class="flex gap-2">
                <label class="flex-1 cursor-pointer"><input type="radio" name="rm-mode" value="once" class="peer hidden" ${mode === "once" ? "checked" : ""} onchange="reminders.modeChanged()"><div class="text-center rounded-xl border-2 border-slate-200 peer-checked:border-[#D4A359] peer-checked:bg-amber-50 p-2 font-black">مرة واحدة</div></label>
                <label class="flex-1 cursor-pointer"><input type="radio" name="rm-mode" value="weekly" class="peer hidden" ${mode === "weekly" ? "checked" : ""} onchange="reminders.modeChanged()"><div class="text-center rounded-xl border-2 border-slate-200 peer-checked:border-[#D4A359] peer-checked:bg-amber-50 p-2 font-black">أسبوعياً</div></label>
              </div>
              <div id="rm-once" class="${mode === "once" ? "" : "hidden"} grid grid-cols-2 gap-2">
                <label class="text-[10px] text-slate-500">التاريخ<input id="rm-date" type="date" min="${todayStr()}" value="${(r && r.date) || todayStr()}" class="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-700"></label>
                <label class="text-[10px] text-slate-500">الوقت<input id="rm-time-once" type="time" value="${(r && r.time) || "16:00"}" class="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-700"></label>
              </div>
              <div id="rm-weekly" class="${mode === "weekly" ? "" : "hidden"} space-y-2">
                <div class="flex flex-wrap gap-1.5">
                  ${DAYS.map((d, i) => `<label class="cursor-pointer"><input type="checkbox" class="rm-day peer hidden" value="${i}" ${days.has(i) ? "checked" : ""}><span class="block px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white peer-checked:bg-[#0B2533] peer-checked:text-white font-bold">${d}</span></label>`).join("")}
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <label class="text-[10px] text-slate-500">الوقت<input id="rm-time-weekly" type="time" value="${(r && r.time) || "16:00"}" class="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-700"></label>
                  <label class="text-[10px] text-slate-500">من<input id="rm-start" type="date" value="${(r && r.startDate) || todayStr()}" class="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-700"></label>
                  <label class="text-[10px] text-slate-500">حتى<input id="rm-end" type="date" min="${todayStr()}" value="${(r && r.endDate) || ""}" class="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-700"></label>
                </div>
              </div>
            </div>

            <button onclick="reminders.save()" class="w-full py-2.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-black rounded-xl transition"><i class="fa-solid fa-check ml-1"></i> حفظ التذكير</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", html);
  }

  function targetChanged() {
    const v = (document.getElementById("rm-target") || {}).value;
    const p = document.getElementById("rm-program");
    const s = document.getElementById("rm-students");
    if (p) p.classList.toggle("hidden", v !== "program");
    if (s) s.classList.toggle("hidden", v !== "students");
  }

  function modeChanged() {
    const m = (document.querySelector('input[name="rm-mode"]:checked') || {}).value;
    const o = document.getElementById("rm-once");
    const w = document.getElementById("rm-weekly");
    if (o) o.classList.toggle("hidden", m !== "once");
    if (w) w.classList.toggle("hidden", m !== "weekly");
  }

  function val(id) {
    return (document.getElementById(id) || {}).value || "";
  }

  function save() {
    if (!isStaff()) return;
    const modal = document.getElementById("reminder-modal");
    const id = modal ? modal.getAttribute("data-id") : "";
    const existing = id ? find(id) : null;
    if (existing && !canEdit(existing)) return;
    const title = cleanText(val("rm-title"), 100);
    const message = cleanText(val("rm-msg"), 300);
    if (!title) {
      alert("اكتب عنوان التذكير.");
      return;
    }
    const type = val("rm-target");
    const target = { type };
    if (type === "program") {
      target.programId = val("rm-program");
      if (!myPrograms().some((p) => p.id === target.programId)) {
        alert("اختر البرنامج.");
        return;
      }
    } else if (type === "students") {
      const allowed = new Set(myStudents().map((s) => s.id));
      target.studentIds = Array.from(document.querySelectorAll(".rm-st:checked")).map((c) => c.value).filter((x) => allowed.has(x));
      if (!target.studentIds.length) {
        alert("حدد طالباً واحداً على الأقل.");
        return;
      }
    } else if (type === "allStudents") {
      if (!isAdmin()) return;
    } else {
      return;
    }
    const mode = (document.querySelector('input[name="rm-mode"]:checked') || {}).value;
    const rec = existing || {
      id: makeUniqueId("rem"),
      createdBy: me().id,
      createdByName: cleanText(me().name, 80),
      ts: Date.now(),
      archived: false,
    };
    if (mode === "once") {
      const date = val("rm-date");
      const time = val("rm-time-once");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
        alert("حدد التاريخ والوقت.");
        return;
      }
      const atMs = Date.parse(date + "T" + time + ":00+03:00");
      if (atMs < Date.now() - 60000) {
        alert("هذا الوقت مضى. اختر وقتاً قادماً.");
        return;
      }
      Object.assign(rec, { mode, date, time, days: [], startDate: "", endDate: "" });
    } else if (mode === "weekly") {
      const dayList = Array.from(document.querySelectorAll(".rm-day:checked")).map((c) => parseInt(c.value, 10));
      const time = val("rm-time-weekly");
      const startDate = val("rm-start") || todayStr();
      const endDate = val("rm-end");
      if (!dayList.length) {
        alert("اختر يوماً واحداً على الأقل.");
        return;
      }
      if (!/^\d{2}:\d{2}$/.test(time)) {
        alert("حدد الوقت.");
        return;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        alert("حدد تاريخ انتهاء التذكير الأسبوعي (حتى).");
        return;
      }
      if (endDate < startDate) {
        alert("تاريخ الانتهاء قبل تاريخ البداية.");
        return;
      }
      Object.assign(rec, { mode, days: dayList, time, startDate, endDate, date: "" });
    } else {
      return;
    }
    rec.title = title;
    rec.message = message;
    rec.target = target;
    rec.includeParents = Boolean((document.getElementById("rm-parents") || {}).checked);
    if (rec.active === undefined) rec.active = true;
    if (!existing) all().push(rec);
    persist("reminders");
    logAudit(existing ? "تعديل تذكير" : "إضافة تذكير", `${title} — ${whenText(rec)}`);
    closeModal("reminder-modal");
    navigateTo("reminders");
  }

  function toggle(id) {
    const r = find(id);
    if (!canEdit(r)) return;
    r.active = r.active === false;
    persist("reminders");
    logAudit(r.active ? "تشغيل تذكير" : "إيقاف تذكير", r.title);
    navigateTo("reminders");
  }

  function remove(id) {
    const r = find(id);
    if (!canEdit(r)) return;
    if (!confirm(`حذف التذكير «${r.title}»؟ لن يُرسل بعد الآن.`)) return;
    r.archived = true;
    r.active = false;
    persist("reminders");
    logAudit("حذف تذكير", r.title);
    navigateTo("reminders");
  }

  return { renderView, openEditor, targetChanged, modeChanged, save, toggle, remove, whenText };
})();
