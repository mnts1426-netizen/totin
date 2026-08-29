/**
 * views.js - محرك بناء الواجهات الديناميكية المعتمد
 * يتضمن: بوابة المسارات النظيفة (بدون نصوص علوية)، استيراد Excel/CSV، التحضير الجماعي والغياب التلقائي، وإدارة المهام والطلاب.
 */

window.views = {
  // 1. القائمة الجانبية الموجهة بالصلاحيات
  renderSidebar(role) {
    const nav = document.getElementById("sidebar-nav");
    if (!nav) return;

    let links = [];

    if (role === "admin") {
      links = [
        { id: "home", icon: "fa-house", color: "#FFFFFF", label: "الرئيسية" },
        {
          id: "portal",
          icon: "fa-layer-group",
          color: "#169BA2",
          label: "بوابة المسارات",
        },
        {
          id: "schedule",
          icon: "fa-calendar-week",
          color: "#169BA2",
          label: "الجدول والتحضير",
        },
        {
          id: "tasks",
          icon: "fa-list-check",
          color: "#8AA838",
          label: "المهام والعمليات",
        },
        {
          id: "students",
          icon: "fa-user-graduate",
          color: "#D4A359",
          label: "إدارة الطلاب",
        },
        {
          id: "supervisors",
          icon: "fa-user-tie",
          color: "#E59824",
          label: "إدارة المشرفين",
        },
        {
          id: "attendance",
          icon: "fa-clipboard-user",
          color: "#9E1B48",
          label: "سجلات التحضير",
        },
        {
          id: "announcements",
          icon: "fa-bullhorn",
          color: "#E59824",
          label: "لوحة الإعلانات",
        },
        {
          id: "settings",
          icon: "fa-gear",
          color: "#D4A359",
          label: "الإعدادات",
        },
      ];
    } else if (role === "supervisor") {
      links = [
        {
          id: "home",
          icon: "fa-chart-line",
          color: "#FFFFFF",
          label: "لوحة المتابعة",
        },
        {
          id: "portal",
          icon: "fa-layer-group",
          color: "#169BA2",
          label: "مساراتي",
        },
        {
          id: "schedule",
          icon: "fa-calendar-week",
          color: "#169BA2",
          label: "الجدول الأسبوعي",
        },
        {
          id: "tasks",
          icon: "fa-tasks",
          color: "#8AA838",
          label: "مهامي والتكليفات",
        },
        {
          id: "students",
          icon: "fa-user-graduate",
          color: "#D4A359",
          label: "إدارة الطلاب",
        },
        {
          id: "attendance",
          icon: "fa-clipboard-user",
          color: "#9E1B48",
          label: "رصد الحضور",
        },
        {
          id: "announcements",
          icon: "fa-bullhorn",
          color: "#E59824",
          label: "لوحة الإعلانات",
        },
        {
          id: "settings",
          icon: "fa-gear",
          color: "#D4A359",
          label: "الإعدادات",
        },
      ];
    } else {
      // student
      links = [
        {
          id: "home",
          icon: "fa-house",
          color: "#FFFFFF",
          label: "الرئيسية والبرنامج",
        },
        {
          id: "portal",
          icon: "fa-layer-group",
          color: "#169BA2",
          label: "اختيار المسار",
        },
        {
          id: "schedule",
          icon: "fa-calendar-days",
          color: "#169BA2",
          label: "جدولي الدراسي",
        },
        {
          id: "tasks",
          icon: "fa-list-check",
          color: "#8AA838",
          label: "مهامي وواجباتي",
        },
        {
          id: "announcements",
          icon: "fa-bullhorn",
          color: "#E59824",
          label: "لوحة الإعلانات",
        },
        {
          id: "settings",
          icon: "fa-gear",
          color: "#D4A359",
          label: "الإعدادات",
        },
      ];
    }

    nav.innerHTML = `
            <div class="space-y-1.5">
                ${links
                  .map(
                    (link) => `
                    <button onclick="navigateTo('${link.id}')" id="nav-${link.id}" class="nav-item w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition">
                        <i class="fa-solid ${link.icon} w-5 text-center text-base" style="color: ${link.color};"></i>
                        <span>${link.label}</span>
                    </button>
                `,
                  )
                  .join("")}
            </div>

            <div class="pt-4 mt-4 border-t border-slate-100">
                <button onclick="views.openSendNotifModal()" class="w-full flex items-center justify-center space-x-2 space-x-reverse px-4 py-3 rounded-2xl text-sm font-black bg-[#FCECEF] text-[#9E1B48] hover:bg-[#F9DDE3] transition">
                    <i class="fa-regular fa-paper-plane text-base"></i>
                    <span>الرسائل التنبيهية</span>
                </button>
            </div>
        `;
  },

  // 2. شاشة بوابة اختيار المسارات (نظيفة تماماً وبدون أي نصوص علوية)
  renderPortalView() {
    return `
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 max-w-4xl mx-auto my-8">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    ${db.programs
                      .map(
                        (prog) => `
                        <div class="rounded-3xl border-2 border-slate-200 hover:border-[#169BA2] p-8 flex flex-col justify-between space-y-8 bg-white hover:shadow-lg transition-all text-center">
                            <div class="py-6">
                                <h3 class="text-3xl font-black text-[#0B2533] mb-3">${prog.name}</h3>
                                <div class="w-12 h-1 bg-[#169BA2] rounded-full mx-auto"></div>
                            </div>

                            <div>
                                <button onclick="selectProgramPath('${prog.id}')" class="w-full py-3.5 bg-[#0B2533] hover:bg-[#169BA2] text-white font-bold rounded-2xl text-sm transition shadow-sm flex items-center justify-center">
                                    <span>دخول مسار ${prog.name}</span>
                                    <i class="fa-solid fa-arrow-left mr-2 text-xs"></i>
                                </button>
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        `;
  },

  // 3. نافذة تسجيل الدخول للمسار
  openLoginModal(programId) {
    const prog = db.programs.find((p) => p.id === programId) || db.programs[1];

    const modalHtml = `
            <div id="login-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in duration-150">
                    <div class="bg-[#0B2533] text-white p-6 flex justify-between items-center border-b border-[#D4A359]">
                        <div>
                            <span class="bg-[#169BA2] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-1 inline-block">
                                مسار ${prog.name}
                            </span>
                            <h3 class="font-bold text-lg leading-snug">تسجيل الدخول للمنصة الالكترونية</h3>
                        </div>
                        <button onclick="closeModal('login-modal')" class="text-slate-300 hover:text-white text-xl mr-2"><i class="fa-solid fa-xmark"></i></button>
                    </div>

                    <form onsubmit="event.preventDefault(); handleLoginSubmit('${programId}');" class="p-6 space-y-4 text-xs">
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">اختر الحساب للدخول السريع:</label>
                            <select id="login-user-select" onchange="views.fillLoginCredentials(this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-800 focus:outline-none focus:border-[#169BA2]">
                                <option value="">-- اختر الحساب المطلوب --</option>
                                <optgroup label="الإدارة">
                                    <option value="admin">مدير النظام (إدارة كاملة)</option>
                                </optgroup>
                                <optgroup label="المشرفون">
                                    ${db.users
                                      .filter((u) => u.role === "supervisor")
                                      .map(
                                        (s) =>
                                          `<option value="${s.id}">${s.name}</option>`,
                                      )
                                      .join("")}
                                </optgroup>
                                <optgroup label="الطلاب">
                                    ${db.users
                                      .filter((u) => u.role === "student")
                                      .map(
                                        (st) =>
                                          `<option value="${st.id}">طالب: ${st.name}</option>`,
                                      )
                                      .join("")}
                                </optgroup>
                            </select>
                        </div>

                        <div>
                            <label class="block font-bold text-slate-700 mb-1">رقم الجوال:</label>
                            <input id="login-phone" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-800" placeholder="05xxxxxxxx">
                        </div>

                        <div>
                            <label class="block font-bold text-slate-700 mb-1">كلمة المرور:</label>
                            <input id="login-pass" type="password" value="1234" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-800">
                        </div>

                        <div class="pt-2">
                            <button type="submit" class="w-full py-3 bg-[#169BA2] hover:bg-[#0B2533] text-white font-bold rounded-xl text-sm transition shadow-sm">
                                دخول مسار ${prog.name}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
  },

  fillLoginCredentials(userId) {
    if (!userId) return;
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      const phoneInput = document.getElementById("login-phone");
      const passInput = document.getElementById("login-pass");
      if (phoneInput) phoneInput.value = user.phone;
      if (passInput) passInput.value = user.password || "1234";
    }
  },

  // 4. الواجهة الرئيسية
  renderHome(user) {
    if (user.role === "admin") return this.renderAdminDashboard();
    if (user.role === "supervisor") return this.renderSupervisorDashboard(user);

    // واجهة الطالب
    const currentProg =
      db.programs.find((p) => p.id === user.currentProgramId) || db.programs[1];
    const studentTasks = db.tasks.filter((t) => t.assignedTo === user.id);
    const pendingTasks = studentTasks.filter(
      (t) => t.status !== "مكتملة" && t.status !== "معفى بعذر",
    );

    return `
            <div class="space-y-6">
                <div class="bg-gradient-to-r from-[#2B1736] to-[#169BA2] rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
                    <div class="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <span class="inline-block bg-[#D4A359] text-[#2B1736] text-xs font-black px-3 py-1 rounded-full mb-2">
                                المسار الحالي: ${currentProg.name}
                            </span>
                            <h2 class="text-2xl font-bold">مسار ${currentProg.name}</h2>
                        </div>
                        <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center min-w-[160px]">
                            <div class="text-xs text-slate-200 font-semibold mb-1">مستوى الإنجاز</div>
                            <div class="text-3xl font-extrabold text-[#D4A359]">${user.progress}%</div>
                            <div class="w-full bg-slate-700/50 h-2 rounded-full mt-2 overflow-hidden">
                                <div class="bg-[#D4A359] h-full rounded-full" style="width: ${user.progress}%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="kpi-card border-[#9E1B48]/30">
                        <span class="kpi-tag">KPI</span>
                        <div class="text-xs text-slate-500 font-bold mb-1">الواجبات المتبقية</div>
                        <div class="text-2xl font-black text-[#9E1B48]">${pendingTasks.length} مهام مستحقة</div>
                    </div>

                    <div class="kpi-card border-[#169BA2]/30">
                        <span class="kpi-tag">KPI</span>
                        <div class="text-xs text-slate-500 font-bold mb-1">نسبة الانضباط</div>
                        <div class="text-2xl font-black text-[#169BA2]">98% (ملتزم)</div>
                    </div>

                    <div class="kpi-card border-[#D4A359]/30">
                        <span class="kpi-tag">KPI</span>
                        <div class="text-xs text-slate-500 font-bold mb-1">حالة الحساب</div>
                        <div class="text-2xl font-black ${user.isRestricted ? "text-rose-600" : "text-emerald-600"}">
                            ${user.isRestricted ? "مقيد ⚠️" : "نشط ✓"}
                        </div>
                    </div>
                </div>

                ${this.renderScheduleWidget(currentProg.id)}
            </div>
        `;
  },

  // 5. لوحة الإدارة العامة
  renderAdminDashboard() {
    const pendingReqsCount = (db.registrationRequests || []).filter(
      (r) => r.status === "قيد المراجعة",
    ).length;
    const pendingEditsCount = (db.pendingProfileEdits || []).filter(
      (e) => e.status === "بانتظار الاعتماد",
    ).length;

    return `
            <div class="space-y-6">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="kpi-card bg-gradient-to-br from-amber-50/40 to-white border-amber-200/60">
                        <span class="kpi-tag">KPI</span>
                        <div class="text-xs text-slate-600 font-bold mb-2">نسبة الانضباط بالحضور</div>
                        <div class="flex items-center justify-between mt-2">
                            <div class="relative w-14 h-8 flex items-end justify-center">
                                <svg class="w-14 h-8 overflow-visible" viewBox="0 0 36 18">
                                    <path d="M 2 18 A 16 16 0 0 1 34 18" fill="none" stroke="#E2E8F0" stroke-width="4" stroke-linecap="round"/>
                                    <path d="M 2 18 A 16 16 0 0 1 31 8" fill="none" stroke="#E59824" stroke-width="4" stroke-linecap="round"/>
                                    <circle cx="18" cy="18" r="2.5" fill="#2B1736"/>
                                    <line x1="18" y1="18" x2="27" y2="9" stroke="#2B1736" stroke-width="1.8" stroke-linecap="round"/>
                                </svg>
                            </div>
                            <div class="text-2xl font-black text-[#0B2533]">94.2%</div>
                        </div>
                    </div>

                    <div class="kpi-card bg-gradient-to-br from-teal-50/40 to-white border-teal-200/60 cursor-pointer" onclick="navigateTo('students')">
                        <span class="kpi-tag">KPI</span>
                        <div class="text-xs text-slate-600 font-bold mb-2">إجمالي الطلاب المسجلين</div>
                        <div class="flex items-center justify-between mt-2">
                            <div class="w-10 h-10 rounded-xl bg-teal-100/60 text-[#169BA2] flex items-center justify-center text-xl">
                                <i class="fa-solid fa-user-graduate"></i>
                            </div>
                            <div class="text-2xl font-black text-[#0B2533]">
                                ${db.users.filter((u) => u.role === "student").length}
                                ${pendingReqsCount + pendingEditsCount > 0 ? `<span class="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full font-bold mr-1">${pendingReqsCount + pendingEditsCount} معلقة</span>` : ""}
                            </div>
                        </div>
                    </div>

                    <div class="kpi-card bg-gradient-to-br from-rose-50/40 to-white border-rose-200/60 cursor-pointer" onclick="navigateTo('supervisors')">
                        <span class="kpi-tag">KPI</span>
                        <div class="text-xs text-slate-600 font-bold mb-2">المشرفون المعتمدون</div>
                        <div class="flex items-center justify-between mt-2">
                            <div class="w-10 h-10 rounded-xl bg-rose-100/60 text-[#9E1B48] flex items-center justify-center text-xl">
                                <i class="fa-solid fa-user-tie"></i>
                            </div>
                            <div class="text-2xl font-black text-[#0B2533]">${db.users.filter((u) => u.role === "supervisor").length}</div>
                        </div>
                    </div>

                    <div class="kpi-card bg-gradient-to-br from-purple-50/40 to-white border-purple-200/60">
                        <span class="kpi-tag">KPI</span>
                        <div class="text-xs text-slate-600 font-bold mb-2">البرامج المفعلة</div>
                        <div class="flex items-center justify-between mt-2">
                            <div class="w-10 h-10 rounded-xl bg-purple-100/60 text-[#2B1736] flex items-center justify-center text-xl">
                                <i class="fa-solid fa-book-open"></i>
                            </div>
                            <div class="text-lg font-black text-[#0B2533]">${db.programs.length} مسارات رئيسية</div>
                        </div>
                    </div>
                </div>

                ${this.renderScheduleWidget("prog_taseel", 0, state.scheduleViewMode)}
            </div>
        `;
  },

  // 6. مكون الجداول الأسبوعية (الجداول الـ 3 المتتالية أو الموحد)[cite: 27]
  renderScheduleWidget(programId, weekOffset = 0, viewMode = "stacked") {
    const days = [
      { ar: "الأحد", en: "sunday", pillColor: "pill-teal", idx: 0 },
      { ar: "الاثنين", en: "Monday", pillColor: "pill-crimson", idx: 1 },
      { ar: "الثلاثاء", en: "Tuesday", pillColor: "pill-plum", idx: 2 },
      { ar: "الأربعاء", en: "Wednesday", pillColor: "pill-crimson", idx: 3 },
      { ar: "الخميس", en: "Thursday", pillColor: "pill-teal", idx: 4 },
      { ar: "الجمعة", en: "Friday", pillColor: "pill-gold", idx: 5 },
      { ar: "السبت", en: "Saturday", pillColor: "pill-olive", idx: 6 },
    ];

    const isStudent = state.currentRole === "student";
    const isAdmin = state.currentRole === "admin";
    const currentDayIndex = new Date().getDay();

    const targetPrograms =
      isAdmin && viewMode === "stacked"
        ? db.programs
        : [db.programs.find((p) => p.id === programId) || db.programs[1]];

    return `
            <div class="space-y-6 w-full">
                <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div class="flex items-center space-x-3 space-x-reverse flex-wrap gap-y-2">
                        <h3 class="text-base sm:text-lg font-black text-[#0B2533] flex items-center">
                            <i class="fa-solid fa-calendar-days text-[#2B1736] ml-2"></i> الجدول الأسبوعي والعمليات
                        </h3>
                        
                        ${
                          isAdmin
                            ? `
                            <div class="flex bg-slate-100 p-1 rounded-xl">
                                <button onclick="toggleScheduleViewMode('stacked')" class="px-2.5 py-1 text-xs font-bold rounded-lg transition ${viewMode === "stacked" ? "bg-white text-[#2B1736] shadow-xs" : "text-slate-500"}">
                                    الجداول الـ 3 متتالية
                                </button>
                                <button onclick="toggleScheduleViewMode('unified')" class="px-2.5 py-1 text-xs font-bold rounded-lg transition ${viewMode === "unified" ? "bg-white text-[#2B1736] shadow-xs" : "text-slate-500"}">
                                    الجدول الموحد الشامل
                                </button>
                            </div>
                        `
                            : ""
                        }
                    </div>

                    <div class="flex items-center space-x-2 space-x-reverse flex-wrap gap-y-2">
                        ${
                          !isStudent
                            ? `
                            <button onclick="views.openAddTaskModal('${programId}')" class="px-3.5 py-1.5 text-xs font-bold bg-[#169BA2] hover:bg-[#128086] text-white rounded-xl transition shadow-sm flex items-center">
                                <i class="fa-solid fa-plus ml-1.5"></i> إضافة مهمة
                            </button>
                        `
                            : ""
                        }

                        <div class="flex items-center space-x-1 space-x-reverse">
                            <button onclick="changeWeek(-1)" class="px-2.5 py-1 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700">
                                <i class="fa-solid fa-chevron-right"></i>
                            </button>
                            <button onclick="changeWeek(0)" class="px-3 py-1 text-xs font-bold bg-teal-50 text-[#169BA2] rounded-xl border border-teal-200">
                                الحالي
                            </button>
                            <button onclick="changeWeek(1)" class="px-2.5 py-1 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700">
                                <i class="fa-solid fa-chevron-left"></i>
                            </button>
                        </div>
                    </div>
                </div>

                ${targetPrograms
                  .map((prog) => {
                    const progSchedules =
                      viewMode === "unified" && isAdmin
                        ? db.schedules
                        : db.schedules.filter((s) => s.programId === prog.id);
                    const progTasks =
                      viewMode === "unified" && isAdmin
                        ? getVisibleTasks(state.currentUser)
                        : getVisibleTasks(state.currentUser, prog.id);

                    return `
                        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3 w-full">
                            <div class="flex justify-between items-center border-b border-slate-100 pb-2.5">
                                <div class="flex items-center space-x-2 space-x-reverse">
                                    <span class="w-3 h-3 rounded-full inline-block" style="background-color: ${prog.color};"></span>
                                    <h4 class="font-extrabold text-[#0B2533] text-base">${viewMode === "unified" ? "الجدول الشامل لجميع البرامج" : "مسار " + prog.name}</h4>
                                </div>
                            </div>

                            <div class="schedule-grid-container">
                                <div class="schedule-grid">
                                    ${days
                                      .map((dayObj) => {
                                        const isToday =
                                          dayObj.idx === currentDayIndex &&
                                          weekOffset === 0;
                                        const dateInfo = getWeekDateDetails(
                                          dayObj.idx,
                                          weekOffset,
                                        );
                                        const dayEvents = progSchedules.filter(
                                          (s) => s.dayOfWeek === dayObj.idx,
                                        );
                                        const dayTasks = progTasks.filter(
                                          (t) => t.dayOfWeek === dayObj.idx,
                                        );

                                        return `
                                            <div class="day-column ${isToday ? "today" : ""}">
                                                <div class="day-header-box">
                                                    <div class="text-xs font-black text-slate-800">${dayObj.ar}</div>
                                                    <div class="text-[9px] text-slate-400 font-medium">${dayObj.en}</div>
                                                    <div class="text-[8px] text-[#169BA2] font-bold mt-0.5 pt-0.5 border-t border-slate-100">
                                                        ${dateInfo.hijri} هـ | ${dateInfo.gregorian} م
                                                    </div>
                                                </div>

                                                <div class="p-1.5 min-h-[150px] flex flex-col justify-between space-y-1.5">
                                                    <div class="space-y-1">
                                                        ${dayEvents
                                                          .map(
                                                            (evt) => `
                                                            <div onclick="views.openEventDetailsModal('${evt.id}')" 
                                                                 class="event-compact-pill ${dayObj.pillColor}" 
                                                                 title="اضغط لمعاينة التفاصيل الكاملة">
                                                                <div class="text-[11px] font-bold text-slate-800 line-clamp-1 leading-tight">${evt.title}</div>
                                                                <div class="text-[9px] text-slate-400 font-medium mt-0.5"><i class="fa-regular fa-clock ml-0.5"></i> ${evt.time}</div>
                                                            </div>
                                                        `,
                                                          )
                                                          .join("")}

                                                        ${
                                                          !isStudent
                                                            ? dayTasks
                                                                .map((tsk) => {
                                                                  const supervisorColor =
                                                                    getUserColor(
                                                                      tsk.assignedTo,
                                                                    );
                                                                  return `
                                                                <div onclick="views.openTaskModal('${tsk.id}')" 
                                                                     class="event-compact-pill" 
                                                                     style="border-right-color: ${supervisorColor} !important;"
                                                                     title="اضغط لمعاينة تفاصيل المهمة والتوكيل">
                                                                    <div class="text-[11px] font-bold text-slate-800 line-clamp-1 leading-tight">${tsk.title}</div>
                                                                    <div class="flex items-center justify-between text-[9px] text-slate-400 mt-0.5">
                                                                        <span>${tsk.startTime}</span>
                                                                        <span class="w-2 h-2 rounded-full" style="background-color: ${supervisorColor};"></span>
                                                                    </div>
                                                                </div>
                                                            `;
                                                                })
                                                                .join("")
                                                            : dayTasks
                                                                .map(
                                                                  (stTask) => `
                                                            <div onclick="views.openTaskModal('${stTask.id}')" class="event-compact-pill pill-teal">
                                                                <div class="text-[11px] font-bold text-[#0B2533] line-clamp-1 leading-tight">${stTask.title}</div>
                                                                <div class="text-[9px] text-slate-400 mt-0.5">${stTask.startTime}</div>
                                                            </div>
                                                        `,
                                                                )
                                                                .join("")
                                                        }

                                                        ${
                                                          dayEvents.length ===
                                                            0 &&
                                                          dayTasks.length === 0
                                                            ? `
                                                            <div class="text-center text-slate-300 text-[10px] py-6 font-medium">لا توجد مواعيد</div>
                                                        `
                                                            : ""
                                                        }
                                                    </div>

                                                    ${
                                                      (dayEvents.some(
                                                        (e) =>
                                                          e.requiresAttendance,
                                                      ) ||
                                                        dayTasks.some(
                                                          (t) =>
                                                            t.requiresAttendance,
                                                        )) &&
                                                      !isStudent
                                                        ? `
                                                        <div>
                                                            ${dayEvents
                                                              .filter(
                                                                (e) =>
                                                                  e.requiresAttendance,
                                                              )
                                                              .map((evt) => {
                                                                const unmarkedCount =
                                                                  getUnmarkedAttendanceCount(
                                                                    evt.id,
                                                                    evt.programId,
                                                                  );
                                                                return `
                                                                    <button onclick="views.openAttendanceModal('${evt.id}')" class="w-full bg-[#2B1736] hover:bg-[#3D214D] text-white text-[9px] py-1 px-1.5 rounded-lg font-bold transition flex items-center justify-between shadow-sm">
                                                                        <span><i class="fa-solid fa-clipboard-user ml-0.5"></i> التحضير</span>
                                                                        <span class="bg-white/20 px-1 py-0.1 rounded text-[8px]">${unmarkedCount > 0 ? unmarkedCount : "✓"}</span>
                                                                    </button>
                                                                `;
                                                              })
                                                              .join("")}
                                                        </div>
                                                    `
                                                        : ""
                                                    }
                                                </div>
                                            </div>
                                        `;
                                      })
                                      .join("")}
                                </div>
                            </div>
                        </div>
                    `;
                  })
                  .join("")}
            </div>
        `;
  },

  // 7. نافذة تفاصيل النشاط المنبثقة
  openEventDetailsModal(eventId) {
    const evt = db.schedules.find((s) => s.id === eventId);
    if (!evt) return;

    const program = db.programs.find((p) => p.id === evt.programId) || {};
    const isStudent = state.currentRole === "student";

    const modalHtml = `
            <div id="event-details-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in duration-150">
                    <div class="bg-[#0B2533] text-white p-5 flex justify-between items-center border-b border-[#D4A359]">
                        <div>
                            <span class="bg-[#169BA2] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-1 inline-block">
                                مسار ${program.name || "البرنامج"}
                            </span>
                            <h3 class="font-bold text-base leading-snug">${evt.title}</h3>
                        </div>
                        <button onclick="closeModal('event-details-modal')" class="text-slate-300 hover:text-white text-lg mr-2"><i class="fa-solid fa-xmark"></i></button>
                    </div>

                    <div class="p-6 space-y-4 text-xs">
                        <div class="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                            <div>
                                <div class="text-slate-400 font-bold mb-0.5">نوع النشاط:</div>
                                <div class="font-bold text-[#0B2533] text-sm">${evt.typeLabel}</div>
                            </div>
                            <div>
                                <div class="text-slate-400 font-bold mb-0.5">التوقيت:</div>
                                <div class="font-bold text-[#169BA2] text-sm"><i class="fa-regular fa-clock ml-1"></i> ${evt.time}</div>
                            </div>
                        </div>

                        <div>
                            <div class="text-slate-500 font-bold mb-1">تفاصيل المحتوى والمقرر:</div>
                            <p class="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">${evt.details || "لا توجد تفاصيل إضافية لهذا الموعد."}</p>
                        </div>

                        ${
                          evt.requiresAttendance && !isStudent
                            ? `
                            <div class="bg-teal-50 p-3 rounded-xl border border-teal-200 flex justify-between items-center">
                                <span class="text-[#169BA2] font-bold">هذا الموعد يتطلب رصد تحضير للطلاب:</span>
                                <button onclick="closeModal('event-details-modal'); views.openAttendanceModal('${evt.id}');" class="px-3 py-1.5 bg-[#2B1736] hover:bg-[#169BA2] text-white font-bold rounded-lg transition text-xs">
                                    فتح التحضير الآن
                                </button>
                            </div>
                        `
                            : ""
                        }
                    </div>

                    <div class="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex justify-end">
                        <button onclick="closeModal('event-details-modal')" class="px-5 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition text-xs">
                            إغلاق
                        </button>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
  },

  // 8. نافذة تفاصيل المهمة والتوكيل والإعفاء والعداد التنازلي
  openTaskModal(taskId) {
    const task = db.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const assignee = db.users.find((u) => u.id === task.assignedTo) || {};
    const supervisorColor = assignee.color || "#169BA2";
    const prog = db.programs.find((p) => p.id === task.programId) || {};
    const timeRemaining = calculateTimeRemaining(task.date, task.startTime);
    const isAdmin = state.currentRole === "admin";

    const eligibleSupervisors = db.users.filter(
      (u) =>
        u.role === "supervisor" &&
        u.id !== task.assignedTo &&
        (u.assignedPrograms || []).includes(task.programId),
    );

    const canManage = isAdmin || state.currentUser.id === task.assignedTo;

    const modalHtml = `
            <div id="task-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    
                    <div class="p-5 text-white flex justify-between items-start" style="background-color: ${supervisorColor};">
                        <div>
                            <span class="bg-black/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full mb-1 inline-block">
                                مسار ${prog.name || "البرنامج"}
                            </span>
                            <h3 class="font-bold text-lg leading-snug">${task.title}</h3>
                        </div>
                        <button onclick="closeModal('task-modal')" class="text-white/80 hover:text-white text-xl mr-2">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <div class="p-6 space-y-4 text-xs">
                        <div class="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                            <div>
                                <div class="text-slate-400 font-bold mb-0.5">المسؤول:</div>
                                <div class="font-bold text-slate-800 text-sm flex items-center">
                                    <span class="w-2.5 h-2.5 rounded-full ml-1.5" style="background-color: ${supervisorColor};"></span>
                                    ${assignee.name || "غير محدد"}
                                </div>
                            </div>
                            <div>
                                <div class="text-slate-400 font-bold mb-0.5">النافذة الزمنية:</div>
                                <div class="font-bold text-[#0B2533] text-sm">
                                    <i class="fa-regular fa-clock ml-1 text-[#169BA2]"></i> من ${task.startTime} إلى ${task.endTime}
                                </div>
                            </div>
                        </div>

                        <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                            <div class="flex justify-between items-center">
                                <span class="text-slate-500 font-bold">حالة التنفيذ:</span>
                                <span class="badge ${task.status === "مكتملة" ? "badge-completed" : task.status === "معفى بعذر" ? "badge-exempt" : "badge-pending"}">${task.status}</span>
                            </div>
                            <div class="flex justify-between items-center pt-1 border-t border-slate-100 text-[11px]">
                                <span class="text-slate-400 font-semibold">الوقت المتبقي:</span>
                                <span class="font-bold ${timeRemaining.isOverdue ? "text-rose-600" : "text-emerald-700"}">
                                    <i class="fa-solid fa-stopwatch ml-1"></i> ${timeRemaining.text}
                                </span>
                            </div>
                            ${
                              task.isExempt
                                ? `
                                <div class="bg-amber-50 p-2 rounded-lg text-amber-900 font-bold text-[11px] mt-1 border border-amber-200">
                                    <i class="fa-solid fa-shield-halved ml-1 text-amber-600"></i> سبب الإعفاء: ${task.exemptionReason}
                                </div>
                            `
                                : ""
                            }
                        </div>

                        <div>
                            <div class="text-slate-500 font-bold mb-1">تفاصيل وإرشادات المهمة:</div>
                            <p class="text-slate-700 bg-white p-3 rounded-xl border border-slate-100 leading-relaxed">${task.description || "لا توجد تفاصيل إضافية."}</p>
                        </div>

                        ${
                          canManage && !task.isExempt
                            ? `
                            <div class="pt-2 border-t border-slate-100">
                                <div class="text-slate-700 font-bold mb-2 flex items-center">
                                    <i class="fa-solid fa-user-plus text-[#169BA2] ml-1.5"></i> توكيل المهمة إلى زميل في نفس البرنامج:
                                </div>
                                ${
                                  eligibleSupervisors.length > 0
                                    ? `
                                    <div class="flex gap-2">
                                        <select id="delegate-select" class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 focus:outline-none focus:border-[#169BA2]">
                                            ${eligibleSupervisors
                                              .map(
                                                (s) => `
                                                <option value="${s.id}">${s.name}</option>
                                            `,
                                              )
                                              .join("")}
                                        </select>
                                        <button onclick="delegateTask('${task.id}', document.getElementById('delegate-select').value)" class="px-4 py-2 bg-[#169BA2] hover:bg-[#2B1736] text-white font-bold rounded-xl transition">
                                            توكيل فوري
                                        </button>
                                    </div>
                                `
                                    : `
                                    <p class="text-slate-400 text-[11px]">لا يوجد مشرفون آخرون مسجلون في نفس هذا البرنامج حالياً للتوكيل.</p>
                                `
                                }
                            </div>
                        `
                            : ""
                        }

                        ${
                          isAdmin && !task.isExempt
                            ? `
                            <div class="pt-2 border-t border-slate-100">
                                <button onclick="const r = prompt('أدخل سبب الإعفاء الرسمي:'); if(r) exemptTask('${task.id}', r);" class="w-full py-2 bg-slate-100 hover:bg-amber-100 text-amber-800 font-bold rounded-xl transition border border-amber-200 flex items-center justify-center">
                                    <i class="fa-solid fa-shield-halved ml-1.5 text-amber-600"></i> منح إعفاء رسمي عن المهمة
                                </button>
                            </div>
                        `
                            : ""
                        }
                    </div>

                    <div class="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center">
                        <button onclick="closeModal('task-modal')" class="px-4 py-2 text-slate-600 hover:bg-slate-200 font-bold rounded-xl transition">
                            إغلاق
                        </button>
                        ${
                          canManage && !task.isExempt
                            ? `
                            <button onclick="toggleTaskCompletion('${task.id}')" class="px-5 py-2 font-bold rounded-xl transition text-white ${task.status === "مكتملة" ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}">
                                ${task.status === "مكتملة" ? '<i class="fa-solid fa-rotate-left ml-1"></i> إعادة فتح المهمة' : '<i class="fa-solid fa-check ml-1"></i> تأكيد إتمام المهمة'}
                            </button>
                        `
                            : ""
                        }
                    </div>

                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
  },

  // 9. نافذة إضافة وتكليف مهمة (بالقائمة المنسدلة للمهام الـ 29 مع خيار الإدخال المخصص وتكليف التحضير)[cite: 27]
  openAddTaskModal(defaultProgramId) {
    const user = state.currentUser;
    const availablePrograms =
      user.role === "admin"
        ? db.programs
        : db.programs.filter((p) =>
            (user.assignedPrograms || []).includes(p.id),
          );
    const students = db.users.filter(
      (u) => u.role === "student" && !u.isRestricted,
    );
    const supervisors = db.users.filter(
      (u) => u.role === "supervisor" && !u.isRestricted,
    );
    const templates = db.taskTemplates || [];

    const modalHtml = `
            <div id="add-task-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden">
                    <div class="bg-[#2B1736] text-white px-6 py-4 flex justify-between items-center border-b border-[#D4A359]">
                        <h3 class="font-bold text-base flex items-center">
                            <i class="fa-solid fa-plus text-[#D4A359] ml-2"></i> إضافة وتكليف مهمة جديدة
                        </h3>
                        <button onclick="closeModal('add-task-modal')" class="text-slate-300 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
                    </div>

                    <form onsubmit="event.preventDefault(); views.handleTaskSubmit();" class="p-6 space-y-3.5 text-xs">
                        
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">اختر المهمة من قائمة المعايير المعتمدة (29 معيار):</label>
                            <select id="task-template-select" onchange="views.handleTemplateSelectChange(this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:border-[#169BA2]">
                                <option value="">-- اختر من قائمة المهام المعتمدة (أو مهمة أخرى) --</option>
                                <option value="__CUSTOM__">✍️ مهمة أخرى (إدخال يدوي مخصص)</option>
                                ${templates
                                  .map(
                                    (t, idx) => `
                                    <option value="${t}">معيار ${idx + 1}: ${t}</option>
                                `,
                                  )
                                  .join("")}
                            </select>
                        </div>

                        <div id="custom-task-title-container" class="hidden">
                            <label class="block font-bold text-slate-700 mb-1">اكتب عنوان المهمة المخصصة:</label>
                            <input id="new-task-title" class="w-full bg-white border-2 border-[#169BA2] rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none" placeholder="اكتب نص المهمة هنا...">
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">البرنامج:</label>
                                <select id="new-task-prog" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700">
                                    ${availablePrograms
                                      .map(
                                        (p) => `
                                        <option value="${p.id}" ${p.id === defaultProgramId ? "selected" : ""}>${p.name}</option>
                                    `,
                                      )
                                      .join("")}
                                </select>
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">إسناد وتكليف إلى:</label>
                                <select id="new-task-assignee" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700">
                                    ${
                                      user.role === "admin"
                                        ? `
                                        <optgroup label="المشرفون">
                                            ${supervisors.map((s) => `<option value="${s.id}">${s.name}</option>`).join("")}
                                        </optgroup>
                                        <optgroup label="الطلاب">
                                            ${students.map((st) => `<option value="${st.id}">طالب: ${st.name}</option>`).join("")}
                                        </optgroup>
                                    `
                                        : `
                                        <option value="${user.id}">لنفسي (${user.name})</option>
                                    `
                                    }
                                </select>
                            </div>
                        </div>

                        <div class="grid grid-cols-3 gap-2">
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">يوم التنفيذ:</label>
                                <select id="new-task-day" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700">
                                    <option value="0">الأحد</option>
                                    <option value="1">الإثنين</option>
                                    <option value="2">الثلاثاء</option>
                                    <option value="3">الأربعاء</option>
                                    <option value="4">الخميس</option>
                                    <option value="5">الجمعة</option>
                                    <option value="6">السبت</option>
                                </select>
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">من:</label>
                                <input id="new-task-start" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium" placeholder="04:30 م">
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">إلى:</label>
                                <input id="new-task-end" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium" placeholder="06:00 م">
                            </div>
                        </div>

                        <div class="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                            <label class="flex items-center space-x-2 space-x-reverse font-bold text-slate-800 cursor-pointer">
                                <input type="checkbox" id="new-task-attendance" class="accent-[#169BA2]">
                                <span>تكليف المشرف برصد التحضير في هذا اليوم (إلزامي للطلاب)</span>
                            </label>

                            <label class="flex items-center space-x-2 space-x-reverse font-bold text-slate-800 cursor-pointer pt-1 border-t border-slate-200">
                                <input type="checkbox" id="new-task-recurring" onchange="document.getElementById('recurring-opts').classList.toggle('hidden')" class="accent-[#169BA2]">
                                <span>تكرار المهمة دورياً كل أسبوع</span>
                            </label>
                            <div id="recurring-opts" class="hidden pt-2">
                                <label class="block font-bold text-slate-600 mb-1">تاريخ التوقف النهائي للتكرار:</label>
                                <input type="date" id="new-task-stop-date" class="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-slate-700">
                            </div>
                        </div>

                        <div>
                            <label class="block font-bold text-slate-700 mb-1">تفاصيل وإرشادات إضافية:</label>
                            <textarea id="new-task-desc" rows="2" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#169BA2]" placeholder="اكتب التعليمات هنا..."></textarea>
                        </div>

                        <div class="pt-2 flex justify-end space-x-2 space-x-reverse">
                            <button type="button" onclick="closeModal('add-task-modal')" class="px-4 py-2 bg-slate-100 font-bold text-slate-600 rounded-xl">إلغاء</button>
                            <button type="submit" class="px-5 py-2.5 bg-[#9E1B48] hover:bg-[#83143A] text-white font-bold rounded-xl transition shadow-sm">حفظ وجدولة المهمة</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
  },

  handleTemplateSelectChange(val) {
    const customContainer = document.getElementById(
      "custom-task-title-container",
    );
    const customInput = document.getElementById("new-task-title");
    if (val === "__CUSTOM__") {
      customContainer.classList.remove("hidden");
      customInput.value = "";
      customInput.focus();
    } else if (val) {
      customContainer.classList.add("hidden");
      customInput.value = val;
    } else {
      customContainer.classList.add("hidden");
      customInput.value = "";
    }
  },

  handleTaskSubmit() {
    const templateSelect = document.getElementById(
      "task-template-select",
    ).value;
    const customTitle = document.getElementById("new-task-title").value;
    const finalTitle =
      templateSelect === "__CUSTOM__"
        ? customTitle
        : templateSelect || customTitle;

    if (!finalTitle || finalTitle.trim() === "") {
      alert("يرجى اختيار مهمة من القائمة أو كتابة عنوان مخصص للمهمة!");
      return;
    }

    const programId = document.getElementById("new-task-prog").value;
    const dayOfWeek = document.getElementById("new-task-day").value;
    const startTime = document.getElementById("new-task-start").value;
    const endTime = document.getElementById("new-task-end").value;
    const description = document.getElementById("new-task-desc").value;
    const requiresAttendance = document.getElementById(
      "new-task-attendance",
    ).checked;
    const isRecurring = document.getElementById("new-task-recurring").checked;
    const stopDate = isRecurring
      ? document.getElementById("new-task-stop-date").value
      : null;
    const assignedTo = document.getElementById("new-task-assignee")
      ? document.getElementById("new-task-assignee").value
      : state.currentUser.id;
    const targetUser = db.users.find((u) => u.id === assignedTo);

    addNewTask({
      title: finalTitle,
      programId,
      dayOfWeek,
      startTime,
      endTime,
      description,
      requiresAttendance,
      isRecurring,
      stopDate,
      assignedTo,
      assigneeRole: targetUser ? targetUser.role : "supervisor",
    });
  },

  // 10. شاشة إدارة الطلاب (بالبحث، استيراد Excel، الترقية، والتقييد)
  renderAdminStudentsView() {
    const user = state.currentUser;
    const isSupervisor = user.role === "supervisor";
    const students = isSupervisor
      ? db.users.filter(
          (u) =>
            u.role === "student" &&
            (user.assignedPrograms || []).includes(u.currentProgramId),
        )
      : db.users.filter((u) => u.role === "student");

    const pendingRequests = db.registrationRequests || [];
    const pendingEdits = db.pendingProfileEdits || [];

    return `
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6">
                <div class="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-100 pb-4">
                    <div>
                        <h2 class="text-xl font-extrabold text-[#0B2533] flex items-center">
                            <i class="fa-solid fa-user-graduate text-[#169BA2] ml-2"></i> إدارة الطلاب
                        </h2>
                        <p class="text-xs text-slate-500 mt-1">متابعة الطلاب، استيراد السجلات، الترقية للمستوى القادم، والتقييد</p>
                    </div>

                    <div class="flex items-center space-x-2 space-x-reverse flex-wrap gap-y-2">
                        <label class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center cursor-pointer">
                            <i class="fa-solid fa-file-excel ml-1.5"></i> استيراد طلاب من Excel / CSV
                            <input type="file" accept=".csv, .xlsx, .xls" class="hidden" onchange="handleStudentExcelImport(event)">
                        </label>
                        <button onclick="views.openAddStudentModal()" class="px-4 py-2 bg-[#169BA2] hover:bg-[#128086] text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center">
                            <i class="fa-solid fa-user-plus ml-1.5"></i> إضافة طالب جديد
                        </button>
                    </div>
                </div>

                <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
                    <div class="relative flex-1 w-full">
                        <i class="fa-solid fa-magnifying-glass absolute right-3 top-3 text-slate-400 text-xs"></i>
                        <input id="student-search-input" onkeyup="views.filterStudentsList(this.value)" class="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs font-medium focus:outline-none focus:border-[#169BA2]" placeholder="ابحث باسم الطالب أو رقم الجوال أو ولي الأمر...">
                    </div>

                    <div class="flex items-center space-x-2 space-x-reverse w-full sm:w-auto">
                        <select id="quick-student-select" onchange="if(this.value) views.openEditStudentModal(this.value)" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#0B2533] focus:outline-none w-full sm:w-auto">
                            <option value="">-- تعديل بيانات طالب مباشر --</option>
                            ${students.map((s) => `<option value="${s.id}">${s.name} (${getProgramName(s.currentProgramId)})</option>`).join("")}
                        </select>
                    </div>
                </div>

                ${
                  pendingEdits.length > 0
                    ? `
                    <div class="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 space-y-3">
                        <div class="flex justify-between items-center">
                            <h3 class="text-sm font-black text-[#2B1736] flex items-center">
                                <i class="fa-solid fa-user-pen text-[#2B1736] ml-2"></i> طلبات تعديل بيانات مقدمة من الطلاب تحتاج للاعتماد (${pendingEdits.length})
                            </h3>
                        </div>
                        <div class="space-y-2">
                            ${pendingEdits
                              .map(
                                (edit) => `
                                <div class="bg-white p-3 rounded-xl border border-purple-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                    <div>
                                        <div class="font-bold text-slate-800 text-sm">${edit.studentName}</div>
                                        <div class="text-xs text-slate-500 mt-0.5">
                                            <span>الجوال الجديد: ${edit.newPhone}</span> | 
                                            <span>البريد: ${edit.newEmail}</span>
                                        </div>
                                    </div>
                                    <div class="flex items-center space-x-2 space-x-reverse">
                                        <button onclick="approveProfileEdit('${edit.id}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition">اعتماد التعديل</button>
                                        <button onclick="rejectProfileEdit('${edit.id}')" class="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs rounded-lg transition">رفض</button>
                                    </div>
                                </div>
                            `,
                              )
                              .join("")}
                        </div>
                    </div>
                `
                    : ""
                }

                ${
                  pendingRequests.length > 0
                    ? `
                    <div class="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3">
                        <div class="flex justify-between items-center">
                            <h3 class="text-sm font-black text-amber-900 flex items-center">
                                <i class="fa-solid fa-bell text-[#E59824] ml-2"></i> طلبات تسجيل جديدة قيد المراجعة (${pendingRequests.length})
                            </h3>
                        </div>

                        <div class="space-y-2">
                            ${pendingRequests
                              .map(
                                (req) => `
                                <div class="bg-white p-3.5 rounded-xl border border-amber-200/80 flex flex-col md:flex-row justify-between md:items-center gap-3 shadow-xs">
                                    <div>
                                        <div class="font-bold text-slate-800 text-sm">${req.name}</div>
                                        <div class="text-xs text-slate-500 mt-0.5">
                                            <span>جوال الطالب: ${req.phone}</span> | 
                                            <span class="font-bold text-slate-700">جوال الأب: ${req.fatherPhone}</span> | 
                                            <span class="text-[#169BA2] font-bold">البرنامج: ${getProgramName(req.programId)}</span>
                                        </div>
                                    </div>
                                    <div class="flex items-center space-x-2 space-x-reverse">
                                        <button onclick="acceptStudentRequest('${req.id}')" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition">
                                            <i class="fa-solid fa-check ml-1"></i> قبول
                                        </button>
                                        <button onclick="rejectStudentRequest('${req.id}')" class="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs rounded-lg transition">
                                            رفض
                                        </button>
                                    </div>
                                </div>
                            `,
                              )
                              .join("")}
                        </div>
                    </div>
                `
                    : ""
                }

                <div class="space-y-3" id="students-cards-container">
                    ${students
                      .map(
                        (st) => `
                        <div class="student-item-card p-4 rounded-2xl border ${st.isRestricted ? "border-rose-300 bg-rose-50/20" : "border-slate-200 bg-white"} flex flex-col md:flex-row justify-between md:items-center gap-4 transition">
                            <div class="flex items-center space-x-3 space-x-reverse">
                                <div class="w-11 h-11 rounded-2xl ${st.isRestricted ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-[#0B2533]"} font-black flex items-center justify-center text-sm shadow-xs">
                                    ${st.avatar}
                                </div>
                                <div>
                                    <div class="flex items-center space-x-2 space-x-reverse">
                                        <h4 class="font-black text-slate-800 text-sm">${st.name}</h4>
                                        ${st.isRestricted ? '<span class="badge badge-restricted text-[10px]">حساب مقيد</span>' : ""}
                                    </div>
                                    <div class="text-xs text-slate-500 mt-0.5">
                                        <span>جوال: ${st.phone || "غير مسجل"}</span> | 
                                        <span class="text-slate-700 font-bold">جوال الأب: ${st.fatherPhone || "غير مسجل"}</span> | 
                                        <span class="text-[#169BA2] font-bold">${getProgramName(st.currentProgramId)}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="flex items-center space-x-2 space-x-reverse flex-wrap gap-y-2">
                                <button onclick="views.openStudentDetailsModal('${st.id}')" class="px-3.5 py-1.5 bg-[#0B2533] hover:bg-[#169BA2] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center">
                                    <i class="fa-solid fa-address-card ml-1.5 text-xs"></i> معلومات الطالب
                                </button>

                                <button onclick="views.openEditStudentModal('${st.id}')" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition" title="تعديل البيانات">
                                    <i class="fa-solid fa-pen-to-square"></i>
                                </button>

                                <button onclick="promoteStudent('${st.id}')" class="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#169BA2] border border-teal-200/60 rounded-xl text-[11px] font-bold transition" title="ترقية للمستوى القادم">
                                    <i class="fa-solid fa-angles-up ml-1"></i> ترقية
                                </button>

                                <button onclick="toggleUserRestriction('${st.id}')" class="px-2.5 py-1.5 ${st.isRestricted ? "bg-emerald-100 text-emerald-800" : "bg-rose-50 text-rose-700"} rounded-xl text-[11px] font-bold transition" title="${st.isRestricted ? "فك التقييد" : "تقييد الحساب"}">
                                    <i class="fa-solid ${st.isRestricted ? "fa-lock-open" : "fa-ban"}"></i>
                                </button>
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        `;
  },

  filterStudentsList(query) {
    const container = document.getElementById("students-cards-container");
    if (!container) return;
    const q = query.toLowerCase().trim();
    const cards = container.getElementsByClassName("student-item-card");
    Array.from(cards).forEach((card) => {
      const text = card.innerText.toLowerCase();
      card.style.display = text.includes(q) ? "flex" : "none";
    });
  },

  // 11. نافذة معلومات الطالب الشاملة
  openStudentDetailsModal(studentId) {
    const student = db.users.find((u) => u.id === studentId);
    if (!student) return;

    const program =
      db.programs.find((p) => p.id === student.currentProgramId) || {};
    const level = db.levels.find((l) => l.id === student.currentLevelId) || {};

    const modalHtml = `
            <div id="student-details-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in duration-150">
                    <div class="bg-[#0B2533] text-white p-5 flex justify-between items-center border-b border-[#D4A359]">
                        <div class="flex items-center space-x-3 space-x-reverse">
                            <div class="w-10 h-10 rounded-full bg-white/10 text-[#D4A359] font-black flex items-center justify-center text-sm border border-white/20">
                                ${student.avatar}
                            </div>
                            <div>
                                <h3 class="font-bold text-base leading-snug">${student.name}</h3>
                                <span class="text-[10px] text-slate-300">${student.studentNumber}</span>
                            </div>
                        </div>
                        <button onclick="closeModal('student-details-modal')" class="text-slate-300 hover:text-white text-lg mr-2"><i class="fa-solid fa-xmark"></i></button>
                    </div>

                    <div class="p-6 space-y-3.5 text-xs">
                        <div class="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                            <div>
                                <div class="text-slate-400 font-bold mb-0.5">رقم جوال الطالب:</div>
                                <div class="font-bold text-slate-800">${student.phone || "غير مسجل"}</div>
                            </div>
                            <div>
                                <div class="text-slate-400 font-bold mb-0.5">رقم جوال ولي الأمر (الأب):</div>
                                <div class="font-bold text-[#169BA2]">${student.fatherPhone || "غير مسجل"}</div>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                            <div>
                                <div class="text-slate-400 font-bold mb-0.5">البرنامج المقيد به:</div>
                                <div class="font-bold text-[#0B2533]">${program.name || "غير محدد"}</div>
                            </div>
                            <div>
                                <div class="text-slate-400 font-bold mb-0.5">المستوى الحالي:</div>
                                <div class="font-bold text-[#D4A359]">${level.name || "المستوى الأول"}</div>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                            <div>
                                <div class="text-slate-400 font-bold mb-0.5">كلمة المرور:</div>
                                <div class="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border inline-block">${student.password || "1234"}</div>
                            </div>
                            <div>
                                <div class="text-slate-400 font-bold mb-0.5">حالة الحساب:</div>
                                <div class="font-bold ${student.isRestricted ? "text-rose-600" : "text-emerald-600"}">${student.isRestricted ? "مقيد ⚠️" : "نشط ✓"}</div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center">
                        <button onclick="closeModal('student-details-modal'); views.openEditStudentModal('${student.id}');" class="px-4 py-2 bg-[#169BA2] text-white font-bold rounded-xl text-xs hover:bg-[#0B2533] transition">
                            تعديل البيانات
                        </button>
                        <button onclick="closeModal('student-details-modal')" class="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-300 transition">
                            إغلاق
                        </button>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
  },

  // 12. نافذة تعديل بيانات الطالب
  openEditStudentModal(studentId) {
    const student = db.users.find((u) => u.id === studentId);
    if (!student) return;

    const modalHtml = `
            <div id="edit-student-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden">
                    <div class="bg-[#0B2533] text-white px-6 py-4 flex justify-between items-center border-b border-[#D4A359]">
                        <h3 class="font-bold text-base flex items-center">
                            <i class="fa-solid fa-user-pen text-[#D4A359] ml-2"></i> تعديل بيانات الطالب (${student.name})
                        </h3>
                        <button onclick="closeModal('edit-student-modal')" class="text-slate-300 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
                    </div>

                    <form onsubmit="event.preventDefault(); views.handleEditStudentSubmit('${student.id}');" class="p-6 space-y-3.5 text-xs">
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">اسم الطالب:</label>
                            <input id="edit-stu-name" value="${student.name}" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800">
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">رقم جوال الطالب:</label>
                                <input id="edit-stu-phone" value="${student.phone || ""}" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium">
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">رقم جوال ولي الأمر (الأب):</label>
                                <input id="edit-stu-father-phone" value="${student.fatherPhone || ""}" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">البرنامج المسجل به:</label>
                                <select id="edit-stu-prog" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700">
                                    ${db.programs.map((p) => `<option value="${p.id}" ${p.id === student.currentProgramId ? "selected" : ""}>${p.name}</option>`).join("")}
                                </select>
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">كلمة المرور:</label>
                                <input id="edit-stu-pass" value="${student.password || "1234"}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800">
                            </div>
                        </div>

                        <div class="pt-2 flex justify-end space-x-2 space-x-reverse">
                            <button type="button" onclick="closeModal('edit-student-modal')" class="px-4 py-2 bg-slate-100 font-bold text-slate-600 rounded-xl">إلغاء</button>
                            <button type="submit" class="px-5 py-2.5 bg-[#169BA2] hover:bg-[#0B2533] text-white font-bold rounded-xl transition shadow-sm">حفظ التعديلات</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
  },

  handleEditStudentSubmit(studentId) {
    const name = document.getElementById("edit-stu-name").value;
    const phone = document.getElementById("edit-stu-phone").value;
    const fatherPhone = document.getElementById("edit-stu-father-phone").value;
    const currentProgramId = document.getElementById("edit-stu-prog").value;
    const password = document.getElementById("edit-stu-pass").value;

    updateStudentData(studentId, {
      name,
      phone,
      fatherPhone,
      currentProgramId,
      password,
    });
  },

  // 13. نافذة إضافة طالب جديد
  openAddStudentModal() {
    const modalHtml = `
            <div id="add-student-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden">
                    <div class="bg-[#0B2533] text-white px-6 py-4 flex justify-between items-center border-b border-[#D4A359]">
                        <h3 class="font-bold text-base flex items-center">
                            <i class="fa-solid fa-user-plus text-[#D4A359] ml-2"></i> تسجيل وإضافة طالب جديد
                        </h3>
                        <button onclick="closeModal('add-student-modal')" class="text-slate-300 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
                    </div>

                    <form onsubmit="event.preventDefault(); views.handleStudentSubmit();" class="p-6 space-y-3.5 text-xs">
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">اسم الطالب رباعياً:</label>
                            <input id="new-stu-name" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#169BA2]" placeholder="مثال: عبد العزيز بن محمد الغامدي">
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">رقم جوال الطالب:</label>
                                <input id="new-stu-phone" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium" placeholder="05xxxxxxxx">
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">رقم جوال ولي الأمر (الأب):</label>
                                <input id="new-stu-father-phone" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium" placeholder="05xxxxxxxx">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">البرنامج الأساسي:</label>
                                <select id="new-stu-prog" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700">
                                    ${db.programs.map((p) => `<option value="${p.id}">${p.name}</option>`).join("")}
                                </select>
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">كلمة المرور الموحدة:</label>
                                <input disabled value="1234" class="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-500 text-center">
                            </div>
                        </div>

                        <div class="pt-2 flex justify-end space-x-2 space-x-reverse">
                            <button type="button" onclick="closeModal('add-student-modal')" class="px-4 py-2 bg-slate-100 font-bold text-slate-600 rounded-xl">إلغاء</button>
                            <button type="submit" class="px-5 py-2.5 bg-[#169BA2] hover:bg-[#0B2533] text-white font-bold rounded-xl transition shadow-sm">حفظ واعتماد الطالب</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
  },

  handleStudentSubmit() {
    const name = document.getElementById("new-stu-name").value;
    const phone = document.getElementById("new-stu-phone").value;
    const fatherPhone = document.getElementById("new-stu-father-phone").value;
    const currentProgramId = document.getElementById("new-stu-prog").value;

    addNewStudent({
      name,
      phone,
      fatherPhone,
      currentProgramId,
    });
  },

  // 14. شاشة إدارة المشرفين (باستيراد Excel، التعديل، والحذف)
  renderAdminSupervisorsView() {
    const supervisors = db.users.filter((u) => u.role === "supervisor");

    return `
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6">
                <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
                    <div>
                        <h2 class="text-xl font-extrabold text-[#0B2533]"><i class="fa-solid fa-user-tie text-[#169BA2] ml-2"></i> إدارة المشرفين</h2>
                        <p class="text-xs text-slate-500 mt-1">توزيع الصلاحيات، إسناد البرامج، استيراد السجلات، والتقييد</p>
                    </div>

                    ${
                      state.currentRole === "admin"
                        ? `
                        <div class="flex items-center space-x-2 space-x-reverse flex-wrap gap-y-2">
                            <label class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center cursor-pointer">
                                <i class="fa-solid fa-file-excel ml-1.5"></i> استيراد مشرفين من Excel / CSV
                                <input type="file" accept=".csv, .xlsx, .xls" class="hidden" onchange="handleSupervisorExcelImport(event)">
                            </label>
                            <button onclick="views.openAddSupervisorModal()" class="px-4 py-2 bg-[#169BA2] hover:bg-[#128086] text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center">
                                <i class="fa-solid fa-user-plus ml-1.5"></i> إضافة مشرف جديد
                            </button>
                        </div>
                    `
                        : ""
                    }
                </div>

                <div class="space-y-3">
                    ${supervisors
                      .map(
                        (sp) => `
                        <div class="p-4 rounded-2xl border ${sp.isRestricted ? "border-rose-300 bg-rose-50/20" : "border-slate-200 bg-white"} flex flex-col md:flex-row justify-between md:items-center gap-3">
                            <div class="flex items-center space-x-3 space-x-reverse">
                                <div class="w-11 h-11 rounded-2xl font-bold text-white flex items-center justify-center shadow-xs" style="background-color: ${sp.color};">
                                    ${sp.avatar}
                                </div>
                                <div>
                                    <div class="flex items-center space-x-2 space-x-reverse">
                                        <h4 class="font-bold text-slate-800 text-sm">${sp.name}</h4>
                                        ${sp.isRestricted ? '<span class="badge badge-restricted text-[10px]">حساب مقيد</span>' : ""}
                                    </div>
                                    <div class="text-xs text-slate-500 mt-0.5">
                                        <span>جوال: ${sp.phone || "غير مسجل"}</span> | 
                                        <span>البرامج: ${(sp.assignedPrograms || []).map((p) => getProgramName(p)).join("، ")}</span> | 
                                        <span class="text-slate-400">كلمة المرور: ${sp.password || "1234"}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2 space-x-reverse">
                                <button onclick="toggleUserRestriction('${sp.id}')" class="px-2.5 py-1.5 ${sp.isRestricted ? "bg-emerald-100 text-emerald-800" : "bg-rose-50 text-rose-700"} rounded-xl text-xs font-bold transition">
                                    ${sp.isRestricted ? "فك التقييد" : "تقييد"}
                                </button>
                                <button onclick="deleteSupervisor('${sp.id}')" class="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition" title="حذف المشرف">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        `;
  },

  openAddSupervisorModal() {
    const modalHtml = `
            <div id="add-supervisor-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden">
                    <div class="bg-[#0B2533] text-white px-6 py-4 flex justify-between items-center border-b border-[#D4A359]">
                        <h3 class="font-bold text-base flex items-center">
                            <i class="fa-solid fa-user-plus text-[#D4A359] ml-2"></i> إضافة مشرف جديد وإسناد البرامج
                        </h3>
                        <button onclick="closeModal('add-supervisor-modal')" class="text-slate-300 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
                    </div>

                    <form onsubmit="event.preventDefault(); views.handleSupervisorSubmit();" class="p-6 space-y-3.5 text-xs">
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">اسم المشرف:</label>
                            <input id="new-sup-name" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#169BA2]" placeholder="مثال: أ. عبد الرحمن الشهري">
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">رقم الجوال:</label>
                                <input id="new-sup-phone" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium" placeholder="05xxxxxxxx">
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">كلمة المرور الموحدة:</label>
                                <input disabled value="1234" class="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-500 text-center">
                            </div>
                        </div>

                        <div>
                            <label class="block font-bold text-slate-700 mb-1.5">البرامج المسندة (يمكن اختيار أكثر من برنامج):</label>
                            <div class="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                ${db.programs
                                  .map(
                                    (p) => `
                                    <label class="flex items-center space-x-1.5 space-x-reverse text-xs font-bold text-slate-700 cursor-pointer">
                                        <input type="checkbox" name="sup-progs" value="${p.id}" class="accent-[#169BA2]">
                                        <span>${p.name}</span>
                                    </label>
                                `,
                                  )
                                  .join("")}
                            </div>
                        </div>

                        <div class="pt-2 flex justify-end space-x-2 space-x-reverse">
                            <button type="button" onclick="closeModal('add-supervisor-modal')" class="px-4 py-2 bg-slate-100 font-bold text-slate-600 rounded-xl">إلغاء</button>
                            <button type="submit" class="px-5 py-2.5 bg-[#169BA2] hover:bg-[#0B2533] text-white font-bold rounded-xl transition shadow-sm">حفظ وإسناد المشرف</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
  },

  handleSupervisorSubmit() {
    const name = document.getElementById("new-sup-name").value;
    const phone = document.getElementById("new-sup-phone").value;
    const checkedBoxes = document.querySelectorAll(
      'input[name="sup-progs"]:checked',
    );
    const assignedPrograms = Array.from(checkedBoxes).map((cb) => cb.value);

    if (assignedPrograms.length === 0) {
      alert("يرجى اختيار برنامج واحد على الأقل للمشرف!");
      return;
    }

    addNewSupervisor({
      name,
      phone,
      assignedPrograms,
    });
  },

  // 15. مودال التحضير الذكي (دعم التحضير الجماعي والغياب التلقائي للبقية)[cite: 27]
  openAttendanceModal(scheduleId) {
    const schedule = db.schedules.find((s) => s.id === scheduleId);
    if (!schedule) return;

    const program = db.programs.find((p) => p.id === schedule.programId) || {};
    const students = db.users.filter(
      (u) =>
        u.role === "student" &&
        u.currentProgramId === schedule.programId &&
        !u.isRestricted,
    );
    const unmarkedCount = getUnmarkedAttendanceCount(
      scheduleId,
      schedule.programId,
    );

    const modalHtml = `
            <div id="attendance-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full overflow-hidden animate-in fade-in duration-150">
                    
                    <div class="bg-[#2B1736] text-white p-5 flex justify-between items-center border-b border-[#D4A359]">
                        <div>
                            <span class="bg-[#169BA2] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-1 inline-block">
                                مسار ${program.name || "البرنامج"}
                            </span>
                            <h3 class="font-bold text-base leading-snug">${schedule.title}</h3>
                        </div>
                        <button onclick="closeModal('attendance-modal')" class="text-slate-300 hover:text-white text-lg mr-2"><i class="fa-solid fa-xmark"></i></button>
                    </div>

                    <div class="p-6 space-y-4 text-xs">
                        <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                            <div>
                                <span class="text-slate-500 font-bold">إجمالي الطلاب:</span>
                                <span class="font-bold text-[#0B2533] mr-1">${students.length} طالب</span>
                            </div>
                            <div id="unmarked-badge-container">
                                <span class="badge ${unmarkedCount > 0 ? "badge-overdue" : "badge-completed"}">
                                    ${unmarkedCount > 0 ? `متبقي ${unmarkedCount} لم يتم تحضيرهم` : "تم تحضير جميع الطلاب ✓"}
                                </span>
                            </div>
                        </div>

                        <!-- شريط العمليات الجماعية للتحضير السريع -->
                        <div class="bg-teal-50/60 border border-teal-200/80 p-3 rounded-2xl space-y-2">
                            <div class="flex items-center justify-between">
                                <label class="flex items-center space-x-1.5 space-x-reverse font-bold text-slate-700 cursor-pointer">
                                    <input type="checkbox" id="select-all-attendance" onchange="toggleSelectAllAttendance(this)" class="accent-[#169BA2]">
                                    <span>تحديد كل الطلاب الظاهرين</span>
                                </label>
                                <span class="text-[10px] text-slate-500 font-semibold">تحضير جماعي للمحددين:</span>
                            </div>

                            <div class="flex items-center gap-1.5 flex-wrap">
                                <button onclick="bulkRecordAttendance('${scheduleId}', 'حاضر')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] transition shadow-xs">
                                    ✓ تحضير كـ حاضر
                                </button>
                                <button onclick="bulkRecordAttendance('${scheduleId}', 'غائب')" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-[11px] transition shadow-xs">
                                    ✗ تسجيل كـ غائب
                                </button>
                                <button onclick="bulkRecordAttendance('${scheduleId}', 'متأخر')" class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-[11px] transition shadow-xs">
                                    ⏱ متأخر
                                </button>
                                <button onclick="bulkRecordAttendance('${scheduleId}', 'مستأذن')" class="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-[11px] transition shadow-xs">
                                    ✉ مستأذن
                                </button>
                            </div>
                        </div>

                        <div class="space-y-2.5 max-h-64 overflow-y-auto pr-1" id="attendance-students-list">
                            ${students
                              .map((st) => {
                                const currentStatus =
                                  getStudentAttendanceStatus(scheduleId, st.id);
                                return `
                                    <div class="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 hover:border-teal-300 transition">
                                        <div class="flex items-center space-x-3 space-x-reverse">
                                            <input type="checkbox" value="${st.id}" class="stu-att-checkbox accent-[#169BA2]">
                                            <div class="w-8 h-8 rounded-full bg-slate-100 text-[#2B1736] font-bold flex items-center justify-center text-xs">
                                                ${st.avatar}
                                            </div>
                                            <div>
                                                <div class="font-bold text-slate-800">${st.name}</div>
                                                <div class="text-[10px] text-slate-400">جوال الأب: ${st.fatherPhone || "غير مسجل"}</div>
                                            </div>
                                        </div>

                                        <select onchange="recordAttendance('${scheduleId}', '${st.id}', this.value)" 
                                                class="bg-slate-50 border border-slate-300 font-bold text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#169BA2]">
                                            <option value="غير محدد" ${currentStatus === "غير محدد" ? "selected" : ""}>-- لم يُرصد --</option>
                                            <option value="حاضر" ${currentStatus === "حاضر" ? "selected" : ""}>حاضر ✓</option>
                                            <option value="غائب" ${currentStatus === "غائب" ? "selected" : ""}>غائب ✗</option>
                                            <option value="متأخر" ${currentStatus === "متأخر" ? "selected" : ""}>متأخر ⏱</option>
                                            <option value="مستأذن" ${currentStatus === "مستأذن" ? "selected" : ""}>مستأذن ✉</option>
                                        </select>
                                    </div>
                                `;
                              })
                              .join("")}
                        </div>
                    </div>

                    <div class="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                        <button onclick="markRemainingAbsent('${scheduleId}')" class="text-rose-700 hover:text-rose-900 font-bold text-xs">
                            <i class="fa-solid fa-user-xmark ml-1"></i> احتساب غير المرصودين غائبين تلقائياً
                        </button>

                        <button onclick="closeModal('attendance-modal')" class="px-5 py-2.5 bg-[#2B1736] text-white font-bold rounded-xl hover:bg-[#169BA2] transition text-xs shadow-sm">
                            تم وحفظ السجل
                        </button>
                    </div>

                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
  },

  updateAttendanceModalView(scheduleId) {
    const schedule = db.schedules.find((s) => s.id === scheduleId);
    if (!schedule) return;
    const unmarkedCount = getUnmarkedAttendanceCount(
      scheduleId,
      schedule.programId,
    );
    const container = document.getElementById("unmarked-badge-container");
    if (container) {
      container.innerHTML = `
                <span class="badge ${unmarkedCount > 0 ? "badge-overdue" : "badge-completed"}">
                    ${unmarkedCount > 0 ? `متبقي ${unmarkedCount} لم يتم تحضيرهم` : "تم تحضير جميع الطلاب ✓"}
                </span>
            `;
    }
  },

  // 16. شاشة الإعدادات
  renderSettingsView() {
    const user = state.currentUser;
    const isStudent = user.role === "student";

    return `
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
                <div class="border-b border-slate-100 pb-4">
                    <h2 class="text-xl font-extrabold text-[#0B2533]"><i class="fa-solid fa-gear text-[#D4A359] ml-2"></i> إعدادات الحساب</h2>
                    <p class="text-xs text-slate-500 mt-1">تحديث البيانات والملف الشخصي</p>
                </div>

                <div class="max-w-xl space-y-4 text-xs">
                    ${
                      isStudent
                        ? `
                        <div class="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-amber-900 font-bold leading-relaxed">
                            <i class="fa-solid fa-triangle-exclamation ml-1 text-amber-600"></i> تنبيه: عند قيامك بتعديل رقم الجوال أو البريد، سيتم إرسال طلب اعتماد لمشرف البرنامج والإدارة للموافقة عليه قبل التحديث الفعلي.
                        </div>
                    `
                        : ""
                    }

                    <div>
                        <label class="block font-bold text-slate-700 mb-1">الاسم الكامل:</label>
                        <input id="set-user-name" value="${user.name}" ${isStudent ? "disabled" : ""} class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800">
                    </div>

                    <div>
                        <label class="block font-bold text-slate-700 mb-1">رقم الجوال:</label>
                        <input id="set-user-phone" value="${user.phone || "0500000000"}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium">
                    </div>

                    <div>
                        <label class="block font-bold text-slate-700 mb-1">البريد الإلكتروني:</label>
                        <input id="set-user-email" value="${user.email || ""}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium">
                    </div>

                    <div class="pt-3">
                        <button onclick="updateProfile()" class="px-6 py-2.5 bg-[#2B1736] hover:bg-[#169BA2] text-white font-bold rounded-xl transition shadow-sm">
                            ${isStudent ? "إرسال طلب التعديل للاعتماد" : "حفظ التعديلات"}
                        </button>
                    </div>
                </div>
            </div>
        `;
  },

  // 17. إرسال الإشعارات التنبيهية
  openSendNotifModal() {
    const user = state.currentUser;
    const isAdmin = user.role === "admin";

    const modalHtml = `
            <div id="send-notif-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden">
                    <div class="bg-[#2B1736] text-white px-6 py-4 flex justify-between items-center border-b border-[#D4A359]">
                        <h3 class="font-bold text-base flex items-center">
                            <i class="fa-regular fa-paper-plane text-[#D4A359] ml-2"></i> ${isAdmin ? "إرسال إشعار موجه" : "مراسلة إدارة المنصة"}
                        </h3>
                        <button onclick="closeModal('send-notif-modal')" class="text-slate-300 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
                    </div>

                    <form onsubmit="event.preventDefault(); views.handleNotifSubmit();" class="p-6 space-y-3.5 text-xs">
                        ${
                          isAdmin
                            ? `
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">الجهة المستهدفة بالإشعار:</label>
                                <select id="notif-target-type" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700">
                                    <option value="all">الجميع (كافة البرامج)</option>
                                    <option value="supervisors">جميع المشرفين فقط</option>
                                    <option value="prog_taseel">طلاب مسار تأصيل</option>
                                    <option value="prog_rasookh">طلاب مسار رسوخ</option>
                                    <option value="prog_taheel">طلاب مسار تأهيل</option>
                                    <option value="student_1">طالب محدد: عبد الله العتيبي</option>
                                </select>
                            </div>
                        `
                            : `
                            <div class="bg-[#FCECEF] p-3 rounded-xl text-[#9E1B48] font-bold">
                                <i class="fa-solid fa-info-circle ml-1"></i> سيتم إرسال هذا الإشعار مباشرة إلى الإدارة المركزية.
                            </div>
                        `
                        }

                        <div>
                            <label class="block font-bold text-slate-700 mb-1">عنوان الإشعار:</label>
                            <input id="notif-title" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium" placeholder="عنوان موجز وواضح">
                        </div>

                        <div>
                            <label class="block font-bold text-slate-700 mb-1">نص الرسالة / الإشعار:</label>
                            <textarea id="notif-msg" required rows="3" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium" placeholder="اكتب تفاصيل الرسالة هنا..."></textarea>
                        </div>

                        <div class="pt-2 flex justify-end space-x-2 space-x-reverse">
                            <button type="button" onclick="closeModal('send-notif-modal')" class="px-4 py-2 bg-slate-100 font-bold text-slate-600 rounded-xl">إلغاء</button>
                            <button type="submit" class="px-5 py-2.5 bg-[#9E1B48] hover:bg-[#83143A] text-white font-bold rounded-xl transition shadow-sm">إرسال فوري</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
  },

  handleNotifSubmit() {
    const title = document.getElementById("notif-title").value;
    const message = document.getElementById("notif-msg").value;
    const targetTypeEl = document.getElementById("notif-target-type");
    const targetType = targetTypeEl ? targetTypeEl.value : "admin";

    let targetId = null;
    let finalType = "all";

    if (targetType.startsWith("prog_")) {
      finalType = "program";
      targetId = targetType;
    } else if (targetType.startsWith("student_")) {
      finalType = "single_user";
      targetId = targetType;
    } else if (targetType === "supervisors") {
      finalType = "supervisors";
    }

    sendTargetedNotification({
      title,
      message,
      targetType: finalType,
      targetId,
    });
  },

  // 18. لوحة المشرف
  renderSupervisorDashboard(supervisor) {
    const visibleTasks = getVisibleTasks(supervisor);
    const myTasks = visibleTasks.filter((t) => t.assignedTo === supervisor.id);

    return `
            <div class="space-y-6">
                <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
                    <div>
                        <h2 class="text-xl font-bold text-[#0B2533]">مرحباً بك، ${supervisor.name}</h2>
                        <p class="text-xs text-slate-500 mt-1">المشرف على برامج: ${(supervisor.assignedPrograms || []).map((p) => getProgramName(p)).join("، ")}</p>
                    </div>
                    <div class="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shadow-sm" style="background-color: ${supervisor.color};">
                        ${supervisor.avatar}
                    </div>
                </div>

                <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-base font-bold text-[#0B2533]"><i class="fa-solid fa-list-check text-[#D4A359] ml-2"></i> مهامك المكلف بها حالياً</h3>
                        <button onclick="views.openAddTaskModal('${supervisor.assignedPrograms[0]}')" class="text-xs text-[#169BA2] font-bold hover:underline">
                            + إضافة مهمة لنفسي
                        </button>
                    </div>
                    <div class="space-y-3">
                        ${
                          myTasks.length === 0
                            ? '<div class="text-slate-400 text-xs text-center py-4">لا توجد مهام مكلف بها حالياً</div>'
                            : myTasks
                                .map(
                                  (t) => `
                            <div onclick="views.openTaskModal('${t.id}')" class="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 cursor-pointer transition">
                                <div>
                                    <div class="text-sm font-bold text-slate-800">${t.title}</div>
                                    <div class="text-xs text-slate-500 mt-0.5">من ${t.startTime} إلى ${t.endTime} | ${getProgramName(t.programId)}</div>
                                </div>
                                <span class="badge ${t.status === "مكتملة" ? "badge-completed" : t.status === "معفى بعذر" ? "badge-exempt" : "badge-pending"}">${t.status}</span>
                            </div>
                        `,
                                )
                                .join("")
                        }
                    </div>
                </div>

                ${this.renderScheduleWidget(supervisor.assignedPrograms[0] || "prog_taseel")}
            </div>
        `;
  },

  // 19. شاشة سجلات التحضير
  renderAttendanceManagementView() {
    const attendanceSchedules = db.schedules.filter(
      (s) => s.requiresAttendance,
    );

    return `
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
                <div class="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div>
                        <h2 class="text-xl font-bold text-[#0B2533]"><i class="fa-solid fa-clipboard-user text-[#169BA2] ml-2"></i> سجلات الحضور والتحضير</h2>
                        <p class="text-xs text-slate-500 mt-1">متابعة الجلسات التي تتطلب تسجيل الحضور</p>
                    </div>
                </div>

                <div class="space-y-3">
                    ${attendanceSchedules
                      .map((sch) => {
                        const unmarked = getUnmarkedAttendanceCount(
                          sch.id,
                          sch.programId,
                        );
                        return `
                            <div class="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row justify-between md:items-center gap-3">
                                <div>
                                    <div class="font-bold text-slate-800 text-sm">${sch.title}</div>
                                    <div class="text-xs text-slate-500 mt-0.5">${getProgramName(sch.programId)} | التوقيت: ${sch.time}</div>
                                </div>
                                <div class="flex items-center space-x-3 space-x-reverse">
                                    <span class="badge ${unmarked > 0 ? "badge-overdue" : "badge-completed"}">
                                        ${unmarked > 0 ? `متبقي ${unmarked}` : "مكتمل التحضير"}
                                    </span>
                                    <button onclick="views.openAttendanceModal('${sch.id}')" class="px-4 py-2 bg-[#2B1736] text-white hover:bg-[#169BA2] font-bold text-xs rounded-xl transition">
                                        فتح التحضير
                                    </button>
                                </div>
                            </div>
                        `;
                      })
                      .join("")}
                </div>
            </div>
        `;
  },

  // 20. شاشة مركز المهام
  renderTasksView(user) {
    const tasksList = getVisibleTasks(user);

    return `
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
                <div class="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div>
                        <h2 class="text-xl font-bold text-[#0B2533]"><i class="fa-solid fa-list-check text-[#D4A359] ml-2"></i> مركز المهام والعمليات</h2>
                        <p class="text-xs text-slate-500 mt-1">متابعة التكليفات، توكيل المهام الفوري، ورصد زمن الإتمام والإعفاءات</p>
                    </div>
                    ${
                      user.role !== "student"
                        ? `
                        <button onclick="views.openAddTaskModal()" class="px-4 py-2 bg-[#9E1B48] hover:bg-[#83143A] text-white text-xs font-bold rounded-xl transition shadow-sm">
                            + إضافة مهمة
                        </button>
                    `
                        : ""
                    }
                </div>

                <div class="space-y-3">
                    ${tasksList
                      .map((t) => {
                        const supervisorColor = getUserColor(t.assignedTo);
                        return `
                            <div onclick="views.openTaskModal('${t.id}')" class="p-4 rounded-2xl border border-slate-200 hover:border-[#169BA2] transition bg-white flex flex-col md:flex-row justify-between md:items-center gap-4 cursor-pointer">
                                <div>
                                    <div class="flex items-center space-x-2 space-x-reverse mb-1">
                                        <span class="text-xs font-bold text-white px-2 py-0.5 rounded-lg" style="background-color: ${supervisorColor};">
                                            ${getUserName(t.assignedTo)}
                                        </span>
                                        <h4 class="font-bold text-slate-800 text-sm">${t.title}</h4>
                                    </div>
                                    <p class="text-xs text-slate-500">${t.description}</p>
                                    <div class="text-[11px] text-slate-400 mt-2">
                                        <i class="fa-regular fa-clock ml-1"></i> من ${t.startTime} إلى ${t.endTime} | ${getProgramName(t.programId)}
                                    </div>
                                </div>
                                <div class="flex items-center space-x-3 space-x-reverse">
                                    <span class="badge ${t.status === "مكتملة" ? "badge-completed" : t.status === "معفى بعذر" ? "badge-exempt" : "badge-pending"}">
                                        ${t.status}
                                    </span>
                                </div>
                            </div>
                        `;
                      })
                      .join("")}
                </div>
            </div>
        `;
  },
};
