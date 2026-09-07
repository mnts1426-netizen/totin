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
};

// ===== أدوات مساعدة عامة =====

// البرامج المفعّلة فقط (تأصيل ورسوخ مغلقان ولا يتم العمل عليهما)
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

function persist(...collections) {
  if (window.store && typeof window.store.save === "function") {
    window.store.save(...collections);
  }
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
      if (state.currentUser) {
        const stillValid = (window.db.users || []).find(
          (u) => u.id === state.currentUser.id,
        );
        if (!stillValid) {
          logoutUser();
          return;
        }
        state.currentUser = stillValid;
        updateNotificationsBadge();
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
  navigateTo("portal");
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
          : "طالب مسجل";
  }
  if (avatarEl) {
    avatarEl.innerText = user.avatar;
  }

  if (window.views && typeof window.views.renderSidebar === "function") {
    window.views.renderSidebar(user.role);
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

  if (!user) {
    alert(
      "بيانات الدخول غير صحيحة. يرجى التأكد من رقم الجوال أو رقم الهوية.",
    );
    return;
  }

  if (user.password && user.password !== passInput) {
    alert("كلمة المرور غير صحيحة!");
    return;
  }

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
  state.currentProgramId = programId;

  if (user.role === "student") {
    user.currentProgramId = programId;
  }

  closeModal("login-modal");
  showAppControls(user);
  updateNotificationsBadge();
  navigateTo("home");
}

function logoutUser() {
  state.currentUser = null;
  state.currentRole = null;
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
  const activeBtn = document.getElementById(`nav-${viewName}`);
  if (activeBtn) activeBtn.classList.add("nav-item-active");

  const contentArea = document.getElementById("app-content");
  if (!contentArea || !window.views) return;

  // أي شاشة داخلية تتطلب تسجيل دخول: بدون مستخدم نعود للبوابة (يمنع أخطاء العرض)
  if (!state.currentUser && viewName !== "portal") {
    state.currentView = "portal";
    contentArea.innerHTML = window.views.renderPortalView();
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
      default:
        contentArea.innerHTML = state.currentUser
          ? window.views.renderHome(state.currentUser)
          : window.views.renderPortalView();
        break;
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
function handleStudentExcelImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    let count = 0;
    let skipped = 0;
    const skippedNames = [];

    // الأعمدة المتوقعة: الاسم، رقم الجوال، رقم الهوية، جوال ولي الأمر
    const defaultProg = getActivePrograms()[0] || db.programs[0];

    lines.forEach((line, idx) => {
      if (idx === 0 && (line.includes("اسم") || line.includes("الاسم"))) return;
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length < 2 || !parts[0]) return;

      const name = parts[0];
      const phone = normalizeDigits(parts[1]);
      const nationalId = normalizeDigits(parts[2] || "");
      const fatherPhone = normalizeDigits(parts[3] || parts[1]);

      // منع تكرار رقم الجوال أو رقم الهوية نهائياً
      if (!phone || isPhoneTaken(phone) || (nationalId && isNationalIdTaken(nationalId))) {
        skipped++;
        skippedNames.push(name);
        return;
      }

      const newStudent = {
        id: makeId("student"),
        name: name,
        role: "student",
        studentNumber: `STU-2026-${String(db.users.filter((u) => u.role === "student").length + 1).padStart(3, "0")}`,
        phone: phone,
        nationalId: nationalId,
        fatherPhone: fatherPhone,
        password: "1234",
        email: `${phone}@totin.sa`,
        avatar: name.substring(0, 2),
        currentProgramId: defaultProg.id,
        currentLevelId: getDefaultLevelId(defaultProg.id),
        groupId: getDefaultGroupId(defaultProg.id),
        supervisorId:
          state.currentUser.role === "supervisor" ? state.currentUser.id : null,
        progress: 0,
        isRestricted: false,
        createdAt: Date.now(),
      };

      db.users.push(newStudent);
      count++;
    });

    persist("users");
    let msg = `تم استيراد وإضافة (${count}) طالب بنجاح.`;
    if (skipped > 0) {
      msg += `\nتم تجاهل (${skipped}) صف بسبب تكرار رقم الجوال/الهوية أو نقص البيانات: ${skippedNames.join("، ")}`;
    }
    alert(msg);
    navigateTo("students");
  };
  reader.readAsText(file);
}

function handleSupervisorExcelImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    let count = 0;
    let skipped = 0;
    const skippedNames = [];

    const colors = ["#169BA2", "#E59824", "#8AA838", "#9E1B48", "#2B1736"];
    const defaultProg = getActivePrograms()[0] || db.programs[0];

    // الأعمدة المتوقعة: الاسم، رقم الجوال، رقم الهوية
    lines.forEach((line, idx) => {
      if (idx === 0 && (line.includes("اسم") || line.includes("الاسم"))) return;
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length < 2 || !parts[0]) return;

      const name = parts[0];
      const phone = normalizeDigits(parts[1]);
      const nationalId = normalizeDigits(parts[2] || "");

      if (!phone || isPhoneTaken(phone) || (nationalId && isNationalIdTaken(nationalId))) {
        skipped++;
        skippedNames.push(name);
        return;
      }

      const newSupervisor = {
        id: makeId("supervisor"),
        name: name,
        role: "supervisor",
        phone: phone,
        nationalId: nationalId,
        password: "1234",
        email: `${phone}@totin.sa`,
        avatar: name.substring(0, 2),
        color:
          colors[db.users.filter((u) => u.role === "supervisor").length % colors.length],
        assignedPrograms: [defaultProg.id],
        assignedGroups: [],
        isRestricted: false,
        createdAt: Date.now(),
      };

      db.users.push(newSupervisor);
      count++;
    });

    persist("users");
    let msg = `تم استيراد وإضافة (${count}) مشرف بنجاح.`;
    if (skipped > 0) {
      msg += `\nتم تجاهل (${skipped}) صف بسبب تكرار رقم الجوال/الهوية أو نقص البيانات: ${skippedNames.join("، ")}`;
    }
    alert(msg);
    navigateTo("supervisors");
  };
  reader.readAsText(file);
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

// تاريخ سياق التحضير: تاريخ "مراجعة يوم" إذا كان المدير داخلها، وإلا تاريخ اليوم
function attendanceContextDate() {
  return state.currentView === "day-review" && state.reviewDate
    ? state.reviewDate
    : todayStr();
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
  const schedule = db.schedules.find((s) => s.id === scheduleId);
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

// تغييب تلقائي: نهاية كل يوم، أي طالب لم يُرصد في جلسة تتطلب تحضيراً يُحتسب غائباً
// (يشمل حالة عدم تحضير أي أحد إطلاقاً). يُطبّق على الأيام السابقة فقط.
function sweepAutoAbsence() {
  if (!Array.isArray(db.attendanceRecords)) db.attendanceRecords = [];
  const today = new Date();
  const todayISO = todayStr();
  let added = 0;

  const activeProgramIds = getActivePrograms().map((p) => p.id);
  const attSchedules = (db.schedules || []).filter(
    (s) => s.requiresAttendance && activeProgramIds.includes(s.programId),
  );
  if (attSchedules.length === 0) return;

  // آخر 21 يوماً السابقة فقط
  for (let back = 1; back <= 21; back++) {
    const d = new Date(today);
    d.setDate(today.getDate() - back);
    const iso = localDateStr(d);
    if (iso >= todayISO) continue;
    const weekday = d.getDay();

    attSchedules
      .filter((s) => s.dayOfWeek === weekday)
      .forEach((sch) => {
        const students = db.users.filter(
          (u) =>
            u.role === "student" &&
            u.currentProgramId === sch.programId &&
            !u.isRestricted &&
            // لا نُغيّب طالباً أُضيف بعد ذلك اليوم
            (!u.createdAt || u.createdAt <= d.getTime() + 86400000),
        );
        students.forEach((st) => {
          const exists = db.attendanceRecords.some(
            (r) =>
              r.scheduleId === sch.id &&
              r.studentId === st.id &&
              (r.date || "") === iso,
          );
          if (!exists) {
            db.attendanceRecords.push({
              id: `att_${sch.id}_${st.id}_${iso}`,
              scheduleId: sch.id,
              studentId: st.id,
              programId: sch.programId,
              date: iso,
              status: "غائب",
              auto: true,
              updatedAt: `${iso} (تلقائي نهاية اليوم)`,
              recordedBy: "system",
            });
            added++;
          }
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
    if (req.newPassword) targetUser.password = req.newPassword;

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

  const newStudent = {
    id: makeId("student"),
    name: req.name,
    role: "student",
    studentNumber: `STU-2026-${String(db.users.filter((u) => u.role === "student").length + 1).padStart(3, "0")}`,
    phone: normalizeDigits(req.phone),
    nationalId: normalizeDigits(req.nationalId || ""),
    fatherPhone: normalizeDigits(req.fatherPhone || req.phone),
    password: "1234",
    email: `${normalizeDigits(req.phone)}@totin.sa`,
    avatar: req.name.substring(0, 2),
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

  const newStudent = {
    id: makeId("student"),
    name: data.name,
    role: "student",
    studentNumber: `STU-2026-${String(db.users.filter((u) => u.role === "student").length + 1).padStart(3, "0")}`,
    phone: phone,
    nationalId: nationalId,
    fatherPhone: normalizeDigits(data.fatherPhone || ""),
    password: "1234",
    email: `${phone}@totin.sa`,
    avatar: (data.name || "طا").substring(0, 2),
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

  student.name = data.name;
  student.phone = phone;
  if (data.nationalId !== undefined) student.nationalId = nationalId;
  student.fatherPhone = normalizeDigits(data.fatherPhone || "");
  if (isProgramActive(data.currentProgramId))
    student.currentProgramId = data.currentProgramId;
  if (data.password) student.password = data.password;

  persist("users");
  closeModal("edit-student-modal");
  alert(`تم تحديث بيانات الطالب (${student.name}) بنجاح.`);
  navigateTo("students");
}

function deleteStudent(studentId) {
  const student = db.users.find((u) => u.id === studentId);
  if (!student) return;
  if (!confirm(`هل أنت متأكد من حذف الطالب (${student.name}) نهائياً؟`)) return;
  db.users = db.users.filter((u) => u.id !== studentId);
  db.attendanceRecords = (db.attendanceRecords || []).filter(
    (r) => r.studentId !== studentId,
  );
  db.pendingProfileEdits = (db.pendingProfileEdits || []).filter(
    (e) => (e.userId || e.studentId) !== studentId,
  );
  persist("users", "attendanceRecords", "pendingProfileEdits");
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

  const newSupervisor = {
    id: makeId("supervisor"),
    name: data.name,
    role: "supervisor",
    phone: phone,
    nationalId: nationalId,
    password: "1234",
    email: `${phone}@totin.sa`,
    avatar: (data.name || "مش").substring(0, 2),
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

  sup.name = data.name;
  sup.phone = phone;
  if (data.nationalId !== undefined) sup.nationalId = nationalId;
  if (Array.isArray(data.assignedPrograms))
    sup.assignedPrograms = data.assignedPrograms.filter((p) => isProgramActive(p));
  if (data.password) sup.password = data.password;

  // إن كان المستخدم يعدّل بيانات نفسه، حدّث الجلسة والترويسة
  if (state.currentUser && state.currentUser.id === sup.id) {
    state.currentUser = sup;
    const hdr = document.getElementById("header-user-name");
    if (hdr) hdr.innerText = sup.name;
  }

  persist("users");
  closeModal("edit-supervisor-modal");
  alert(`تم تحديث بيانات (${sup.name}) بنجاح.`);
  navigateTo("supervisors");
}

function deleteSupervisor(supervisorId) {
  if (!confirm("هل أنت متأكد من حذف هذا المشرف نهائياً؟")) return;
  db.users = db.users.filter((u) => u.id !== supervisorId);
  // فك ارتباط الطلاب بهذا المشرف
  (db.users || []).forEach((u) => {
    if (u.role === "student" && u.supervisorId === supervisorId)
      u.supervisorId = null;
  });
  persist("users");
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

  const newAdmin = {
    id: makeId("admin"),
    name: data.name,
    role: "admin",
    phone: phone,
    nationalId: nationalId,
    password: "1234",
    email: `${phone}@totin.sa`,
    avatar: (data.name || "مد").substring(0, 2),
    color: "#0B2533",
    isRestricted: false,
    createdAt: Date.now(),
  };

  db.users.push(newAdmin);
  persist("users");
  closeModal("add-admin-modal");
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
  db.users = db.users.filter((u) => u.id !== adminId);
  persist("users");
  navigateTo("supervisors");
}

// 17. تحديث الملف الشخصي (تغيير الاسم/الجوال/كلمة المرور يحتاج اعتماد المدير لغير الإداريين)
function updateProfile() {
  const nameEl = document.getElementById("set-user-name");
  const phoneEl = document.getElementById("set-user-phone");
  const emailEl = document.getElementById("set-user-email");
  const passEl = document.getElementById("set-user-pass");
  const idEl = document.getElementById("set-user-nid");

  const name = nameEl ? nameEl.value.trim() : state.currentUser.name;
  const phone = phoneEl ? normalizeDigits(phoneEl.value) : state.currentUser.phone;
  const email = emailEl ? emailEl.value.trim() : state.currentUser.email;
  const nationalId = idEl
    ? normalizeDigits(idEl.value)
    : state.currentUser.nationalId;
  const newPass = passEl ? passEl.value.trim() : "";

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
    me.name = name;
    me.phone = phone;
    me.email = email;
    if (nationalId) me.nationalId = nationalId;
    if (newPass) me.password = newPass;
    const hdr = document.getElementById("header-user-name");
    if (hdr) hdr.innerText = name;
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
  if (newPass) request.newPassword = newPass;

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
function recordAttendance(scheduleId, studentId, status, date, skipPersist) {
  if (!db.attendanceRecords) db.attendanceRecords = [];
  const d = date || attendanceContextDate();

  const schedule = (db.schedules || []).find((s) => s.id === scheduleId);
  const now = new Date();
  const timeStr = `${now.toLocaleDateString("ar-SA")} - ${now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}`;

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
    record.recordedBy = state.currentUser ? state.currentUser.id : "system";
  } else {
    db.attendanceRecords.push({
      id: `att_${scheduleId}_${studentId}_${d}`,
      scheduleId: scheduleId,
      studentId: studentId,
      programId: schedule ? schedule.programId : null,
      date: d,
      status: status,
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

function getStudentAttendanceStatus(scheduleId, studentId, date) {
  if (!db.attendanceRecords) return "غير محدد";
  const d = date || attendanceContextDate();
  const record = db.attendanceRecords.find(
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

  const newTask = {
    id: makeId("tsk"),
    title: taskData.title,
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
    description: taskData.description || "",
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

  targetUserIds.forEach((uid) => {
    db.notifications.unshift({
      id: `notif_${Date.now()}_${uid}`,
      userId: uid,
      category: sender.role === "admin" ? "إشعار إداري" : "رسالة واردة",
      title: data.title,
      message: `من (${sender.name}): ${data.message}`,
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
  db.announcements.unshift({
    id: makeId("anc"),
    title: data.title,
    content: data.content,
    publisher: state.currentUser ? state.currentUser.name : "الإدارة",
    targetGroup: data.targetGroup || "all",
    mediaType: data.mediaType || "none",
    mediaUrl: data.mediaUrl || "",
    date: todayStr(),
    priority: data.priority || "عادي",
  });
  persist("announcements");
  closeModal("add-announcement-modal");
  alert("تم نشر الإعلان بنجاح.");
  navigateTo("announcements");
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
                <div class="text-xs font-bold text-slate-800">${n.title}</div>
                <div class="text-[11px] text-slate-500 mt-0.5">${n.message}</div>
                <div class="text-[9px] text-slate-400 mt-0.5">${n.date}</div>
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
}
