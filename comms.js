/**
 * comms.js - التواصل: الإعلانات + الرسائل + الإنذارات في خانة واحدة
 *
 *  - الإعلانات: لوحة الإعلانات الحالية كما هي.
 *  - الرسائل: بين المشرفين والإدارة فقط، بسيطة جداً (رسالة ورد). كل رسالة ترسل
 *    إشعاراً للمستلم. تُحفظ آخر 1000 رسالة فقط حتى تبقى خفيفة.
 *  - الإنذارات: كاملة بيد المدير — يحدد أنواعها ويصدرها للطالب ويلغيها.
 *    تصل للطالب كإشعار وتظهر في تقريره. المشرف يطّلع على إنذارات طلابه فقط.
 *
 * البيانات:
 *  db.messages : [{ id, fromId, fromName, toId, toName, text, ts, updatedAt, readAt }]
 *  db.warnings : [{ id, studentId, studentName, typeId, typeName, reason, by, byName,
 *                   ts, updatedAt, revoked, revokedBy }]
 *  appSettings.app.warningTypes : [{ id, name, archived }]
 */

window.comms = (function () {
  const MSG_MAX_LEN = 1000;

  function me() {
    return state.currentUser;
  }
  function role() {
    return me() ? me().role : "";
  }
  function isAdmin() {
    return role() === "admin";
  }
  function isStaff() {
    return role() === "admin" || role() === "supervisor";
  }
  function userById(id) {
    return (db.users || []).find((u) => u && u.id === id) || null;
  }
  function whenText(ts) {
    return new Date(ts || 0).toLocaleString("ar-SA", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  // نص متعدد الأسطر: يحفظ فواصل الأسطر (العرض دائماً عبر escHtml فلا خطر)
  function cleanMultiline(v, maxLen) {
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

  function notify(userId, category, title, message) {
    if (!Array.isArray(db.notifications)) db.notifications = [];
    db.notifications.unshift({
      id: makeUniqueId("notif"),
      userId,
      category,
      title: cleanText(title, 150),
      message: cleanText(message, 300),
      date: "الآن",
      isRead: false,
    });
  }

  // ---------- التبويبات ----------
  function tabs() {
    const list = [{ id: "announcements", icon: "fa-bullhorn", label: "الإعلانات" }];
    if (isStaff()) {
      const unread = unreadCount();
      list.push({
        id: "messages",
        icon: "fa-envelope",
        label: "الرسائل" + (unread ? ` (${unread})` : ""),
      });
    }
    list.push({
      id: "warnings",
      icon: "fa-triangle-exclamation",
      label: role() === "student" ? "إنذاراتي" : "الإنذارات",
    });
    return list;
  }

  function setTab(id) {
    state.commsTab = id;
    if (id !== "messages") state.commsPeer = null;
    navigateTo("comms");
  }

  function renderView() {
    const list = tabs();
    let tab = state.commsTab;
    if (!list.some((t) => t.id === tab)) tab = "announcements";

    let body = "";
    if (tab === "announcements") body = views.renderAnnouncementsView();
    else if (tab === "messages") body = renderMessages();
    else body = renderWarnings();

    return `
      <div class="space-y-4">
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-1.5 flex gap-1.5 overflow-x-auto">
          ${list
            .map(
              (t) => `
            <button onclick="comms.setTab('${t.id}')" class="flex-1 min-w-max px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition ${
              t.id === tab
                ? "bg-[#0B2533] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }">
              <i class="fa-solid ${t.icon} ml-1.5 ${t.id === tab ? "text-[#D4A359]" : "text-slate-400"}"></i>${escHtml(t.label)}
            </button>`,
            )
            .join("")}
        </div>
        ${body}
      </div>`;
  }

  // =====================================================================
  // الرسائل
  // =====================================================================
  function myMessages() {
    const id = me() ? me().id : "";
    return (db.messages || []).filter((m) => m && (m.fromId === id || m.toId === id));
  }

  function unreadCount() {
    const id = me() ? me().id : "";
    return (db.messages || []).filter((m) => m && m.toId === id && !m.readAt).length;
  }

  function staffContacts() {
    const id = me() ? me().id : "";
    return (db.users || [])
      .filter((u) => u && u.id !== id && (u.role === "admin" || u.role === "supervisor"))
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "ar"));
  }

  function conversations() {
    const id = me().id;
    const map = new Map();
    myMessages()
      .sort((a, b) => (b.ts || 0) - (a.ts || 0))
      .forEach((m) => {
        const peer = m.fromId === id ? m.toId : m.fromId;
        if (!map.has(peer)) {
          map.set(peer, {
            peerId: peer,
            peerName: m.fromId === id ? m.toName : m.fromName,
            last: m,
            unread: 0,
          });
        }
        if (m.toId === id && !m.readAt) map.get(peer).unread++;
      });
    return Array.from(map.values());
  }

  function renderMessages() {
    if (!isStaff()) return "";
    const peerId = state.commsPeer;
    if (peerId) return renderThread(peerId);

    const convs = conversations();
    const contacts = staffContacts();
    return `
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
        <div class="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <h3 class="font-black text-[#0B2533] text-sm"><i class="fa-solid fa-envelope text-[#D4A359] ml-1.5"></i> الرسائل بين المشرفين والإدارة</h3>
          <div class="flex gap-2">
            <select id="msg-new-peer" class="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700">
              <option value="">اختر شخصاً لمراسلته...</option>
              ${contacts.map((u) => `<option value="${u.id}">${escHtml(u.name)} — ${u.role === "admin" ? "الإدارة" : "مشرف"}</option>`).join("")}
            </select>
            <button onclick="comms.openThreadFromSelect()" class="px-3 py-2 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white text-xs font-bold rounded-xl transition"><i class="fa-solid fa-pen ml-1"></i> رسالة</button>
          </div>
        </div>
        ${
          convs.length === 0
            ? '<div class="text-center py-8 text-slate-400 text-xs">لا توجد رسائل بعد. اختر شخصاً من القائمة لبدء محادثة.</div>'
            : `<div class="divide-y divide-slate-100">${convs
                .map(
                  (c) => `
            <button onclick="comms.openThread('${c.peerId}')" class="w-full text-right py-3 px-2 flex items-center gap-3 hover:bg-slate-50 rounded-xl transition">
              <div class="w-9 h-9 rounded-2xl bg-[#0B2533] text-[#D4A359] flex items-center justify-center font-black text-xs shrink-0">${escHtml(String(c.peerName || "؟").substring(0, 2))}</div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-center">
                  <span class="font-black text-xs text-slate-800">${escHtml(c.peerName || "")}</span>
                  <span class="text-[10px] text-slate-400">${escHtml(whenText(c.last.ts))}</span>
                </div>
                <div class="text-[11px] text-slate-500 truncate">${c.last.fromId === me().id ? "أنت: " : ""}${escHtml(c.last.text)}</div>
              </div>
              ${c.unread ? `<span class="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#9E1B48] text-white text-[10px] font-black flex items-center justify-center">${c.unread}</span>` : ""}
            </button>`,
                )
                .join("")}</div>`
        }
      </div>`;
  }

  function openThreadFromSelect() {
    const v = (document.getElementById("msg-new-peer") || {}).value;
    if (!v) {
      alert("اختر الشخص أولاً.");
      return;
    }
    openThread(v);
  }

  function openThread(peerId) {
    state.commsTab = "messages";
    state.commsPeer = peerId;
    // تعليم رسائل هذه المحادثة كمقروءة
    const id = me().id;
    const now = Date.now();
    let changed = false;
    (db.messages || []).forEach((m) => {
      if (m && m.toId === id && m.fromId === peerId && !m.readAt) {
        m.readAt = now;
        m.updatedAt = now;
        changed = true;
      }
    });
    if (changed) persist("messages");
    navigateTo("comms");
    setTimeout(() => {
      const box = document.getElementById("msg-thread");
      if (box) box.scrollTop = box.scrollHeight;
    }, 0);
  }

  function renderThread(peerId) {
    const peer = userById(peerId);
    const id = me().id;
    const msgs = myMessages()
      .filter((m) => m.fromId === peerId || m.toId === peerId)
      .sort((a, b) => (a.ts || 0) - (b.ts || 0));
    return `
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="bg-[#0B2533] text-white px-4 py-3 flex items-center gap-3">
          <button onclick="comms.closeThread()" class="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20"><i class="fa-solid fa-arrow-right"></i></button>
          <div>
            <div class="font-black text-sm">${escHtml(peer ? peer.name : "مستخدم")}</div>
            <div class="text-[10px] text-[#D4A359]">${peer && peer.role === "admin" ? "الإدارة" : "مشرف"}</div>
          </div>
        </div>
        <div id="msg-thread" class="p-4 space-y-2 max-h-[55vh] overflow-y-auto bg-slate-50/60">
          ${
            msgs.length === 0
              ? '<div class="text-center py-6 text-slate-400 text-xs">ابدأ المحادثة بكتابة رسالتك بالأسفل</div>'
              : msgs
                  .map((m) => {
                    const mine = m.fromId === id;
                    return `
            <div class="flex ${mine ? "justify-start" : "justify-end"}">
              <div class="max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${mine ? "bg-[#0B2533] text-white rounded-br-md" : "bg-white border border-slate-200 text-slate-800 rounded-bl-md"}">
                <div class="whitespace-pre-line">${escHtml(m.text)}</div>
                <div class="text-[9px] mt-1 ${mine ? "text-slate-300" : "text-slate-400"}">${escHtml(whenText(m.ts))}${mine && m.readAt ? " · قُرئت" : ""}</div>
              </div>
            </div>`;
                  })
                  .join("")
          }
        </div>
        <div class="p-3 border-t border-slate-100 flex gap-2">
          <textarea id="msg-text" rows="2" maxlength="${MSG_MAX_LEN}" class="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium focus:outline-none focus:border-[#D4A359]" placeholder="اكتب رسالتك..."></textarea>
          <button onclick="comms.send('${peerId}')" class="px-4 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white text-xs font-black rounded-xl transition"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
      </div>`;
  }

  function closeThread() {
    state.commsPeer = null;
    navigateTo("comms");
  }

  function send(peerId) {
    if (!isStaff()) return;
    const peer = userById(peerId);
    if (!peer || (peer.role !== "admin" && peer.role !== "supervisor")) return;
    const el = document.getElementById("msg-text");
    const text = cleanMultiline(el ? el.value : "", MSG_MAX_LEN);
    if (!text) return;
    if (!Array.isArray(db.messages)) db.messages = [];
    const now = Date.now();
    db.messages.push({
      id: makeUniqueId("msg"),
      fromId: me().id,
      fromName: cleanText(me().name, 80),
      toId: peer.id,
      toName: cleanText(peer.name, 80),
      text,
      ts: now,
      updatedAt: now,
      readAt: null,
    });
    notify(peer.id, "رسالة", `رسالة من ${me().name}`, text.slice(0, 140));
    persist("messages", "notifications");
    openThread(peerId);
  }

  // =====================================================================
  // الإنذارات
  // =====================================================================
  function allWarningTypes() {
    const app = getAppSettings();
    if (!Array.isArray(app.warningTypes)) app.warningTypes = [];
    return app.warningTypes;
  }
  function activeWarningTypes() {
    return allWarningTypes().filter((t) => t && !t.archived);
  }

  function visibleStudents() {
    const u = me();
    const students = (db.users || []).filter((x) => x && x.role === "student");
    if (!u) return [];
    if (u.role === "admin") return students;
    if (u.role === "supervisor") {
      const progs = u.assignedPrograms || [];
      return students.filter((s) => progs.includes(s.currentProgramId));
    }
    return students.filter((s) => s.id === u.id);
  }

  function warningsOf(studentId) {
    return (db.warnings || [])
      .filter((w) => w && w.studentId === studentId && !w.revoked)
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }

  function addWarningType() {
    if (!isAdmin()) return;
    const el = document.getElementById("wt-name");
    const name = cleanText(el ? el.value : "", 60);
    if (!name) {
      alert("اكتب اسم نوع الإنذار (مثال: إنذار أول).");
      return;
    }
    if (activeWarningTypes().some((t) => t.name === name)) {
      alert("هذا النوع موجود.");
      return;
    }
    allWarningTypes().push({ id: makeUniqueId("wt"), name, archived: false });
    persist("appSettings");
    logAudit("إضافة نوع إنذار", name);
    navigateTo("comms");
  }

  function removeWarningType(id) {
    if (!isAdmin()) return;
    const t = allWarningTypes().find((x) => x.id === id);
    if (!t) return;
    if (!confirm(`حذف نوع الإنذار «${t.name}»؟ تبقى الإنذارات الصادرة به سابقاً كما هي.`)) return;
    t.archived = true;
    persist("appSettings");
    logAudit("حذف نوع إنذار", t.name);
    navigateTo("comms");
  }

  function issueWarning() {
    if (!isAdmin()) return;
    const sid = (document.getElementById("wr-student") || {}).value || "";
    const tid = (document.getElementById("wr-type") || {}).value || "";
    const reason = cleanMultiline((document.getElementById("wr-reason") || {}).value || "", 300);
    const st = userById(sid);
    const type = activeWarningTypes().find((t) => t.id === tid);
    if (!st || st.role !== "student") {
      alert("اختر الطالب.");
      return;
    }
    if (!type) {
      alert("اختر نوع الإنذار.");
      return;
    }
    if (!reason) {
      alert("اكتب سبب الإنذار.");
      return;
    }
    if (!confirm(`إصدار «${type.name}» للطالب ${st.name}؟\nسيصله إشعار بذلك.`)) return;
    if (!Array.isArray(db.warnings)) db.warnings = [];
    const now = Date.now();
    db.warnings.push({
      id: makeUniqueId("wrn"),
      studentId: st.id,
      studentName: cleanText(st.name, 80),
      typeId: type.id,
      typeName: type.name,
      reason,
      by: me().id,
      byName: cleanText(me().name, 80),
      ts: now,
      updatedAt: now,
      revoked: false,
    });
    notify(st.id, "إنذار", type.name, `السبب: ${reason}`);
    // ولي الأمر (إن كان له حساب مفعّل) يصله الإنذار أيضاً
    if (window.parents) {
      window.parents.parentsOfStudent(st).forEach((p) =>
        notify(p.id, "إنذار", `${type.name} لابنكم ${st.name}`, `السبب: ${reason}`),
      );
    }
    persist("warnings", "notifications");
    logAudit("إصدار إنذار", `${st.name}: ${type.name}`);
    navigateTo("comms");
  }

  function revokeWarning(id) {
    if (!isAdmin()) return;
    const w = (db.warnings || []).find((x) => x && x.id === id);
    if (!w || w.revoked) return;
    if (!confirm(`إلغاء «${w.typeName}» للطالب ${w.studentName}؟`)) return;
    w.revoked = true;
    w.revokedBy = cleanText(me().name, 80);
    w.updatedAt = Date.now();
    notify(w.studentId, "إنذار", `إلغاء ${w.typeName}`, "تم إلغاء الإنذار الصادر لك.");
    persist("warnings", "notifications");
    logAudit("إلغاء إنذار", `${w.studentName}: ${w.typeName}`);
    navigateTo("comms");
  }

  function warningRowHtml(w, showStudent) {
    return `
      <div class="flex justify-between items-start gap-2 py-2 border-b border-slate-100 last:border-0">
        <div class="min-w-0">
          <div class="font-black text-xs text-slate-800">
            <span class="inline-block text-[10px] px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 ml-1">${escHtml(w.typeName)}</span>
            ${showStudent ? escHtml(w.studentName) : ""}
          </div>
          <div class="text-[11px] text-slate-600 mt-1 whitespace-pre-line">${escHtml(w.reason)}</div>
          <div class="text-[10px] text-slate-400 mt-0.5">${escHtml(w.byName || "")} · ${escHtml(whenText(w.ts))}</div>
        </div>
        ${isAdmin() ? `<button onclick="comms.revokeWarning('${w.id}')" class="shrink-0 px-2.5 py-1 bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 rounded-lg text-[10px] font-bold">إلغاء</button>` : ""}
      </div>`;
  }

  function renderWarnings() {
    const students = visibleStudents();
    const ids = new Set(students.map((s) => s.id));
    const list = (db.warnings || [])
      .filter((w) => w && !w.revoked && ids.has(w.studentId))
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));

    if (role() === "student") {
      return `
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <h3 class="font-black text-[#0B2533] text-sm mb-2"><i class="fa-solid fa-triangle-exclamation text-[#9E1B48] ml-1.5"></i> إنذاراتي (${list.length})</h3>
          ${list.length === 0 ? '<div class="text-center py-6 text-emerald-700 text-xs font-bold">لا توجد عليك إنذارات — بارك الله فيك</div>' : list.map((w) => warningRowHtml(w, false)).join("")}
        </div>`;
    }

    // ملخص: عدد الإنذارات لكل طالب
    const counts = new Map();
    list.forEach((w) => counts.set(w.studentId, (counts.get(w.studentId) || 0) + 1));
    const summary = students
      .filter((s) => counts.has(s.id))
      .sort((a, b) => counts.get(b.id) - counts.get(a.id));

    const types = activeWarningTypes();
    const adminPanel = isAdmin()
      ? `
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
        <h3 class="font-black text-[#0B2533] text-sm"><i class="fa-solid fa-sliders text-[#D4A359] ml-1.5"></i> أنواع الإنذارات</h3>
        <div class="flex flex-wrap gap-2">
          ${
            types.length === 0
              ? '<div class="text-slate-400 text-xs">لا توجد أنواع بعد — مثال: إنذار أول، إنذار ثانٍ، إنذار نهائي.</div>'
              : types
                  .map(
                    (t) => `
            <span class="flex items-center gap-1.5 pr-2.5 pl-1 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-black">
              ${escHtml(t.name)}
              <button onclick="comms.removeWarningType('${t.id}')" title="حذف" class="w-5 h-5 rounded-md hover:bg-white/70"><i class="fa-solid fa-xmark text-[10px]"></i></button>
            </span>`,
                  )
                  .join("")
          }
        </div>
        <div class="flex gap-2">
          <input id="wt-name" maxlength="60" placeholder="نوع جديد (مثال: إنذار أول)" class="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800">
          <button onclick="comms.addWarningType()" class="px-4 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white text-xs font-bold rounded-xl transition"><i class="fa-solid fa-plus ml-1"></i> إضافة</button>
        </div>
      </div>

      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
        <h3 class="font-black text-[#0B2533] text-sm"><i class="fa-solid fa-gavel text-[#9E1B48] ml-1.5"></i> إصدار إنذار لطالب</h3>
        ${
          types.length === 0
            ? '<div class="text-slate-400 text-xs">أضف نوع إنذار واحداً على الأقل أولاً.</div>'
            : `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <select id="wr-student" class="bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700">
            <option value="">اختر الطالب...</option>
            ${students
              .slice()
              .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "ar", { numeric: true }))
              .map((s) => `<option value="${s.id}">${escHtml(s.name)}${counts.get(s.id) ? ` (عليه ${counts.get(s.id)})` : ""}</option>`)
              .join("")}
          </select>
          <select id="wr-type" class="bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700">
            ${types.map((t) => `<option value="${t.id}">${escHtml(t.name)}</option>`).join("")}
          </select>
          <textarea id="wr-reason" rows="2" maxlength="300" placeholder="سبب الإنذار (يصل للطالب)" class="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800"></textarea>
          <button onclick="comms.issueWarning()" class="sm:col-span-2 py-2.5 bg-[#9E1B48] hover:bg-[#7d1539] text-white font-black rounded-xl transition"><i class="fa-solid fa-triangle-exclamation ml-1"></i> إصدار الإنذار</button>
        </div>`
        }
      </div>`
      : `<div class="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900"><i class="fa-solid fa-circle-info ml-1"></i> الإنذارات تصدرها الإدارة فقط. هنا تطّلع على إنذارات طلابك.</div>`;

    return `
      <div class="space-y-4">
        ${adminPanel}
        ${
          summary.length
            ? `<div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5">
                <h3 class="font-black text-[#0B2533] text-sm mb-2"><i class="fa-solid fa-ranking-star text-[#D4A359] ml-1.5"></i> الطلاب الحاصلون على إنذارات</h3>
                <div class="flex flex-wrap gap-1.5">${summary
                  .map((s) => `<span class="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">${escHtml(s.name)}: ${counts.get(s.id)}</span>`)
                  .join("")}</div>
              </div>`
            : ""
        }
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <h3 class="font-black text-[#0B2533] text-sm mb-2"><i class="fa-solid fa-list text-[#D4A359] ml-1.5"></i> سجل الإنذارات (${list.length})</h3>
          ${list.length === 0 ? '<div class="text-slate-400 text-xs">لا توجد إنذارات</div>' : list.slice(0, 60).map((w) => warningRowHtml(w, true)).join("")}
        </div>
      </div>`;
  }

  // بطاقة مختصرة في "تقريري" للطالب (تظهر فقط إن وُجدت إنذارات)
  function renderStudentWarningsCard(studentId, title) {
    const list = warningsOf(studentId);
    if (!list.length) return "";
    return `
      <div class="bg-white rounded-3xl border border-rose-200 shadow-sm p-4 sm:p-5">
        <h3 class="font-black text-rose-800 text-sm mb-2"><i class="fa-solid fa-triangle-exclamation ml-1.5"></i> ${escHtml(title || "إنذاراتي")} (${list.length})</h3>
        ${list.slice(0, 5).map((w) => warningRowHtml(w, false)).join("")}
      </div>`;
  }

  return {
    renderView,
    setTab,
    openThread,
    openThreadFromSelect,
    closeThread,
    send,
    unreadCount,
    addWarningType,
    removeWarningType,
    issueWarning,
    revokeWarning,
    renderStudentWarningsCard,
    warningsOf,
  };
})();
