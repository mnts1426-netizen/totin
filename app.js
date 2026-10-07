/**
 * app.js - محرك المنصة الرئيسي وإدارة العمليات الشاملة
 * يدعم:
 * 1. شاشة التحضير السريع المستقلة (quick-attendance) ودعم مسح الباركود الفوري.
 * 2. تفعيل الإشعارات لجميع المستخدمين فور تسجيل الدخول.
 * 3. حصر صلاحيات المشرف على برامجه المسندة فقط في التحضير والمهام.
 * 4. دعم التقاط تثبيت التطبيق المستقل (PWA).
 * 5. توحيد مسمى (برنامج) في كامل رسائل وتنبيهات النظام.
 */

const state = {
  currentUser: null,
  currentRole: null,
  currentView: "portal",
  currentWeekOffset: 0,
  currentProgramId: "prog_taheel",
  scheduleViewMode: "stacked",
  // وضع رابط الدخول: "student" (رابط طلاب برنامج محدد) أو "staff" (رابط المشرفين والإدارة) أو null (الرابط العام)
  portalMode: null,
  lockedProgramId: null,
  // تاريخ العرض الحالي لشاشة "مراجعة يوم" الخاصة بالمدير (YYYY-MM-DD محلي)
  reviewDate: "",
  // الجلسة المختارة يدوياً في التحضير السريع (لو للبرنامج أكثر من جلسة تحضير)
  quickAttScheduleId: null,
  // تاريخ التحضير المختار في التحضير السريع (YYYY-MM-DD) — فارغ = اليوم
  quickAttDate: null,
};

// ===== أدوات مساعدة عامة =====

// البرامج المفعّلة فقط (أي برنامج بلا isClosed:true يُعتبر مفعّلاً)
function getActivePrograms() {
  return (window.db.programs || []).filter((p) => !p.isClosed);
}

function isProgramActive(programId) {
  const p = (window.db.programs || []).find((x) => x.id === programId);
  return Boolean(p && !p.isClosed);
}

function firstActiveProgramId() {
  const list = getActivePrograms();
  return list.length ? list[0].id : "prog_taheel";
}

// تحويل الأرقام العربية إلى إنجليزية وإزالة الفراغات لتوحيد المقارنة
function normalizeDigits(v) {
  if (v === undefined || v === null) return "";
  const map = {
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
    "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  };
  return String(v)
    .trim()
    .replace(/[٠-٩]/g, (d) => map[d])
    .replace(/\s+/g, "");
}

// التحقق من تكرار رقم الجوال أو رقم الهوية (لا يُسمح بالتكرار نهائياً)
function isPhoneTaken(phone, exceptUserId) {
  const p = normalizeDigits(phone);
  if (!p) return false;
  return (window.db.users || []).some(
    (u) => u.id !== exceptUserId && normalizeDigits(u.phone) === p,
  );
}

function isNationalIdTaken(nationalId, exceptUserId) {
  const n = normalizeDigits(nationalId);
  if (!n) return false;
  return (window.db.users || []).some(
    (u) => u.id !== exceptUserId && normalizeDigits(u.nationalId) === n,
  );
}

// إيجاد مستخدم عبر رقم الجوال أو رقم الهوية
// إيجاد حساب بالمعرّف: المستخدمون (إدارة/مشرفون/طلاب) أو أولياء الأمور (قائمة مستقلة)
function findAccountById(id) {
  if (!id) return null;
  return (
    (window.db.users || []).find((u) => u && u.id === id) ||
    (window.db.parents || []).find((p) => p && p.id === id) ||
    null
  );
}

function findUserByPhoneOrId(value) {
  const v = normalizeDigits(value);
  if (!v) return null;
  return (
    (window.db.users || []).find(
      (u) =>
        normalizeDigits(u.phone) === v || normalizeDigits(u.nationalId) === v,
    ) || null
  );
}

function getDefaultLevelId(programId) {
  const lvl = (window.db.levels || [])
    .filter((l) => l.programId === programId)
    .sort((a, b) => (a.order || 0) - (b.order || 0))[0];
  return lvl ? lvl.id : null;
}

function getDefaultGroupId(programId) {
  const g = (window.db.groups || []).find((x) => x.programId === programId);
  return g ? g.id : null;
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

// معرّف لا يتكرر حتى لو أُنشئ مئات في نفس اللحظة (استيراد، إشعارات جماعية)
let __uidCounter = 0;
function makeUniqueId(prefix) {
  __uidCounter = (__uidCounter + 1) % 1000000;
  return `${prefix}_${Date.now().toString(36)}${__uidCounter.toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

// ===== الحماية من حقن الأكواد (XSS) =====

// تنظيف نص قادم من المستخدم قبل حفظه: إزالة رموز HTML الخطرة والتحكم، وتقييد الطول
function cleanText(v, maxLen) {
  if (v === undefined || v === null) return "";
  let s = String(v)
    .replace(/[<>"'`]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (maxLen && s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}

// ترميز نص عند عرضه داخل innerHTML (دفاع إضافي)
function escHtml(v) {
  if (v === undefined || v === null) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
window.escHtml = escHtml;
window.cleanText = cleanText;

function persist(...collections) {
  // ختم وقت الإنشاء لكل إشعار جديد — الدالة السحابية ترسل للأجهزة الإشعارات الحديثة فقط
  if (
    collections.indexOf("notifications") > -1 &&
    Array.isArray(window.db.notifications)
  ) {
    const now = Date.now();
    window.db.notifications.forEach((n) => {
      if (n && !n.ts) n.ts = now;
    });
  }
  // تقليم الإشعارات الأقدم لإبقاء الوثيقة صغيرة (الإشعارات مؤقتة بطبيعتها)
  if (
    collections.indexOf("notifications") > -1 &&
    Array.isArray(window.db.notifications) &&
    window.db.notifications.length > 500
  ) {
    window.db.notifications = window.db.notifications.slice(0, 500);
  }
  if (window.store && typeof window.store.save === "function") {
    window.store.save(...collections);
  }
}

// ===== الإعدادات والفصل الدراسي =====
function getAppSettings() {
  if (!Array.isArray(window.db.appSettings)) window.db.appSettings = [];
  let app = window.db.appSettings.find((s) => s && s.id === "app");
  if (!app) {
    const seed =
      (window.__DB_SEED__ &&
        window.__DB_SEED__.appSettings &&
        window.__DB_SEED__.appSettings[0]) ||
      { id: "app" };
    app = JSON.parse(JSON.stringify(seed));
    window.db.appSettings.unshift(app);
  }
  return app;
}

// تاريخ بداية الفصل الحالي (لتصفية الإحصاءات على الفصل الجاري)
function termStartDate() {
  const app = getAppSettings();
  return (app.currentTerm && app.currentTerm.startDate) || "2000-01-01";
}

// ===== واتساب =====
// تحويل رقم سعودي 05xxxxxxxx إلى صيغة دولية 9665xxxxxxxx
function toWaNumber(phone) {
  let p = normalizeDigits(phone).replace(/[^\d]/g, "");
  if (!p) return "";
  if (p.startsWith("00")) p = p.slice(2);
  if (p.startsWith("966")) return p;
  if (p.startsWith("0")) p = p.slice(1);
  if (p.length === 9 && p.startsWith("5")) return "966" + p;
  if (p.length === 10 && p.startsWith("05")) return "966" + p.slice(1);
  return p; // رقم دولي كامل مُدخل يدوياً
}

function waLink(phone, text) {
  const num = toWaNumber(phone);
  const body = encodeURIComponent(String(text || ""));
  return num ? `https://wa.me/${num}?text=${body}` : "";
}

function fillTemplate(tpl, map) {
  return String(tpl || "").replace(/\{(\w+)\}/g, (m, k) =>
    map[k] !== undefined && map[k] !== null ? String(map[k]) : "",
  );
}

// ===== سجل العمليات (Audit log) =====
function logAudit(action, details) {
  if (!Array.isArray(window.db.auditLog)) window.db.auditLog = [];
  const u = state.currentUser;
  window.db.auditLog.unshift({
    id: makeId("log"),
    ts: Date.now(),
    date: new Date().toLocaleString("ar-SA"),
    userId: u ? u.id : "system",
    userName: cleanText(u ? u.name : "النظام", 60),
    role: u ? u.role : "system",
    action: cleanText(action, 80),
    details: cleanText(details, 300),
  });
  // إبقاء آخر 600 عملية فقط لتفادي التضخم
  if (window.db.auditLog.length > 600) {
    window.db.auditLog = window.db.auditLog.slice(0, 600);
  }
  persist("auditLog");
}

// ===== الأرشفة: سجلات التحضير الحيّة + المحمّلة من الأرشيف =====
window.__attArchLoaded = window.__attArchLoaded || {}; // { "2026-03": true }
let __attArchiveCheckedThisSession = false;

// أقدم تاريخ يبقى في الوثيقة الحيّة (100 يوم أو بداية الفصل، أيهما أبعد)
function liveAttendanceCutoff() {
  const d = new Date();
  d.setDate(d.getDate() - 100);
  const byDays = localDateStr(d);
  const t = termStartDate();
  return byDays < t ? byDays : t;
}

// كل سجلات التحضير المتاحة حالياً (الحيّة + ما حُمّل من الأرشيف) بلا تكرار
function getAttendanceRecords() {
  const live = Array.isArray(window.db.attendanceRecords)
    ? window.db.attendanceRecords
    : [];
  const arch = Array.isArray(window.db._attArch) ? window.db._attArch : [];
  if (!arch.length) return live;
  const map = new Map();
  arch.forEach((r) => r && r.id && map.set(r.id, r));
  live.forEach((r) => r && r.id && map.set(r.id, r));
  return Array.from(map.values());
}

// تحميل أشهر الأرشيف اللازمة لتغطية نطاق تاريخي (يُستدعى قبل عرض تقارير/أيام قديمة)
function ensureAttendanceArchive(fromISO, toISO, cb) {
  if (!window.store || typeof window.store.loadArchive !== "function") {
    if (cb) cb();
    return;
  }
  const months = [];
  // نبدأ من أول الشهر حتى لا يُتخطّى شهر (31 يناير + شهر = 3 مارس)
  const cur = new Date((fromISO || "2000-01-01").slice(0, 7) + "-01T00:00:00");
  const endKey = (toISO || todayStr()).slice(0, 7);
  while (localDateStr(cur).slice(0, 7) <= endKey && months.length < 60) {
    const key = localDateStr(cur).slice(0, 7);
    if (!window.__attArchLoaded[key]) months.push(key);
    cur.setMonth(cur.getMonth() + 1);
  }
  if (months.length === 0) {
    if (cb) cb();
    return;
  }
  if (!window.db._attArch) window.db._attArch = [];
  let pending = months.length;
  months.forEach((key) => {
    window.store.loadArchive("attendanceRecords", key).then((items) => {
      window.__attArchLoaded[key] = true;
      (items || []).forEach((r) => {
        if (r && r.id && !window.db._attArch.some((x) => x.id === r.id))
          window.db._attArch.push(r);
      });
      if (--pending === 0 && cb) cb();
    });
  });
}

// حدّ الأمان لحجم وثيقة التحضير الحيّة (حد Firestore للوثيقة الواحدة 1 ميجا تقريباً)
const ATT_LIVE_SAFE_BYTES = 550 * 1024;
const ATT_LIVE_MIN_DAYS = 60; // عند تجاوز الحدّ تبقى آخر 60 يوماً حيّة على الأقل

function attendanceLiveBytes() {
  try {
    return JSON.stringify(window.db.attendanceRecords || []).length;
  } catch (e) {
    return 0;
  }
}

// تسجيل آخر تاريخ نُقل للأرشيف (ليُحمَّل تلقائياً إن كان داخل الفصل الحالي)
function noteAttendanceArchivedThrough(maxDate) {
  if (!maxDate) return;
  const app = getAppSettings();
  if (!app.attArchivedThrough || app.attArchivedThrough < maxDate) {
    app.attArchivedThrough = maxDate;
    persist("appSettings");
  }
}

function archiveAttendanceBefore(cutoff) {
  const moving = (window.db.attendanceRecords || []).filter(
    (r) => (r.date || "") < cutoff,
  );
  const maxDate = moving.reduce(
    (m, r) => ((r.date || "") > m ? r.date : m),
    "",
  );
  return window.store
    .archiveOld(
      "attendanceRecords",
      (r) => (r.date || "") < cutoff,
      (r) => (r.date || "2000-01").slice(0, 7),
    )
    .then((res) => {
      if (res.moved > 0) {
        // السجلات المنقولة موجودة في الذاكرة: نضيفها لأرشيف الجلسة مباشرة
        // فتبقى الإحصاءات كاملة دون أي قراءة إضافية
        const liveIds = new Set(
          (window.db.attendanceRecords || []).map((r) => r && r.id),
        );
        if (!Array.isArray(window.db._attArch)) window.db._attArch = [];
        const have = new Set(window.db._attArch.map((r) => r && r.id));
        moving.forEach((r) => {
          if (r && r.id && !liveIds.has(r.id) && !have.has(r.id))
            window.db._attArch.push(r);
        });
        noteAttendanceArchivedThrough(maxDate);
      }
      return res;
    });
}

// أرشفة السجلات الأقدم من الحدّ الحيّ (المدير فقط، مرة كل جلسة، عند تجاوز عتبة)
function maybeArchiveAttendance() {
  if (__attArchiveCheckedThisSession) return;
  if (!state.currentUser || state.currentUser.role !== "admin") return;
  if (!window.store || !window.store.firstSyncDone()) return;
  const live = window.db.attendanceRecords || [];
  const tooBig = attendanceLiveBytes() > ATT_LIVE_SAFE_BYTES;
  if (live.length < 1200 && !tooBig) return; // لا داعي قبل ذلك
  __attArchiveCheckedThisSession = true;
  let cutoff = liveAttendanceCutoff();
  if (tooBig) {
    // الوثيقة تقترب من حدّها: نؤرشف حتى داخل الفصل الحالي (تبقى آخر 60 يوماً حيّة)،
    // وأشهر الفصل المؤرشفة تُحمَّل تلقائياً فلا تتأثر الإحصاءات.
    const d = new Date();
    d.setDate(d.getDate() - ATT_LIVE_MIN_DAYS);
    const bySize = localDateStr(d);
    if (bySize > cutoff) cutoff = bySize;
  }
  archiveAttendanceBefore(cutoff).then((res) => {
    if (res.moved > 0) {
      logAudit("أرشفة تلقائية", `${res.moved} سجل تحضير قديم`);
      navigateTo(state.currentView);
    }
  });
}

// إن نُقلت سجلات من الفصل الحالي للأرشيف، تُحمَّل أشهرها مرة واحدة لكل جلسة
// حتى تبقى إحصاءات الفصل والتقارير كاملة. (لا قراءات إضافية إن لم يحدث ذلك)
let __termArchivePreloaded = false;
function preloadTermArchiveIfNeeded() {
  if (__termArchivePreloaded) return;
  if (!window.store || !window.store.firstSyncDone()) return;
  const through = getAppSettings().attArchivedThrough;
  const tStart = termStartDate();
  if (!through || through < tStart) return;
  __termArchivePreloaded = true;
  // شهر قد يكون حُمّل (فارغاً) قبل نقل سجلاته للأرشيف: نعيد تحميل أشهر الفصل مرة واحدة
  const m = new Date(tStart.slice(0, 7) + "-01T00:00:00");
  while (localDateStr(m).slice(0, 7) <= through.slice(0, 7)) {
    delete window.__attArchLoaded[localDateStr(m).slice(0, 7)];
    m.setMonth(m.getMonth() + 1);
  }
  const before = (window.db._attArch || []).length;
  ensureAttendanceArchive(tStart, through, () => {
    if ((window.db._attArch || []).length !== before && state.currentUser) {
      navigateTo(state.currentView);
    }
  });
}

// أرشفة يدوية فورية (زر في شاشة الفصل الدراسي)
function archiveAttendanceNow() {
  if (!state.currentUser || state.currentUser.role !== "admin") return;
  const cutoff = liveAttendanceCutoff();
  const n = (window.db.attendanceRecords || []).filter(
    (r) => (r.date || "") < cutoff,
  ).length;
  if (n === 0) {
    alert("لا توجد سجلات قديمة للأرشفة. كل السجلات ضمن الفترة الحيّة.");
    return;
  }
  if (
    !confirm(
      `أرشفة (${n}) سجل تحضير أقدم من ${cutoff}؟\nتبقى محفوظة بالكامل وتظهر عند مراجعة تلك الأيام.`,
    )
  )
    return;
  archiveAttendanceBefore(cutoff)
    .then((res) => {
      logAudit("أرشفة يدوية", `${res.moved} سجل`);
      alert(`تمت أرشفة (${res.moved}) سجل.`);
      navigateTo("term-manage");
    });
}

// ===== إحصاءات الحضور الحقيقية =====
// حساب إحصاء حضور طالب واحد ضمن نطاق تاريخي
function studentAttendanceStats(studentId, fromISO, toISO) {
  const from = fromISO || termStartDate();
  const to = toISO || todayStr();
  const recs = getAttendanceRecords().filter(
    (r) =>
      r.studentId === studentId &&
      (r.date || "") >= from &&
      (r.date || "") <= to,
  );
  const s = { present: 0, absent: 0, late: 0, excused: 0, total: recs.length };
  recs.forEach((r) => {
    if (r.status === "حاضر") s.present++;
    else if (r.status === "غائب") s.absent++;
    else if (r.status === "متأخر") s.late++;
    else if (r.status === "مستأذن") s.excused++;
  });
  // نسبة الانضباط: (حاضر + نصف وزن للتأخر) / (الكل عدا المستأذن)
  const denom = s.present + s.absent + s.late;
  s.rate = denom > 0 ? Math.round(((s.present + s.late * 0.5) / denom) * 100) : 100;
  return s;
}

// نسبة الانضباط العامة (لكل البرامج المفعّلة أو برنامج محدد) خلال الفصل الحالي
function overallDisciplineRate(programId) {
  const from = termStartDate();
  const activeIds = getActivePrograms().map((p) => p.id);
  const recs = getAttendanceRecords().filter((r) => {
    if ((r.date || "") < from) return false;
    if (programId) return r.programId === programId;
    return !r.programId || activeIds.includes(r.programId);
  });
  let present = 0,
    late = 0,
    denom = 0,
    manual = 0;
  recs.forEach((r) => {
    if (!r.auto) manual++;
    if (r.status === "حاضر") {
      present++;
      denom++;
    } else if (r.status === "متأخر") {
      late++;
      denom++;
    } else if (r.status === "غائب") denom++;
  });
  // لا نعرض نسبة إذا لم يُرصد أي حضور يدوياً بعد (كل السجلات تغييب تلقائي)
  if (denom === 0 || manual === 0) return null;
  return Math.round(((present + late * 0.5) / denom) * 100);
}

// هل للطالب عذر معتمد في هذا التاريخ؟
function hasApprovedExcuse(studentId, dateISO) {
  return (window.db.excuseRequests || []).some(
    (e) =>
      e.studentId === studentId &&
      e.status === "معتمد" &&
      dateISO >= (e.fromDate || "") &&
      dateISO <= (e.toDate || e.fromDate || ""),
  );
}

function approvedExcuseReason(studentId, dateISO) {
  const e = (window.db.excuseRequests || []).find(
    (x) =>
      x.studentId === studentId &&
      x.status === "معتمد" &&
      dateISO >= (x.fromDate || "") &&
      dateISO <= (x.toDate || x.fromDate || ""),
  );
  return e ? e.reason || "" : "";
}

// هل المستخدم في منتصف كتابة داخل نموذج أو نافذة مفتوحة؟ (لتفادي مسح إدخاله عند وصول تحديث سحابي)
function isUserBusyEditing() {
  // نافذة منبثقة مُدرجة ديناميكياً (كلها fixed inset-0 وليست مخفية)
  const overlays = document.querySelectorAll(".fixed.inset-0");
  for (const o of overlays) {
    if (o.id === "sidebar-backdrop") continue;
    if (!o.classList.contains("hidden")) return true;
  }
  const el = document.activeElement;
  if (!el) return false;
  const tag = (el.tagName || "").toLowerCase();
  if (tag !== "input" && tag !== "textarea" && tag !== "select") return false;
  // نتجاهل حقول البحث/الاختيار السريعة التي لا تُفقد بيانات مهمة
  return true;
}

// تحديد وضع الرابط من عنوان الصفحة:
//  - رابط الطلاب لكل برنامج:  index.html?v=student&p=prog_taheel
//  - رابط المشرفين والإدارة الموحّد: index.html?v=staff
function applyAccessLinkParams() {
  try {
    const params = new URLSearchParams(window.location.search);
    const view = (params.get("v") || params.get("portal") || "")
      .trim()
      .toLowerCase();
    const prog = (params.get("p") || params.get("program") || "").trim();

    if (view === "staff" || view === "supervisor" || view === "admin") {
      state.portalMode = "staff";
      state.lockedProgramId = null;
    } else if (view === "student" || prog) {
      state.portalMode = "student";
      const match = (window.db.programs || []).find(
        (p) => p.id === prog || p.name === prog,
      );
      state.lockedProgramId = match ? match.id : null;
      if (match) state.currentProgramId = match.id;
    }
  } catch (e) {
    console.warn("تعذر قراءة إعدادات رابط الدخول:", e);
  }
}

// التقاط حدث تثبيت التطبيق PWA
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
});

// 1. التهيئة للبدء في شاشة البوابة
function initApp() {
  if (!window.db || !window.db.users) {
    setTimeout(initApp, 50);
    return;
  }

  // تشغيل طبقة الحفظ (محلي + مزامنة سحابية). عند وصول تحديث من جهاز آخر يُعاد رسم الشاشة الحالية.
  if (window.store && typeof window.store.init === "function") {
    window.store.init(() => {
      try {
        sweepAutoAbsence();
      } catch (e) {
        console.warn(e);
      }
      try {
        maybeArchiveAttendance();
      } catch (e) {
        console.warn(e);
      }
      try {
        preloadTermArchiveIfNeeded();
      } catch (e) {
        console.warn(e);
      }
      try {
        migrateAllPasswordsIfAdmin();
      } catch (e) {
        console.warn(e);
      }
      try {
        if (window.content) window.content.runReadingReminders();
      } catch (e) {
        console.warn(e);
      }
      if (state.currentUser) {
        const stillValid = findAccountById(state.currentUser.id);
        if (!stillValid) {
          logoutUser();
          return;
        }
        state.currentUser = stillValid;
        updateNotificationsBadge();
        try {
          checkNewNotifications();
        } catch (e) {
          console.warn(e);
        }
      }
      // لا نُعيد رسم الشاشة إذا كان المستخدم في منتصف إدخال/نافذة مفتوحة حتى لا نفقد ما يكتبه
      if (!isUserBusyEditing()) {
        navigateTo(state.currentView);
      }
    });
  }

  if (!state.reviewDate) state.reviewDate = todayStr();
  applyAccessLinkParams();
  sweepAutoAbsence();
  hideAppControls();

  // استعادة جلسة الدخول السابقة إن وُجدت (تسجيل الدخول يبقى محفوظاً)
  if (!restoreSession()) {
    navigateTo("portal");
  }
}

// ===== حفظ/استعادة جلسة الدخول =====
const SESSION_KEY = "totin_session_v1";
const SESSION_MAX_AGE = 45 * 24 * 60 * 60 * 1000; // 45 يوماً

function saveSession() {
  try {
    if (!state.currentUser) return;
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        userId: state.currentUser.id,
        programId: state.currentProgramId,
        portalMode: state.portalMode,
        lockedProgramId: state.lockedProgramId,
        ts: Date.now(),
      }),
    );
  } catch (e) {}
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {}
}

function restoreSession() {
  let s = null;
  try {
    s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch (e) {
    s = null;
  }
  if (!s || !s.userId || !s.ts || Date.now() - s.ts > SESSION_MAX_AGE) {
    return false;
  }
  const user = findAccountById(s.userId);
  if (!user || user.isRestricted) {
    clearSession();
    return false;
  }
  // احترام قيود الرابط: رابط الطلاب للطلاب (وأولياء أمورهم) فقط والعكس
  if (
    state.portalMode === "student" &&
    user.role !== "student" &&
    user.role !== "parent"
  )
    return false;
  if (
    state.portalMode === "staff" &&
    (user.role === "student" || user.role === "parent")
  )
    return false;

  state.currentUser = user;
  state.currentRole = user.role;
  if (s.programId && isProgramActive(s.programId))
    state.currentProgramId = s.programId;
  else state.currentProgramId = firstActiveProgramId();

  showAppControls(user);
  updateNotificationsBadge();
  window.__seenNotifInit = false;
  checkNewNotifications();
  registerPushDevice(user);
  navigateTo("home");
  return true;
}

// ربط هذا الجهاز بإشعارات FCM للمستخدم (بصمت — لا شيء يحدث إن لم يُمنح إذن الإشعارات بعد)
function registerPushDevice(user) {
  try {
    if (window.pushReg && user) window.pushReg.register(user);
  } catch (e) {
    console.warn(e);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

// 2. إخفاء وإظهار عناصر التحكم والقائمة الجانبية
function hideAppControls() {
  const sidebar = document.getElementById("main-sidebar");
  const userControls = document.getElementById("header-user-badge");
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const notifContainer = document.getElementById("notif-container");

  if (sidebar) {
    sidebar.classList.add("hidden");
    sidebar.classList.remove("md:block");
  }
  if (userControls) userControls.classList.add("hidden");
  if (mobileMenuBtn) mobileMenuBtn.classList.add("hidden");
  if (notifContainer) notifContainer.classList.add("hidden");
}

function showAppControls(user) {
  const sidebar = document.getElementById("main-sidebar");
  const userControls = document.getElementById("header-user-badge");
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const notifContainer = document.getElementById("notif-container");

  // إظهار القائمة الجانبية بالكامل على سطح المكتب وتفعيلها للجوال
  if (sidebar) {
    sidebar.classList.remove("hidden");
    sidebar.classList.remove("md:hidden");
    sidebar.classList.add("md:block");
  }
  if (userControls) {
    userControls.classList.remove("hidden");
    userControls.classList.add("flex");
  }
  if (mobileMenuBtn) {
    mobileMenuBtn.classList.remove("hidden");
  }

  // إظهار مركز التنبيهات لجميع المستخدمين فور تسجيل الدخول
  if (notifContainer) {
    notifContainer.classList.remove("hidden");
  }

  const nameEl = document.getElementById("header-user-name");
  const roleEl = document.getElementById("header-user-role");
  const avatarEl = document.getElementById("header-avatar");

  if (nameEl) nameEl.innerText = user.name;
  if (roleEl) {
    roleEl.innerText =
      user.role === "admin"
        ? "إدارة كاملة لكل البرامج"
        : user.role === "supervisor"
          ? "مشرف معتمد"
          : user.role === "parent"
            ? "ولي أمر"
            : "طالب مسجل";
  }
  if (avatarEl) {
    avatarEl.innerText = user.avatar;
  }

  if (window.views && typeof window.views.renderSidebar === "function") {
    window.views.renderSidebar(user.role);
  }
}

// ===== حماية كلمات المرور =====
// تُحفظ كلمة المرور "مُشفّرة" (بصمة SHA-256 متكررة) في الحقل passHash بدل النص الواضح.
// الحسابات القديمة (password نص واضح) تبقى تعمل، وتُحوَّل تلقائياً عند دخول صاحبها أو دخول المدير.
const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function sha256Hex(message) {
  const bytes = new TextEncoder().encode(String(message));
  const len = bytes.length;
  const total = ((len + 9 + 63) >> 6) << 6;
  const buf = new Uint8Array(total);
  buf.set(bytes);
  buf[len] = 0x80;
  const dv = new DataView(buf.buffer);
  const bits = len * 8;
  dv.setUint32(total - 8, Math.floor(bits / 0x100000000));
  dv.setUint32(total - 4, bits >>> 0);
  const H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const W = new Uint32Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
      const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 =
        (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + SHA256_K[i] + W[i]) >>> 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }
  return H.map((x) => x.toString(16).padStart(8, "0")).join("");
}

const PASS_HASH_PREFIX = "h1$";
const PASS_HASH_ROUNDS = 500;

// البصمة مرتبطة بمعرّف الحساب، فنفس كلمة المرور لحسابين تعطي بصمتين مختلفتين
function passwordHashFor(userId, plain) {
  let h = sha256Hex("totin|" + userId + "|" + String(plain));
  for (let i = 1; i < PASS_HASH_ROUNDS; i++) h = sha256Hex(h + "|" + userId);
  return PASS_HASH_PREFIX + h;
}

function setUserPassword(user, plain) {
  if (!user || !user.id) return;
  user.passHash = passwordHashFor(user.id, plain);
  delete user.password;
}

// الحساب بلا كلمة مرور محفوظة يُعامل بالافتراضية 1234 (كما كانت الشاشات تعرضه)
function checkUserPassword(user, plain) {
  if (!user) return false;
  if (user.passHash) return user.passHash === passwordHashFor(user.id, plain);
  return (user.password || "1234") === plain;
}

// تحويل كلمة مرور حساب قديم (نص واضح) إلى بصمة. يعيد true إن تغيّر شيء.
function migrateUserPassword(user) {
  if (!user || user.passHash) {
    if (user && user.passHash && user.password !== undefined) {
      delete user.password;
      return true;
    }
    return false;
  }
  setUserPassword(user, user.password || "1234");
  return true;
}

// المدير: تحويل كل الحسابات القديمة مرة واحدة لكل جلسة (بعد أول مزامنة فقط)
let __passMigrationDone = false;
function migrateAllPasswordsIfAdmin() {
  if (__passMigrationDone) return;
  if (!state.currentUser || state.currentUser.role !== "admin") return;
  if (window.store && window.store.isCloudConnected() && !window.store.firstSyncDone())
    return;
  __passMigrationDone = true;
  let n = 0;
  (window.db.users || []).forEach((u) => {
    if (migrateUserPassword(u)) n++;
  });
  if (n > 0) {
    persist("users");
    logAudit("حماية كلمات المرور", `تشفير ${n} كلمة مرور`);
  }
}

// حد المحاولات الخاطئة: 5 محاولات ثم إيقاف 5 دقائق (على هذا الجهاز)
const LOGIN_FAIL_KEY = "totin_login_fail";
const LOGIN_MAX_FAILS = 5;
const LOGIN_LOCK_MS = 5 * 60 * 1000;

function loginFailState() {
  try {
    return JSON.parse(localStorage.getItem(LOGIN_FAIL_KEY) || "{}") || {};
  } catch (e) {
    return {};
  }
}

function loginLockedMinutes(userId) {
  const s = loginFailState()[userId];
  if (!s || !s.until || s.until <= Date.now()) return 0;
  return Math.ceil((s.until - Date.now()) / 60000);
}

function recordLoginFail(userId) {
  const all = loginFailState();
  let s = all[userId] || { n: 0 };
  if (s.until && s.until <= Date.now()) s = { n: 0 }; // انتهى إيقاف سابق
  s.n = (s.n || 0) + 1;
  let left = LOGIN_MAX_FAILS - s.n;
  if (left <= 0) {
    s = { n: 0, until: Date.now() + LOGIN_LOCK_MS };
    left = 0;
  }
  all[userId] = s;
  try {
    localStorage.setItem(LOGIN_FAIL_KEY, JSON.stringify(all));
  } catch (e) {}
  return left; // عدد المحاولات المتبقية (0 = أُوقف الآن)
}

function clearLoginFails(userId) {
  const all = loginFailState();
  if (all[userId]) {
    delete all[userId];
    try {
      localStorage.setItem(LOGIN_FAIL_KEY, JSON.stringify(all));
    } catch (e) {}
  }
}

// 3. التحقق وتسجيل الدخول
function handleLoginSubmit(programId) {
  const selectEl = document.getElementById("login-user-select");
  const userSelect = selectEl ? selectEl.value : "";
  const phoneInput = document.getElementById("login-phone").value.trim();
  const passInput = document.getElementById("login-pass").value.trim();

  let user = null;
  if (userSelect) {
    user = db.users.find((u) => u.id === userSelect);
  } else {
    // الدخول برقم الجوال أو رقم الهوية
    user = findUserByPhoneOrId(phoneInput);
  }

  // ولي الأمر: يدخل برقم جواله المسجّل عند أبنائه (حساب مستقل)
  if (!userSelect && window.parents && state.portalMode !== "staff") {
    if (window.parents.tryLogin(phoneInput, passInput, user, programId)) return;
  }

  if (!user) {
    alert(
      "بيانات الدخول غير صحيحة. يرجى التأكد من رقم الجوال أو رقم الهوية.",
    );
    return;
  }

  const lockedMin = loginLockedMinutes(user.id);
  if (lockedMin > 0) {
    alert(
      `تم إيقاف الدخول لهذا الحساب مؤقتاً بسبب محاولات خاطئة متكررة.\nحاول بعد ${lockedMin} دقيقة.`,
    );
    return;
  }

  if (!checkUserPassword(user, passInput)) {
    const left = recordLoginFail(user.id);
    alert(
      left > 0
        ? `كلمة المرور غير صحيحة! (متبقٍ ${left} محاولات قبل الإيقاف المؤقت)`
        : "كلمة المرور غير صحيحة! تم إيقاف الدخول لهذا الحساب 5 دقائق.",
    );
    return;
  }
  clearLoginFails(user.id);

  if (user.isRestricted) {
    alert("عذراً، هذا الحساب مقيد حالياً. يرجى التواصل مع إدارة المنصة.");
    return;
  }

  // حصر نوع الرابط: رابط الطلاب للطلاب فقط، ورابط المشرفين للمشرفين والإدارة فقط
  if (state.portalMode === "student" && user.role !== "student") {
    alert("هذا الرابط مخصص للطلاب فقط. يرجى استخدام رابط المشرفين والإدارة.");
    return;
  }
  if (state.portalMode === "staff" && user.role === "student") {
    alert("هذا الرابط مخصص للمشرفين والإدارة. يرجى استخدام رابط الطلاب الخاص ببرنامجك.");
    return;
  }

  // منع تسجيل الدخول عبر برنامج مغلق
  const loginProg = db.programs.find((p) => p.id === programId);
  if (loginProg && loginProg.isClosed) {
    alert(`عذراً، برنامج ${loginProg.name} مغلق حالياً ولا يمكن الدخول إليه.`);
    return;
  }

  state.currentUser = user;
  state.currentRole = user.role;
  state.currentProgramId = isProgramActive(programId)
    ? programId
    : firstActiveProgramId();

  if (user.role === "student" && isProgramActive(programId)) {
    user.currentProgramId = programId;
  }

  closeModal("login-modal");
  showAppControls(user);
  updateNotificationsBadge();
  window.__seenNotifInit = false;
  checkNewNotifications();
  registerPushDevice(user);
  saveSession();
  try {
    logAudit("تسجيل دخول", `دخول ${user.role} إلى المنصة`);
  } catch (e) {}
  // تشفير كلمة مرور هذا الحساب إن كانت ما تزال نصاً واضحاً (والمدير: كل الحسابات)
  try {
    if (migrateUserPassword(user)) persist("users");
    migrateAllPasswordsIfAdmin();
  } catch (e) {
    console.warn(e);
  }
  navigateTo("home");
}

function logoutUser() {
  // فك ربط الجهاز حتى لا تصله إشعارات المستخدم الذي خرج
  try {
    if (window.pushReg) window.pushReg.unregister();
  } catch (e) {}
  clearSession();
  state.currentUser = null;
  state.currentRole = null;
  window.__seenNotifInit = false;
  window.__seenNotifIds = new Set();
  hideAppControls();
  navigateTo("portal");
}

// 4. اختيار البرنامج والدخول
function selectProgramPath(progId) {
  const targetProg = db.programs.find((p) => p.id === progId);
  if (targetProg && targetProg.isClosed) {
    alert(
      `عذراً، برنامج ${targetProg.name} مغلق حالياً ولا يمكن الدخول إليه.`,
    );
    return;
  }
  state.currentProgramId = progId;
  if (!state.currentUser) {
    views.openLoginModal(progId);
  } else {
    if (state.currentUser.role === "student") {
      state.currentUser.currentProgramId = progId;
    }
    navigateTo("schedule");
  }
}

function toggleMobileSidebar() {
  const sidebar = document.getElementById("main-sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  if (!sidebar || !backdrop) return;

  const isOpen = sidebar.classList.contains("sidebar-open");
  if (isOpen) {
    sidebar.classList.remove("sidebar-open");
    backdrop.classList.add("hidden");
  } else {
    sidebar.classList.add("sidebar-open");
    backdrop.classList.remove("hidden");
  }
}

function toggleScheduleViewMode(mode) {
  state.scheduleViewMode = mode;
  navigateTo("schedule");
}

// 5. محرك التنقل بين الشاشات
function navigateTo(viewName) {
  // تاريخ/جلسة التحضير السريع المختاران يُنسيان عند مغادرة الشاشة (لا يبقى تاريخ قديم عالقاً)
  if (viewName !== "quick-attendance") {
    state.quickAttDate = null;
    state.quickAttScheduleId = null;
  }
  state.currentView = viewName;

  const sidebar = document.getElementById("main-sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  if (sidebar && sidebar.classList.contains("sidebar-open")) {
    sidebar.classList.remove("sidebar-open");
    if (backdrop) backdrop.classList.add("hidden");
  }

  document.querySelectorAll("#sidebar-nav button").forEach((btn) => {
    btn.classList.remove("nav-item-active");
  });
  // القائمة مجمّعة: الصفحة تُظلّل خانتها، وتُحفظ كآخر تبويب مستخدم فيها
  const navGroup =
    window.views && window.views.groupOfView
      ? window.views.groupOfView(viewName)
      : null;
  if (navGroup) {
    if (!state.navLastTab) state.navLastTab = {};
    state.navLastTab[navGroup.id] = viewName;
  }
  const activeBtn = document.getElementById(
    `nav-${navGroup ? navGroup.id : viewName}`,
  );
  if (activeBtn) activeBtn.classList.add("nav-item-active");

  const contentArea = document.getElementById("app-content");
  if (!contentArea || !window.views) return;

  // أي شاشة داخلية تتطلب تسجيل دخول: بدون مستخدم نعود للبوابة (يمنع أخطاء العرض)
  if (!state.currentUser && viewName !== "portal") {
    state.currentView = "portal";
    contentArea.innerHTML = window.views.renderPortalView();
    return;
  }

  // ولي الأمر: شاشتان فقط (أبنائي، الإعدادات)
  if (state.currentUser && state.currentUser.role === "parent" && window.parents) {
    try {
      contentArea.innerHTML =
        viewName === "settings"
          ? window.parents.renderSettings()
          : window.parents.renderHome();
    } catch (e) {
      console.error("خطأ في عرض شاشة ولي الأمر:", e);
    }
    return;
  }

  try {
    switch (viewName) {
      case "portal":
        contentArea.innerHTML = window.views.renderPortalView();
        break;
      case "home":
        contentArea.innerHTML = window.views.renderHome(state.currentUser);
        break;
      case "quick-attendance":
        contentArea.innerHTML = window.views.renderQuickAttendanceView
          ? window.views.renderQuickAttendanceView()
          : window.views.renderHome(state.currentUser);
        // إبقاء التركيز على حقل المسح ليستمر قارئ الباركود (USB) في العمل
        // دون الحاجة للضغط داخل الحقل بعد كل عملية تحضير
        if (window.views.focusBarcodeInput) {
          setTimeout(() => window.views.focusBarcodeInput(), 0);
        }
        break;
      case "schedule":
        contentArea.innerHTML = window.views.renderScheduleWidget(
          state.currentProgramId,
          state.currentWeekOffset,
          state.scheduleViewMode,
        );
        break;
      case "tasks":
        contentArea.innerHTML = window.views.renderTasksView(state.currentUser);
        break;
      case "attendance":
        contentArea.innerHTML = window.views.renderAttendanceManagementView
          ? window.views.renderAttendanceManagementView()
          : window.views.renderHome(state.currentUser);
        break;
      case "students":
        contentArea.innerHTML = window.views.renderAdminStudentsView
          ? window.views.renderAdminStudentsView()
          : window.views.renderHome(state.currentUser);
        break;
      case "supervisors":
        contentArea.innerHTML = window.views.renderAdminSupervisorsView
          ? window.views.renderAdminSupervisorsView()
          : window.views.renderHome(state.currentUser);
        break;
      case "announcements":
        contentArea.innerHTML = window.views.renderAnnouncementsView
          ? window.views.renderAnnouncementsView()
          : window.views.renderHome(state.currentUser);
        break;
      case "settings":
        contentArea.innerHTML = window.views.renderSettingsView
          ? window.views.renderSettingsView()
          : window.views.renderHome(state.currentUser);
        break;
      case "day-review":
        contentArea.innerHTML =
          window.views.renderDayReviewView && state.currentUser.role === "admin"
            ? window.views.renderDayReviewView()
            : window.views.renderHome(state.currentUser);
        break;
      case "schedule-manage":
        contentArea.innerHTML =
          window.views.renderScheduleManageView &&
          state.currentUser.role === "admin"
            ? window.views.renderScheduleManageView()
            : window.views.renderHome(state.currentUser);
        break;
      case "audit-log":
        contentArea.innerHTML =
          window.views.renderAuditLogView && state.currentUser.role === "admin"
            ? window.views.renderAuditLogView()
            : window.views.renderHome(state.currentUser);
        break;
      case "term-manage":
        contentArea.innerHTML =
          window.views.renderTermManageView && state.currentUser.role === "admin"
            ? window.views.renderTermManageView()
            : window.views.renderHome(state.currentUser);
        break;
      case "excuses":
        contentArea.innerHTML = window.views.renderExcusesView
          ? window.views.renderExcusesView()
          : window.views.renderHome(state.currentUser);
        break;
      case "parents":
        contentArea.innerHTML =
          window.parents && state.currentUser.role === "admin"
            ? window.parents.renderAdminView()
            : window.views.renderHome(state.currentUser);
        break;
      case "content":
        contentArea.innerHTML = window.content
          ? window.content.renderView()
          : window.views.renderHome(state.currentUser);
        break;
      case "comms":
        contentArea.innerHTML = window.comms
          ? window.comms.renderView()
          : window.views.renderAnnouncementsView();
        break;
      case "grades":
        contentArea.innerHTML =
          window.grades && state.currentUser.role !== "student"
            ? window.grades.renderView()
            : window.views.renderHome(state.currentUser);
        break;
      case "my-report":
        contentArea.innerHTML =
          window.views.renderMyReportView && state.currentUser.role === "student"
            ? window.views.renderMyReportView()
            : window.views.renderHome(state.currentUser);
        break;
      default:
        contentArea.innerHTML = state.currentUser
          ? window.views.renderHome(state.currentUser)
          : window.views.renderPortalView();
        break;
    }
    // تبويبات الخانة (مثل: الطلاب | المشرفون | أولياء الأمور)
    if (navGroup && window.views.renderGroupTabs) {
      const bar = window.views.renderGroupTabs(viewName);
      if (bar) contentArea.insertAdjacentHTML("afterbegin", bar);
    }
  } catch (e) {
    console.error("خطأ في عرض الشاشة (" + viewName + "):", e);
    // fallback آمن حتى لا تبقى الشاشة فارغة
    try {
      contentArea.innerHTML = state.currentUser
        ? window.views.renderHome(state.currentUser)
        : window.views.renderPortalView();
    } catch (e2) {
      contentArea.innerHTML = window.views.renderPortalView();
    }
  }
}

// 6. استيراد الطلاب والمشرفين عبر Excel / CSV
// ===== استيراد Excel / CSV =====

// قراءة ملف Excel(xlsx/xls) أو CSV وإرجاع صفوف ككائنات { [الحقل]: القيمة }
function parseImportFile(file, cb) {
  const name = (file.name || "").toLowerCase();
  const reader = new FileReader();

  const finish = (rows) => {
    try {
      cb(rows || []);
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء معالجة الملف.");
    }
  };

  const parseCsv = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    if (!lines.length) return [];
    const split = (l) => l.split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ""));
    const header = split(lines[0]);
    return lines.slice(1).map((l) => {
      const cells = split(l);
      const o = {};
      header.forEach((h, i) => (o[h] = cells[i] || ""));
      return o;
    });
  };

  if (
    typeof XLSX !== "undefined" &&
    (name.endsWith(".xlsx") || name.endsWith(".xls"))
  ) {
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        finish(XLSX.utils.sheet_to_json(ws, { defval: "", raw: false }));
      } catch (err) {
        console.error(err);
        alert("تعذّر قراءة ملف Excel. جرّب حفظه بصيغة CSV.");
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    reader.onload = (e) => finish(parseCsv(String(e.target.result || "")));
    reader.readAsText(file, "UTF-8");
  }
}

// إيجاد قيمة عمود من عدة تسميات محتملة (للتخمين التلقائي الأولي فقط)
function pickCol(row, names) {
  const keys = Object.keys(row);
  for (const want of names) {
    const k = keys.find(
      (key) => key && key.replace(/\s+/g, "").includes(want.replace(/\s+/g, "")),
    );
    if (k && String(row[k]).trim() !== "") return String(row[k]).trim();
  }
  return "";
}

// تخمين اسم عمود الملف (المفتاح نفسه، وليس قيمته) الأقرب لأحد الأسماء المحتملة —
// يُستخدم فقط لتعبئة مربع الاختيار مبدئياً؛ القرار النهائي بيد المستخدم في نافذة المطابقة
function guessColumnKey(headers, names) {
  for (const want of names) {
    const k = headers.find(
      (h) => h && h.replace(/\s+/g, "").includes(want.replace(/\s+/g, "")),
    );
    if (k) return k;
  }
  return "";
}

// الحقول المطلوب تعيينها للطلاب والمشرفين + الأسماء المحتملة للتخمين المبدئي
const STUDENT_IMPORT_FIELDS = [
  { key: "name", label: "الاسم", required: true, guesses: ["الاسم", "اسم", "الطالب", "name"] },
  { key: "phone", label: "رقم الجوال", required: false, guesses: ["الجوال", "جوال", "الهاتف", "الجوّال", "phone", "رقمالجوال"] },
  { key: "nationalId", label: "رقم الهوية", required: false, guesses: ["الهوية", "هوية", "السجل", "id", "رقمالهوية"] },
  { key: "fatherPhone", label: "جوال ولي الأمر", required: false, guesses: ["ولي", "الأب", "ولي الأمر", "جوال الأب", "father"] },
];
const SUPERVISOR_IMPORT_FIELDS = [
  { key: "name", label: "الاسم", required: true, guesses: ["الاسم", "اسم", "المشرف", "name"] },
  { key: "phone", label: "رقم الجوال", required: false, guesses: ["الجوال", "جوال", "الهاتف", "phone"] },
  { key: "nationalId", label: "رقم الهوية", required: false, guesses: ["الهوية", "هوية", "id"] },
];

function handleStudentExcelImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  event.target.value = "";

  parseImportFile(file, (rows) => {
    if (!rows.length) {
      alert("الملف فارغ أو تعذّرت قراءته.");
      return;
    }
    // خطوة مطابقة الأعمدة: المستخدم يختار بنفسه أي عمود في ملفه يقابل كل حقل
    views.openImportMappingModal("student", rows);
  });
}

function handleSupervisorExcelImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  event.target.value = "";

  parseImportFile(file, (rows) => {
    if (!rows.length) {
      alert("الملف فارغ أو تعذّرت قراءته.");
      return;
    }
    views.openImportMappingModal("supervisor", rows);
  });
}

// تنفيذ استيراد الطلاب وفق مطابقة أعمدة اختارها المستخدم بنفسه.
// mapping: { name, phone, nationalId, fatherPhone } كل قيمة = اسم عمود الملف أو "" (بدون)
// لا حقل إلزامي عدا الاسم — أي حقل تُرك "بدون" يبقى فارغاً في السجل، وهذا متوقّع وليس خطأً.
function runStudentImport(rows, mapping, programId) {
  const targetProg =
    db.programs.find((p) => p.id === programId && isProgramActive(p.id)) ||
    getActivePrograms()[0] ||
    db.programs[0];
  let added = 0,
    updated = 0,
    skipped = 0,
    noLogin = 0;
  const problems = [];

  const normName = (s) =>
    cleanText(s, 80).replace(/\s+/g, " ").replace(/[أإآ]/g, "ا").trim();
  const get = (row, colKey) =>
    colKey && row[colKey] !== undefined ? String(row[colKey]).trim() : "";

  rows.forEach((row, i) => {
    const name = cleanText(get(row, mapping.name), 80);
    const phone = normalizeDigits(get(row, mapping.phone));
    const nationalId = normalizeDigits(get(row, mapping.nationalId));
    const fatherPhone = normalizeDigits(get(row, mapping.fatherPhone));

    if (!name) return; // صف بلا اسم = صف فارغ، يُتجاهل بصمت

    // 1) مطابقة موجود بالجوال أو الهوية (إن وُجدا)
    let existing =
      phone || nationalId
        ? db.users.find(
            (u) =>
              u.role === "student" &&
              ((phone && normalizeDigits(u.phone) === phone) ||
                (nationalId && normalizeDigits(u.nationalId) === nationalId)),
          )
        : null;

    // 2) وإلا: مطابقة بالاسم (لتحديث حسابات موجودة بلا رقم صالح)
    if (!existing) {
      const byName = db.users.filter(
        (u) => u.role === "student" && normName(u.name) === normName(name),
      );
      if (byName.length === 1) existing = byName[0];
      else if (byName.length > 1) {
        skipped++;
        problems.push(`صف ${i + 2} (${name}): يوجد أكثر من طالب بنفس الاسم — صحّحه يدوياً`);
        return;
      }
    }

    if (existing) {
      if (
        (phone && isPhoneTaken(phone, existing.id)) ||
        (nationalId && isNationalIdTaken(nationalId, existing.id))
      ) {
        skipped++;
        problems.push(`صف ${i + 2} (${name}): الرقم مستخدم لحساب آخر`);
        return;
      }
      existing.name = name;
      existing.avatar = name.substring(0, 2);
      if (phone) existing.phone = phone;
      if (nationalId) existing.nationalId = nationalId;
      if (fatherPhone) existing.fatherPhone = fatherPhone;
      if (
        phone &&
        (!existing.email || /^[^@]{0,3}@totin\.sa$/.test(existing.email))
      )
        existing.email = `${phone}@totin.sa`;
      if (!existing.phone && !existing.nationalId) noLogin++;
      updated++;
      return;
    }

    if ((phone && isPhoneTaken(phone)) || (nationalId && isNationalIdTaken(nationalId))) {
      skipped++;
      problems.push(`صف ${i + 2} (${name}): الرقم مستخدم لحساب آخر`);
      return;
    }

    if (!phone && !nationalId) noLogin++;

    db.users.push({
      id: makeId("student"),
      name: name,
      role: "student",
      studentNumber: `STU-2026-${String(db.users.filter((u) => u.role === "student").length + 1).padStart(3, "0")}`,
      phone: phone,
      nationalId: nationalId,
      fatherPhone: fatherPhone || phone,
      password: "1234",
      email: phone ? `${phone}@totin.sa` : "",
      avatar: name.substring(0, 2),
      currentProgramId: targetProg.id,
      currentLevelId: getDefaultLevelId(targetProg.id),
      groupId: getDefaultGroupId(targetProg.id),
      supervisorId:
        state.currentUser.role === "supervisor" ? state.currentUser.id : null,
      progress: 0,
      isRestricted: false,
      createdAt: Date.now(),
    });
    added++;
  });

  if (added || updated) {
    persist("users");
    logAudit(
      "استيراد طلاب",
      `جديد: ${added} | محدّث: ${updated} | متجاهل: ${skipped} | بلا معرّف دخول: ${noLogin}`,
    );
  }
  let msg = `اكتمل الاستيراد إلى برنامج ${targetProg.name}:\n• طلاب جدد: ${added}\n• حسابات محدّثة: ${updated}\n• متجاهَل: ${skipped}`;
  if (noLogin > 0) {
    msg += `\n\n⚠️ تنبيه مهم: (${noLogin}) طالباً بلا رقم جوال ولا رقم هوية — لن يستطيعوا تسجيل الدخول حتى تُضاف لهم من «تعديل الطالب».`;
  }
  if (problems.length) msg += `\n\nملاحظات:\n${problems.slice(0, 15).join("\n")}`;
  alert(msg);
  navigateTo("students");
}

// تنفيذ استيراد المشرفين وفق مطابقة أعمدة اختارها المستخدم بنفسه
function runSupervisorImport(rows, mapping, programId) {
  const colors = ["#169BA2", "#E59824", "#8AA838", "#9E1B48", "#2B1736"];
  const targetProg =
    db.programs.find((p) => p.id === programId && isProgramActive(p.id)) ||
    getActivePrograms()[0] ||
    db.programs[0];
  let added = 0,
    updated = 0,
    skipped = 0,
    noLogin = 0;
  const problems = [];
  const get = (row, colKey) =>
    colKey && row[colKey] !== undefined ? String(row[colKey]).trim() : "";

  rows.forEach((row, i) => {
    const name = cleanText(get(row, mapping.name), 80);
    const phone = normalizeDigits(get(row, mapping.phone));
    const nationalId = normalizeDigits(get(row, mapping.nationalId));

    if (!name) return;

    const existing =
      phone || nationalId
        ? db.users.find(
            (u) =>
              u.role === "supervisor" &&
              ((phone && normalizeDigits(u.phone) === phone) ||
                (nationalId && normalizeDigits(u.nationalId) === nationalId)),
          )
        : null;

    if (existing) {
      if (
        (phone && isPhoneTaken(phone, existing.id)) ||
        (nationalId && isNationalIdTaken(nationalId, existing.id))
      ) {
        skipped++;
        problems.push(`صف ${i + 2} (${name}): الرقم مستخدم لحساب آخر`);
        return;
      }
      existing.name = name;
      existing.avatar = name.substring(0, 2);
      if (phone) existing.phone = phone;
      if (nationalId) existing.nationalId = nationalId;
      if (!existing.phone && !existing.nationalId) noLogin++;
      updated++;
      return;
    }

    if ((phone && isPhoneTaken(phone)) || (nationalId && isNationalIdTaken(nationalId))) {
      skipped++;
      problems.push(`صف ${i + 2} (${name}): الرقم مستخدم لحساب آخر`);
      return;
    }

    if (!phone && !nationalId) noLogin++;

    db.users.push({
      id: makeId("supervisor"),
      name: name,
      role: "supervisor",
      phone: phone,
      nationalId: nationalId,
      password: "1234",
      email: phone ? `${phone}@totin.sa` : "",
      avatar: name.substring(0, 2),
      color:
        colors[
          db.users.filter((u) => u.role === "supervisor").length % colors.length
        ],
      assignedPrograms: [targetProg.id],
      assignedGroups: [],
      isRestricted: false,
      createdAt: Date.now(),
    });
    added++;
  });

  if (added || updated) {
    persist("users");
    logAudit(
      "استيراد مشرفين",
      `جديد: ${added} | محدّث: ${updated} | بلا معرّف دخول: ${noLogin}`,
    );
  }
  let msg = `اكتمل الاستيراد إلى برنامج ${targetProg.name}:\n• مشرفون جدد: ${added}\n• حسابات محدّثة: ${updated}\n• متجاهَل: ${skipped}`;
  if (noLogin > 0) {
    msg += `\n\n⚠️ تنبيه: (${noLogin}) مشرفاً بلا رقم جوال ولا هوية — لن يستطيعوا الدخول حتى تُضاف لهم البيانات.`;
  }
  if (problems.length) msg += `\n\nملاحظات:\n${problems.slice(0, 15).join("\n")}`;
  alert(msg);
  navigateTo("supervisors");
}

// تنزيل ملف (Blob) بأمان في كل المتصفحات - يجب إلحاق الرابط بالصفحة قبل الضغط عليه
// وإلا يفشل التنزيل بصمت في بعض المتصفحات (خصوصاً فايرفوكس وبعض متصفحات الجوال)
function downloadBlob(blob, filename) {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
    return true;
  } catch (e) {
    console.error("تعذر بدء التنزيل:", e);
    alert(
      "تعذّر تنزيل الملف من هذا المتصفح. جرّب متصفح Chrome أو Edge الرسمي (وليس متصفحاً مضمّناً داخل تطبيق آخر مثل واتساب أو تويتر).",
    );
    return false;
  }
}

// تصدير قائمة الطلاب الحاليين إلى Excel (لتعبئة الأرقام الصحيحة ثم إعادة الاستيراد)
function exportStudentsExcel() {
  const students = db.users
    .filter((u) => u.role === "student")
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", "ar"));
  const rows = [["الاسم", "رقم الجوال", "رقم الهوية", "جوال ولي الأمر"]];
  students.forEach((s) => {
    rows.push([
      s.name || "",
      /^\d{9,}$/.test(String(s.phone || "").replace(/\D/g, "")) ? s.phone : "",
      /^\d{9,}$/.test(String(s.nationalId || "").replace(/\D/g, ""))
        ? s.nationalId
        : "",
      s.fatherPhone || "",
    ]);
  });
  if (typeof XLSX !== "undefined") {
    try {
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 34 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "الطلاب");
      const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      downloadBlob(
        new Blob([out], { type: "application/octet-stream" }),
        "الطلاب_للتعبئة.xlsx",
      );
      return;
    } catch (e) {
      console.warn("فشل تصدير xlsx، سيُستخدم CSV:", e);
    }
  } else {
    console.warn("مكتبة Excel (XLSX) لم تُحمَّل - يُصدَّر CSV بدلاً منها.");
  }
  const csv =
    "﻿" + rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  downloadBlob(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
    "الطلاب_للتعبئة.csv",
  );
}

// تنزيل قالب Excel للاستيراد
function downloadImportTemplate(kind) {
  const headers =
    kind === "supervisor"
      ? ["الاسم", "رقم الجوال", "رقم الهوية"]
      : ["الاسم", "رقم الجوال", "رقم الهوية", "جوال ولي الأمر"];
  const sample =
    kind === "supervisor"
      ? ["أحمد محمد", "0551234567", "1012345678"]
      : ["عبدالله سعد", "0551234567", "1122334455", "0509876543"];
  if (typeof XLSX !== "undefined") {
    try {
      const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "قالب");
      const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      downloadBlob(
        new Blob([out], { type: "application/octet-stream" }),
        kind === "supervisor" ? "قالب_المشرفين.xlsx" : "قالب_الطلاب.xlsx",
      );
      return;
    } catch (e) {
      console.warn("فشل تصدير xlsx، سيُستخدم CSV:", e);
    }
  } else {
    console.warn("مكتبة Excel (XLSX) لم تُحمَّل - يُصدَّر CSV بدلاً منها.");
  }
  // احتياطي CSV
  const csv = "﻿" + headers.join(",") + "\n" + sample.join(",");
  downloadBlob(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
    kind === "supervisor" ? "قالب_المشرفين.csv" : "قالب_الطلاب.csv",
  );
}

// 7. نظام التحضير المتعدد والغياب التلقائي نهاية اليوم

// سلسلة تاريخ محلية YYYY-MM-DD (بدون تحويل UTC حتى لا تنزلق التواريخ للمستخدمين شرق غرينتش)
function localDateStr(dt) {
  const d = dt || new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayStr() {
  return localDateStr(new Date());
}

// تاريخ سياق التحضير: تاريخ "مراجعة يوم" إن كان المدير داخلها، أو التاريخ الذي اختاره
// المشرف/المدير في شاشة التحضير السريع، وإلا تاريخ اليوم
function attendanceContextDate() {
  if (state.currentView === "day-review" && state.reviewDate)
    return state.reviewDate;
  if (state.currentView === "quick-attendance" && state.quickAttDate)
    return state.quickAttDate;
  return todayStr();
}

// ===== جلسة "تحضير يومي" عامة لكل برنامج =====
// تسمح بالتحضير في أي يوم حتى لو لم تكن له جلسة مجدولة. ليست محفوظة ضمن db.schedules
// (لا تظهر في الجدول الأسبوعي)، ويُتعرَّف عليها من المعرّف "adhoc_<programId>".
function getAdhocSchedule(programId) {
  return {
    id: "adhoc_" + programId,
    programId: programId,
    title: "تحضير يومي",
    time: "—",
    type: "attendance",
    typeLabel: "تحضير",
    dayOfWeek: null,
    requiresAttendance: true,
    adhoc: true,
    details: "",
  };
}

// إيجاد جلسة بالمعرّف: الجلسات المجدولة الحقيقية أو جلسة التحضير اليومي العامة
function getScheduleById(id) {
  const s = (db.schedules || []).find((x) => x.id === id);
  if (s) return s;
  if (typeof id === "string" && id.indexOf("adhoc_") === 0) {
    const pid = id.slice(6);
    if ((db.programs || []).some((p) => p.id === pid)) return getAdhocSchedule(pid);
  }
  return null;
}

// طريقة احتساب أيام التحضير (من إعدادات التطبيق):
//  "taken"     = اليوم يُعتبر يوم تحضير فقط إذا رُصد فيه تحضير فعلاً (الافتراضي)
//  "scheduled" = أيام الجلسات المجدولة + أي يوم رُصد فيه تحضير
function getAttendanceMode() {
  const m = getAppSettings().attendanceMode;
  return m === "scheduled" ? "scheduled" : "taken";
}

function setAttendanceMode(mode) {
  if (!state.currentUser || state.currentUser.role !== "admin") return;
  const app = getAppSettings();
  app.attendanceMode = mode === "scheduled" ? "scheduled" : "taken";
  persist("appSettings");
  logAudit(
    "تغيير طريقة أيام التحضير",
    app.attendanceMode === "scheduled"
      ? "أيام الجلسات المجدولة + أي يوم يُرصد فيه"
      : "أي يوم يُرصد فيه تحضير فقط",
  );
  navigateTo(state.currentView);
}

// سجل رُصد يدوياً (وليس غياباً تلقائياً ولا ناتجاً عن استئذان معتمد)
function isManualAttendanceRecord(r) {
  return Boolean(
    r && !r.auto && r.recordedBy !== "excuse" && r.recordedBy !== "system",
  );
}

// حذف الغياب التلقائي القديم من الأيام التي لم يُرصد فيها أي تحضير يدوي
// (مفيد بعد التحول إلى طريقة "أي يوم يُرصد فيه تحضير فقط")
function cleanupAutoAbsences() {
  if (!state.currentUser || state.currentUser.role !== "admin") return;
  const recs = db.attendanceRecords || [];
  const takenDays = new Set();
  recs.forEach((r) => {
    if (!isManualAttendanceRecord(r)) return;
    const pid = r.programId || (getScheduleById(r.scheduleId) || {}).programId;
    if (pid) takenDays.add(pid + "|" + r.date);
  });
  const isOrphanAuto = (r) =>
    r &&
    r.auto &&
    r.recordedBy === "system" &&
    r.status === "غائب" &&
    !takenDays.has(
      (r.programId || (getScheduleById(r.scheduleId) || {}).programId) +
        "|" +
        r.date,
    );
  const n = recs.filter(isOrphanAuto).length;
  if (n === 0) {
    alert("لا يوجد غياب تلقائي في أيام لم يُرصد فيها تحضير.");
    return;
  }
  if (
    !confirm(
      `سيتم حذف (${n}) سجل غياب تلقائي من أيام لم يُرصد فيها أي تحضير فعلي.\nالسجلات اليدوية لا تُمس. متابعة؟`,
    )
  )
    return;
  db.attendanceRecords = recs.filter((r) => !isOrphanAuto(r));
  persist("attendanceRecords");
  logAudit("تنظيف الغياب التلقائي", `${n} سجل`);
  alert(`تم حذف (${n}) سجل.`);
  navigateTo(state.currentView);
}

function toggleSelectAllAttendance(masterCheckbox) {
  const checkboxes = document.querySelectorAll(".stu-att-checkbox");
  checkboxes.forEach((cb) => (cb.checked = masterCheckbox.checked));
}

function bulkRecordAttendance(scheduleId, status, date) {
  const d = date || attendanceContextDate();
  const selectedBoxes = document.querySelectorAll(".stu-att-checkbox:checked");
  if (selectedBoxes.length === 0) {
    alert("يرجى تحديد طالب واحد على الأقل للتحضير الجماعي!");
    return;
  }

  selectedBoxes.forEach((cb) => {
    recordAttendance(scheduleId, cb.value, status, d, true);
  });
  persist("attendanceRecords");

  alert(`تم رصد حالة (${status}) لعدد (${selectedBoxes.length}) طالب.`);
  views.updateAttendanceModalView(scheduleId);
  views.openAttendanceModal(scheduleId);
}

function markRemainingAbsent(scheduleId, date) {
  const d = date || attendanceContextDate();
  const schedule = getScheduleById(scheduleId);
  if (!schedule) return;

  const students = db.users.filter(
    (u) =>
      u.role === "student" &&
      u.currentProgramId === schedule.programId &&
      !u.isRestricted,
  );
  let markedCount = 0;

  students.forEach((st) => {
    const currentStatus = getStudentAttendanceStatus(scheduleId, st.id, d);
    if (currentStatus === "غير محدد") {
      recordAttendance(scheduleId, st.id, "غائب", d, true);
      markedCount++;
    }
  });
  if (markedCount > 0) persist("attendanceRecords");

  alert(`تم احتساب (${markedCount}) طالب كـ (غائب).`);
  if (window.views && window.views.updateAttendanceModalView) {
    views.updateAttendanceModalView(scheduleId);
  }
}

// تغييب تلقائي نهاية اليوم: في كل يوم تحضير، أي طالب لم يُرصد يُحتسب غائباً.
// "يوم التحضير" = يوم رُصد فيه تحضير فعلاً لذلك البرنامج (ولو لطالب واحد، في أي يوم كان)،
// وإن كانت الطريقة "scheduled" فتُضاف أيام الجلسات المجدولة أيضاً. يُطبّق على الأيام السابقة فقط.
function sweepAutoAbsence() {
  if (!Array.isArray(db.attendanceRecords)) db.attendanceRecords = [];
  const today = new Date();
  const todayISO = todayStr();
  const mode = getAttendanceMode();
  let added = 0;

  const activeProgramIds = getActivePrograms().map((p) => p.id);
  if (!activeProgramIds.length) return;

  // الجلسات التي رُصد فيها تحضير يدوي لكل (برنامج|تاريخ)
  const taken = {};
  // فهرس سريع للسجلات الموجودة (جلسة|طالب|تاريخ)
  const existing = new Set();
  db.attendanceRecords.forEach((r) => {
    if (!r) return;
    existing.add(r.scheduleId + "|" + r.studentId + "|" + (r.date || ""));
    if (!isManualAttendanceRecord(r)) return;
    const pid = r.programId || (getScheduleById(r.scheduleId) || {}).programId;
    if (!pid) return;
    const k = pid + "|" + r.date;
    (taken[k] = taken[k] || new Set()).add(r.scheduleId);
  });

  // آخر 21 يوماً السابقة فقط
  for (let back = 1; back <= 21; back++) {
    const d = new Date(today);
    d.setDate(today.getDate() - back);
    const iso = localDateStr(d);
    if (iso >= todayISO) continue;
    const weekday = d.getDay();

    activeProgramIds.forEach((pid) => {
      const sessions = new Set(taken[pid + "|" + iso] || []);
      if (mode === "scheduled") {
        (db.schedules || [])
          .filter(
            (s) =>
              s.programId === pid && s.requiresAttendance && s.dayOfWeek === weekday,
          )
          .forEach((s) => sessions.add(s.id));
      }
      if (!sessions.size) return; // ليس يوم تحضير لهذا البرنامج

      const students = db.users.filter(
        (u) =>
          u.role === "student" &&
          u.currentProgramId === pid &&
          !u.isRestricted &&
          // لا نُغيّب طالباً أُضيف بعد ذلك اليوم
          (!u.createdAt || u.createdAt <= d.getTime() + 86400000),
      );

      sessions.forEach((sid) => {
        students.forEach((st) => {
          const key = sid + "|" + st.id + "|" + iso;
          if (existing.has(key)) return;
          existing.add(key);
          const excused = hasApprovedExcuse(st.id, iso);
          const exReason = excused ? approvedExcuseReason(st.id, iso) : "";
          db.attendanceRecords.push({
            id: `att_${sid}_${st.id}_${iso}`,
            scheduleId: sid,
            studentId: st.id,
            programId: pid,
            date: iso,
            status: excused ? "مستأذن" : "غائب",
            excuseReason: exReason,
            auto: true,
            updatedAt: `${iso} (تلقائي نهاية اليوم)`,
            recordedBy: "system",
          });
          added++;
        });
      });
    });
  }

  if (added > 0) persist("attendanceRecords");
}

// 8. تزامن التواريخ الهجرية والميلادية
function getWeekDateDetails(dayOfWeekIndex, weekOffset = 0) {
  const today = new Date();
  const currentDay = today.getDay();

  const targetDate = new Date(today);
  const dayDiff = dayOfWeekIndex - currentDay + weekOffset * 7;
  targetDate.setDate(today.getDate() + dayDiff);

  const gregStr = targetDate.toLocaleDateString("ar-SA-u-nu-latn", {
    day: "numeric",
    month: "numeric",
  });

  let hijriStr = "";
  try {
    hijriStr = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura-nu-latn", {
      day: "numeric",
      month: "numeric",
    }).format(targetDate);
  } catch (e) {
    hijriStr = gregStr;
  }

  return {
    gregorian: gregStr,
    hijri: hijriStr,
    fullDate: localDateStr(targetDate),
  };
}

// 9. حساب العداد التنازلي الحي للمهام
function calculateTimeRemaining(dateStr, timeStr) {
  if (!dateStr) return { isOverdue: false, text: "غير محدد" };

  const target = new Date(`${dateStr}T17:00:00`);
  const now = new Date();
  const diff = target - now;

  if (diff <= 0) {
    return { isOverdue: true, text: "انتهى الوقت / متأخرة" };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return { isOverdue: false, text: `متبقي ${days} يوم و ${hours} ساعة` };
  } else {
    return { isOverdue: false, text: `متبقي ${hours} ساعة و ${minutes} دقيقة` };
  }
}

// 10. ترقية الطالب إلى المستوى القادم
function promoteStudent(studentId) {
  const student = db.users.find((u) => u.id === studentId);
  if (!student) return;

  const programLevels = db.levels
    .filter((l) => l.programId === student.currentProgramId)
    .sort((a, b) => a.order - b.order);
  const currentLevelIndex = programLevels.findIndex(
    (l) => l.id === student.currentLevelId,
  );

  if (
    currentLevelIndex !== -1 &&
    currentLevelIndex < programLevels.length - 1
  ) {
    const nextLevel = programLevels[currentLevelIndex + 1];
    student.currentLevelId = nextLevel.id;
    student.progress = Math.min(100, student.progress + 35);
    alert(`تمت ترقية الطالب (${student.name}) إلى: ${nextLevel.name}`);
  } else {
    alert(
      `الطالب (${student.name}) في أعلى مستوى ببرنامج ${getProgramName(student.currentProgramId)}!`,
    );
  }

  persist("users");
  navigateTo("students");
}

// 11. تقييد وفك تقييد الحساب
function toggleUserRestriction(userId) {
  const user = db.users.find((u) => u.id === userId);
  if (!user) return;

  user.isRestricted = !user.isRestricted;
  const statusText = user.isRestricted ? "تقييد" : "فك تقييد";
  persist("users");
  logAudit(statusText + " حساب", user.name);
  alert(`تم ${statusText} حساب (${user.name}) بنجاح.`);

  if (user.role === "student") navigateTo("students");
  else if (user.role === "supervisor") navigateTo("supervisors");
  else navigateTo(state.currentView);
}

// 12. اعتماد وتعديل بيانات المستخدمين وكلمات المرور (تحتاج اعتماد المدير)
function approveProfileEdit(editId) {
  const editIndex = db.pendingProfileEdits.findIndex((e) => e.id === editId);
  if (editIndex === -1) return;

  const req = db.pendingProfileEdits[editIndex];
  const targetId = req.userId || req.studentId;
  const targetUser = db.users.find((u) => u.id === targetId);

  if (targetUser) {
    // منع اعتماد رقم جوال أو هوية مكرر
    if (req.newPhone && isPhoneTaken(req.newPhone, targetUser.id)) {
      alert("تعذر الاعتماد: رقم الجوال الجديد مستخدم لحساب آخر.");
      return;
    }
    if (req.newNationalId && isNationalIdTaken(req.newNationalId, targetUser.id)) {
      alert("تعذر الاعتماد: رقم الهوية الجديد مستخدم لحساب آخر.");
      return;
    }
    if (req.newPhone) targetUser.phone = normalizeDigits(req.newPhone);
    if (req.newNationalId) targetUser.nationalId = normalizeDigits(req.newNationalId);
    if (req.newFatherPhone)
      targetUser.fatherPhone = normalizeDigits(req.newFatherPhone);
    if (req.newEmail) targetUser.email = req.newEmail;
    if (req.newName) targetUser.name = req.newName;
    if (req.newPassword) {
      // الطلب يحمل بصمة كلمة المرور (الطلبات القديمة قد تحمل نصاً واضحاً)
      if (String(req.newPassword).indexOf(PASS_HASH_PREFIX) === 0) {
        targetUser.passHash = req.newPassword;
        delete targetUser.password;
      } else {
        setUserPassword(targetUser, req.newPassword);
      }
    }

    db.notifications.unshift({
      id: makeId("notif"),
      userId: targetUser.id,
      category: "اعتماد تعديل",
      title: "تم اعتماد طلبك",
      message: req.newPassword
        ? "تم اعتماد تغيير كلمة المرور الخاصة بك."
        : "تم اعتماد تعديل بياناتك.",
      date: "الآن",
      isRead: false,
    });
  }

  db.pendingProfileEdits.splice(editIndex, 1);
  persist("users", "pendingProfileEdits", "notifications");
  logAudit(
    "اعتماد تعديل بيانات",
    `${req.studentName || req.userName || "مستخدم"}${req.newPassword ? " (كلمة مرور)" : ""}`,
  );
  alert(`تم اعتماد طلب (${req.studentName || req.userName || "المستخدم"}).`);
  navigateTo(state.currentView);
}

function rejectProfileEdit(editId) {
  if (!confirm("هل أنت متأكد من رفض هذا الطلب؟")) return;
  db.pendingProfileEdits = db.pendingProfileEdits.filter(
    (e) => e.id !== editId,
  );
  persist("pendingProfileEdits");
  navigateTo(state.currentView);
}

// 13. استرجاع المهام
function getVisibleTasks(user, programId = null) {
  if (!user) return [];

  return db.tasks.filter((task) => {
    if (programId && task.programId !== programId) return false;
    if (user.role === "admin") return true;
    if (user.role === "student") return task.assignedTo === user.id;

    if (user.role === "supervisor") {
      const userPrograms = user.assignedPrograms || [];
      return userPrograms.includes(task.programId);
    }
    return false;
  });
}

// 14. إعفاء المهمة للمدير
function exemptTask(taskId, reason) {
  const task = db.tasks.find((t) => t.id === taskId);
  if (!task) return;

  task.status = "معفى بعذر";
  task.isExempt = true;
  task.exemptionReason = reason || "إعفاء معتمد من إدارة المنصة.";

  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: task.assignedTo,
    category: "إعفاء من مهمة",
    title: "تم اعتماد إعفاء لك من مهمة",
    message: `تم اعتماد إعفائك من مهمة (${task.title}). السبب: ${task.exemptionReason}`,
    date: "الآن",
    isRead: false,
  });

  closeModal("task-modal");
  persist("tasks", "notifications");
  alert("تم اعتماد الإعفاء للمهمة بنجاح.");
  navigateTo(state.currentView);
}

// 15. قبول ورفض تسجيل الطلاب
function acceptStudentRequest(reqId) {
  const reqIndex = db.registrationRequests.findIndex((r) => r.id === reqId);
  if (reqIndex === -1) return;

  const req = db.registrationRequests[reqIndex];
  const progId = isProgramActive(req.programId)
    ? req.programId
    : firstActiveProgramId();

  if (isPhoneTaken(req.phone) || (req.nationalId && isNationalIdTaken(req.nationalId))) {
    alert("تعذر القبول: رقم الجوال أو رقم الهوية مستخدم لحساب آخر.");
    return;
  }

  const cleanName = cleanText(req.name, 80) || "طالب";
  const newStudent = {
    id: makeId("student"),
    name: cleanName,
    role: "student",
    studentNumber: `STU-2026-${String(db.users.filter((u) => u.role === "student").length + 1).padStart(3, "0")}`,
    phone: normalizeDigits(req.phone),
    nationalId: normalizeDigits(req.nationalId || ""),
    fatherPhone: normalizeDigits(req.fatherPhone || req.phone),
    password: "1234",
    email: `${normalizeDigits(req.phone)}@totin.sa`,
    avatar: cleanName.substring(0, 2),
    currentProgramId: progId,
    currentLevelId: getDefaultLevelId(progId),
    groupId: getDefaultGroupId(progId),
    supervisorId:
      state.currentUser.role === "supervisor" ? state.currentUser.id : null,
    progress: 0,
    isRestricted: false,
    createdAt: Date.now(),
  };

  db.users.push(newStudent);
  db.registrationRequests.splice(reqIndex, 1);
  persist("users", "registrationRequests");
  alert(`تم قبول الطالب (${req.name}) بنجاح.`);
  navigateTo("students");
}

function rejectStudentRequest(reqId) {
  if (!confirm("هل أنت متأكد من رفض طلب التسجيل؟")) return;
  db.registrationRequests = db.registrationRequests.filter(
    (r) => r.id !== reqId,
  );
  persist("registrationRequests");
  navigateTo("students");
}

// 16. إضافة وتعديل الطلاب والمشرفين والإداريين
function addNewStudent(data) {
  const phone = normalizeDigits(data.phone);
  const nationalId = normalizeDigits(data.nationalId || "");

  if (!phone) {
    alert("رقم الجوال مطلوب.");
    return;
  }
  if (isPhoneTaken(phone)) {
    alert("رقم الجوال مستخدم مسبقاً لحساب آخر. لا يمكن تكراره.");
    return;
  }
  if (nationalId && isNationalIdTaken(nationalId)) {
    alert("رقم الهوية مستخدم مسبقاً لحساب آخر. لا يمكن تكراره.");
    return;
  }

  const progId = isProgramActive(data.currentProgramId)
    ? data.currentProgramId
    : firstActiveProgramId();

  const cleanName = cleanText(data.name, 80) || "طالب";
  const newStudent = {
    id: makeId("student"),
    name: cleanName,
    role: "student",
    studentNumber: `STU-2026-${String(db.users.filter((u) => u.role === "student").length + 1).padStart(3, "0")}`,
    phone: phone,
    nationalId: nationalId,
    fatherPhone: normalizeDigits(data.fatherPhone || ""),
    password: "1234",
    email: `${phone}@totin.sa`,
    avatar: cleanName.substring(0, 2),
    currentProgramId: progId,
    currentLevelId: getDefaultLevelId(progId),
    groupId: getDefaultGroupId(progId),
    supervisorId:
      state.currentUser.role === "supervisor" ? state.currentUser.id : null,
    progress: 0,
    isRestricted: false,
    createdAt: Date.now(),
  };

  db.users.push(newStudent);
  persist("users");
  closeModal("add-student-modal");
  logAudit("إضافة طالب", `${cleanName} - ${getProgramName(progId)}`);
  alert("تم إضافة الطالب بنجاح. كلمة المرور الافتراضية: 1234");
  navigateTo("students");
}

function updateStudentData(studentId, data) {
  const student = db.users.find((u) => u.id === studentId);
  if (!student) return;

  const phone = normalizeDigits(data.phone);
  const nationalId = normalizeDigits(data.nationalId || "");
  if (phone && isPhoneTaken(phone, studentId)) {
    alert("رقم الجوال مستخدم لحساب آخر. لا يمكن تكراره.");
    return;
  }
  if (nationalId && isNationalIdTaken(nationalId, studentId)) {
    alert("رقم الهوية مستخدم لحساب آخر. لا يمكن تكراره.");
    return;
  }

  student.name = cleanText(data.name, 80) || student.name;
  student.avatar = student.name.substring(0, 2);
  student.phone = phone;
  if (data.nationalId !== undefined) student.nationalId = nationalId;
  student.fatherPhone = normalizeDigits(data.fatherPhone || "");
  if (isProgramActive(data.currentProgramId))
    student.currentProgramId = data.currentProgramId;
  if (data.password) setUserPassword(student, cleanText(data.password, 60));

  persist("users");
  closeModal("edit-student-modal");
  logAudit("تعديل طالب", student.name);
  alert(`تم تحديث بيانات الطالب (${student.name}) بنجاح.`);
  navigateTo("students");
}

function deleteStudent(studentId) {
  const student = db.users.find((u) => u.id === studentId);
  if (!student) return;
  if (!confirm(`هل أنت متأكد من حذف الطالب (${student.name}) نهائياً؟`)) return;
  const nm = student.name;
  db.users = db.users.filter((u) => u.id !== studentId);
  db.attendanceRecords = (db.attendanceRecords || []).filter(
    (r) => r.studentId !== studentId,
  );
  db.pendingProfileEdits = (db.pendingProfileEdits || []).filter(
    (e) => (e.userId || e.studentId) !== studentId,
  );
  db.excuseRequests = (db.excuseRequests || []).filter(
    (e) => e.studentId !== studentId,
  );
  persist("users", "attendanceRecords", "pendingProfileEdits", "excuseRequests");
  logAudit("حذف طالب", nm);
  alert("تم حذف الطالب نهائياً.");
  navigateTo("students");
}

function addNewSupervisor(data) {
  const phone = normalizeDigits(data.phone);
  const nationalId = normalizeDigits(data.nationalId || "");

  if (!phone) {
    alert("رقم الجوال مطلوب.");
    return;
  }
  if (isPhoneTaken(phone)) {
    alert("رقم الجوال مستخدم مسبقاً لحساب آخر. لا يمكن تكراره.");
    return;
  }
  if (nationalId && isNationalIdTaken(nationalId)) {
    alert("رقم الهوية مستخدم مسبقاً لحساب آخر. لا يمكن تكراره.");
    return;
  }

  const colors = ["#169BA2", "#E59824", "#8AA838", "#9E1B48", "#2B1736"];
  const assignedColor =
    colors[
      db.users.filter((u) => u.role === "supervisor").length % colors.length
    ];

  const assignedPrograms = (data.assignedPrograms || []).filter((p) =>
    isProgramActive(p),
  );

  const cleanName = cleanText(data.name, 80) || "مشرف";
  const newSupervisor = {
    id: makeId("supervisor"),
    name: cleanName,
    role: "supervisor",
    phone: phone,
    nationalId: nationalId,
    password: "1234",
    email: `${phone}@totin.sa`,
    avatar: cleanName.substring(0, 2),
    color: assignedColor,
    assignedPrograms: assignedPrograms.length
      ? assignedPrograms
      : [firstActiveProgramId()],
    assignedGroups: [],
    isRestricted: false,
    createdAt: Date.now(),
  };

  db.users.push(newSupervisor);
  persist("users");
  closeModal("add-supervisor-modal");
  logAudit("إضافة مشرف", cleanName);
  alert("تم إضافة المشرف بنجاح. كلمة المرور الافتراضية: 1234");
  navigateTo("supervisors");
}

function updateSupervisorData(supervisorId, data) {
  const sup = db.users.find((u) => u.id === supervisorId);
  if (!sup) return;

  const phone = normalizeDigits(data.phone);
  const nationalId = normalizeDigits(data.nationalId || "");
  if (phone && isPhoneTaken(phone, supervisorId)) {
    alert("رقم الجوال مستخدم لحساب آخر. لا يمكن تكراره.");
    return;
  }
  if (nationalId && isNationalIdTaken(nationalId, supervisorId)) {
    alert("رقم الهوية مستخدم لحساب آخر. لا يمكن تكراره.");
    return;
  }

  sup.name = cleanText(data.name, 80) || sup.name;
  sup.avatar = sup.name.substring(0, 2);
  sup.phone = phone;
  if (data.nationalId !== undefined) sup.nationalId = nationalId;
  if (Array.isArray(data.assignedPrograms))
    sup.assignedPrograms = data.assignedPrograms.filter((p) => isProgramActive(p));
  if (data.password) setUserPassword(sup, cleanText(data.password, 60));

  // إن كان المستخدم يعدّل بيانات نفسه، حدّث الجلسة والترويسة
  if (state.currentUser && state.currentUser.id === sup.id) {
    state.currentUser = sup;
    const hdr = document.getElementById("header-user-name");
    if (hdr) hdr.innerText = sup.name;
  }

  persist("users");
  closeModal("edit-supervisor-modal");
  logAudit("تعديل حساب", sup.name);
  alert(`تم تحديث بيانات (${sup.name}) بنجاح.`);
  navigateTo("supervisors");
}

function deleteSupervisor(supervisorId) {
  const sup = db.users.find((u) => u.id === supervisorId);
  if (!confirm("هل أنت متأكد من حذف هذا المشرف نهائياً؟")) return;
  db.users = db.users.filter((u) => u.id !== supervisorId);
  // فك ارتباط الطلاب بهذا المشرف
  (db.users || []).forEach((u) => {
    if (u.role === "student" && u.supervisorId === supervisorId)
      u.supervisorId = null;
  });
  persist("users");
  logAudit("حذف مشرف", sup ? sup.name : supervisorId);
  navigateTo("supervisors");
}

// إضافة حساب إداري جديد (المدير فقط)
function addNewAdmin(data) {
  if (!state.currentUser || state.currentUser.role !== "admin") {
    alert("غير مصرح لك بإضافة إداريين.");
    return;
  }
  const phone = normalizeDigits(data.phone);
  const nationalId = normalizeDigits(data.nationalId || "");

  if (!phone) {
    alert("رقم الجوال مطلوب.");
    return;
  }
  if (isPhoneTaken(phone)) {
    alert("رقم الجوال مستخدم مسبقاً لحساب آخر. لا يمكن تكراره.");
    return;
  }
  if (nationalId && isNationalIdTaken(nationalId)) {
    alert("رقم الهوية مستخدم مسبقاً لحساب آخر. لا يمكن تكراره.");
    return;
  }

  const cleanName = cleanText(data.name, 80) || "إداري";
  const newAdmin = {
    id: makeId("admin"),
    name: cleanName,
    role: "admin",
    phone: phone,
    nationalId: nationalId,
    password: "1234",
    email: `${phone}@totin.sa`,
    avatar: cleanName.substring(0, 2),
    color: "#0B2533",
    isRestricted: false,
    createdAt: Date.now(),
  };

  db.users.push(newAdmin);
  persist("users");
  closeModal("add-admin-modal");
  logAudit("إضافة إداري", cleanName);
  alert("تم إضافة الحساب الإداري بنجاح. كلمة المرور الافتراضية: 1234");
  navigateTo("supervisors");
}

function deleteAdmin(adminId) {
  if (adminId === "admin") {
    alert("لا يمكن حذف حساب المدير الرئيسي.");
    return;
  }
  const admins = db.users.filter((u) => u.role === "admin");
  if (admins.length <= 1) {
    alert("لا يمكن حذف آخر حساب إداري في المنصة.");
    return;
  }
  if (!confirm("هل أنت متأكد من حذف هذا الحساب الإداري نهائياً؟")) return;
  const a = db.users.find((u) => u.id === adminId);
  db.users = db.users.filter((u) => u.id !== adminId);
  persist("users");
  logAudit("حذف إداري", a ? a.name : adminId);
  navigateTo("supervisors");
}

// 17. تحديث الملف الشخصي (تغيير الاسم/الجوال/كلمة المرور يحتاج اعتماد المدير لغير الإداريين)
function updateProfile() {
  const nameEl = document.getElementById("set-user-name");
  const phoneEl = document.getElementById("set-user-phone");
  const emailEl = document.getElementById("set-user-email");
  const passEl = document.getElementById("set-user-pass");
  const idEl = document.getElementById("set-user-nid");

  const name = nameEl ? cleanText(nameEl.value, 80) : state.currentUser.name;
  const phone = phoneEl ? normalizeDigits(phoneEl.value) : state.currentUser.phone;
  const email = emailEl ? cleanText(emailEl.value, 120) : state.currentUser.email;
  const nationalId = idEl
    ? normalizeDigits(idEl.value)
    : state.currentUser.nationalId;
  const newPass = passEl ? cleanText(passEl.value, 60) : "";

  const me = state.currentUser;

  // منع التكرار (فحص مبكر قبل الاعتماد أيضاً)
  if (phone && isPhoneTaken(phone, me.id)) {
    alert("رقم الجوال مستخدم لحساب آخر. لا يمكن تكراره.");
    return;
  }
  if (nationalId && isNationalIdTaken(nationalId, me.id)) {
    alert("رقم الهوية مستخدم لحساب آخر. لا يمكن تكراره.");
    return;
  }

  if (me.role === "admin") {
    // الإداري يعدّل مباشرة
    if (name) {
      me.name = name;
      me.avatar = name.substring(0, 2);
    }
    me.phone = phone;
    me.email = email;
    if (nationalId) me.nationalId = nationalId;
    if (newPass) setUserPassword(me, newPass);
    const hdr = document.getElementById("header-user-name");
    if (hdr) hdr.innerText = me.name;
    persist("users");
    alert("تم حفظ البيانات بنجاح.");
    navigateTo("settings");
    return;
  }

  // الطالب/المشرف: طلب يحتاج اعتماد المدير
  const request = {
    id: makeId("edit"),
    userId: me.id,
    userName: me.name,
    userRole: me.role,
    studentId: me.id, // توافق مع الكود القديم
    studentName: me.name,
    requestDate: todayStr(),
    status: "بانتظار الاعتماد",
  };
  if (name && name !== me.name) request.newName = name;
  if (phone && phone !== me.phone) request.newPhone = phone;
  if (nationalId && nationalId !== me.nationalId)
    request.newNationalId = nationalId;
  if (email && email !== me.email) request.newEmail = email;
  // لا تُحفظ كلمة المرور الجديدة نصاً واضحاً حتى داخل الطلب
  if (newPass) request.newPassword = passwordHashFor(me.id, newPass);

  if (
    !request.newName &&
    !request.newPhone &&
    !request.newNationalId &&
    !request.newEmail &&
    !request.newPassword
  ) {
    alert("لا يوجد تغيير لإرساله.");
    return;
  }

  db.pendingProfileEdits.push(request);
  db.notifications.unshift({
    id: makeId("notif"),
    userId: "admin",
    category: "طلب اعتماد",
    title: request.newPassword ? "طلب تغيير كلمة مرور" : "طلب تعديل بيانات",
    message: `${me.name} يطلب ${request.newPassword ? "تغيير كلمة المرور" : "تعديل بياناته"}.`,
    date: "الآن",
    isRead: false,
  });
  persist("pendingProfileEdits", "notifications");
  alert("تم إرسال طلبك للاعتماد من الإدارة.");
  navigateTo("settings");
}

// 18. نظام التحضير الذكي (كل سجل مرتبط بتاريخ محدد)
function recordAttendance(scheduleId, studentId, status, date, skipPersist, reason) {
  if (!db.attendanceRecords) db.attendanceRecords = [];
  const d = date || attendanceContextDate();

  const schedule = getScheduleById(scheduleId);
  const now = new Date();
  const timeStr = `${now.toLocaleDateString("ar-SA")} - ${now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}`;
  const exReason =
    reason !== undefined
      ? cleanText(reason, 200)
      : status === "مستأذن"
        ? approvedExcuseReason(studentId, d)
        : "";

  let record = db.attendanceRecords.find(
    (r) =>
      r.scheduleId === scheduleId &&
      r.studentId === studentId &&
      (r.date || "") === d,
  );

  if (record) {
    record.status = status;
    record.updatedAt = timeStr;
    record.auto = false;
    if (status === "مستأذن") record.excuseReason = exReason;
    else delete record.excuseReason;
    record.recordedBy = state.currentUser ? state.currentUser.id : "system";
  } else {
    db.attendanceRecords.push({
      id: `att_${scheduleId}_${studentId}_${d}`,
      scheduleId: scheduleId,
      studentId: studentId,
      programId: schedule ? schedule.programId : null,
      date: d,
      status: status,
      excuseReason: status === "مستأذن" ? exReason : "",
      auto: false,
      updatedAt: timeStr,
      recordedBy: state.currentUser ? state.currentUser.id : "system",
    });
  }

  if (!skipPersist) persist("attendanceRecords");

  if (window.views && window.views.updateAttendanceModalView) {
    window.views.updateAttendanceModalView(scheduleId);
  }
}

// من واجهة التحضير: عند اختيار "مستأذن" نطلب سبب العذر (إن لم يكن هناك عذر معتمد)
function handleAttendanceChange(scheduleId, studentId, status, date) {
  const d = date || attendanceContextDate();
  if (status === "مستأذن" && !approvedExcuseReason(studentId, d)) {
    const r = prompt("سبب الاستئذان (اختياري):", "");
    recordAttendance(scheduleId, studentId, status, d, false, r || "");
  } else {
    recordAttendance(scheduleId, studentId, status, d);
  }
}

function getStudentAttendanceStatus(scheduleId, studentId, date) {
  const d = date || attendanceContextDate();
  // للتواريخ القديمة نبحث في الحيّ + الأرشيف المحمّل
  const source =
    d < liveAttendanceCutoff() ? getAttendanceRecords() : db.attendanceRecords || [];
  const record = source.find(
    (r) =>
      r.scheduleId === scheduleId &&
      r.studentId === studentId &&
      (r.date || "") === d,
  );
  return record ? record.status : "غير محدد";
}

function getUnmarkedAttendanceCount(scheduleId, programId, date) {
  const d = date || attendanceContextDate();
  const students = db.users.filter(
    (u) =>
      u.role === "student" &&
      u.currentProgramId === programId &&
      !u.isRestricted,
  );
  let unmarked = 0;
  students.forEach((s) => {
    const st = getStudentAttendanceStatus(scheduleId, s.id, d);
    if (st === "غير محدد") unmarked++;
  });
  return unmarked;
}

// 19. التوكيل وإتمام المهام
function delegateTask(taskId, newSupervisorId) {
  const task = db.tasks.find((t) => t.id === taskId);
  const newSupervisor = db.users.find((u) => u.id === newSupervisorId);
  const currentSupervisor = state.currentUser;

  if (!task || !newSupervisor) {
    alert("تعذر إتمام التوكيل.");
    return;
  }

  const previousAssigneeName =
    task.assignedTo === currentSupervisor.id
      ? currentSupervisor.name
      : "الإدارة";
  task.assignedTo = newSupervisor.id;
  task.delegatedFrom = previousAssigneeName;

  persist("tasks");
  closeModal("task-modal");
  updateNotificationsBadge();
  navigateTo(state.currentView);
}

function toggleTaskCompletion(taskId) {
  const task = db.tasks.find((t) => t.id === taskId);
  if (!task) return;

  if (task.status === "مكتملة") {
    task.status = "قيد التنفيذ";
    task.completedAt = null;
  } else {
    task.status = "مكتملة";
    const now = new Date();
    task.completedAt = `${now.toLocaleDateString("ar-SA")} - ${now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}`;
  }

  persist("tasks");
  closeModal("task-modal");
  navigateTo(state.currentView);
}

function addNewTask(taskData) {
  // تأصيل ورسوخ مغلقان: لا تُنشأ مهام لهما
  if (!isProgramActive(taskData.programId)) {
    alert("لا يمكن إضافة مهام لبرنامج مغلق. البرامج المفعّلة فقط.");
    return;
  }

  const cleanTitle = cleanText(taskData.title, 200);
  if (!cleanTitle) {
    alert("عنوان المهمة مطلوب.");
    return;
  }
  const newTask = {
    id: makeId("tsk"),
    title: cleanTitle,
    programId: taskData.programId,
    dayOfWeek: parseInt(taskData.dayOfWeek),
    date: taskData.date || todayStr(),
    startTime: taskData.startTime || "05:00 م",
    endTime: taskData.endTime || "06:00 م",
    assigneeRole: taskData.assigneeRole || "supervisor",
    assignedTo: taskData.assignedTo || state.currentUser.id,
    status: "لم تبدأ",
    completedAt: null,
    delegatedFrom: null,
    isRecurring: taskData.isRecurring || false,
    recurringDays: taskData.recurringDays || [parseInt(taskData.dayOfWeek)],
    stopDate: taskData.stopDate || null,
    requiresAttendance: taskData.requiresAttendance || false,
    isExempt: false,
    exemptionReason: null,
    createdBy: state.currentUser.id,
    description: cleanText(taskData.description, 500),
    createdAt: Date.now(),
  };

  db.tasks.push(newTask);
  db.notifications.unshift({
    id: makeId("notif"),
    userId: newTask.assignedTo,
    category: "تكليف بمهمة",
    title: "تم تكليفك بمهمة جديدة",
    message: newTask.title,
    date: "الآن",
    isRead: false,
  });
  persist("tasks", "notifications");
  closeModal("add-task-modal");
  updateNotificationsBadge();
  navigateTo(state.currentView);
}

// 20. إرسال الإشعارات الموجهة
function sendTargetedNotification(data) {
  const sender = state.currentUser;
  let targetUserIds = [];

  if (sender.role === "admin") {
    if (data.targetType === "all") {
      targetUserIds = db.users.map((u) => u.id);
    } else if (data.targetType === "program") {
      targetUserIds = db.users
        .filter(
          (u) =>
            u.currentProgramId === data.targetId ||
            (u.assignedPrograms && u.assignedPrograms.includes(data.targetId)),
        )
        .map((u) => u.id);
    } else if (data.targetType === "supervisors") {
      targetUserIds = db.users
        .filter((u) => u.role === "supervisor")
        .map((u) => u.id);
    }
  } else {
    targetUserIds = ["admin"];
  }

  const nTitle = cleanText(data.title, 150) || "إشعار";
  const nMsg = cleanText(data.message, 1000);
  const senderName = cleanText(sender.name, 80);

  targetUserIds.forEach((uid) => {
    db.notifications.unshift({
      id: `notif_${Date.now()}_${uid}`,
      userId: uid,
      category: sender.role === "admin" ? "إشعار إداري" : "رسالة واردة",
      title: nTitle,
      message: `من (${senderName}): ${nMsg}`,
      date: "الآن",
      isRead: false,
    });
  });

  closeModal("send-notif-modal");
  persist("notifications");
  updateNotificationsBadge();
  alert("تم إرسال الإشعار بنجاح.");
}

// إضافة إعلان جديد للوحة الإعلانات
function addNewAnnouncement(data) {
  if (!db.announcements) db.announcements = [];
  const aTitle = cleanText(data.title, 150);
  const aContent = cleanText(data.content, 2000);
  if (!aTitle || !aContent) {
    alert("العنوان والنص مطلوبان.");
    return;
  }
  db.announcements.unshift({
    id: makeId("anc"),
    title: aTitle,
    content: aContent,
    publisher: cleanText(state.currentUser ? state.currentUser.name : "الإدارة", 80),
    targetGroup: data.targetGroup || "all",
    mediaType: "none",
    mediaUrl: "",
    date: todayStr(),
    priority: data.priority === "عاجل" ? "عاجل" : "عادي",
  });
  persist("announcements");
  closeModal("add-announcement-modal");
  alert("تم نشر الإعلان بنجاح.");
  // بعد نشر إعلان: العودة لتبويب الإعلانات داخل "التواصل"
  state.commsTab = "announcements";
  navigateTo(window.comms ? "comms" : "announcements");
}

// ===== مراجعة يوم محدد (المدير فقط) =====
function setReviewDate(dateStr) {
  if (dateStr) state.reviewDate = dateStr;
  navigateTo("day-review");
}

function shiftReviewDate(deltaDays) {
  const d = new Date((state.reviewDate || todayStr()) + "T00:00:00");
  d.setDate(d.getDate() + deltaDays);
  state.reviewDate = localDateStr(d);
  navigateTo("day-review");
}

// =====================================================================
// إدارة جلسات الجدول (المدير) - CRUD
// =====================================================================
function addSchedule(data) {
  if (!state.currentUser || state.currentUser.role !== "admin") return;
  const title = cleanText(data.title, 120);
  const programId = isProgramActive(data.programId)
    ? data.programId
    : firstActiveProgramId();
  if (!title) {
    alert("عنوان الجلسة مطلوب.");
    return;
  }
  const grp = (db.groups || []).find((g) => g.programId === programId);
  if (!Array.isArray(db.schedules)) db.schedules = [];
  db.schedules.push({
    id: makeId("sch"),
    programId: programId,
    groupId: grp ? grp.id : null,
    dayOfWeek: parseInt(data.dayOfWeek, 10) || 0,
    time: cleanText(data.time, 20) || "05:00 م",
    title: title,
    type: "lesson",
    typeLabel: cleanText(data.typeLabel, 20) || "درس",
    status: "قادم",
    requiresAttendance: data.requiresAttendance !== false,
    details: cleanText(data.details, 400),
    createdAt: Date.now(),
  });
  persist("schedules");
  logAudit("إضافة جلسة", `${title} - ${getProgramName(programId)}`);
  closeModal("schedule-modal");
  alert("تم إضافة الجلسة.");
  navigateTo("schedule-manage");
}

function updateSchedule(schId, data) {
  const sch = (db.schedules || []).find((s) => s.id === schId);
  if (!sch || !state.currentUser || state.currentUser.role !== "admin") return;
  if (data.title !== undefined) sch.title = cleanText(data.title, 120) || sch.title;
  if (isProgramActive(data.programId)) {
    sch.programId = data.programId;
    const grp = (db.groups || []).find((g) => g.programId === data.programId);
    sch.groupId = grp ? grp.id : sch.groupId;
  }
  if (data.dayOfWeek !== undefined) sch.dayOfWeek = parseInt(data.dayOfWeek, 10) || 0;
  if (data.time !== undefined) sch.time = cleanText(data.time, 20) || sch.time;
  if (data.typeLabel !== undefined)
    sch.typeLabel = cleanText(data.typeLabel, 20) || sch.typeLabel;
  if (data.requiresAttendance !== undefined)
    sch.requiresAttendance = !!data.requiresAttendance;
  if (data.details !== undefined) sch.details = cleanText(data.details, 400);
  persist("schedules");
  logAudit("تعديل جلسة", sch.title);
  closeModal("schedule-modal");
  alert("تم حفظ التعديلات.");
  navigateTo("schedule-manage");
}

function deleteSchedule(schId) {
  const sch = (db.schedules || []).find((s) => s.id === schId);
  if (!sch) return;
  if (
    !confirm(
      `حذف الجلسة (${sch.title})؟ لن تُحذف سجلات الحضور السابقة المرتبطة بها.`,
    )
  )
    return;
  db.schedules = db.schedules.filter((s) => s.id !== schId);
  persist("schedules");
  logAudit("حذف جلسة", sch.title);
  navigateTo("schedule-manage");
}

// =====================================================================
// الاستئذان المسبق
// =====================================================================
function submitExcuseRequest(data) {
  const me = state.currentUser;
  if (!me) return;
  const studentId = me.role === "student" ? me.id : data.studentId;
  const student = db.users.find((u) => u.id === studentId);
  if (!student) {
    alert("الطالب غير موجود.");
    return;
  }
  const fromDate = data.fromDate;
  const toDate = data.toDate || data.fromDate;
  const reason = cleanText(data.reason, 300);
  if (!fromDate || !reason) {
    alert("يرجى تحديد التاريخ وكتابة السبب.");
    return;
  }
  if (!Array.isArray(db.excuseRequests)) db.excuseRequests = [];

  // المدير/المشرف يعتمد مباشرة؛ الطالب يقدّم طلباً بانتظار الاعتماد
  const autoApprove = me.role === "admin" || me.role === "supervisor";
  db.excuseRequests.unshift({
    id: makeId("exc"),
    studentId: studentId,
    studentName: cleanText(student.name, 80),
    programId: student.currentProgramId,
    fromDate: fromDate,
    toDate: toDate,
    reason: reason,
    status: autoApprove ? "معتمد" : "بانتظار الاعتماد",
    requestedBy: me.id,
    requestedByRole: me.role,
    decidedBy: autoApprove ? me.id : null,
    createdAt: Date.now(),
  });
  persist("excuseRequests");

  if (autoApprove) {
    applyExcuseToAttendance(db.excuseRequests[0]);
    logAudit("اعتماد استئذان", `${student.name} (${fromDate} - ${toDate})`);
  } else {
    db.notifications.unshift({
      id: makeId("notif"),
      userId: "admin",
      category: "طلب استئذان",
      title: "طلب استئذان جديد",
      message: `${student.name} يطلب استئذاناً (${fromDate}) - السبب: ${reason}`,
      date: "الآن",
      isRead: false,
    });
    persist("notifications");
    updateNotificationsBadge();
    logAudit("تقديم استئذان", `${fromDate} - ${reason}`);
  }

  closeModal("excuse-modal");
  alert(
    autoApprove
      ? "تم اعتماد الاستئذان."
      : "تم إرسال طلب الاستئذان للاعتماد من الإدارة.",
  );
  navigateTo(state.currentView);
}

function decideExcuseRequest(reqId, approve) {
  const req = (db.excuseRequests || []).find((e) => e.id === reqId);
  if (!req || !state.currentUser) return;
  if (state.currentUser.role === "student") return;

  req.status = approve ? "معتمد" : "مرفوض";
  req.decidedBy = state.currentUser.id;
  if (approve) applyExcuseToAttendance(req);

  db.notifications.unshift({
    id: makeId("notif"),
    userId: req.studentId,
    category: "استئذان",
    title: approve ? "تم اعتماد استئذانك" : "تم رفض طلب الاستئذان",
    message: `بخصوص ${req.fromDate}${req.toDate && req.toDate !== req.fromDate ? " إلى " + req.toDate : ""}`,
    date: "الآن",
    isRead: false,
  });
  persist("excuseRequests", "notifications");
  updateNotificationsBadge();
  logAudit(
    approve ? "اعتماد استئذان" : "رفض استئذان",
    `${req.studentName} (${req.fromDate})`,
  );
  navigateTo(state.currentView);
}

// تحويل الاستئذان المعتمد إلى سجلات حضور "مستأذن" لكل جلسة تتطلب تحضيراً في الفترة
function applyExcuseToAttendance(req) {
  if (!req || req.status !== "معتمد") return;
  if (!Array.isArray(db.attendanceRecords)) db.attendanceRecords = [];
  const from = new Date(req.fromDate + "T00:00:00");
  const to = new Date((req.toDate || req.fromDate) + "T00:00:00");
  let changed = false;

  for (
    let d = new Date(from);
    d <= to && (d - from) / 86400000 <= 31;
    d.setDate(d.getDate() + 1)
  ) {
    const iso = localDateStr(d);
    const wd = d.getDay();
    (db.schedules || [])
      .filter(
        (s) =>
          s.requiresAttendance &&
          s.dayOfWeek === wd &&
          s.programId === req.programId,
      )
      .forEach((sch) => {
        let rec = db.attendanceRecords.find(
          (r) =>
            r.scheduleId === sch.id &&
            r.studentId === req.studentId &&
            (r.date || "") === iso,
        );
        if (rec) {
          if (rec.status === "غائب" || rec.auto) {
            rec.status = "مستأذن";
            rec.excuseReason = req.reason;
            rec.auto = false;
            changed = true;
          }
        } else {
          db.attendanceRecords.push({
            id: `att_${sch.id}_${req.studentId}_${iso}`,
            scheduleId: sch.id,
            studentId: req.studentId,
            programId: sch.programId,
            date: iso,
            status: "مستأذن",
            excuseReason: req.reason,
            auto: false,
            updatedAt: `${iso} (استئذان معتمد)`,
            recordedBy: "excuse",
          });
          changed = true;
        }
      });
  }
  if (changed) persist("attendanceRecords");
}

// =====================================================================
// الفصل الدراسي
// =====================================================================
function startNewTerm(name, startDate) {
  if (!state.currentUser || state.currentUser.role !== "admin") return;
  const app = getAppSettings();
  const tName = cleanText(name, 60) || "فصل جديد";
  const sDate = startDate || todayStr();
  const term = { id: makeId("term"), name: tName, startDate: sDate };
  if (!Array.isArray(app.terms)) app.terms = [];
  app.terms.push(term);
  app.currentTerm = term;
  persist("appSettings");
  logAudit("بدء فصل دراسي جديد", `${tName} - يبدأ ${sDate}`);

  // أرشفة سجلات التحضير الأقدم من بداية الفصل الجديد (تبقى محفوظة بالكامل)
  const doneMsg = `تم بدء «${tName}». تبقى كل البيانات السابقة محفوظة، والإحصاءات الآن تعرض الفصل الجديد.`;
  if (window.store && typeof window.store.archiveOld === "function") {
    window.store
      .archiveOld(
        "attendanceRecords",
        (r) => (r.date || "") < sDate,
        (r) => (r.date || "2000-01").slice(0, 7),
      )
      .then((res) => {
        alert(
          doneMsg +
            (res.moved > 0
              ? `\nتمت أرشفة (${res.moved}) سجل تحضير من الفصل السابق.`
              : ""),
        );
        navigateTo("term-manage");
      })
      .catch(() => {
        alert(doneMsg);
        navigateTo("term-manage");
      });
  } else {
    alert(doneMsg);
    navigateTo("term-manage");
  }
}

function updateCurrentTerm(name, startDate) {
  if (!state.currentUser || state.currentUser.role !== "admin") return;
  const app = getAppSettings();
  if (!app.currentTerm) app.currentTerm = { id: makeId("term") };
  if (name !== undefined)
    app.currentTerm.name = cleanText(name, 60) || app.currentTerm.name;
  if (startDate) app.currentTerm.startDate = startDate;
  // مزامنة القائمة
  if (Array.isArray(app.terms)) {
    const t = app.terms.find((x) => x.id === app.currentTerm.id);
    if (t) {
      t.name = app.currentTerm.name;
      t.startDate = app.currentTerm.startDate;
    }
  }
  persist("appSettings");
  logAudit("تعديل الفصل الحالي", app.currentTerm.name);
  alert("تم حفظ إعدادات الفصل.");
  navigateTo("term-manage");
}

// =====================================================================
// تقييم مهمة طالب
// =====================================================================
function saveTaskEvaluation(taskId, rating, note) {
  const task = (db.tasks || []).find((t) => t.id === taskId);
  if (!task || !state.currentUser) return;
  if (state.currentUser.role === "student") return;
  if (!Array.isArray(db.taskEvaluations)) db.taskEvaluations = [];

  let ev = db.taskEvaluations.find((e) => e.taskId === taskId);
  const clean = {
    rating: cleanText(rating, 20),
    note: cleanText(note, 300),
    by: state.currentUser.id,
    byName: cleanText(state.currentUser.name, 60),
    at: new Date().toLocaleString("ar-SA"),
  };
  if (ev) {
    Object.assign(ev, clean);
  } else {
    ev = Object.assign({ id: makeId("ev"), taskId: taskId }, clean);
    db.taskEvaluations.push(ev);
  }
  // وسم المهمة كمقيّمة
  if (rating && task.status !== "مكتملة") {
    task.status = "مكتملة";
    task.completedAt = clean.at;
  }
  persist("taskEvaluations", "tasks");

  db.notifications.unshift({
    id: makeId("notif"),
    userId: task.assignedTo,
    category: "تقييم مهمة",
    title: "تم تقييم مهمتك",
    message: `${task.title}: ${clean.rating || ""} ${clean.note ? "- " + clean.note : ""}`,
    date: "الآن",
    isRead: false,
  });
  persist("notifications");
  updateNotificationsBadge();
  logAudit("تقييم مهمة", `${task.title} (${clean.rating})`);
  closeModal("task-modal");
  alert("تم حفظ التقييم.");
  navigateTo(state.currentView);
}

function getTaskEvaluation(taskId) {
  return (db.taskEvaluations || []).find((e) => e.taskId === taskId) || null;
}

// =====================================================================
// واتساب - فتح محادثة برسالة جاهزة
// =====================================================================
function openWhatsApp(phone, text) {
  const url = waLink(phone, text);
  if (!url) {
    alert("رقم الجوال غير صالح لفتح واتساب.");
    return;
  }
  window.open(url, "_blank");
}

// إرسال تقرير طالب عبر واتساب لولي الأمر
function waStudentReport(studentId) {
  const st = db.users.find((u) => u.id === studentId);
  if (!st) return;
  const app = getAppSettings();
  const stats = studentAttendanceStats(studentId);
  const prog = getProgramName(st.currentProgramId);
  const msg = fillTemplate(
    (app.waTemplates && app.waTemplates.report) || "",
    {
      student: st.name,
      program: prog,
      present: stats.present,
      absent: stats.absent,
      late: stats.late,
      rate: stats.rate,
      note: "",
    },
  );
  openWhatsApp(st.fatherPhone || st.phone, msg);
  logAudit("إرسال تقرير واتساب", st.name);
}

// إشعار غياب طالب عبر واتساب
function waAbsenceNotice(studentId, dateISO) {
  const st = db.users.find((u) => u.id === studentId);
  if (!st) return;
  const app = getAppSettings();
  const msg = fillTemplate(
    (app.waTemplates && app.waTemplates.absence) || "",
    {
      student: st.name,
      date: dateISO || todayStr(),
      program: getProgramName(st.currentProgramId),
    },
  );
  openWhatsApp(st.fatherPhone || st.phone, msg);
  logAudit("إشعار غياب واتساب", `${st.name} (${dateISO || todayStr()})`);
}

// 21. دوال مساعدة
function getUserColor(userId) {
  const user = db.users.find((u) => u.id === userId);
  return user ? user.color || "#169BA2" : "#64748B";
}

function getUserName(userId) {
  const user = db.users.find((u) => u.id === userId);
  return user ? user.name : "غير محدد";
}

function getProgramName(programId) {
  const prog = db.programs.find((p) => p.id === programId);
  return prog ? prog.name : "البرنامج العام";
}

function changeWeek(offset) {
  if (offset === 0) {
    state.currentWeekOffset = 0;
  } else {
    state.currentWeekOffset += offset;
  }
  navigateTo("schedule");
}

function toggleNotificationsModal() {
  const modal = document.getElementById("notifications-modal");
  if (modal) {
    modal.classList.toggle("hidden");
    if (!modal.classList.contains("hidden")) {
      renderNotificationsList();
    }
  }
}

// هل هذا الإشعار موجّه للمستخدم الحالي؟
function notifTargetsCurrentUser(n) {
  if (!state.currentUser) return false;
  if (n.userId === "all") return true;
  if (n.userId === state.currentUser.id) return true;
  // الإشعارات الموجّهة لدور "admin" تصل لكل الإداريين
  if (state.currentRole === "admin" && n.userId === "admin") return true;
  return false;
}

// عرض إشعار نظام فوري عند وصول إشعار جديد للمستخدم الحالي أثناء فتح التطبيق
// (ولو في الخلفية/تبويب آخر). لا يعمل إن كان المتصفح مغلقاً تماماً - ذلك يحتاج
// خادم دفع (Firebase Cloud Messaging) وهو تحسين منفصل يمكن إضافته لاحقاً.
function checkNewNotifications() {
  if (!state.currentUser) return;
  const mine = (window.db.notifications || []).filter(notifTargetsCurrentUser);

  if (!window.__seenNotifInit) {
    // أول تشغيل بعد الدخول: اعتبر كل الموجود "معروفاً" حتى لا تنهال إشعارات قديمة دفعة واحدة
    window.__seenNotifIds = new Set(mine.map((n) => n.id));
    window.__seenNotifInit = true;
    return;
  }

  if (!window.__seenNotifIds) window.__seenNotifIds = new Set();
  const fresh = mine.filter((n) => !window.__seenNotifIds.has(n.id));
  if (fresh.length === 0) return;

  fresh.forEach((n) => window.__seenNotifIds.add(n.id));
  if (typeof window.showLocalNotification !== "function") return;

  // لا نُظهر أكثر من ٣ نوافذ دفعة واحدة تفادياً للإزعاج
  fresh.slice(0, 3).forEach((n) => {
    window.showLocalNotification(n.title || "إشعار جديد", n.message || "", n.id);
  });
}

function renderNotificationsList() {
  const container = document.getElementById("notifications-list");
  if (!container) return;

  const notifs = db.notifications.filter(notifTargetsCurrentUser);

  if (notifs.length === 0) {
    container.innerHTML = `<div class="text-center py-6 text-slate-400 text-xs font-medium">لا توجد إشعارات حالية</div>`;
    return;
  }

  container.innerHTML = notifs
    .map(
      (n) => `
        <div class="py-2.5 flex items-start space-x-2.5 space-x-reverse ${n.isRead ? "opacity-60" : ""}">
            <div class="w-7 h-7 rounded-full bg-amber-50 text-[#D4A359] border border-[#D4A359]/30 flex items-center justify-center shrink-0 mt-0.5">
                <i class="fa-solid fa-bell text-xs"></i>
            </div>
            <div class="flex-1">
                <div class="text-xs font-bold text-slate-800">${escHtml(n.title)}</div>
                <div class="text-[11px] text-slate-500 mt-0.5">${escHtml(n.message)}</div>
                <div class="text-[9px] text-slate-400 mt-0.5">${escHtml(n.date)}</div>
            </div>
        </div>
    `,
    )
    .join("");
}

function markAllNotificationsRead() {
  db.notifications.forEach((n) => {
    if (notifTargetsCurrentUser(n)) n.isRead = true;
  });
  persist("notifications");
  updateNotificationsBadge();
  renderNotificationsList();
}

function updateNotificationsBadge() {
  const badge = document.getElementById("notif-badge");
  if (!badge || !state.currentUser) return;
  const unread = db.notifications.filter(
    (n) => notifTargetsCurrentUser(n) && !n.isRead,
  ).length;
  if (unread > 0) {
    badge.innerText = unread;
    badge.style.display = "inline-block";
  } else {
    badge.style.display = "none";
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.remove();
  if (modalId === "student-cards-modal" || modalId === "single-card-modal") {
    document.body.classList.remove("printing-cards");
  }
}
