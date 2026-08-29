/**
 * views.js - محرك بناء الواجهات الديناميكية المعتمد
 * يتضمن:
 * 1. حصر رصد الحضور للمشرف على برامجه المسندة فقط ومنع أي برامج أخرى.
 * 2. تخصيص إضافة المهام للمشرف بكتابة يدوية مباشرة (إخفاء قائمة الـ 29 معياراً عنه وقصرها على المدير).
 * 3. توحيد مسمى (برنامج) في كافة الواجهات والشاشات.
 * 4. الحفاظ على الطابع الأكاديمي الفاخر وكافة الميزات السابقة.
 */

window.views = {
  // 1. القائمة الجانبية الموجهة بالصلاحيات
  renderSidebar(role) {
    const nav = document.getElementById("sidebar-nav");
    if (!nav) return;

    let links = [];

    if (role === "admin") {
      links = [
        { id: "home", icon: "fa-house", color: "#D4A359", label: "الرئيسية" },
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
          color: "#64748B",
          label: "الإعدادات",
        },
      ];
    } else if (role === "supervisor") {
      links = [
        {
          id: "home",
          icon: "fa-chart-line",
          color: "#D4A359",
          label: "لوحة المتابعة",
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
          color: "#64748B",
          label: "الإعدادات",
        },
      ];
    } else {
      // student
      links = [
        {
          id: "home",
          icon: "fa-house",
          color: "#D4A359",
          label: "الرئيسية والبرنامج",
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
          color: "#64748B",
          label: "الإعدادات",
        },
      ];
    }

    nav.innerHTML = `
            <div class="space-y-1">
                ${links
                  .map(
                    (link) => `
                    <button onclick="navigateTo('${link.id}')" id="nav-${link.id}" class="nav-item w-full flex items-center space-x-3 space-x-reverse px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition">
                        <i class="fa-solid ${link.icon} w-5 text-center text-sm" style="color: ${link.color};"></i>
                        <span>${link.label}</span>
                    </button>
                `,
                  )
                  .join("")}
            </div>

            <div class="pt-3 mt-3 border-t border-slate-100">
                <button onclick="views.openSendNotifModal()" class="w-full flex items-center justify-center space-x-2 space-x-reverse px-3 py-2.5 rounded-2xl text-xs sm:text-sm font-black bg-[#FCECEF] text-[#9E1B48] hover:bg-[#F9DDE3] transition">
                    <i class="fa-regular fa-paper-plane text-sm"></i>
                    <span>الرسائل التنبيهية</span>
                </button>
            </div>
        `;
  },

  // 2. شاشة بوابة اختيار البرامج
  renderPortalView() {
    return `
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8 max-w-4xl mx-auto my-4 sm:my-8 border-t-4 border-t-[#D4A359]">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                    ${db.programs
                      .map(
                        (prog) => `
                        <div class="rounded-3xl border-2 border-slate-200 hover:border-[#D4A359] p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-white hover:shadow-md transition-all text-center relative overflow-hidden group">
                            <div class="absolute top-0 left-0 right-0 h-1 bg-[#D4A359]/40 group-hover:bg-[#D4A359] transition-all"></div>
                            <div class="py-4">
                                <h3 class="text-2xl sm:text-3xl font-black text-[#0B2533] mb-2">${prog.name}</h3>
                                <div class="w-10 h-1 bg-[#D4A359] rounded-full mx-auto"></div>
                            </div>

                            <div>
                                <button onclick="selectProgramPath('${prog.id}')" class="w-full py-3 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-black rounded-2xl text-xs sm:text-sm transition shadow-sm flex items-center justify-center">
                                    <span>دخول برنامج ${prog.name}</span>
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

  // 3. نافذة تسجيل الدخول للبرنامج المحدد
  openLoginModal(programId) {
    const prog = db.programs.find((p) => p.id === programId) || db.programs[1];

    const modalHtml = `
            <div id="login-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in duration-150 border-t-4 border-t-[#D4A359]">
                    <div class="bg-[#0B2533] text-white p-5 flex justify-between items-center border-b border-[#D4A359]">
                        <div>
                            <span class="bg-[#D4A359] text-[#0B2533] text-[10px] font-black px-2.5 py-0.5 rounded-full mb-1 inline-block">
                                برنامج ${prog.name}
                            </span>
                            <h3 class="font-bold text-base sm:text-lg leading-snug">تسجيل الدخول للمنصة الالكترونية</h3>
                        </div>
                        <button onclick="closeModal('login-modal')" class="text-slate-300 hover:text-white text-lg mr-2"><i class="fa-solid fa-xmark"></i></button>
                    </div>

                    <form onsubmit="event.preventDefault(); handleLoginSubmit('${programId}');" class="p-5 sm:p-6 space-y-3.5 text-xs">
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">اختر الحساب للدخول المباشر:</label>
                            <select id="login-user-select" onchange="views.fillLoginCredentials(this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:border-[#D4A359]">
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
                            <input id="login-phone" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:border-[#D4A359]" placeholder="05xxxxxxxx">
                        </div>

                        <div>
                            <label class="block font-bold text-slate-700 mb-1">كلمة المرور:</label>
                            <input id="login-pass" type="password" value="1234" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:border-[#D4A359]">
                        </div>

                        <div class="pt-2">
                            <button type="submit" class="w-full py-3 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-black rounded-xl text-xs sm:text-sm transition shadow-sm">
                                دخول برنامج ${prog.name}
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
            <div class="space-y-4 sm:space-y-6">
                <div class="bg-gradient-to-r from-[#0B2533] to-[#2B1736] rounded-3xl p-5 sm:p-6 text-white shadow-sm relative overflow-hidden border-t-4 border-t-[#D4A359]">
                    <div class="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-3">
                        <div>
                            <span class="inline-block bg-[#D4A359] text-[#0B2533] text-[11px] font-black px-3 py-0.5 rounded-full mb-1.5">
                                البرنامج الأكاديمي: ${currentProg.name}
                            </span>
                            <h2 class="text-xl sm:text-2xl font-black">برنامج ${currentProg.name}</h2>
                        </div>
                        <div class="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/20 text-center min-w-[140px]">
                            <div class="text-[11px] text-slate-200 font-semibold mb-0.5">مستوى الإنجاز</div>
                            <div class="text-2xl sm:text-3xl font-extrabold text-[#D4A359]">${user.progress}%</div>
                            <div class="w-full bg-slate-700/50 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                <div class="bg-[#D4A359] h-full rounded-full" style="width: ${user.progress}%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div class="kpi-card border-[#9E1B48]/30">
                        <span class="kpi-tag">KPI</span>
                        <div class="text-[11px] text-slate-500 font-bold mb-1">الواجبات المتبقية</div>
                        <div class="text-xl font-black text-[#9E1B48]">${pendingTasks.length} مهام مستحقة</div>
                    </div>

                    <div class="kpi-card border-[#169BA2]/30">
                        <span class="kpi-tag">KPI</span>
                        <div class="text-[11px] text-slate-500 font-bold mb-1">نسبة الانضباط</div>
                        <div class="text-xl font-black text-[#169BA2]">98% (ملتزم)</div>
                    </div>

                    <div class="kpi-card border-[#D4A359]/30">
                        <span class="kpi-tag">KPI</span>
                        <div class="text-[11px] text-slate-500 font-bold mb-1">حالة الحساب</div>
                        <div class="text-xl font-black ${user.isRestricted ? "text-rose-600" : "text-emerald-600"}">
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
            <div class="space-y-4 sm:space-y-6">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div class="kpi-card bg-gradient-to-br from-amber-50/40 to-white border-amber-200/60">
                        <span class="kpi-tag">KPI</span>
                        <div class="text-[11px] text-slate-600 font-bold mb-1">نسبة الانضباط بالحضور</div>
                        <div class="flex items-center justify-between mt-1">
                            <div class="text-2xl font-black text-[#0B2533]">94.2%</div>
                            <div class="w-8 h-8 rounded-xl bg-amber-100 text-[#E59824] flex items-center justify-center text-sm">
                                <i class="fa-solid fa-clipboard-check"></i>
                            </div>
                        </div>
                    </div>

                    <div class="kpi-card bg-gradient-to-br from-teal-50/40 to-white border-teal-200/60 cursor-pointer" onclick="navigateTo('students')">
                        <span class="kpi-tag">KPI</span>
                        <div class="text-[11px] text-slate-600 font-bold mb-1">إجمالي الطلاب المسجلين</div>
                        <div class="flex items-center justify-between mt-1">
                            <div class="text-2xl font-black text-[#0B2533]">
                                ${db.users.filter((u) => u.role === "student").length}
                                ${pendingReqsCount + pendingEditsCount > 0 ? `<span class="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full font-bold mr-1">${pendingReqsCount + pendingEditsCount} معلقة</span>` : ""}
                            </div>
                            <div class="w-8 h-8 rounded-xl bg-teal-100 text-[#169BA2] flex items-center justify-center text-sm">
                                <i class="fa-solid fa-user-graduate"></i>
                            </div>
                        </div>
                    </div>

                    <div class="kpi-card bg-gradient-to-br from-rose-50/40 to-white border-rose-200/60 cursor-pointer" onclick="navigateTo('supervisors')">
                        <span class="kpi-tag">KPI</span>
                        <div class="text-[11px] text-slate-600 font-bold mb-1">المشرفون المعتمدون</div>
                        <div class="flex items-center justify-between mt-1">
                            <div class="text-2xl font-black text-[#0B2533]">${db.users.filter((u) => u.role === "supervisor").length}</div>
                            <div class="w-8 h-8 rounded-xl bg-rose-100 text-[#9E1B48] flex items-center justify-center text-sm">
                                <i class="fa-solid fa-user-tie"></i>
                            </div>
                        </div>
                    </div>

                    <div class="kpi-card bg-gradient-to-br from-purple-50/40 to-white border-purple-200/60">
                        <span class="kpi-tag">KPI</span>
                        <div class="text-[11px] text-slate-600 font-bold mb-1">البرامج المفعلة</div>
                        <div class="flex items-center justify-between mt-1">
                            <div class="text-lg font-black text-[#0B2533]">${db.programs.length} برامج</div>
                            <div class="w-8 h-8 rounded-xl bg-purple-100 text-[#2B1736] flex items-center justify-center text-sm">
                                <i class="fa-solid fa-layer-group"></i>
                            </div>
                        </div>
                    </div>
                </div>

                ${this.renderScheduleWidget("prog_taseel", 0, state.scheduleViewMode)}
            </div>
        `;
  },

  // 6. مكون الجداول الأسبوعية
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
    const isSupervisor = state.currentRole === "supervisor";
    const currentDayIndex = new Date().getDay();

    let targetPrograms = [];
    if (isAdmin && viewMode === "stacked") {
      targetPrograms = db.programs;
    } else if (isSupervisor) {
      const assigned = state.currentUser.assignedPrograms || [];
      targetPrograms = db.programs.filter((p) => assigned.includes(p.id));
      if (targetPrograms.length === 0) targetPrograms = [db.programs[0]];
    } else {
      targetPrograms = [
        db.programs.find((p) => p.id === programId) || db.programs[1],
      ];
    }

    return `
            <div class="space-y-4 sm:space-y-5 w-full">
                <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-3.5 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-t-3 border-t-[#D4A359]">
                    <div class="flex items-center space-x-3 space-x-reverse flex-wrap gap-y-2">
                        <h3 class="text-sm sm:text-base font-black text-[#0B2533] flex items-center">
                            <i class="fa-solid fa-calendar-days text-[#D4A359] ml-1.5"></i> الجدول الأسبوعي والعمليات
                        </h3>
                        
                        ${
                          isAdmin
                            ? `
                            <div class="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                                <button onclick="toggleScheduleViewMode('stacked')" class="px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${viewMode === "stacked" ? "bg-white text-[#0B2533] shadow-xs font-black border border-slate-200" : "text-slate-500"}">
                                    الجداول متتالية
                                </button>
                                <button onclick="toggleScheduleViewMode('unified')" class="px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${viewMode === "unified" ? "bg-white text-[#0B2533] shadow-xs font-black border border-slate-200" : "text-slate-500"}">
                                    الجدول الشامل
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
                            <button onclick="views.openAddTaskModal('${programId}')" class="px-3 py-1.5 text-xs font-bold bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white rounded-xl transition shadow-sm flex items-center">
                                <i class="fa-solid fa-plus ml-1 text-[#D4A359]"></i> إضافة مهمة
                            </button>
                        `
                            : ""
                        }

                        <div class="flex items-center space-x-1 space-x-reverse">
                            <button onclick="changeWeek(-1)" class="px-2 py-1 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700">
                                <i class="fa-solid fa-chevron-right"></i>
                            </button>
                            <button onclick="changeWeek(0)" class="px-2.5 py-1 text-xs font-bold bg-teal-50 text-[#169BA2] rounded-xl border border-teal-200">
                                الحالي
                            </button>
                            <button onclick="changeWeek(1)" class="px-2 py-1 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700">
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
                        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-3.5 sm:p-5 space-y-3 w-full border-t-2 border-t-[#D4A359]">
                            <div class="flex justify-between items-center border-b border-slate-100 pb-2">
                                <div class="flex items-center space-x-2 space-x-reverse">
                                    <span class="w-2.5 h-2.5 rounded-full inline-block" style="background-color: ${prog.color};"></span>
                                    <h4 class="font-black text-[#0B2533] text-sm sm:text-base">${viewMode === "unified" ? "الجدول الشامل لجميع البرامج" : "برنامج " + prog.name}</h4>
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
                                                    <div class="text-[11px] font-black text-slate-800">${dayObj.ar}</div>
                                                    <div class="text-[8px] text-[#D4A359] font-bold mt-0.5">
                                                        ${dateInfo.hijri} هـ
                                                    </div>
                                                </div>

                                                <div class="p-1 min-h-[140px] flex flex-col justify-between space-y-1">
                                                    <div class="space-y-1">
                                                        ${dayEvents
                                                          .map(
                                                            (evt) => `
                                                            <div onclick="views.openEventDetailsModal('${evt.id}')" 
                                                                 class="event-compact-pill ${dayObj.pillColor}" 
                                                                 title="اضغط لمعاينة التفاصيل">
                                                                <div class="text-[10px] font-bold text-slate-800 line-clamp-1 leading-tight">${evt.title}</div>
                                                                <div class="text-[8px] text-slate-400 font-medium mt-0.5"><i class="fa-regular fa-clock ml-0.5"></i> ${evt.time}</div>
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
                                                                    <div class="text-[10px] font-bold text-slate-800 line-clamp-1 leading-tight">${tsk.title}</div>
                                                                    <div class="flex items-center justify-between text-[8px] text-slate-400 mt-0.5">
                                                                        <span>${tsk.startTime}</span>
                                                                        <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${supervisorColor};"></span>
                                                                    </div>
                                                                </div>
                                                            `;
                                                                })
                                                                .join("")
                                                            : dayTasks
                                                                .map(
                                                                  (stTask) => `
                                                            <div onclick="views.openTaskModal('${stTask.id}')" class="event-compact-pill pill-teal">
                                                                <div class="text-[10px] font-bold text-[#0B2533] line-clamp-1 leading-tight">${stTask.title}</div>
                                                                <div class="text-[8px] text-slate-400 mt-0.5">${stTask.startTime}</div>
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
                                                            <div class="text-center text-slate-300 text-[9px] py-6 font-medium">لا توجد مواعيد</div>
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
                                                                    <button onclick="views.openAttendanceModal('${evt.id}')" class="w-full bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white text-[8px] py-1 px-1 rounded-lg font-bold transition flex items-center justify-between shadow-xs">
                                                                        <span><i class="fa-solid fa-clipboard-user ml-0.5"></i> التحضير</span>
                                                                        <span class="bg-white/20 px-1 rounded text-[7px]">${unmarkedCount > 0 ? unmarkedCount : "✓"}</span>
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

  // 7. تفاصيل النشاط
  openEventDetailsModal(eventId) {
    const evt = db.schedules.find((s) => s.id === eventId);
    if (!evt) return;

    const program = db.programs.find((p) => p.id === evt.programId) || {};
    const isStudent = state.currentRole === "student";

    const modalHtml = `
            <div id="event-details-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in duration-150 border-t-4 border-t-[#D4A359]">
                    <div class="bg-[#0B2533] text-white p-4 sm:p-5 flex justify-between items-center border-b border-[#D4A359]">
                        <div>
                            <span class="bg-[#D4A359] text-[#0B2533] text-[10px] font-black px-2.5 py-0.5 rounded-full mb-1 inline-block">
                                برنامج ${program.name || "البرنامج"}
                            </span>
                            <h3 class="font-bold text-sm sm:text-base leading-snug">${evt.title}</h3>
                        </div>
                        <button onclick="closeModal('event-details-modal')" class="text-slate-300 hover:text-white text-lg mr-2"><i class="fa-solid fa-xmark"></i></button>
                    </div>

                    <div class="p-5 space-y-3.5 text-xs">
                        <div class="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                            <div>
                                <div class="text-slate-400 font-bold mb-0.5">نوع النشاط:</div>
                                <div class="font-bold text-[#0B2533]">${evt.typeLabel}</div>
                            </div>
                            <div>
                                <div class="text-slate-400 font-bold mb-0.5">التوقيت:</div>
                                <div class="font-bold text-[#169BA2]"><i class="fa-regular fa-clock ml-1"></i> ${evt.time}</div>
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
                                <span class="text-[#0B2533] font-bold">هذا الموعد يتطلب رصد تحضير:</span>
                                <button onclick="closeModal('event-details-modal'); views.openAttendanceModal('${evt.id}');" class="px-3 py-1.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-bold rounded-lg transition text-xs">
                                    فتح التحضير
                                </button>
                            </div>
                        `
                            : ""
                        }
                    </div>

                    <div class="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-end">
                        <button onclick="closeModal('event-details-modal')" class="px-4 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition text-xs">
                            إغلاق
                        </button>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
  },

  // 8. تفاصيل المهمة والتوكيل
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
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in duration-150 border-t-4 border-t-[#D4A359]">
                    
                    <div class="p-4 sm:p-5 text-white flex justify-between items-start" style="background-color: ${supervisorColor};">
                        <div>
                            <span class="bg-black/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 inline-block">
                                برنامج ${prog.name || "البرنامج"}
                            </span>
                            <h3 class="font-bold text-base sm:text-lg leading-snug">${task.title}</h3>
                        </div>
                        <button onclick="closeModal('task-modal')" class="text-white/80 hover:text-white text-xl mr-2">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <div class="p-5 space-y-3.5 text-xs">
                        <div class="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                            <div>
                                <div class="text-slate-400 font-bold mb-0.5">المسؤول:</div>
                                <div class="font-bold text-slate-800 text-xs flex items-center">
                                    <span class="w-2 h-2 rounded-full ml-1" style="background-color: ${supervisorColor};"></span>
                                    ${assignee.name || "غير محدد"}
                                </div>
                            </div>
                            <div>
                                <div class="text-slate-400 font-bold mb-0.5">النافذة الزمنية:</div>
                                <div class="font-bold text-[#0B2533] text-xs">
                                    <i class="fa-regular fa-clock ml-1 text-[#169BA2]"></i> ${task.startTime} - ${task.endTime}
                                </div>
                            </div>
                        </div>

                        <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                            <div class="flex justify-between items-center">
                                <span class="text-slate-500 font-bold">حالة التنفيذ:</span>
                                <span class="badge ${task.status === "مكتملة" ? "badge-completed" : task.status === "معفى بعذر" ? "badge-exempt" : "badge-pending"}">${task.status}</span>
                            </div>
                            <div class="flex justify-between items-center pt-1 border-t border-slate-100 text-[10px]">
                                <span class="text-slate-400 font-semibold">الوقت المتبقي:</span>
                                <span class="font-bold ${timeRemaining.isOverdue ? "text-rose-600" : "text-emerald-700"}">
                                    <i class="fa-solid fa-stopwatch ml-1"></i> ${timeRemaining.text}
                                </span>
                            </div>
                        </div>

                        <div>
                            <div class="text-slate-500 font-bold mb-1">تفاصيل وإرشادات المهمة:</div>
                            <p class="text-slate-700 bg-white p-3 rounded-xl border border-slate-100 leading-relaxed">${task.description || "لا توجد تفاصيل إضافية."}</p>
                        </div>

                        ${
                          canManage && !task.isExempt
                            ? `
                            <div class="pt-2 border-t border-slate-100">
                                <div class="text-slate-700 font-bold mb-1.5 flex items-center">
                                    <i class="fa-solid fa-user-plus text-[#169BA2] ml-1"></i> توكيل المهمة لمشرف آخر:
                                </div>
                                ${
                                  eligibleSupervisors.length > 0
                                    ? `
                                    <div class="flex gap-2">
                                        <select id="delegate-select" class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none focus:border-[#D4A359]">
                                            ${eligibleSupervisors.map((s) => `<option value="${s.id}">${s.name}</option>`).join("")}
                                        </select>
                                        <button onclick="delegateTask('${task.id}', document.getElementById('delegate-select').value)" class="px-3 py-1.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-bold rounded-xl transition text-xs">
                                            توكيل
                                        </button>
                                    </div>
                                `
                                    : `
                                    <p class="text-slate-400 text-[10px]">لا يوجد مشرفون آخرون مسجلون بنفس البرنامج للتوكيل.</p>
                                `
                                }
                            </div>
                        `
                            : ""
                        }

                        ${
                          isAdmin && !task.isExempt
                            ? `
                            <div class="pt-1 border-t border-slate-100">
                                <button onclick="const r = prompt('أدخل سبب الإعفاء الرسمي:'); if(r) exemptTask('${task.id}', r);" class="w-full py-2 bg-slate-100 hover:bg-amber-100 text-amber-800 font-bold rounded-xl transition border border-amber-200 flex items-center justify-center text-xs">
                                    <i class="fa-solid fa-shield-halved ml-1 text-amber-600"></i> منح إعفاء رسمي عن المهمة
                                </button>
                            </div>
                        `
                            : ""
                        }
                    </div>

                    <div class="bg-slate-50 px-5 py-3.5 border-t border-slate-100 flex justify-between items-center">
                        <button onclick="closeModal('task-modal')" class="px-4 py-1.5 text-slate-600 hover:bg-slate-200 font-bold rounded-xl transition text-xs">
                            إغلاق
                        </button>
                        ${
                          canManage && !task.isExempt
                            ? `
                            <button onclick="toggleTaskCompletion('${task.id}')" class="px-4 py-1.5 font-bold rounded-xl transition text-white text-xs ${task.status === "مكتملة" ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}">
                                ${task.status === "مكتملة" ? '<i class="fa-solid fa-rotate-left ml-1"></i> إعادة فتح' : '<i class="fa-solid fa-check ml-1"></i> إتمام المهمة'}
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

  // 9. إضافة وتكليف مهمة جديدة (قائمة الـ 29 للمدير فقط / إدخال يدوي مباشر للمشرف)
  openAddTaskModal(defaultProgramId) {
    const user = state.currentUser;
    const isAdmin = user.role === "admin";
    const availablePrograms = isAdmin
      ? db.programs
      : db.programs.filter((p) => (user.assignedPrograms || []).includes(p.id));
    const students = db.users.filter(
      (u) => u.role === "student" && !u.isRestricted,
    );
    const supervisors = db.users.filter(
      (u) => u.role === "supervisor" && !u.isRestricted,
    );
    const templates = db.taskTemplates || [];

    const modalHtml = `
            <div id="add-task-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden border-t-4 border-t-[#D4A359]">
                    <div class="bg-[#0B2533] text-white px-5 py-4 flex justify-between items-center border-b border-[#D4A359]">
                        <h3 class="font-bold text-sm sm:text-base flex items-center">
                            <i class="fa-solid fa-plus text-[#D4A359] ml-1.5"></i> إضافة وتكليف مهمة جديدة
                        </h3>
                        <button onclick="closeModal('add-task-modal')" class="text-slate-300 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
                    </div>

                    <form onsubmit="event.preventDefault(); views.handleTaskSubmit();" class="p-5 space-y-3 text-xs">
                        
                        ${
                          isAdmin
                            ? `
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">اختر المهمة من قائمة المعايير (29 معيار):</label>
                                <select id="task-template-select" onchange="views.handleTemplateSelectChange(this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:border-[#D4A359]">
                                    <option value="">-- اختر من قائمة المهام المعتمدة --</option>
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
                                <label class="block font-bold text-slate-700 mb-1">عنوان المهمة المخصصة:</label>
                                <input id="new-task-title" class="w-full bg-white border-2 border-[#D4A359] rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none" placeholder="اكتب نص المهمة...">
                            </div>
                        `
                            : `
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">عنوان المهمة (كتابة يدوية):</label>
                                <input id="new-task-title" required class="w-full bg-white border-2 border-[#D4A359] rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none" placeholder="اكتب نص المهمة هنا...">
                            </div>
                        `
                        }

                        <div class="grid grid-cols-2 gap-2.5">
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">البرنامج:</label>
                                <select id="new-task-prog" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-700">
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
                                <select id="new-task-assignee" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-700">
                                    ${
                                      isAdmin
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
                                <label class="block font-bold text-slate-700 mb-1">اليوم:</label>
                                <select id="new-task-day" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-700">
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
                                <input id="new-task-start" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium" placeholder="04:30 م">
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">إلى:</label>
                                <input id="new-task-end" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium" placeholder="06:00 م">
                            </div>
                        </div>

                        <div class="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 space-y-2">
                            <label class="flex items-center space-x-2 space-x-reverse font-bold text-slate-800 cursor-pointer">
                                <input type="checkbox" id="new-task-attendance" class="accent-[#D4A359]">
                                <span>تكليف المشرف بالتحضير في هذا اليوم (إلزامي)</span>
                            </label>

                            <label class="flex items-center space-x-2 space-x-reverse font-bold text-slate-800 cursor-pointer pt-1 border-t border-slate-200">
                                <input type="checkbox" id="new-task-recurring" onchange="document.getElementById('recurring-opts').classList.toggle('hidden')" class="accent-[#D4A359]">
                                <span>تكرار المهمة أسبوعياً</span>
                            </label>
                            <div id="recurring-opts" class="hidden pt-1.5">
                                <input type="date" id="new-task-stop-date" class="w-full bg-white border border-slate-300 rounded-xl p-1.5 font-bold text-slate-700">
                            </div>
                        </div>

                        <div>
                            <label class="block font-bold text-slate-700 mb-1">تعليمات إضافية:</label>
                            <textarea id="new-task-desc" rows="2" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#D4A359]" placeholder="اكتب التعليمات هنا..."></textarea>
                        </div>

                        <div class="pt-2 flex justify-end space-x-2 space-x-reverse">
                            <button type="button" onclick="closeModal('add-task-modal')" class="px-3 py-1.5 bg-slate-100 font-bold text-slate-600 rounded-xl">إلغاء</button>
                            <button type="submit" class="px-4 py-1.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-black rounded-xl transition shadow-sm">حفظ وجدولة</button>
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
    if (!customContainer || !customInput) return;

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
    const user = state.currentUser;
    const isAdmin = user.role === "admin";
    let finalTitle = "";

    if (isAdmin) {
      const templateSelectEl = document.getElementById("task-template-select");
      const templateSelect = templateSelectEl ? templateSelectEl.value : "";
      const customTitleEl = document.getElementById("new-task-title");
      const customTitle = customTitleEl ? customTitleEl.value : "";
      finalTitle =
        templateSelect === "__CUSTOM__"
          ? customTitle
          : templateSelect || customTitle;
    } else {
      const titleEl = document.getElementById("new-task-title");
      finalTitle = titleEl ? titleEl.value : "";
    }

    if (!finalTitle || finalTitle.trim() === "") {
      alert("يرجى كتابة عنوان المهمة!");
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

  // 10. شاشة إدارة الطلاب
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
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5 border-t-4 border-t-[#D4A359]">
                <div class="flex flex-col md:flex-row justify-between md:items-center gap-3 border-b border-slate-100 pb-3.5">
                    <div>
                        <h2 class="text-lg sm:text-xl font-extrabold text-[#0B2533] flex items-center">
                            <i class="fa-solid fa-user-graduate text-[#D4A359] ml-2"></i> إدارة الطلاب
                        </h2>
                    </div>

                    <div class="flex items-center space-x-2 space-x-reverse flex-wrap gap-y-2">
                        <label class="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center cursor-pointer">
                            <i class="fa-solid fa-file-excel ml-1"></i> استيراد من Excel / CSV
                            <input type="file" accept=".csv, .xlsx, .xls" class="hidden" onchange="handleStudentExcelImport(event)">
                        </label>
                        <button onclick="views.openAddStudentModal()" class="px-3 py-1.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center">
                            <i class="fa-solid fa-user-plus ml-1 text-[#D4A359]"></i> إضافة طالب
                        </button>
                    </div>
                </div>

                <div class="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-2.5">
                    <div class="relative flex-1 w-full">
                        <i class="fa-solid fa-magnifying-glass absolute right-3 top-2.5 text-slate-400 text-xs"></i>
                        <input id="student-search-input" onkeyup="views.filterStudentsList(this.value)" class="w-full bg-white border border-slate-200 rounded-xl pr-8 pl-3 py-1.5 text-xs font-medium focus:outline-none focus:border-[#D4A359]" placeholder="ابحث باسم الطالب أو رقم الجوال...">
                    </div>

                    <div class="flex items-center space-x-2 space-x-reverse w-full sm:w-auto">
                        <select id="quick-student-select" onchange="if(this.value) views.openEditStudentModal(this.value)" class="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#0B2533] focus:outline-none w-full sm:w-auto">
                            <option value="">-- تعديل مباشر لطالب --</option>
                            ${students.map((s) => `<option value="${s.id}">${s.name} (${getProgramName(s.currentProgramId)})</option>`).join("")}
                        </select>
                    </div>
                </div>

                ${
                  pendingEdits.length > 0
                    ? `
                    <div class="bg-purple-50/70 border border-purple-200 rounded-2xl p-3.5 space-y-2.5">
                        <h3 class="text-xs font-black text-[#2B1736] flex items-center">
                            <i class="fa-solid fa-user-pen ml-1.5 text-[#D4A359]"></i> طلبات تعديل بيانات مقدمة من الطلاب (${pendingEdits.length})
                        </h3>
                        <div class="space-y-1.5">
                            ${pendingEdits
                              .map(
                                (edit) => `
                                <div class="bg-white p-2.5 rounded-xl border border-purple-200 flex justify-between items-center text-xs">
                                    <div>
                                        <span class="font-bold text-slate-800">${edit.studentName}</span>
                                        <span class="text-slate-500 mr-2">جوال جديد: ${edit.newPhone}</span>
                                    </div>
                                    <div class="flex items-center space-x-1.5 space-x-reverse">
                                        <button onclick="approveProfileEdit('${edit.id}')" class="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg">اعتماد</button>
                                        <button onclick="rejectProfileEdit('${edit.id}')" class="px-2.5 py-1 bg-rose-100 text-rose-700 font-bold rounded-lg">رفض</button>
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

                <div class="space-y-2.5" id="students-cards-container">
                    ${students
                      .map(
                        (st) => `
                        <div class="student-item-card p-3 sm:p-4 rounded-2xl border ${st.isRestricted ? "border-rose-300 bg-rose-50/20" : "border-slate-200 bg-white"} flex flex-col md:flex-row justify-between md:items-center gap-3 transition hover:border-[#D4A359]">
                            <div class="flex items-center space-x-3 space-x-reverse">
                                <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl ${st.isRestricted ? "bg-rose-100 text-rose-700" : "bg-[#0B2533] text-[#D4A359]"} font-black flex items-center justify-center text-xs sm:text-sm shadow-xs border border-[#D4A359]/30">
                                    ${st.avatar}
                                </div>
                                <div>
                                    <div class="flex items-center space-x-1.5 space-x-reverse">
                                        <h4 class="font-black text-slate-800 text-xs sm:text-sm">${st.name}</h4>
                                        ${st.isRestricted ? '<span class="badge badge-restricted text-[9px]">مقيد</span>' : ""}
                                    </div>
                                    <div class="text-[11px] text-slate-500 mt-0.5">
                                        <span>جوال: ${st.phone || "غير مسجل"}</span> | 
                                        <span class="text-[#0B2533] font-bold">برنامج ${getProgramName(st.currentProgramId)}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="flex items-center space-x-1.5 space-x-reverse flex-wrap gap-y-1.5">
                                <button onclick="views.openStudentDetailsModal('${st.id}')" class="px-2.5 py-1 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white rounded-xl text-xs font-bold transition">
                                    معلومات الطالب
                                </button>
                                <button onclick="views.openEditStudentModal('${st.id}')" class="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition hover:bg-slate-200">
                                    <i class="fa-solid fa-pen-to-square"></i>
                                </button>
                                <button onclick="promoteStudent('${st.id}')" class="px-2 py-1 bg-amber-50 text-[#D4A359] border border-amber-200/60 rounded-xl text-[10px] font-bold transition hover:bg-amber-100">
                                    ترقية
                                </button>
                                <button onclick="toggleUserRestriction('${st.id}')" class="px-2 py-1 ${st.isRestricted ? "bg-emerald-100 text-emerald-800" : "bg-rose-50 text-rose-700"} rounded-xl text-[10px] font-bold transition">
                                    ${st.isRestricted ? "فك" : "تقييد"}
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

  // 11. معلومات الطالب
  openStudentDetailsModal(studentId) {
    const student = db.users.find((u) => u.id === studentId);
    if (!student) return;

    const program =
      db.programs.find((p) => p.id === student.currentProgramId) || {};
    const level = db.levels.find((l) => l.id === student.currentLevelId) || {};

    const modalHtml = `
            <div id="student-details-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in duration-150 border-t-4 border-t-[#D4A359]">
                    <div class="bg-[#0B2533] text-white p-4 sm:p-5 flex justify-between items-center border-b border-[#D4A359]">
                        <div class="flex items-center space-x-2.5 space-x-reverse">
                            <div class="w-9 h-9 rounded-full bg-white/10 text-[#D4A359] font-black flex items-center justify-center text-xs border border-[#D4A359]/30">
                                ${student.avatar}
                            </div>
                            <div>
                                <h3 class="font-bold text-sm leading-snug">${student.name}</h3>
                                <span class="text-[9px] text-[#D4A359] font-bold">${student.studentNumber}</span>
                            </div>
                        </div>
                        <button onclick="closeModal('student-details-modal')" class="text-slate-300 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                    </div>

                    <div class="p-5 space-y-3 text-xs">
                        <div class="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                            <div>
                                <div class="text-slate-400 font-bold mb-0.5">رقم جوال الطالب:</div>
                                <div class="font-bold text-slate-800">${student.phone || "غير مسجل"}</div>
                            </div>
                            <div>
                                <div class="text-slate-400 font-bold mb-0.5">رقم ولي الأمر:</div>
                                <div class="font-bold text-[#169BA2]">${student.fatherPhone || "غير مسجل"}</div>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                            <div>
                                <div class="text-slate-400 font-bold mb-0.5">البرنامج:</div>
                                <div class="font-bold text-[#0B2533]">${program.name || "غير محدد"}</div>
                            </div>
                            <div>
                                <div class="text-slate-400 font-bold mb-0.5">المستوى:</div>
                                <div class="font-bold text-[#D4A359]">${level.name || "المستوى الأول"}</div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-end">
                        <button onclick="closeModal('student-details-modal')" class="px-4 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-300">
                            إغلاق
                        </button>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
  },

  // 12. تعديل طالب
  openEditStudentModal(studentId) {
    const student = db.users.find((u) => u.id === studentId);
    if (!student) return;

    const modalHtml = `
            <div id="edit-student-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden border-t-4 border-t-[#D4A359]">
                    <div class="bg-[#0B2533] text-white px-5 py-4 flex justify-between items-center border-b border-[#D4A359]">
                        <h3 class="font-bold text-sm flex items-center">
                            <i class="fa-solid fa-user-pen text-[#D4A359] ml-1.5"></i> تعديل بيانات الطالب
                        </h3>
                        <button onclick="closeModal('edit-student-modal')" class="text-slate-300 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                    </div>

                    <form onsubmit="event.preventDefault(); views.handleEditStudentSubmit('${student.id}');" class="p-5 space-y-3 text-xs">
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">اسم الطالب:</label>
                            <input id="edit-stu-name" value="${student.name}" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:outline-none focus:border-[#D4A359]">
                        </div>

                        <div class="grid grid-cols-2 gap-2.5">
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">رقم الجوال:</label>
                                <input id="edit-stu-phone" value="${student.phone || ""}" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#D4A359]">
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">جوال ولي الأمر:</label>
                                <input id="edit-stu-father-phone" value="${student.fatherPhone || ""}" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#D4A359]">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-2.5">
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">البرنامج:</label>
                                <select id="edit-stu-prog" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-700 focus:outline-none focus:border-[#D4A359]">
                                    ${db.programs.map((p) => `<option value="${p.id}" ${p.id === student.currentProgramId ? "selected" : ""}>${p.name}</option>`).join("")}
                                </select>
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">كلمة المرور:</label>
                                <input id="edit-stu-pass" value="${student.password || "1234"}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:outline-none focus:border-[#D4A359]">
                            </div>
                        </div>

                        <div class="pt-2 flex justify-end space-x-2 space-x-reverse">
                            <button type="button" onclick="closeModal('edit-student-modal')" class="px-3 py-1.5 bg-slate-100 font-bold text-slate-600 rounded-xl">إلغاء</button>
                            <button type="submit" class="px-4 py-1.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-bold rounded-xl transition shadow-xs">حفظ</button>
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

  // 13. إضافة طالب يدوياً
  openAddStudentModal() {
    const modalHtml = `
            <div id="add-student-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden border-t-4 border-t-[#D4A359]">
                    <div class="bg-[#0B2533] text-white px-5 py-4 flex justify-between items-center border-b border-[#D4A359]">
                        <h3 class="font-bold text-sm flex items-center">
                            <i class="fa-solid fa-user-plus text-[#D4A359] ml-1.5"></i> تسجيل طالب جديد
                        </h3>
                        <button onclick="closeModal('add-student-modal')" class="text-slate-300 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                    </div>

                    <form onsubmit="event.preventDefault(); views.handleStudentSubmit();" class="p-5 space-y-3 text-xs">
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">اسم الطالب رباعياً:</label>
                            <input id="new-stu-name" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#D4A359]">
                        </div>

                        <div class="grid grid-cols-2 gap-2.5">
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">رقم الجوال:</label>
                                <input id="new-stu-phone" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#D4A359]" placeholder="05xxxxxxxx">
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">جوال ولي الأمر:</label>
                                <input id="new-stu-father-phone" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#D4A359]" placeholder="05xxxxxxxx">
                            </div>
                        </div>

                        <div>
                            <label class="block font-bold text-slate-700 mb-1">البرنامج:</label>
                            <select id="new-stu-prog" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-700 focus:outline-none focus:border-[#D4A359]">
                                ${db.programs.map((p) => `<option value="${p.id}">${p.name}</option>`).join("")}
                            </select>
                        </div>

                        <div pt-2 flex justify-end space-x-2 space-x-reverse>
                            <button type="button" onclick="closeModal('add-student-modal')" class="px-3 py-1.5 bg-slate-100 font-bold text-slate-600 rounded-xl">إلغاء</button>
                            <button type="submit" class="px-4 py-1.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-bold rounded-xl transition shadow-xs">حفظ واعتماد</button>
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

    addNewStudent({ name, phone, fatherPhone, currentProgramId });
  },

  // 14. شاشة إدارة المشرفين
  renderAdminSupervisorsView() {
    const supervisors = db.users.filter((u) => u.role === "supervisor");

    return `
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5 border-t-4 border-t-[#D4A359]">
                <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3.5">
                    <div>
                        <h2 class="text-lg sm:text-xl font-extrabold text-[#0B2533]"><i class="fa-solid fa-user-tie text-[#D4A359] ml-2"></i> إدارة المشرفين</h2>
                    </div>

                    ${
                      state.currentRole === "admin"
                        ? `
                        <div class="flex items-center space-x-2 space-x-reverse flex-wrap gap-y-2">
                            <label class="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center cursor-pointer">
                                <i class="fa-solid fa-file-excel ml-1"></i> استيراد من Excel / CSV
                                <input type="file" accept=".csv, .xlsx, .xls" class="hidden" onchange="handleSupervisorExcelImport(event)">
                            </label>
                            <button onclick="views.openAddSupervisorModal()" class="px-3 py-1.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center">
                                <i class="fa-solid fa-user-plus ml-1 text-[#D4A359]"></i> إضافة مشرف
                            </button>
                        </div>
                    `
                        : ""
                    }
                </div>

                <div class="space-y-2.5">
                    ${supervisors
                      .map(
                        (sp) => `
                        <div class="p-3 sm:p-4 rounded-2xl border ${sp.isRestricted ? "border-rose-300 bg-rose-50/20" : "border-slate-200 bg-white"} flex flex-col md:flex-row justify-between md:items-center gap-3 hover:border-[#D4A359] transition">
                            <div class="flex items-center space-x-3 space-x-reverse">
                                <div class="w-9 h-9 rounded-2xl font-bold text-white flex items-center justify-center shadow-xs" style="background-color: ${sp.color};">
                                    ${sp.avatar}
                                </div>
                                <div>
                                    <div class="flex items-center space-x-1.5 space-x-reverse">
                                        <h4 class="font-bold text-slate-800 text-xs sm:text-sm">${sp.name}</h4>
                                        ${sp.isRestricted ? '<span class="badge badge-restricted text-[9px]">مقيد</span>' : ""}
                                    </div>
                                    <div class="text-[11px] text-slate-500 mt-0.5">
                                        <span>جوال: ${sp.phone || "غير مسجل"}</span> | 
                                        <span>البرامج: ${(sp.assignedPrograms || []).map((p) => getProgramName(p)).join("، ")}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center space-x-1.5 space-x-reverse">
                                <button onclick="toggleUserRestriction('${sp.id}')" class="px-2.5 py-1 ${sp.isRestricted ? "bg-emerald-100 text-emerald-800" : "bg-rose-50 text-rose-700"} rounded-xl text-xs font-bold transition">
                                    ${sp.isRestricted ? "فك" : "تقييد"}
                                </button>
                                <button onclick="deleteSupervisor('${sp.id}')" class="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition">
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
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden border-t-4 border-t-[#D4A359]">
                    <div class="bg-[#0B2533] text-white px-5 py-4 flex justify-between items-center border-b border-[#D4A359]">
                        <h3 class="font-bold text-sm flex items-center">
                            <i class="fa-solid fa-user-plus text-[#D4A359] ml-1.5"></i> إضافة مشرف جديد
                        </h3>
                        <button onclick="closeModal('add-supervisor-modal')" class="text-slate-300 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                    </div>

                    <form onsubmit="event.preventDefault(); views.handleSupervisorSubmit();" class="p-5 space-y-3 text-xs">
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">اسم المشرف:</label>
                            <input id="new-sup-name" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#D4A359]">
                        </div>

                        <div>
                            <label class="block font-bold text-slate-700 mb-1">رقم الجوال:</label>
                            <input id="new-sup-phone" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#D4A359]" placeholder="05xxxxxxxx">
                        </div>

                        <div>
                            <label class="block font-bold text-slate-700 mb-1">البرامج المسندة:</label>
                            <div class="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                ${db.programs
                                  .map(
                                    (p) => `
                                    <label class="flex items-center space-x-1.5 space-x-reverse text-xs font-bold text-slate-700 cursor-pointer">
                                        <input type="checkbox" name="sup-progs" value="${p.id}" class="accent-[#D4A359]">
                                        <span>${p.name}</span>
                                    </label>
                                `,
                                  )
                                  .join("")}
                            </div>
                        </div>

                        <div class="pt-2 flex justify-end space-x-2 space-x-reverse">
                            <button type="button" onclick="closeModal('add-supervisor-modal')" class="px-3 py-1.5 bg-slate-100 font-bold text-slate-600 rounded-xl">إلغاء</button>
                            <button type="submit" class="px-4 py-1.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-bold rounded-xl transition shadow-xs">حفظ</button>
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
      alert("يرجى اختيار برنامج واحد على الأقل!");
      return;
    }

    addNewSupervisor({ name, phone, assignedPrograms });
  },

  // 15. مودال التحضير الذكي (التحضير المتعدد والغياب التلقائي للبقية)
  openAttendanceModal(scheduleId) {
    const schedule = db.schedules.find((s) => s.id === scheduleId);
    if (!schedule) return;

    const user = state.currentUser;
    if (
      user.role === "supervisor" &&
      !(user.assignedPrograms || []).includes(schedule.programId)
    ) {
      alert("غير مصرح لك برصد حضور هذا البرنامج!");
      return;
    }

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
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full overflow-hidden animate-in fade-in duration-150 border-t-4 border-t-[#D4A359]">
                    
                    <div class="bg-[#0B2533] text-white p-4 sm:p-5 flex justify-between items-center border-b border-[#D4A359]">
                        <div>
                            <span class="bg-[#D4A359] text-[#0B2533] text-[10px] font-black px-2.5 py-0.5 rounded-full mb-1 inline-block">
                                برنامج ${program.name || "البرنامج"}
                            </span>
                            <h3 class="font-bold text-sm sm:text-base leading-snug">${schedule.title}</h3>
                        </div>
                        <button onclick="closeModal('attendance-modal')" class="text-slate-300 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                    </div>

                    <div class="p-4 sm:p-5 space-y-3.5 text-xs">
                        <div class="flex justify-between items-center bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                            <div>
                                <span class="text-slate-500 font-bold">الطلاب:</span>
                                <span class="font-bold text-[#0B2533] mr-1">${students.length} طالب</span>
                            </div>
                            <div id="unmarked-badge-container">
                                <span class="badge ${unmarkedCount > 0 ? "badge-overdue" : "badge-completed"}">
                                    ${unmarkedCount > 0 ? `متبقي ${unmarkedCount}` : "مكتمل ✓"}
                                </span>
                            </div>
                        </div>

                        <!-- شريط التحضير الجماعي السريع -->
                        <div class="bg-teal-50/60 border border-teal-200/80 p-2.5 rounded-2xl space-y-2">
                            <div class="flex items-center justify-between">
                                <label class="flex items-center space-x-1.5 space-x-reverse font-bold text-slate-700 cursor-pointer">
                                    <input type="checkbox" id="select-all-attendance" onchange="toggleSelectAllAttendance(this)" class="accent-[#D4A359]">
                                    <span>تحديد الكل</span>
                                </label>
                                <span class="text-[10px] text-slate-500 font-bold">تحضير جماعي للمحددين:</span>
                            </div>

                            <div class="flex items-center gap-1.5 flex-wrap">
                                <button onclick="bulkRecordAttendance('${scheduleId}', 'حاضر')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] transition shadow-xs">
                                    ✓ حاضر
                                </button>
                                <button onclick="bulkRecordAttendance('${scheduleId}', 'غائب')" class="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[10px] transition shadow-xs">
                                    ✗ غائب
                                </button>
                                <button onclick="bulkRecordAttendance('${scheduleId}', 'متأخر')" class="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] transition shadow-xs">
                                    ⏱ متأخر
                                </button>
                                <button onclick="bulkRecordAttendance('${scheduleId}', 'مستأذن')" class="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-[10px] transition shadow-xs">
                                    ✉ مستأذن
                                </button>
                            </div>
                        </div>

                        <div class="space-y-2 max-h-60 overflow-y-auto pr-1" id="attendance-students-list">
                            ${students
                              .map((st) => {
                                const currentStatus =
                                  getStudentAttendanceStatus(scheduleId, st.id);
                                return `
                                    <div class="flex items-center justify-between p-2.5 bg-white rounded-2xl border border-slate-200 hover:border-[#D4A359] transition">
                                        <div class="flex items-center space-x-2.5 space-x-reverse">
                                            <input type="checkbox" value="${st.id}" class="stu-att-checkbox accent-[#D4A359]">
                                            <div class="w-7 h-7 rounded-full bg-[#0B2533] text-[#D4A359] font-bold flex items-center justify-center text-[11px] border border-[#D4A359]/30">
                                                ${st.avatar}
                                            </div>
                                            <div class="font-bold text-slate-800 text-xs">${st.name}</div>
                                        </div>

                                        <select onchange="recordAttendance('${scheduleId}', '${st.id}', this.value)" 
                                                class="bg-slate-50 border border-slate-300 font-bold text-[11px] rounded-xl px-2 py-1 focus:outline-none focus:border-[#D4A359]">
                                            <option value="غير محدد" ${currentStatus === "غير محدد" ? "selected" : ""}>-- غير مرصود --</option>
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

                    <div class="bg-slate-50 px-4 sm:px-5 py-3 border-t border-slate-100 flex justify-between items-center gap-2">
                        <button onclick="markRemainingAbsent('${scheduleId}')" class="text-rose-700 hover:text-rose-900 font-bold text-[11px]">
                            <i class="fa-solid fa-user-xmark ml-0.5"></i> احتساب البقية غائبين
                        </button>

                        <button onclick="closeModal('attendance-modal')" class="px-4 py-1.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-bold rounded-xl text-xs shadow-xs transition">
                            حفظ وإغلاق
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
                    ${unmarkedCount > 0 ? `متبقي ${unmarkedCount}` : "مكتمل ✓"}
                </span>
            `;
    }
  },

  // 16. الإعدادات
  renderSettingsView() {
    const user = state.currentUser;
    const isStudent = user.role === "student";

    return `
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5 border-t-4 border-t-[#D4A359]">
                <div class="border-b border-slate-100 pb-3">
                    <h2 class="text-lg font-extrabold text-[#0B2533]"><i class="fa-solid fa-gear text-[#D4A359] ml-1.5"></i> إعدادات الحساب</h2>
                </div>

                <div class="max-w-xl space-y-3.5 text-xs">
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">الاسم:</label>
                        <input id="set-user-name" value="${user.name}" ${isStudent ? "disabled" : ""} class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:outline-none focus:border-[#D4A359]">
                    </div>

                    <div>
                        <label class="block font-bold text-slate-700 mb-1">رقم الجوال:</label>
                        <input id="set-user-phone" value="${user.phone || "0500000000"}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#D4A359]">
                    </div>

                    <div>
                        <label class="block font-bold text-slate-700 mb-1">البريد الإلكتروني:</label>
                        <input id="set-user-email" value="${user.email || ""}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#D4A359]">
                    </div>

                    <div class="pt-2">
                        <button onclick="updateProfile()" class="px-5 py-2 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-bold rounded-xl transition shadow-xs">
                            ${isStudent ? "إرسال طلب التعديل للاعتماد" : "حفظ التعديلات"}
                        </button>
                    </div>
                </div>
            </div>
        `;
  },

  // 17. إرسال الإشعارات
  openSendNotifModal() {
    const user = state.currentUser;
    const isAdmin = user.role === "admin";

    const modalHtml = `
            <div id="send-notif-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden border-t-4 border-t-[#D4A359]">
                    <div class="bg-[#0B2533] text-white px-5 py-4 flex justify-between items-center border-b border-[#D4A359]">
                        <h3 class="font-bold text-sm flex items-center">
                            <i class="fa-regular fa-paper-plane text-[#D4A359] ml-1.5"></i> ${isAdmin ? "إرسال إشعار موجه" : "مراسلة الإدارة"}
                        </h3>
                        <button onclick="closeModal('send-notif-modal')" class="text-slate-300 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                    </div>

                    <form onsubmit="event.preventDefault(); views.handleNotifSubmit();" class="p-5 space-y-3 text-xs">
                        ${
                          isAdmin
                            ? `
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">الجهة المستهدفة:</label>
                                <select id="notif-target-type" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-700 focus:outline-none focus:border-[#D4A359]">
                                    <option value="all">الجميع (كافة البرامج)</option>
                                    <option value="supervisors">جميع المشرفين فقط</option>
                                    <option value="prog_taseel">طلاب برنامج تأصيل</option>
                                    <option value="prog_rasookh">طلاب برنامج رسوخ</option>
                                    <option value="prog_taheel">طلاب برنامج تأهيل</option>
                                </select>
                            </div>
                        `
                            : ""
                        }

                        <div>
                            <label class="block font-bold text-slate-700 mb-1">العنوان:</label>
                            <input id="notif-title" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#D4A359]" placeholder="عنوان موجز">
                        </div>

                        <div>
                            <label class="block font-bold text-slate-700 mb-1">نص الرسالة:</label>
                            <textarea id="notif-msg" required rows="3" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#D4A359]" placeholder="اكتب الرسالة..."></textarea>
                        </div>

                        <div class="pt-2 flex justify-end space-x-2 space-x-reverse">
                            <button type="button" onclick="closeModal('send-notif-modal')" class="px-3 py-1.5 bg-slate-100 font-bold text-slate-600 rounded-xl">إلغاء</button>
                            <button type="submit" class="px-4 py-1.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-bold rounded-xl transition shadow-xs">إرسال</button>
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
            <div class="space-y-4 sm:space-y-6">
                <div class="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center border-t-4 border-t-[#D4A359]">
                    <div>
                        <h2 class="text-base sm:text-xl font-bold text-[#0B2533]">مرحباً بك، ${supervisor.name}</h2>
                        <p class="text-xs text-slate-500 mt-0.5">المشرف على: ${(supervisor.assignedPrograms || []).map((p) => getProgramName(p)).join("، ")}</p>
                    </div>
                    <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-white font-bold shadow-xs" style="background-color: ${supervisor.color};">
                        ${supervisor.avatar}
                    </div>
                </div>

                <div class="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm border-t-2 border-t-[#D4A359]">
                    <div class="flex justify-between items-center mb-3">
                        <h3 class="text-sm sm:text-base font-bold text-[#0B2533]"><i class="fa-solid fa-list-check text-[#D4A359] ml-1.5"></i> مهامك المكلف بها</h3>
                        <button onclick="views.openAddTaskModal('${supervisor.assignedPrograms[0]}')" class="text-xs text-[#0B2533] font-bold hover:text-[#D4A359]">
                            + إضافة مهمة
                        </button>
                    </div>
                    <div class="space-y-2">
                        ${
                          myTasks.length === 0
                            ? '<div class="text-slate-400 text-xs text-center py-3">لا توجد مهام مكلف بها حالياً</div>'
                            : myTasks
                                .map(
                                  (t) => `
                            <div onclick="views.openTaskModal('${t.id}')" class="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 cursor-pointer transition">
                                <div>
                                    <div class="text-xs sm:text-sm font-bold text-slate-800">${t.title}</div>
                                    <div class="text-[10px] text-slate-500 mt-0.5">${t.startTime} - ${t.endTime} | ${getProgramName(t.programId)}</div>
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

  // 19. سجلات التحضير (مقيدة للمشرف ببرامجه فقط)
  renderAttendanceManagementView() {
    const user = state.currentUser;
    const isSupervisor = user.role === "supervisor";
    const userPrograms = isSupervisor ? user.assignedPrograms || [] : [];

    const attendanceSchedules = db.schedules.filter((s) => {
      if (!s.requiresAttendance) return false;
      if (isSupervisor) return userPrograms.includes(s.programId);
      return true;
    });

    return `
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6 border-t-4 border-t-[#D4A359]">
                <div class="border-b border-slate-100 pb-3">
                    <h2 class="text-lg sm:text-xl font-bold text-[#0B2533]"><i class="fa-solid fa-clipboard-user text-[#D4A359] ml-2"></i> سجلات الحضور والتحضير</h2>
                </div>

                <div class="space-y-2.5">
                    ${
                      attendanceSchedules.length === 0
                        ? `
                        <div class="text-center py-8 text-slate-400 text-xs font-bold">لا توجد جلسات تحضير مسندة إليك حالياً</div>
                    `
                        : attendanceSchedules
                            .map((sch) => {
                              const unmarked = getUnmarkedAttendanceCount(
                                sch.id,
                                sch.programId,
                              );
                              return `
                            <div class="p-3.5 rounded-2xl border border-slate-200 bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:border-[#D4A359] transition">
                                <div>
                                    <div class="font-bold text-slate-800 text-xs sm:text-sm">${sch.title}</div>
                                    <div class="text-[11px] text-slate-500 mt-0.5">برنامج ${getProgramName(sch.programId)} | ${sch.time}</div>
                                </div>
                                <div class="flex items-center space-x-2 space-x-reverse">
                                    <span class="badge ${unmarked > 0 ? "badge-overdue" : "badge-completed"}">
                                        ${unmarked > 0 ? `متبقي ${unmarked}` : "مكتمل"}
                                    </span>
                                    <button onclick="views.openAttendanceModal('${sch.id}')" class="px-3 py-1.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-bold text-xs rounded-xl transition">
                                        فتح التحضير
                                    </button>
                                </div>
                            </div>
                        `;
                            })
                            .join("")
                    }
                </div>
            </div>
        `;
  },

  // 20. مركز المهام
  renderTasksView(user) {
    const tasksList = getVisibleTasks(user);

    return `
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6 border-t-4 border-t-[#D4A359]">
                <div class="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h2 class="text-lg sm:text-xl font-bold text-[#0B2533]"><i class="fa-solid fa-list-check text-[#D4A359] ml-2"></i> مركز المهام والعمليات</h2>
                    ${
                      user.role !== "student"
                        ? `
                        <button onclick="views.openAddTaskModal()" class="px-3.5 py-1.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center">
                            <i class="fa-solid fa-plus ml-1 text-[#D4A359]"></i> إضافة مهمة
                        </button>
                    `
                        : ""
                    }
                </div>

                <div class="space-y-2.5">
                    ${tasksList
                      .map((t) => {
                        const supervisorColor = getUserColor(t.assignedTo);
                        return `
                            <div onclick="views.openTaskModal('${t.id}')" class="p-3.5 rounded-2xl border border-slate-200 hover:border-[#D4A359] transition bg-white flex flex-col md:flex-row justify-between md:items-center gap-3 cursor-pointer">
                                <div>
                                    <div class="flex items-center space-x-2 space-x-reverse mb-0.5">
                                        <span class="text-[10px] font-bold text-white px-2 py-0.5 rounded-lg" style="background-color: ${supervisorColor};">
                                            ${getUserName(t.assignedTo)}
                                        </span>
                                        <h4 class="font-bold text-slate-800 text-xs sm:text-sm">${t.title}</h4>
                                    </div>
                                    <p class="text-xs text-slate-500">${t.description}</p>
                                    <div class="text-[10px] text-slate-400 mt-1">
                                        <i class="fa-regular fa-clock ml-1"></i> ${t.startTime} - ${t.endTime} | برنامج ${getProgramName(t.programId)}
                                    </div>
                                </div>
                                <span class="badge ${t.status === "مكتملة" ? "badge-completed" : t.status === "معفى بعذر" ? "badge-exempt" : "badge-pending"}">
                                    ${t.status}
                                </span>
                            </div>
                        `;
                      })
                      .join("")}
                </div>
            </div>
        `;
  },

  // 21. لوحة الإعلانات
  renderAnnouncementsView() {
    const announcements = db.announcements || [];
    const canPublish =
      state.currentRole === "admin" || state.currentRole === "supervisor";

    return `
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5 border-t-4 border-t-[#D4A359]">
                <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
                    <h2 class="text-lg sm:text-xl font-extrabold text-[#0B2533] flex items-center">
                        <i class="fa-solid fa-bullhorn text-[#D4A359] ml-2"></i> لوحة الإعلانات
                    </h2>
                    ${
                      canPublish
                        ? `
                        <button onclick="views.openAddAnnouncementModal()" class="px-3.5 py-1.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center">
                            <i class="fa-solid fa-plus ml-1 text-[#D4A359]"></i> نشر إعلان
                        </button>
                    `
                        : ""
                    }
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${
                      announcements.length === 0
                        ? '<div class="col-span-2 text-center py-8 text-slate-400 text-xs">لا توجد إعلانات منشورة حالياً</div>'
                        : announcements
                            .map(
                              (anc) => `
                        <div class="p-4 rounded-2xl border ${anc.priority === "عاجل" ? "border-rose-200 bg-rose-50/20" : "border-slate-200 bg-white"} shadow-xs space-y-2.5">
                            <div class="flex justify-between items-start">
                                <div class="flex items-center space-x-1.5 space-x-reverse">
                                    <span class="badge ${anc.priority === "عاجل" ? "badge-overdue" : "badge-active"}">${anc.priority}</span>
                                    <h3 class="font-extrabold text-slate-800 text-xs sm:text-sm">${anc.title}</h3>
                                </div>
                                <span class="text-[9px] text-slate-400 font-bold">${anc.date}</span>
                            </div>
                            <p class="text-xs text-slate-600 leading-relaxed whitespace-pre-line">${anc.content}</p>
                        </div>
                    `,
                            )
                            .join("")
                    }
                </div>
            </div>
        `;
  },

  // 22. نافذة إضافة إعلان
  openAddAnnouncementModal() {
    const modalHtml = `
            <div id="add-announcement-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden border-t-4 border-t-[#D4A359]">
                    <div class="bg-[#0B2533] text-white px-5 py-4 flex justify-between items-center border-b border-[#D4A359]">
                        <h3 class="font-bold text-sm flex items-center">
                            <i class="fa-solid fa-bullhorn text-[#D4A359] ml-1.5"></i> نشر إعلان جديد
                        </h3>
                        <button onclick="closeModal('add-announcement-modal')" class="text-slate-300 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                    </div>

                    <form onsubmit="event.preventDefault(); views.handleAnnouncementSubmit();" class="p-5 space-y-3 text-xs">
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">عنوان الإعلان:</label>
                            <input id="new-anc-title" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:outline-none focus:border-[#D4A359]" placeholder="عنوان موجز">
                        </div>

                        <div class="grid grid-cols-2 gap-2.5">
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">البرنامج المستهدف:</label>
                                <select id="new-anc-target" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-700 focus:outline-none focus:border-[#D4A359]">
                                    <option value="all">الجميع (كافة البرامج)</option>
                                    <option value="supervisors">جميع المشرفين</option>
                                    <option value="prog_taseel">طلاب برنامج تأصيل</option>
                                    <option value="prog_rasookh">طلاب برنامج رسوخ</option>
                                    <option value="prog_taheel">طلاب برنامج تأهيل</option>
                                </select>
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">الأهمية:</label>
                                <select id="new-anc-priority" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-700 focus:outline-none focus:border-[#D4A359]">
                                    <option value="عادي">عادي</option>
                                    <option value="عاجل">عاجل</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label class="block font-bold text-slate-700 mb-1">نص الإعلان:</label>
                            <textarea id="new-anc-content" required rows="3" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#D4A359]" placeholder="اكتب نص الإعلان..."></textarea>
                        </div>

                        <div class="pt-2 flex justify-end space-x-2 space-x-reverse">
                            <button type="button" onclick="closeModal('add-announcement-modal')" class="px-3 py-1.5 bg-slate-100 font-bold text-slate-600 rounded-xl">إلغاء</button>
                            <button type="submit" class="px-4 py-1.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-bold rounded-xl transition shadow-xs">نشر</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
  },

  handleAnnouncementSubmit() {
    const title = document.getElementById("new-anc-title").value;
    const content = document.getElementById("new-anc-content").value;
    const targetGroup = document.getElementById("new-anc-target").value;
    const priority = document.getElementById("new-anc-priority").value;

    addNewAnnouncement({
      title,
      content,
      targetGroup,
      priority,
      mediaType: "none",
      mediaUrl: "",
    });
  },
};
