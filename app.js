/**
 * app.js - محرك المنصة الرئيسي وإدارة العمليات الشاملة
 * يدعم: المنصة الالكترونية، استيراد Excel/CSV، التحضير الجماعي والغياب التلقائي، وإدارة الصلاحيات التامة.
 */

const state = {
  currentUser: null,
  currentRole: null,
  currentView: "portal",
  currentWeekOffset: 0,
  currentProgramId: "prog_taseel",
  scheduleViewMode: "stacked",
};

// 1. التهيئة الآمنة للبدء في شاشة بوابة المسارات
function initApp() {
  if (!window.db || !window.db.users) {
    setTimeout(initApp, 50);
    return;
  }
  hideAppControls();
  navigateTo("portal");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

// 2. إخفاء وإظهار عناصر التحكم والهيدر والقائمة الجانبية
function hideAppControls() {
  const sidebar = document.getElementById("main-sidebar");
  const userControls = document.getElementById("header-user-badge");
  const portalBtn = document.getElementById("header-portal-btn");
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const notifContainer = document.getElementById("notif-container");

  if (sidebar) {
    sidebar.classList.add("hidden");
    sidebar.classList.remove("md:block");
  }
  if (userControls) userControls.classList.add("hidden");
  if (portalBtn) portalBtn.classList.add("hidden");
  if (mobileMenuBtn) mobileMenuBtn.classList.add("hidden");
  if (notifContainer) notifContainer.classList.add("hidden");
}

function showAppControls(user) {
  const sidebar = document.getElementById("main-sidebar");
  const userControls = document.getElementById("header-user-badge");
  const portalBtn = document.getElementById("header-portal-btn");
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const notifContainer = document.getElementById("notif-container");

  if (sidebar) {
    sidebar.classList.remove("hidden");
    sidebar.classList.add("md:block");
  }
  if (userControls) {
    userControls.classList.remove("hidden");
    userControls.classList.add("flex");
  }
  if (portalBtn) {
    portalBtn.classList.remove("hidden");
  }
  if (mobileMenuBtn) {
    mobileMenuBtn.classList.remove("hidden");
  }

  if (notifContainer) {
    if (user.role === "admin") {
      notifContainer.classList.remove("hidden");
    } else {
      notifContainer.classList.add("hidden");
    }
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
    avatarEl.style.borderColor = user.color || "#169BA2";
    avatarEl.style.color = user.color || "#169BA2";
  }

  if (window.views && typeof window.views.renderSidebar === "function") {
    window.views.renderSidebar(user.role);
  }
}

// 3. التحقق وتسجيل الدخول للمسار المحدد
function handleLoginSubmit(programId) {
  const userSelect = document.getElementById("login-user-select").value;
  const phoneInput = document.getElementById("login-phone").value.trim();
  const passInput = document.getElementById("login-pass").value.trim();

  let user = null;
  if (userSelect) {
    user = db.users.find((u) => u.id === userSelect);
  } else {
    user = db.users.find((u) => u.phone === phoneInput);
  }

  if (!user) {
    alert("بيانات الدخول غير صحيحة، يرجى التأكد من رقم الجوال أو اختيار حساب.");
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

// 4. اختيار المسار من البوابة
function selectProgramPath(progId) {
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

function switchSupervisorProgram(progId) {
  state.currentProgramId = progId;
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

  switch (viewName) {
    case "portal":
      contentArea.innerHTML = window.views.renderPortalView();
      break;
    case "home":
      contentArea.innerHTML = state.currentUser
        ? window.views.renderHome(state.currentUser)
        : window.views.renderPortalView();
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
    default:
      contentArea.innerHTML = window.views.renderPortalView();
      break;
  }
}

// 6. استيراد الطلاب والمشرفين عبر Excel / CSV
function handleStudentExcelImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    const lines = text.split("\n").filter((l) => l.trim() !== "");
    let count = 0;

    lines.forEach((line, idx) => {
      if (idx === 0 && line.includes("اسم")) return; // تجاهل ترويسة الملف
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 2) {
        const name = parts[0];
        const phone = parts[1] || `0550000${Date.now().toString().slice(-3)}`;
        const fatherPhone = parts[2] || phone;
        const progName = parts[3] || "تأصيل";
        const prog =
          db.programs.find((p) => p.name.includes(progName)) || db.programs[1];

        const newStudent = {
          id: `student_${Date.now()}_${count}`,
          name: name,
          role: "student",
          studentNumber: `STU-2026-${String(db.users.filter((u) => u.role === "student").length + 1).padStart(3, "0")}`,
          phone: phone,
          fatherPhone: fatherPhone,
          password: "1234",
          email: `${phone}@alelm.edu.sa`,
          avatar: name.substring(0, 2),
          currentProgramId: prog.id,
          currentLevelId: "lvl_ts_1",
          groupId: "grp_ts_101",
          supervisorId:
            state.currentUser.id === "admin"
              ? "supervisor_1"
              : state.currentUser.id,
          progress: 0,
          isRestricted: false,
        };

        db.users.push(newStudent);
        count++;
      }
    });

    alert(`تم استيراد وإضافة (${count}) طالب بنجاح.`);
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
    const lines = text.split("\n").filter((l) => l.trim() !== "");
    let count = 0;

    lines.forEach((line, idx) => {
      if (idx === 0 && line.includes("اسم")) return;
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 2) {
        const name = parts[0];
        const phone = parts[1];
        const progName = parts[2] || "تأصيل";
        const prog =
          db.programs.find((p) => p.name.includes(progName)) || db.programs[1];

        const newSupervisor = {
          id: `supervisor_${Date.now()}_${count}`,
          name: name,
          role: "supervisor",
          phone: phone,
          password: "1234",
          email: `${phone}@alelm.edu.sa`,
          avatar: name.substring(0, 2),
          color: "#169BA2",
          assignedPrograms: [prog.id],
          assignedGroups: [],
          isRestricted: false,
        };

        db.users.push(newSupervisor);
        count++;
      }
    });

    alert(`تم استيراد وإضافة (${count}) مشرف بنجاح.`);
    navigateTo("supervisors");
  };
  reader.readAsText(file);
}

// 7. نظام التحضير الجماعي والغياب التلقائي
function toggleSelectAllAttendance(masterCheckbox) {
  const checkboxes = document.querySelectorAll(".stu-att-checkbox");
  checkboxes.forEach((cb) => (cb.checked = masterCheckbox.checked));
}

function bulkRecordAttendance(scheduleId, status) {
  const selectedBoxes = document.querySelectorAll(".stu-att-checkbox:checked");
  if (selectedBoxes.length === 0) {
    alert("يرجى تحديد طالب واحد على الأقل من القائمة للتحضير الجماعي!");
    return;
  }

  selectedBoxes.forEach((cb) => {
    recordAttendance(scheduleId, cb.value, status);
  });

  alert(`تم رصد حالة (${status}) لعدد (${selectedBoxes.length}) طالب بنجاح.`);
  views.updateAttendanceModalView(scheduleId);
  views.openAttendanceModal(scheduleId);
}

function markRemainingAbsent(scheduleId) {
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
    const currentStatus = getStudentAttendanceStatus(scheduleId, st.id);
    if (currentStatus === "غير محدد") {
      recordAttendance(scheduleId, st.id, "غائب");
      markedCount++;
    }
  });

  alert(`تم احتساب (${markedCount}) طالب غير مرصود كـ (غائب) تلقائياً.`);
  views.updateAttendanceModalView(scheduleId);
  views.openAttendanceModal(scheduleId);
}

// 8. تزامن التواريخ الهجرية والميلادية للأسبوع
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
    fullDate: targetDate.toISOString().split("T")[0],
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
    alert(`تمت ترقية الطالب (${student.name}) بنجاح إلى: ${nextLevel.name}`);
  } else {
    alert(
      `الطالب (${student.name}) وصل إلى أعلى مستوى في مسار ${getProgramName(student.currentProgramId)}!`,
    );
  }

  navigateTo("students");
}

// 11. تقييد أو إلغاء تقييد حساب المستخدم
function toggleUserRestriction(userId) {
  const user = db.users.find((u) => u.id === userId);
  if (!user) return;

  user.isRestricted = !user.isRestricted;
  const statusText = user.isRestricted ? "تقييد" : "فك تقييد";
  alert(`تم ${statusText} حساب (${user.name}) بنجاح.`);

  if (user.role === "student") navigateTo("students");
  else if (user.role === "supervisor") navigateTo("supervisors");
}

// 12. اعتماد ورفض طلبات تعديل بيانات الطلاب من الإعدادات
function approveProfileEdit(editId) {
  const editIndex = db.pendingProfileEdits.findIndex((e) => e.id === editId);
  if (editIndex === -1) return;

  const req = db.pendingProfileEdits[editIndex];
  const student = db.users.find((u) => u.id === req.studentId);

  if (student) {
    if (req.newPhone) student.phone = req.newPhone;
    if (req.newFatherPhone) student.fatherPhone = req.newFatherPhone;
    if (req.newEmail) student.email = req.newEmail;
  }

  db.pendingProfileEdits.splice(editIndex, 1);
  alert(`تم اعتماد وتحديث بيانات الطالب (${req.studentName}) بنجاح.`);
  navigateTo("students");
}

function rejectProfileEdit(editId) {
  if (!confirm("هل أنت متأكد من رفض طلب تعديل البيانات؟")) return;
  db.pendingProfileEdits = db.pendingProfileEdits.filter(
    (e) => e.id !== editId,
  );
  navigateTo("students");
}

// 13. إضافة وحذف الإعلانات
function addNewAnnouncement(data) {
  const newAnc = {
    id: `anc_${Date.now()}`,
    title: data.title,
    content: data.content,
    publisher:
      state.currentUser.role === "admin"
        ? "إدارة المنصة المركزية"
        : `${state.currentUser.name} (مشرف)`,
    targetGroup: data.targetGroup || "all",
    mediaType: data.mediaType || "none",
    mediaUrl: data.mediaUrl || "",
    date: new Date().toISOString().split("T")[0],
    expiresAt: data.expiresAt || "2026-12-31",
    priority: data.priority || "عادي",
  };

  db.announcements.unshift(newAnc);
  closeModal("add-announcement-modal");
  updateNotificationsBadge();
  alert("تم نشر الإعلان بنجاح.");
  navigateTo("announcements");
}

function deleteAnnouncement(ancId) {
  if (!confirm("هل أنت متأكد من حذف هذا الإعلان؟")) return;
  db.announcements = db.announcements.filter((a) => a.id !== ancId);
  navigateTo("announcements");
}

// 14. استرجاع المهام المصرح برؤيتها
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

// 15. إعفاء المهمة للمدير
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
  alert("تم اعتماد الإعفاء للمهمة بنجاح.");
  navigateTo(state.currentView);
}

// 16. قبول ورفض طلبات تسجيل الطلاب
function acceptStudentRequest(reqId) {
  const reqIndex = db.registrationRequests.findIndex((r) => r.id === reqId);
  if (reqIndex === -1) return;

  const req = db.registrationRequests[reqIndex];
  const defaultLevel = db.levels.find(
    (l) => l.programId === req.programId && l.order === 1,
  );

  const newStudent = {
    id: `student_${Date.now()}`,
    name: req.name,
    role: "student",
    studentNumber: `STU-2026-${String(db.users.filter((u) => u.role === "student").length + 1).padStart(3, "0")}`,
    phone: req.phone,
    fatherPhone: req.fatherPhone,
    password: "1234",
    email: `${req.phone}@alelm.edu.sa`,
    avatar: req.name.substring(0, 2),
    currentProgramId: req.programId,
    currentLevelId: defaultLevel ? defaultLevel.id : "lvl_ts_1",
    groupId: "grp_ts_101",
    supervisorId:
      state.currentUser.id === "admin" ? "supervisor_1" : state.currentUser.id,
    progress: 0,
    isRestricted: false,
  };

  db.users.push(newStudent);
  db.studentPrograms.push({
    id: `sp_${Date.now()}`,
    studentId: newStudent.id,
    programId: req.programId,
    status: "مستمر",
    startDate: new Date().toISOString().split("T")[0],
    endDate: null,
  });
  db.studentPaths.push({
    studentId: newStudent.id,
    history: [
      {
        programName: getProgramName(req.programId),
        status: "مستمر",
        period: "2026 - الحالي",
        isCurrent: true,
      },
    ],
  });

  db.registrationRequests.splice(reqIndex, 1);
  alert(`تم قبول الطالب (${req.name}) بنجاح وإضافته للبرنامج.`);
  navigateTo("students");
}

function rejectStudentRequest(reqId) {
  if (!confirm("هل أنت متأكد من رفض طلب التسجيل؟")) return;
  db.registrationRequests = db.registrationRequests.filter(
    (r) => r.id !== reqId,
  );
  navigateTo("students");
}

// 17. إضافة وتعديل الطلاب والمشرفين
function addNewStudent(data) {
  const defaultLevel = db.levels.find(
    (l) => l.programId === data.currentProgramId && l.order === 1,
  );

  const newStudent = {
    id: `student_${Date.now()}`,
    name: data.name,
    role: "student",
    studentNumber: `STU-2026-${String(db.users.filter((u) => u.role === "student").length + 1).padStart(3, "0")}`,
    phone: data.phone,
    fatherPhone: data.fatherPhone,
    password: "1234",
    email: `${data.phone}@alelm.edu.sa`,
    avatar: data.name.substring(0, 2),
    currentProgramId: data.currentProgramId,
    currentLevelId: defaultLevel ? defaultLevel.id : "lvl_ts_1",
    groupId: "grp_ts_101",
    supervisorId:
      state.currentUser.id === "admin" ? "supervisor_1" : state.currentUser.id,
    progress: 0,
    isRestricted: false,
  };

  db.users.push(newStudent);
  db.studentPrograms.push({
    id: `sp_${Date.now()}`,
    studentId: newStudent.id,
    programId: data.currentProgramId,
    status: "مستمر",
    startDate: new Date().toISOString().split("T")[0],
    endDate: null,
  });
  db.studentPaths.push({
    studentId: newStudent.id,
    history: [
      {
        programName: getProgramName(data.currentProgramId),
        status: "مستمر",
        period: "2026 - الحالي",
        isCurrent: true,
      },
    ],
  });

  closeModal("add-student-modal");
  alert("تم إضافة الطالب بنجاح.");
  navigateTo("students");
}

function updateStudentData(studentId, data) {
  const student = db.users.find((u) => u.id === studentId);
  if (!student) return;

  student.name = data.name;
  student.phone = data.phone;
  student.fatherPhone = data.fatherPhone;
  student.currentProgramId = data.currentProgramId;
  if (data.password) student.password = data.password;

  closeModal("edit-student-modal");
  alert(`تم تحديث بيانات الطالب (${student.name}) بنجاح.`);
  navigateTo("students");
}

function addNewSupervisor(data) {
  const colors = ["#169BA2", "#E59824", "#8AA838", "#9E1B48", "#2B1736"];
  const assignedColor =
    colors[
      db.users.filter((u) => u.role === "supervisor").length % colors.length
    ];

  const newSupervisor = {
    id: `supervisor_${Date.now()}`,
    name: data.name,
    role: "supervisor",
    phone: data.phone,
    password: "1234",
    email: `${data.phone}@alelm.edu.sa`,
    avatar: data.name.substring(0, 2),
    color: assignedColor,
    assignedPrograms: data.assignedPrograms,
    assignedGroups: [],
    isRestricted: false,
  };

  db.users.push(newSupervisor);
  closeModal("add-supervisor-modal");
  alert("تم إضافة المشرف وإسناد البرامج بنجاح.");
  navigateTo("supervisors");
}

function deleteSupervisor(supervisorId) {
  if (!confirm("هل أنت متأكد من حذف هذا المشرف نهائياً؟")) return;
  db.users = db.users.filter((u) => u.id !== supervisorId);
  navigateTo("supervisors");
}

// 18. تحديث الملف الشخصي
function updateProfile() {
  const name = document.getElementById("set-user-name").value;
  const phone = document.getElementById("set-user-phone").value;
  const email = document.getElementById("set-user-email").value;

  if (state.currentUser.role === "student") {
    db.pendingProfileEdits.push({
      id: `edit_${Date.now()}`,
      studentId: state.currentUser.id,
      studentName: state.currentUser.name,
      newPhone: phone,
      newEmail: email,
      requestDate: new Date().toISOString().split("T")[0],
      status: "بانتظار الاعتماد",
    });
    alert("تم إرسال طلب تحديث البيانات بنجاح إلى المشرف والإدارة للاعتماد.");
  } else {
    state.currentUser.name = name;
    state.currentUser.phone = phone;
    state.currentUser.email = email;
    document.getElementById("header-user-name").innerText = name;
    alert("تم حفظ وتحديث البيانات بنجاح.");
  }
}

// 19. نظام التحضير الذكي
function recordAttendance(scheduleId, studentId, status) {
  if (!db.attendanceRecords) db.attendanceRecords = [];

  let record = db.attendanceRecords.find(
    (r) => r.scheduleId === scheduleId && r.studentId === studentId,
  );
  const now = new Date();
  const timeStr = `${now.toLocaleDateString("ar-SA")} - ${now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}`;

  if (record) {
    record.status = status;
    record.updatedAt = timeStr;
    record.recordedBy = state.currentUser.id;
  } else {
    db.attendanceRecords.push({
      id: `att_${Date.now()}_${studentId}`,
      scheduleId: scheduleId,
      studentId: studentId,
      status: status,
      updatedAt: timeStr,
      recordedBy: state.currentUser.id,
    });
  }

  if (window.views && window.views.updateAttendanceModalView) {
    window.views.updateAttendanceModalView(scheduleId);
  }
}

function getStudentAttendanceStatus(scheduleId, studentId) {
  if (!db.attendanceRecords) return "غير محدد";
  const record = db.attendanceRecords.find(
    (r) => r.scheduleId === scheduleId && r.studentId === studentId,
  );
  return record ? record.status : "غير محدد";
}

function getUnmarkedAttendanceCount(scheduleId, programId) {
  const students = db.users.filter(
    (u) =>
      u.role === "student" &&
      u.currentProgramId === programId &&
      !u.isRestricted,
  );
  let unmarked = 0;
  students.forEach((s) => {
    const st = getStudentAttendanceStatus(scheduleId, s.id);
    if (st === "غير محدد") unmarked++;
  });
  return unmarked;
}

// 20. التوكيل وإتمام المهام وإضافة المهام الدورية
function delegateTask(taskId, newSupervisorId) {
  const task = db.tasks.find((t) => t.id === taskId);
  const newSupervisor = db.users.find((u) => u.id === newSupervisorId);
  const currentSupervisor = state.currentUser;

  if (!task || !newSupervisor) {
    alert("تعذر إتمام التوكيل، بيانات غير مكتملة.");
    return;
  }

  if (
    newSupervisor.role === "supervisor" &&
    !newSupervisor.assignedPrograms.includes(task.programId)
  ) {
    alert("لا يمكن توكيل المهمة لمشرف غير مسجل في نفس هذا البرنامج!");
    return;
  }

  const previousAssigneeName =
    task.assignedTo === currentSupervisor.id
      ? currentSupervisor.name
      : "الإدارة";

  task.assignedTo = newSupervisor.id;
  task.delegatedFrom = previousAssigneeName;

  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: newSupervisor.id,
    category: "توكيل مهام",
    title: "تم توكيل مهمة جديدة إليك",
    message: `قام ${previousAssigneeName} بتوكيل مهمة "${task.title}" إليك في مسار ${getProgramName(task.programId)}.`,
    date: "الآن",
    isRead: false,
  });

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

  closeModal("task-modal");
  navigateTo(state.currentView);
}

function addNewTask(taskData) {
  const newTask = {
    id: `tsk_${Date.now()}`,
    title: taskData.title,
    programId: taskData.programId,
    dayOfWeek: parseInt(taskData.dayOfWeek),
    date: taskData.date || "2026-08-30",
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
  };

  db.tasks.push(newTask);

  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: newTask.assignedTo,
    category: "تذكير بمهمة",
    title: "تنبيه: تم جدولة مهمة جديدة",
    message: `تمت جدولة مهمة "${newTask.title}" المقررة في ${newTask.startTime}.`,
    date: "الآن",
    isRead: false,
  });

  closeModal("add-task-modal");
  updateNotificationsBadge();
  navigateTo(state.currentView);
}

// 21. إرسال الإشعارات الموجهة
function sendTargetedNotification(data) {
  const sender = state.currentUser;
  let targetUserIds = [];

  if (sender.role === "admin") {
    if (data.targetType === "all") {
      targetUserIds = db.users.filter((u) => u.id !== "admin").map((u) => u.id);
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
    } else if (data.targetType === "single_user") {
      targetUserIds = [data.targetId];
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
  updateNotificationsBadge();
  alert("تم إرسال الإشعار بنجاح.");
}

// 22. دوال مساعدة
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

function renderNotificationsList() {
  const container = document.getElementById("notifications-list");
  if (!container) return;

  const notifs = db.notifications.filter(
    (n) => n.userId === state.currentUser.id || state.currentRole === "admin",
  );

  if (notifs.length === 0) {
    container.innerHTML = `<div class="text-center py-6 text-slate-400 text-xs font-medium">لا توجد إشعارات حالية</div>`;
    return;
  }

  container.innerHTML = notifs
    .map(
      (n) => `
        <div class="py-3 flex items-start space-x-3 space-x-reverse ${n.isRead ? "opacity-60" : ""}">
            <div class="w-8 h-8 rounded-full bg-teal-50 text-[#169BA2] flex items-center justify-center shrink-0 mt-1">
                <i class="fa-solid fa-bell text-xs"></i>
            </div>
            <div class="flex-1">
                <div class="text-xs font-bold text-slate-800">${n.title}</div>
                <div class="text-xs text-slate-500 mt-0.5">${n.message}</div>
                <div class="text-[10px] text-slate-400 mt-1">${n.date}</div>
            </div>
        </div>
    `,
    )
    .join("");
}

function markAllNotificationsRead() {
  db.notifications.forEach((n) => {
    if (n.userId === state.currentUser.id || state.currentRole === "admin") {
      n.isRead = true;
    }
  });
  updateNotificationsBadge();
  renderNotificationsList();
}

function updateNotificationsBadge() {
  const badge = document.getElementById("notif-badge");
  if (!badge) return;
  const unread = db.notifications.filter(
    (n) =>
      (n.userId === state.currentUser.id || state.currentRole === "admin") &&
      !n.isRead,
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
