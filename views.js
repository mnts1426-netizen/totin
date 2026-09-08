/**
 * views.js - محرك بناء الواجهات الديناميكية المعتمد
 * يتضمن:
 * 1. بطاقات الطلاب الصغيرة القابلة للطباعة المباشرة مع الباركود الأكاديمي.
 * 2. شريط عائم لتثبيت المنصة كتطبيق (PWA) وتفعيل الإشعارات الفورية بعد الدخول.
 * 3. شاشة "التحضير السريع والمباشر" المستقلة مع الرصد بالباركود والعمليات الجماعية.
 * 4. حصر التحضير للمشرف على برامجه المسندة فقط، وتخصيص إدخال المهام له يدوياً (الـ 29 معياراً للمدير فقط).
 * 5. توحيد مسمى (برنامج) في كامل أرجاء النظام مع الحفاظ على الهوية الأكاديمية الفخمة.
 */

window.views = {
  // 1. القائمة الجانبية الموجهة بالصلاحيات مع إضافة رابط التحضير السريع
  renderSidebar(role) {
    const nav = document.getElementById("sidebar-nav");
    if (!nav) return;

    let links = [];

    if (role === "admin") {
      links = [
        { id: "home", icon: "fa-house", color: "#D4A359", label: "الرئيسية" },
        {
          id: "quick-attendance",
          icon: "fa-qrcode",
          color: "#169BA2",
          label: "التحضير السريع (باركود)",
        },
        {
          id: "schedule",
          icon: "fa-calendar-week",
          color: "#169BA2",
          label: "الجدول والعمليات",
        },
        {
          id: "tasks",
          icon: "fa-list-check",
          color: "#8AA838",
          label: "المهام والتكليفات",
        },
        {
          id: "students",
          icon: "fa-user-graduate",
          color: "#D4A359",
          label: "إدارة الطلاب والبطاقات",
        },
        {
          id: "supervisors",
          icon: "fa-user-tie",
          color: "#E59824",
          label: "المشرفون والإداريون",
        },
        {
          id: "attendance",
          icon: "fa-clipboard-user",
          color: "#9E1B48",
          label: "سجلات التحضير",
        },
        {
          id: "day-review",
          icon: "fa-calendar-day",
          color: "#0B2533",
          label: "مراجعة يوم محدد",
        },
        {
          id: "schedule-manage",
          icon: "fa-calendar-plus",
          color: "#169BA2",
          label: "إدارة الجلسات",
        },
        {
          id: "excuses",
          icon: "fa-file-circle-check",
          color: "#8AA838",
          label: "الاستئذانات",
        },
        {
          id: "term-manage",
          icon: "fa-graduation-cap",
          color: "#9E1B48",
          label: "الفصل الدراسي",
        },
        {
          id: "audit-log",
          icon: "fa-clock-rotate-left",
          color: "#64748B",
          label: "سجل العمليات",
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
          id: "quick-attendance",
          icon: "fa-qrcode",
          color: "#169BA2",
          label: "التحضير السريع (باركود)",
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
          label: "مهامي المباشرة",
        },
        {
          id: "students",
          icon: "fa-user-graduate",
          color: "#D4A359",
          label: "طلابي والبطاقات",
        },
        {
          id: "attendance",
          icon: "fa-clipboard-user",
          color: "#9E1B48",
          label: "رصد الحضور",
        },
        {
          id: "excuses",
          icon: "fa-file-circle-check",
          color: "#8AA838",
          label: "الاستئذانات",
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
          id: "my-report",
          icon: "fa-chart-simple",
          color: "#9E1B48",
          label: "تقريري",
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
    // في رابط الطلاب الخاص ببرنامج محدد لا يُعرض إلا ذلك البرنامج، وفي غيره تُعرض كل البرامج
    const visiblePrograms =
      state.portalMode === "student" && state.lockedProgramId
        ? db.programs.filter((p) => p.id === state.lockedProgramId)
        : db.programs;

    const modeNote =
      state.portalMode === "staff"
        ? "بوابة المشرفين والإدارة — اختر البرنامج الذي تريد الدخول إليه"
        : state.portalMode === "student"
          ? "بوابة الطلاب — الدخول إلى برنامجك"
          : "اختر البرنامج للمتابعة";

    return `
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8 max-w-4xl mx-auto my-4 sm:my-8 border-t-4 border-t-[#D4A359]">
                <div class="text-center mb-5 sm:mb-7">
                    <p class="text-xs sm:text-sm font-bold text-slate-500">${modeNote}</p>
                </div>
                <div class="grid grid-cols-1 ${visiblePrograms.length === 1 ? "max-w-sm mx-auto" : "md:grid-cols-3"} gap-5">
                    ${visiblePrograms
                      .map((prog) => {
                        const closed = !!prog.isClosed;
                        return `
                        <div class="rounded-3xl border-2 ${closed ? "border-slate-200 bg-slate-50/60" : "border-slate-200 hover:border-[#D4A359] bg-white hover:shadow-md"} p-6 sm:p-8 flex flex-col justify-between space-y-6 transition-all text-center relative overflow-hidden group">
                            <div class="absolute top-0 left-0 right-0 h-1 ${closed ? "bg-slate-300" : "bg-[#D4A359]/40 group-hover:bg-[#D4A359]"} transition-all"></div>
                            <div class="py-4">
                                <h3 class="text-2xl sm:text-3xl font-black ${closed ? "text-slate-400" : "text-[#0B2533]"} mb-2">${prog.name}</h3>
                                <div class="w-10 h-1 ${closed ? "bg-slate-300" : "bg-[#D4A359]"} rounded-full mx-auto"></div>
                                ${
                                  closed
                                    ? `<div class="mt-3 inline-flex items-center gap-1.5 bg-slate-200 text-slate-600 text-[11px] font-black px-3 py-1 rounded-full">
                                        <i class="fa-solid fa-lock text-[10px]"></i> البرنامج مغلق حالياً
                                       </div>`
                                    : ""
                                }
                            </div>

                            <div>
                                <button ${closed ? "disabled" : `onclick="selectProgramPath('${prog.id}')"`} class="w-full py-3 font-black rounded-2xl text-xs sm:text-sm transition shadow-sm flex items-center justify-center ${closed ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white"}">
                                    ${
                                      closed
                                        ? `<i class="fa-solid fa-lock ml-2 text-xs"></i><span>الدخول مغلق</span>`
                                        : `<span>دخول برنامج ${prog.name}</span><i class="fa-solid fa-arrow-left mr-2 text-xs"></i>`
                                    }
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

  // 3. نافذة تسجيل الدخول للبرنامج المحدد
  openLoginModal(programId) {
    const prog =
      db.programs.find((p) => p.id === programId) ||
      getActivePrograms()[0] ||
      db.programs[0];

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
                                ${(() => {
                                  const admins = db.users.filter((u) => u.role === "admin");
                                  const sups = db.users.filter((u) => u.role === "supervisor");
                                  const studs = db.users.filter(
                                    (u) =>
                                      u.role === "student" &&
                                      (!state.lockedProgramId ||
                                        u.currentProgramId === state.lockedProgramId),
                                  );
                                  const staffGroups = `
                                    <optgroup label="الإدارة">
                                        ${admins.map((a) => `<option value="${a.id}">${a.name}</option>`).join("")}
                                    </optgroup>
                                    <optgroup label="المشرفون">
                                        ${sups.map((s) => `<option value="${s.id}">${s.name}</option>`).join("")}
                                    </optgroup>`;
                                  const studentGroup = `
                                    <optgroup label="الطلاب">
                                        ${studs.map((st) => `<option value="${st.id}">طالب: ${st.name}</option>`).join("")}
                                    </optgroup>`;
                                  if (state.portalMode === "student") return studentGroup;
                                  if (state.portalMode === "staff") return staffGroups;
                                  return staffGroups + studentGroup;
                                })()}
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

  // 4. الواجهة الرئيسية مع شريط تثبيت التطبيق وتفعيل الإشعارات
  renderHome(user) {
    if (!user) return this.renderPortalView();
    const installBannerHtml = `
            <div id="pwa-install-banner" class="bg-gradient-to-r from-[#0B2533] via-[#163a75] to-[#0B2533] rounded-2xl p-4 text-white shadow-md border-r-4 border-r-[#D4A359] flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div class="flex items-center space-x-3 space-x-reverse">
                    <div class="w-10 h-10 rounded-xl bg-white/10 text-[#D4A359] flex items-center justify-center text-lg border border-[#D4A359]/30 shrink-0">
                        <i class="fa-solid fa-mobile-screen-button"></i>
                    </div>
                    <div>
                        <h4 class="font-black text-sm text-white">تثبيت المنصة كتطبيق على جهازك وتفعيل التنبيهات</h4>
                        <p class="text-[11px] text-slate-300">قم بتثبيت المنصة كتطبيق سريع ومستقل على جوالك أو جهازك لتلقي التنبيهات والإشعارات فورياً.</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2 space-x-reverse shrink-0">
                    <button onclick="views.installAppAndNotify()" class="js-install-notify-btn px-3.5 py-1.5 bg-[#D4A359] hover:bg-amber-500 text-[#0B2533] font-black rounded-xl text-xs transition shadow-xs flex items-center">
                        <i class="fa-solid fa-cloud-arrow-down ml-1.5 text-xs"></i> تثبيت التطبيق وتفعيل الإشعارات
                    </button>
                    <button onclick="document.getElementById('pwa-install-banner').remove()" class="p-1.5 text-slate-400 hover:text-white rounded-lg transition" title="إغلاق">
                        <i class="fa-solid fa-xmark text-sm"></i>
                    </button>
                </div>
            </div>
        `;

    if (user.role === "admin")
      return `<div class="space-y-4 sm:space-y-6">${installBannerHtml}${this.renderAdminDashboard()}</div>`;
    if (user.role === "supervisor")
      return `<div class="space-y-4 sm:space-y-6">${installBannerHtml}${this.renderSupervisorDashboard(user)}</div>`;

    // واجهة الطالب
    const currentProg =
      db.programs.find((p) => p.id === user.currentProgramId) ||
      getActivePrograms()[0] ||
      db.programs[0];
    const studentTasks = db.tasks.filter((t) => t.assignedTo === user.id);
    const pendingTasks = studentTasks.filter(
      (t) => t.status !== "مكتملة" && t.status !== "معفى بعذر",
    );
    const myStats = studentAttendanceStats(user.id);
    const rateLabel =
      myStats.rate >= 90
        ? "ملتزم"
        : myStats.rate >= 75
          ? "جيد"
          : "يحتاج متابعة";

    return `
            <div class="space-y-4 sm:space-y-6">
                ${installBannerHtml}

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

                    <div class="kpi-card border-[#169BA2]/30 cursor-pointer" onclick="navigateTo('my-report')">
                        <span class="kpi-tag">KPI</span>
                        <div class="text-[11px] text-slate-500 font-bold mb-1">نسبة الانضباط</div>
                        <div class="text-xl font-black text-[#169BA2]">${myStats.rate}% (${rateLabel})</div>
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

  // دالة موحّدة: تثبيت التطبيق + تفعيل الإشعارات بضغطة واحدة (بدون أي خدمة خارجية)
  installAppAndNotify() {
    if (typeof window.installAppAndEnableNotifications === "function") {
      window.installAppAndEnableNotifications();
    } else {
      alert("تعذر تحميل وحدة التثبيت. يرجى تحديث الصفحة والمحاولة مجدداً.");
    }
  },

  // إبقاء الأسماء القديمة للتوافق
  triggerAppInstall() {
    this.installAppAndNotify();
  },

  requestPushNotification() {
    this.installAppAndNotify();
  },

  // 5. لوحة الإدارة العامة
  renderAdminDashboard() {
    const pendingReqsCount = (db.registrationRequests || []).filter(
      (r) => r.status === "قيد المراجعة",
    ).length;
    const pendingEditsCount = (db.pendingProfileEdits || []).filter(
      (e) => e.status === "بانتظار الاعتماد",
    ).length;
    const pendingExcuses = (db.excuseRequests || []).filter(
      (e) => e.status === "بانتظار الاعتماد",
    ).length;
    const disc = overallDisciplineRate();
    const discTxt = disc === null ? "— لا بيانات بعد" : disc + "%";

    return `
            <div class="space-y-4 sm:space-y-6">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div class="kpi-card bg-gradient-to-br from-amber-50/40 to-white border-amber-200/60 cursor-pointer" onclick="navigateTo('day-review')">
                        <span class="kpi-tag">KPI</span>
                        <div class="text-[11px] text-slate-600 font-bold mb-1">نسبة الانضباط بالحضور (الفصل)</div>
                        <div class="flex items-center justify-between mt-1">
                            <div class="text-2xl font-black text-[#0B2533]">${discTxt}</div>
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
                                ${pendingReqsCount + pendingEditsCount + pendingExcuses > 0 ? `<span class="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full font-bold mr-1">${pendingReqsCount + pendingEditsCount + pendingExcuses} معلقة</span>` : ""}
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
                            <div class="text-lg font-black text-[#0B2533]">${getActivePrograms().length} برامج</div>
                            <div class="w-8 h-8 rounded-xl bg-purple-100 text-[#2B1736] flex items-center justify-center text-sm">
                                <i class="fa-solid fa-layer-group"></i>
                            </div>
                        </div>
                    </div>
                </div>

                ${this.renderScheduleWidget(firstActiveProgramId(), 0, state.scheduleViewMode)}
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

    // البرامج المفعّلة فقط (تأصيل ورسوخ مغلقان)
    const activePrograms = getActivePrograms();

    let targetPrograms = [];
    if (isAdmin && viewMode === "stacked") {
      targetPrograms = activePrograms;
    } else if (isSupervisor) {
      const assigned = state.currentUser.assignedPrograms || [];
      targetPrograms = activePrograms.filter((p) => assigned.includes(p.id));
      if (targetPrograms.length === 0 && activePrograms.length)
        targetPrograms = [activePrograms[0]];
    } else {
      const one =
        activePrograms.find((p) => p.id === programId) ||
        activePrograms[0] ||
        db.programs[0];
      targetPrograms = one ? [one] : [];
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
                                    ${
                                      viewMode !== "unified" && prog.isClosed
                                        ? `<span class="inline-flex items-center gap-1 bg-slate-200 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full"><i class="fa-solid fa-lock text-[9px]"></i> مغلق</span>`
                                        : ""
                                    }
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
    const isStudentTask = assignee.role === "student";
    const ev = getTaskEvaluation(task.id);
    const canEvaluate =
      isStudentTask &&
      (isAdmin ||
        (state.currentRole === "supervisor" &&
          (state.currentUser.assignedPrograms || []).includes(task.programId)));
    const ratingOpts = ["ممتاز", "جيد جداً", "جيد", "يحتاج تحسين"]
      .map(
        (r) =>
          `<option value="${r}" ${ev && ev.rating === r ? "selected" : ""}>${r}</option>`,
      )
      .join("");

    const modalHtml = `
            <div id="task-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in duration-150 border-t-4 border-t-[#D4A359]">
                    
                    <div class="p-4 sm:p-5 text-white flex justify-between items-start" style="background-color: ${supervisorColor};">
                        <div>
                            <span class="bg-black/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 inline-block">
                                برنامج ${prog.name || "البرنامج"}
                            </span>
                            <h3 class="font-bold text-base sm:text-lg leading-snug">${escHtml(task.title)}</h3>
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
                                    ${escHtml(assignee.name) || "غير محدد"}
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
                            <p class="text-slate-700 bg-white p-3 rounded-xl border border-slate-100 leading-relaxed">${escHtml(task.description) || "لا توجد تفاصيل إضافية."}</p>
                        </div>

                        ${
                          isStudentTask
                            ? `
                            <div class="pt-2 border-t border-slate-100">
                                <div class="text-slate-700 font-bold mb-1.5 flex items-center">
                                    <i class="fa-solid fa-star text-[#D4A359] ml-1"></i> تقييم أداء الطالب
                                </div>
                                ${
                                  canEvaluate
                                    ? `
                                    <div class="space-y-2">
                                        <select id="task-eval-rating" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-700">
                                            <option value="">— اختر التقدير —</option>
                                            ${ratingOpts}
                                        </select>
                                        <input id="task-eval-note" value="${ev ? escHtml(ev.note || "") : ""}" placeholder="ملاحظة للطالب (اختياري)" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium">
                                        <button onclick="saveTaskEvaluation('${task.id}', document.getElementById('task-eval-rating').value, document.getElementById('task-eval-note').value)" class="w-full py-2 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-bold rounded-xl text-xs">حفظ التقييم</button>
                                    </div>`
                                    : ev
                                      ? `<div class="bg-emerald-50/60 border border-emerald-200 rounded-xl p-2.5 text-xs">
                                            <b>التقدير:</b> ${escHtml(ev.rating || "—")}${ev.note ? `<br><b>ملاحظة:</b> ${escHtml(ev.note)}` : ""}
                                            <div class="text-[10px] text-slate-400 mt-1">${escHtml(ev.byName || "")} — ${escHtml(ev.at || "")}</div>
                                         </div>`
                                      : `<p class="text-slate-400 text-[10px]">لم يُقيَّم بعد.</p>`
                                }
                            </div>`
                            : ""
                        }

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
                                            ${eligibleSupervisors.map((s) => `<option value="${s.id}">${escHtml(s.name)}</option>`).join("")}
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

  // 9. إضافة مهمة جديدة: قائمة الـ 29 معيار للمدير فقط، وإدخال يدوي مباشر للمشرف
  openAddTaskModal(defaultProgramId) {
    const user = state.currentUser;
    const isAdmin = user.role === "admin";
    const availablePrograms = isAdmin
      ? getActivePrograms()
      : getActivePrograms().filter((p) =>
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
                                <label class="block font-bold text-slate-700 mb-1">اختر المهمة من قائمة المعايير المعتمدة (29 معيار):</label>
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
                                <label class="block font-bold text-slate-700 mb-1">عنوان المهمة المطلوب تنفيذها:</label>
                                <input id="new-task-title" required class="w-full bg-white border-2 border-[#D4A359] rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none" placeholder="اكتب نص المهمة بدقة هنا...">
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

  // 10. شاشة التحضير السريع المستقلة (Dedicated Fast Attendance with Barcode Reader)
  renderQuickAttendanceView() {
    const user = state.currentUser;
    const isSupervisor = user.role === "supervisor";
    const availablePrograms = isSupervisor
      ? getActivePrograms().filter((p) =>
          (user.assignedPrograms || []).includes(p.id),
        )
      : getActivePrograms();

    const currentProgId =
      state.currentProgramId &&
      availablePrograms.some((p) => p.id === state.currentProgramId)
        ? state.currentProgramId
        : availablePrograms[0]
          ? availablePrograms[0].id
          : firstActiveProgramId();

    const activeSchedule =
      db.schedules.find(
        (s) => s.programId === currentProgId && s.requiresAttendance,
      ) || db.schedules[0];
    const scheduleId = activeSchedule ? activeSchedule.id : "sch_ts_1";

    const students = db.users.filter(
      (u) =>
        u.role === "student" &&
        u.currentProgramId === currentProgId &&
        !u.isRestricted,
    );

    let presentCount = 0,
      absentCount = 0,
      lateCount = 0,
      excusedCount = 0,
      unmarkedCount = 0;
    students.forEach((st) => {
      const status = getStudentAttendanceStatus(scheduleId, st.id);
      if (status === "حاضر") presentCount++;
      else if (status === "غائب") absentCount++;
      else if (status === "متأخر") lateCount++;
      else if (status === "مستأذن") excusedCount++;
      else unmarkedCount++;
    });

    return `
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5 border-t-4 border-t-[#D4A359]">
                
                <!-- رأس شاشة التحضير المباشر -->
                <div class="flex flex-col md:flex-row justify-between md:items-center gap-3 border-b border-slate-100 pb-4">
                    <div>
                        <h2 class="text-lg sm:text-xl font-black text-[#0B2533] flex items-center">
                            <i class="fa-solid fa-qrcode text-[#D4A359] ml-2 text-xl"></i> التحضير السريع والمباشر للطلاب
                        </h2>
                        <p class="text-xs text-slate-500 mt-1">الرصد الفوري عبر تمرير قارئ الباركود أو تحديد الحالات جماعياً بنقرة واحدة</p>
                    </div>

                    <div class="flex items-center space-x-2 space-x-reverse flex-wrap gap-y-2">
                        <select onchange="state.currentProgramId = this.value; navigateTo('quick-attendance');" class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-[#0B2533] focus:border-[#D4A359]">
                            ${availablePrograms.map((p) => `<option value="${p.id}" ${p.id === currentProgId ? "selected" : ""}>برنامج ${p.name}</option>`).join("")}
                        </select>
                    </div>
                </div>

                <!-- خانة الماسح الضوئي وقارئ الباركود الذكي -->
                <div class="bg-gradient-to-r from-slate-900 to-[#0B2533] rounded-2xl p-4 text-white shadow-sm border border-[#D4A359]/40 space-y-3">
                    <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <label class="font-black text-xs sm:text-sm text-[#D4A359] flex items-center">
                            <i class="fa-solid fa-barcode ml-2 text-base"></i> مسح باركود بطاقة الطالب (يدعم أجهزة الـ USB وكاميرا الجوال):
                        </label>
                        <span id="barcode-scan-feedback" class="text-[11px] font-bold text-emerald-400">جاهز لاستقبال مسح الأكواد...</span>
                    </div>

                    <div class="relative">
                        <input id="barcode-quick-input" 
                               autofocus 
                               onkeydown="if(event.key === 'Enter') { views.processBarcodeScan(this.value, '${scheduleId}'); this.value = ''; }"
                               placeholder="مرر كود بطاقة الطالب هنا أو اكتب الرقم الأكاديمي واضغط Enter..." 
                               class="w-full bg-white text-[#0B2533] font-black text-sm px-4 py-3 rounded-xl border-2 border-[#D4A359] focus:outline-none shadow-inner placeholder:font-normal placeholder:text-slate-400">
                        <button onclick="const val = document.getElementById('barcode-quick-input').value; views.processBarcodeScan(val, '${scheduleId}'); document.getElementById('barcode-quick-input').value = '';" 
                                class="absolute left-2 top-2 bottom-2 px-4 bg-[#D4A359] hover:bg-amber-500 text-[#0B2533] font-black rounded-lg text-xs transition">
                            تحضير
                        </button>
                    </div>
                </div>

                <!-- بطاقات إحصائيات الجلسة الحالية -->
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div class="kpi-card text-center p-3">
                        <div class="text-[10px] text-slate-500 font-bold">العدد الكلي</div>
                        <div class="text-xl font-black text-[#0B2533] mt-0.5">${students.length}</div>
                    </div>
                    <div class="kpi-card text-center p-3 border-emerald-300">
                        <div class="text-[10px] text-emerald-700 font-bold">حاضر ✓</div>
                        <div class="text-xl font-black text-emerald-600 mt-0.5">${presentCount}</div>
                    </div>
                    <div class="kpi-card text-center p-3 border-rose-300">
                        <div class="text-[10px] text-rose-700 font-bold">غائب ✗</div>
                        <div class="text-xl font-black text-rose-600 mt-0.5">${absentCount}</div>
                    </div>
                    <div class="kpi-card text-center p-3 border-amber-300">
                        <div class="text-[10px] text-amber-700 font-bold">متأخر ⏱</div>
                        <div class="text-xl font-black text-amber-600 mt-0.5">${lateCount}</div>
                    </div>
                    <div class="kpi-card text-center p-3 border-sky-300">
                        <div class="text-[10px] text-sky-700 font-bold">مستأذن ✉</div>
                        <div class="text-xl font-black text-sky-600 mt-0.5">${excusedCount}</div>
                    </div>
                </div>

                <!-- شريط العمليات الجماعية للتحضير الفوري -->
                <div class="bg-teal-50/70 border border-teal-200/80 p-3 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <label class="flex items-center space-x-2 space-x-reverse font-bold text-slate-800 text-xs cursor-pointer">
                        <input type="checkbox" id="select-all-fast-att" onchange="document.querySelectorAll('.fast-stu-checkbox').forEach(cb => cb.checked = this.checked)" class="accent-[#0B2533]">
                        <span>تحديد جميع الطلاب المعروضين (${students.length})</span>
                    </label>

                    <div class="flex items-center gap-1.5 flex-wrap">
                        <button onclick="views.bulkRecordQuickAttendance('${scheduleId}', 'حاضر')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition">
                            ✓ تحضير المحددين حاضر
                        </button>
                        <button onclick="views.bulkRecordQuickAttendance('${scheduleId}', 'غائب')" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-xs transition">
                            ✗ رصد كـ غائب
                        </button>
                        <button onclick="views.bulkRecordQuickAttendance('${scheduleId}', 'متأخر')" class="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs transition">
                            ⏱ متأخر
                        </button>
                        <button onclick="views.bulkRecordQuickAttendance('${scheduleId}', 'مستأذن')" class="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-xs transition">
                            ✉ مستأذن
                        </button>
                        <button onclick="markRemainingAbsent('${scheduleId}'); navigateTo('quick-attendance');" class="px-3 py-1.5 bg-slate-800 hover:bg-black text-[#D4A359] font-bold rounded-xl text-xs transition">
                            احتساب البقية غائبين
                        </button>
                    </div>
                </div>

                <!-- قائمة الطلاب مع أزرار الرصد المباشر -->
                <div class="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    ${students
                      .map((st) => {
                        const status = getStudentAttendanceStatus(
                          scheduleId,
                          st.id,
                        );
                        return `
                            <div class="p-3 bg-white rounded-2xl border border-slate-200 hover:border-[#D4A359] transition flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                <div class="flex items-center space-x-3 space-x-reverse">
                                    <input type="checkbox" value="${st.id}" class="fast-stu-checkbox accent-[#0B2533]">
                                    <div class="w-8 h-8 rounded-xl bg-[#0B2533] text-[#D4A359] font-bold flex items-center justify-center text-xs shrink-0 border border-[#D4A359]/30">
                                        ${st.avatar}
                                    </div>
                                    <div>
                                        <div class="font-black text-slate-800 text-xs sm:text-sm">${st.name}</div>
                                        <div class="text-[10px] text-slate-400 font-mono">${st.studentNumber} | جوال الأب: ${st.fatherPhone || "غير مسجل"}</div>
                                    </div>
                                </div>

                                <!-- كبسولات تغيير الحالة المباشرة بضغطة واحدة -->
                                <div class="flex items-center gap-1">
                                    <button onclick="recordAttendance('${scheduleId}', '${st.id}', 'حاضر'); navigateTo('quick-attendance');" 
                                            class="px-2.5 py-1 rounded-lg text-xs font-bold transition border ${status === "حاضر" ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50"}">
                                        حاضر ✓
                                    </button>
                                    <button onclick="recordAttendance('${scheduleId}', '${st.id}', 'غائب'); navigateTo('quick-attendance');" 
                                            class="px-2.5 py-1 rounded-lg text-xs font-bold transition border ${status === "غائب" ? "bg-rose-600 text-white border-rose-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-rose-50"}">
                                        غائب ✗
                                    </button>
                                    <button onclick="recordAttendance('${scheduleId}', '${st.id}', 'متأخر'); navigateTo('quick-attendance');" 
                                            class="px-2 py-1 rounded-lg text-xs font-bold transition border ${status === "متأخر" ? "bg-amber-600 text-white border-amber-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50"}">
                                        متأخر ⏱
                                    </button>
                                    <button onclick="recordAttendance('${scheduleId}', '${st.id}', 'مستأذن'); navigateTo('quick-attendance');" 
                                            class="px-2 py-1 rounded-lg text-xs font-bold transition border ${status === "مستأذن" ? "bg-sky-600 text-white border-sky-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-sky-50"}">
                                        مستأذن ✉
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

  // معالجة مسح الباركود السريع
  processBarcodeScan(scannedCode, scheduleId) {
    if (!scannedCode || scannedCode.trim() === "") return;
    const code = scannedCode.trim();

    const student = db.users.find(
      (u) =>
        u.role === "student" &&
        (u.studentNumber === code || u.phone === code || u.id === code),
    );

    const feedback = document.getElementById("barcode-scan-feedback");
    if (!student) {
      if (feedback) {
        feedback.innerText = `لم يتم العثور على طالب بالكود: ${code} ❌`;
        feedback.className = "text-[11px] font-bold text-rose-400";
      }
      alert(`لم يتم العثور على طالب يطابق الرقم: ${code}`);
      return;
    }

    recordAttendance(scheduleId, student.id, "حاضر");
    if (feedback) {
      feedback.innerText = `تم رصد حضور الطالب: ${student.name} بنجاح ✓`;
      feedback.className = "text-[11px] font-bold text-emerald-400";
    }
    navigateTo("quick-attendance");
  },

  bulkRecordQuickAttendance(scheduleId, status) {
    const selected = document.querySelectorAll(".fast-stu-checkbox:checked");
    if (selected.length === 0) {
      alert("يرجى تحديد طالب واحد على الأقل من القائمة للرصد الجماعي!");
      return;
    }
    selected.forEach((cb) => {
      recordAttendance(scheduleId, cb.value, status);
    });
    alert(`تم رصد حالة (${status}) لعدد (${selected.length}) طالب بنجاح.`);
    navigateTo("quick-attendance");
  },

  // 11. شاشة إدارة الطلاب مع زر طباعة البطاقات المصغرة
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
                            <i class="fa-solid fa-user-graduate text-[#D4A359] ml-2"></i> إدارة الطلاب والبطاقات الأكاديمية
                        </h2>
                    </div>

                    <div class="flex items-center space-x-2 space-x-reverse flex-wrap gap-y-2">
                        <button onclick="views.openStudentCardsModal()" class="px-3.5 py-1.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white text-xs font-black rounded-xl transition shadow-xs flex items-center border border-[#D4A359]">
                            <i class="fa-solid fa-id-card ml-1.5 text-[#D4A359]"></i> طباعة بطاقات الطلاب (باركود)
                        </button>
                        <label class="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center cursor-pointer">
                            <i class="fa-solid fa-file-excel ml-1"></i> استيراد من Excel / CSV
                            <input type="file" accept=".csv, .xlsx, .xls" class="hidden" onchange="handleStudentExcelImport(event)">
                        </label>
                        <button onclick="views.openAddStudentModal()" class="px-3 py-1.5 bg-[#169BA2] hover:bg-[#128086] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center">
                            <i class="fa-solid fa-user-plus ml-1"></i> إضافة طالب
                        </button>
                    </div>
                </div>

                <div class="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-2.5">
                    <div class="relative flex-1 w-full">
                        <i class="fa-solid fa-magnifying-glass absolute right-3 top-2.5 text-slate-400 text-xs"></i>
                        <input id="student-search-input" onkeyup="views.filterStudentsList(this.value)" class="w-full bg-white border border-slate-200 rounded-xl pr-8 pl-3 py-1.5 text-xs font-medium focus:outline-none focus:border-[#D4A359]" placeholder="ابحث باسم الطالب أو رقم الجوال أو الرقم الأكاديمي...">
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
                            <i class="fa-solid fa-user-pen ml-1.5 text-[#D4A359]"></i> طلبات تحتاج اعتماد المدير (${pendingEdits.length})
                        </h3>
                        <div class="space-y-1.5">
                            ${pendingEdits
                              .map((edit) => {
                                const changes = [];
                                if (edit.newName) changes.push(`الاسم: ${edit.newName}`);
                                if (edit.newPhone) changes.push(`جوال: ${edit.newPhone}`);
                                if (edit.newNationalId) changes.push(`هوية: ${edit.newNationalId}`);
                                if (edit.newEmail) changes.push(`إيميل: ${edit.newEmail}`);
                                if (edit.newPassword) changes.push(`كلمة مرور جديدة`);
                                return `
                                <div class="bg-white p-2.5 rounded-xl border border-purple-200 flex justify-between items-center text-xs gap-2">
                                    <div>
                                        <span class="font-bold text-slate-800">${edit.studentName || edit.userName || "مستخدم"}</span>
                                        <span class="badge badge-pending text-[9px] mr-1">${edit.userRole === "supervisor" ? "مشرف" : "طالب"}</span>
                                        <div class="text-slate-500 mt-0.5">${changes.join(" — ") || "طلب تعديل"}</div>
                                    </div>
                                    <div class="flex items-center space-x-1.5 space-x-reverse shrink-0">
                                        <button onclick="approveProfileEdit('${edit.id}')" class="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg">اعتماد</button>
                                        <button onclick="rejectProfileEdit('${edit.id}')" class="px-2.5 py-1 bg-rose-100 text-rose-700 font-bold rounded-lg">رفض</button>
                                    </div>
                                </div>
                            `;
                              })
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
                                        <span class="font-mono text-[#D4A359] font-bold">${st.studentNumber}</span> | 
                                        <span>جوال: ${st.phone || "غير مسجل"}</span> | 
                                        <span class="text-[#0B2533] font-bold">برنامج ${getProgramName(st.currentProgramId)}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="flex items-center space-x-1.5 space-x-reverse flex-wrap gap-y-1.5">
                                <button onclick="waStudentReport('${st.id}')" class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition flex items-center" title="إرسال تقرير لولي الأمر واتساب">
                                    <i class="fa-brands fa-whatsapp ml-1"></i> تقرير
                                </button>
                                <button onclick="views.openSingleStudentCardPrint('${st.id}')" class="px-2.5 py-1 bg-slate-100 hover:bg-[#D4A359] hover:text-[#0B2533] text-slate-700 rounded-xl text-xs font-bold transition flex items-center">
                                    <i class="fa-solid fa-id-card ml-1"></i> البطاقة
                                </button>
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
                                ${
                                  state.currentRole === "admin"
                                    ? `<button onclick="deleteStudent('${st.id}')" class="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition" title="حذف الطالب نهائياً"><i class="fa-solid fa-trash-can"></i></button>`
                                    : ""
                                }
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        `;
  },

  // 12. نافذة طباعة بطاقات الطلاب الأكاديمية المصغرة (ID Badges with Barcode)
  openStudentCardsModal() {
    closeModal("student-cards-modal");
    document.body.classList.remove("printing-cards");

    const perPage = this._cardsPerPage || 9; // الافتراضي 9 بطاقات في الصفحة
    const progFilter = this._cardsProg || "all";
    const codeType = this._cardsCode || "barcode"; // barcode | qr | both
    this._cardsPerPage = perPage;
    this._cardsProg = progFilter;
    this._cardsCode = codeType;

    const activePrograms = getActivePrograms();
    let students = db.users.filter(
      (u) => u.role === "student" && !u.isRestricted,
    );
    if (progFilter !== "all") {
      students = students.filter((u) => u.currentProgramId === progFilter);
    }
    students.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ar"));

    const colsFor = { 2: 2, 4: 2, 9: 3, 12: 3 };
    const cols = colsFor[perPage] || 3;
    const compact = perPage >= 9;

    const modalHtml = `
            <div id="student-cards-modal" class="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex justify-center items-start pt-8 px-4 overflow-y-auto">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full overflow-hidden my-6">

                    <div class="bg-[#0B2533] text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-[#D4A359] print-hide">
                        <div>
                            <h3 class="font-black text-sm sm:text-lg flex items-center">
                                <i class="fa-solid fa-id-card text-[#D4A359] ml-2"></i> طباعة بطاقات الطلاب (باركود حقيقي)
                            </h3>
                            <p class="text-[11px] text-slate-300 mt-0.5">${students.length} طالب — تُطبع ${perPage} بطاقة في كل ورقة A4</p>
                        </div>
                        <div class="flex items-center gap-2 flex-wrap">
                            <select onchange="views._cardsProg=this.value; views.openStudentCardsModal();" class="bg-white/10 border border-white/20 text-white text-xs font-bold rounded-lg px-2 py-1.5 focus:outline-none">
                                <option value="all" ${progFilter === "all" ? "selected" : ""}>كل البرامج المفعّلة</option>
                                ${activePrograms
                                  .map(
                                    (p) =>
                                      `<option value="${p.id}" ${progFilter === p.id ? "selected" : ""}>${escHtml(p.name)}</option>`,
                                  )
                                  .join("")}
                            </select>
                            <select onchange="views._cardsPerPage=parseInt(this.value); views.openStudentCardsModal();" class="bg-white/10 border border-white/20 text-white text-xs font-bold rounded-lg px-2 py-1.5 focus:outline-none">
                                <option value="9" ${perPage === 9 ? "selected" : ""}>9 في الورقة</option>
                                <option value="12" ${perPage === 12 ? "selected" : ""}>12 في الورقة</option>
                                <option value="4" ${perPage === 4 ? "selected" : ""}>4 في الورقة</option>
                                <option value="2" ${perPage === 2 ? "selected" : ""}>2 في الورقة</option>
                            </select>
                            <select onchange="views._cardsCode=this.value; views.openStudentCardsModal();" class="bg-white/10 border border-white/20 text-white text-xs font-bold rounded-lg px-2 py-1.5 focus:outline-none">
                                <option value="barcode" ${codeType === "barcode" ? "selected" : ""}>باركود (USB)</option>
                                <option value="qr" ${codeType === "qr" ? "selected" : ""}>QR (كاميرا الجوال)</option>
                                <option value="both" ${codeType === "both" ? "selected" : ""}>باركود + QR</option>
                            </select>
                            <button onclick="views.printCards()" class="px-3.5 py-1.5 bg-[#D4A359] hover:bg-amber-500 text-[#0B2533] font-black rounded-lg text-xs transition shadow-sm flex items-center">
                                <i class="fa-solid fa-print ml-1.5"></i> طباعة الآن
                            </button>
                            <button onclick="closeModal('student-cards-modal')" class="text-slate-300 hover:text-white text-lg mr-1">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </div>

                    <div class="p-4 sm:p-6 bg-slate-100 max-h-[72vh] overflow-y-auto print-hide-scroll">
                        ${
                          students.length === 0
                            ? '<div class="text-center py-10 text-slate-400 text-sm">لا يوجد طلاب مطابقون</div>'
                            : `<div id="print-area" class="cards-grid cards-cols-${cols} code-${codeType}">
                                ${students.map((st) => views.buildStudentBadgeHtml(st, compact)).join("")}
                               </div>`
                        }
                    </div>

                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
    setTimeout(() => views.renderBadgeCodes(document.getElementById("print-area")), 30);
  },

  // تشغيل الطباعة مع تجهيز الصفحة (إخفاء كل شيء عدا البطاقات)
  printCards() {
    document.body.classList.add("printing-cards");
    setTimeout(() => {
      window.print();
      setTimeout(() => document.body.classList.remove("printing-cards"), 400);
    }, 60);
  },

  // طباعة بطاقة لطالب واحد منفرد
  openSingleStudentCardPrint(studentId) {
    closeModal("single-card-modal");
    const student = db.users.find((u) => u.id === studentId);
    if (!student) return;

    const modalHtml = `
            <div id="single-card-modal" class="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden p-6 text-center space-y-4">
                    <div class="flex justify-between items-center pb-2 border-b border-slate-100 print-hide">
                        <span class="font-black text-sm text-[#0B2533]">معاينة بطاقة الطالب</span>
                        <button onclick="closeModal('single-card-modal')" class="text-slate-400 hover:text-slate-700"><i class="fa-solid fa-xmark text-lg"></i></button>
                    </div>

                    <div id="print-area" class="cards-grid cards-cols-1 code-both flex justify-center">
                        ${views.buildStudentBadgeHtml(student, false)}
                    </div>

                    <div class="flex justify-center space-x-2 space-x-reverse pt-2 print-hide">
                        <button onclick="views.printCards()" class="px-5 py-2 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-black rounded-xl text-xs transition">
                            <i class="fa-solid fa-print ml-1.5"></i> طباعة البطاقة
                        </button>
                        <button onclick="closeModal('single-card-modal')" class="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs">
                            إغلاق
                        </button>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
    setTimeout(() => views.renderBadgeCodes(document.getElementById("print-area")), 30);
  },

  // بناء قالب البطاقة المصغرة (باركود + QR)
  buildStudentBadgeHtml(student, compact) {
    const program =
      db.programs.find((p) => p.id === student.currentProgramId) || {};
    const code = String(student.studentNumber || student.id || "");
    const esc = (v) => (typeof escHtml === "function" ? escHtml(v) : v);
    return `
            <div class="student-id-badge ${compact ? "badge-compact" : ""} bg-white flex flex-col justify-between overflow-hidden">

                <div class="badge-head">
                    <div class="badge-logos">
                        <img src="logo15.png" alt="مشكاة" onerror="this.style.display='none'">
                        <img src="logo16.png" alt="توطين" onerror="this.style.display='none'">
                    </div>
                    <span class="badge-prog">${esc(program.name || "علمي")}</span>
                </div>

                <div class="badge-body">
                    <div class="badge-avatar">${esc(student.avatar || "")}</div>
                    <div class="badge-info">
                        <div class="badge-name">${esc(student.name)}</div>
                        <div class="badge-num">${esc(code)}</div>
                    </div>
                </div>

                <div class="badge-codes">
                    <div class="badge-barcode-box"><svg class="badge-barcode" data-code="${esc(code)}"></svg></div>
                    <div class="badge-qr-box"><div class="badge-qr" data-code="${esc(code)}"></div></div>
                </div>

            </div>
        `;
  },

  // رسم الباركود الحقيقي + رمز QR على كل بطاقة معروضة (يُستدعى بعد إدراج البطاقات)
  renderBadgeCodes(root) {
    const scope = root || document;
    const safe = (c) => (typeof escHtml === "function" ? escHtml(c) : c);

    scope.querySelectorAll("svg.badge-barcode[data-code]").forEach((svg) => {
      const code = svg.getAttribute("data-code");
      if (!code) return;
      try {
        if (typeof JsBarcode === "function") {
          JsBarcode(svg, code, {
            format: "CODE128",
            displayValue: false,
            margin: 0,
            height: 34,
            width: 1.4,
          });
        } else {
          svg.outerHTML =
            '<div class="badge-num" style="font-size:9px">' + safe(code) + "</div>";
        }
      } catch (e) {
        svg.outerHTML =
          '<div class="badge-num" style="font-size:9px">' + safe(code) + "</div>";
      }
    });

    scope.querySelectorAll(".badge-qr[data-code]").forEach((el) => {
      const code = el.getAttribute("data-code");
      if (!code) return;
      el.innerHTML = "";
      try {
        if (typeof QRCode === "function") {
          new QRCode(el, {
            text: code,
            width: 74,
            height: 74,
            correctLevel: QRCode.CorrectLevel.M,
          });
        } else {
          el.textContent = code;
        }
      } catch (e) {
        el.textContent = code;
      }
    });
  },

  // توافق مع الاسم القديم
  renderBadgeBarcodes(root) {
    return this.renderBadgeCodes(root);
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

  // 13. تفاصيل الطالب
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

  // 14. تعديل بيانات طالب
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
                                <label class="block font-bold text-slate-700 mb-1">رقم الهوية:</label>
                                <input id="edit-stu-nid" value="${student.nationalId || ""}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#D4A359]">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-2.5">
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">جوال ولي الأمر:</label>
                                <input id="edit-stu-father-phone" value="${student.fatherPhone || ""}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#D4A359]">
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">البرنامج:</label>
                                <select id="edit-stu-prog" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-700 focus:outline-none focus:border-[#D4A359]">
                                    ${getActivePrograms().map((p) => `<option value="${p.id}" ${p.id === student.currentProgramId ? "selected" : ""}>${p.name}</option>`).join("")}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label class="block font-bold text-slate-700 mb-1">كلمة المرور:</label>
                            <input id="edit-stu-pass" value="${student.password || "1234"}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:outline-none focus:border-[#D4A359]">
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
    const nationalId = document.getElementById("edit-stu-nid").value;
    const fatherPhone = document.getElementById("edit-stu-father-phone").value;
    const currentProgramId = document.getElementById("edit-stu-prog").value;
    const password = document.getElementById("edit-stu-pass").value;

    updateStudentData(studentId, {
      name,
      phone,
      nationalId,
      fatherPhone,
      currentProgramId,
      password,
    });
  },

  // 15. إضافة طالب يدوياً
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
                                <label class="block font-bold text-slate-700 mb-1">رقم الهوية:</label>
                                <input id="new-stu-nid" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#D4A359]" placeholder="10xxxxxxxx">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-2.5">
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">جوال ولي الأمر:</label>
                                <input id="new-stu-father-phone" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#D4A359]" placeholder="05xxxxxxxx">
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">البرنامج:</label>
                                <select id="new-stu-prog" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-700 focus:outline-none focus:border-[#D4A359]">
                                    ${getActivePrograms().map((p) => `<option value="${p.id}">${p.name}</option>`).join("")}
                                </select>
                            </div>
                        </div>

                        <p class="text-[11px] text-slate-500 bg-slate-50 rounded-xl p-2 border border-slate-200">
                            كلمة المرور الافتراضية <b>1234</b>، ويغيّرها الطالب لاحقاً باعتماد الإدارة. لا يُسمح بتكرار رقم الجوال أو رقم الهوية.
                        </p>

                        <div class="pt-2 flex justify-end space-x-2 space-x-reverse">
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
    const nationalId = document.getElementById("new-stu-nid").value;
    const fatherPhone = document.getElementById("new-stu-father-phone").value;
    const currentProgramId = document.getElementById("new-stu-prog").value;

    addNewStudent({ name, phone, nationalId, fatherPhone, currentProgramId });
  },

  // 16. إدارة المشرفين والإداريين (المدير فقط يضيف إداريين)
  renderAdminSupervisorsView() {
    const isAdmin = state.currentRole === "admin";
    const supervisors = db.users.filter((u) => u.role === "supervisor");
    const admins = db.users.filter((u) => u.role === "admin");

    const userRow = (u, kind) => `
        <div class="p-3 sm:p-4 rounded-2xl border ${u.isRestricted ? "border-rose-300 bg-rose-50/20" : "border-slate-200 bg-white"} flex flex-col md:flex-row justify-between md:items-center gap-3 hover:border-[#D4A359] transition">
            <div class="flex items-center space-x-3 space-x-reverse">
                <div class="w-9 h-9 rounded-2xl font-bold text-white flex items-center justify-center shadow-xs" style="background-color: ${u.color || "#0B2533"};">
                    ${u.avatar || (kind === "admin" ? "مد" : "مش")}
                </div>
                <div>
                    <div class="flex items-center space-x-1.5 space-x-reverse">
                        <h4 class="font-bold text-slate-800 text-xs sm:text-sm">${u.name}</h4>
                        <span class="badge ${kind === "admin" ? "badge-exempt" : "badge-active"} text-[9px]">${kind === "admin" ? "إداري" : "مشرف"}</span>
                        ${u.isRestricted ? '<span class="badge badge-restricted text-[9px]">مقيد</span>' : ""}
                    </div>
                    <div class="text-[11px] text-slate-500 mt-0.5">
                        <span>جوال: ${u.phone || "غير مسجل"}</span>
                        ${u.nationalId ? ` | <span>هوية: ${u.nationalId}</span>` : ""}
                        ${kind === "supervisor" ? ` | <span>البرامج: ${(u.assignedPrograms || []).map((p) => getProgramName(p)).join("، ") || "—"}</span>` : ""}
                    </div>
                </div>
            </div>
            ${
              isAdmin
                ? `
            <div class="flex items-center space-x-1.5 space-x-reverse flex-wrap gap-y-1.5">
                <button onclick="views.${kind === "admin" ? "openEditAdminModal" : "openEditSupervisorModal"}('${u.id}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition">
                    <i class="fa-solid fa-pen-to-square"></i> تعديل
                </button>
                ${
                  kind === "supervisor"
                    ? `<button onclick="toggleUserRestriction('${u.id}')" class="px-2.5 py-1 ${u.isRestricted ? "bg-emerald-100 text-emerald-800" : "bg-rose-50 text-rose-700"} rounded-xl text-xs font-bold transition">${u.isRestricted ? "فك" : "تقييد"}</button>`
                    : ""
                }
                ${
                  u.id === "admin"
                    ? ""
                    : `<button onclick="${kind === "admin" ? `deleteAdmin('${u.id}')` : `deleteSupervisor('${u.id}')`}" class="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition"><i class="fa-solid fa-trash-can"></i></button>`
                }
            </div>`
                : ""
            }
        </div>`;

    return `
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5 border-t-4 border-t-[#D4A359]">
                <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3.5">
                    <h2 class="text-lg sm:text-xl font-extrabold text-[#0B2533]"><i class="fa-solid fa-user-tie text-[#D4A359] ml-2"></i> المشرفون والإداريون</h2>

                    ${
                      isAdmin
                        ? `
                        <div class="flex items-center space-x-2 space-x-reverse flex-wrap gap-y-2">
                            <label class="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center cursor-pointer">
                                <i class="fa-solid fa-file-excel ml-1"></i> استيراد مشرفين Excel / CSV
                                <input type="file" accept=".csv, .xlsx, .xls" class="hidden" onchange="handleSupervisorExcelImport(event)">
                            </label>
                            <button onclick="views.openAddSupervisorModal()" class="px-3 py-1.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center">
                                <i class="fa-solid fa-user-plus ml-1 text-[#D4A359]"></i> إضافة مشرف
                            </button>
                            <button onclick="views.openAddAdminModal()" class="px-3 py-1.5 bg-[#9E1B48] hover:bg-[#7d1439] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center">
                                <i class="fa-solid fa-user-shield ml-1"></i> إضافة إداري
                            </button>
                        </div>
                    `
                        : ""
                    }
                </div>

                <div>
                    <h3 class="text-xs font-black text-slate-500 mb-2">الحسابات الإدارية (${admins.length})</h3>
                    <div class="space-y-2.5">
                        ${admins.map((u) => userRow(u, "admin")).join("")}
                    </div>
                </div>

                <div>
                    <h3 class="text-xs font-black text-slate-500 mb-2">المشرفون (${supervisors.length})</h3>
                    <div class="space-y-2.5">
                        ${
                          supervisors.length
                            ? supervisors.map((u) => userRow(u, "supervisor")).join("")
                            : '<div class="text-center py-6 text-slate-400 text-xs">لا يوجد مشرفون بعد. أضِف مشرفاً من الأعلى.</div>'
                        }
                    </div>
                </div>
            </div>
        `;
  },

  _programCheckboxes(selectedIds) {
    const sel = selectedIds || [];
    return getActivePrograms()
      .map(
        (p) => `
        <label class="flex items-center space-x-1.5 space-x-reverse text-xs font-bold text-slate-700 cursor-pointer">
            <input type="checkbox" name="sup-progs" value="${p.id}" class="accent-[#D4A359]" ${sel.includes(p.id) ? "checked" : ""}>
            <span>${p.name}</span>
        </label>`,
      )
      .join("");
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

                        <div class="grid grid-cols-2 gap-2.5">
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">رقم الجوال:</label>
                                <input id="new-sup-phone" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#D4A359]" placeholder="05xxxxxxxx">
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">رقم الهوية:</label>
                                <input id="new-sup-nid" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#D4A359]" placeholder="10xxxxxxxx">
                            </div>
                        </div>

                        <div>
                            <label class="block font-bold text-slate-700 mb-1">البرامج المسندة:</label>
                            <div class="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                ${this._programCheckboxes([])}
                            </div>
                        </div>

                        <p class="text-[11px] text-slate-500 bg-slate-50 rounded-xl p-2 border border-slate-200">
                            كلمة المرور الافتراضية <b>1234</b>. لا يُسمح بتكرار رقم الجوال أو رقم الهوية.
                        </p>

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
    const nationalId = document.getElementById("new-sup-nid").value;
    const checkedBoxes = document.querySelectorAll(
      'input[name="sup-progs"]:checked',
    );
    const assignedPrograms = Array.from(checkedBoxes).map((cb) => cb.value);

    if (assignedPrograms.length === 0) {
      alert("يرجى اختيار برنامج واحد على الأقل!");
      return;
    }

    addNewSupervisor({ name, phone, nationalId, assignedPrograms });
  },

  openEditSupervisorModal(supId) {
    const sup = db.users.find((u) => u.id === supId);
    if (!sup) return;
    const modalHtml = `
            <div id="edit-supervisor-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden border-t-4 border-t-[#D4A359]">
                    <div class="bg-[#0B2533] text-white px-5 py-4 flex justify-between items-center border-b border-[#D4A359]">
                        <h3 class="font-bold text-sm flex items-center">
                            <i class="fa-solid fa-user-pen text-[#D4A359] ml-1.5"></i> تعديل بيانات المشرف
                        </h3>
                        <button onclick="closeModal('edit-supervisor-modal')" class="text-slate-300 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <form onsubmit="event.preventDefault(); views.handleEditSupervisorSubmit('${sup.id}');" class="p-5 space-y-3 text-xs">
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">الاسم:</label>
                            <input id="edit-sup-name" value="${sup.name}" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:outline-none focus:border-[#D4A359]">
                        </div>
                        <div class="grid grid-cols-2 gap-2.5">
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">رقم الجوال:</label>
                                <input id="edit-sup-phone" value="${sup.phone || ""}" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#D4A359]">
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">رقم الهوية:</label>
                                <input id="edit-sup-nid" value="${sup.nationalId || ""}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#D4A359]">
                            </div>
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">البرامج المسندة:</label>
                            <div class="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                ${this._programCheckboxes(sup.assignedPrograms || [])}
                            </div>
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">كلمة المرور:</label>
                            <input id="edit-sup-pass" value="${sup.password || "1234"}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:outline-none focus:border-[#D4A359]">
                        </div>
                        <div class="pt-2 flex justify-end space-x-2 space-x-reverse">
                            <button type="button" onclick="closeModal('edit-supervisor-modal')" class="px-3 py-1.5 bg-slate-100 font-bold text-slate-600 rounded-xl">إلغاء</button>
                            <button type="submit" class="px-4 py-1.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-bold rounded-xl transition shadow-xs">حفظ</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    document.body.insertAdjacentHTML("beforeend", modalHtml);
  },

  handleEditSupervisorSubmit(supId) {
    const name = document.getElementById("edit-sup-name").value;
    const phone = document.getElementById("edit-sup-phone").value;
    const nationalId = document.getElementById("edit-sup-nid").value;
    const password = document.getElementById("edit-sup-pass").value;
    const assignedPrograms = Array.from(
      document.querySelectorAll('input[name="sup-progs"]:checked'),
    ).map((cb) => cb.value);
    updateSupervisorData(supId, {
      name,
      phone,
      nationalId,
      password,
      assignedPrograms,
    });
  },

  openAddAdminModal() {
    const modalHtml = `
            <div id="add-admin-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden border-t-4 border-t-[#9E1B48]">
                    <div class="bg-[#9E1B48] text-white px-5 py-4 flex justify-between items-center">
                        <h3 class="font-bold text-sm flex items-center">
                            <i class="fa-solid fa-user-shield ml-1.5"></i> إضافة حساب إداري
                        </h3>
                        <button onclick="closeModal('add-admin-modal')" class="text-white/80 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <form onsubmit="event.preventDefault(); views.handleAdminSubmit();" class="p-5 space-y-3 text-xs">
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">الاسم:</label>
                            <input id="new-adm-name" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#9E1B48]">
                        </div>
                        <div class="grid grid-cols-2 gap-2.5">
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">رقم الجوال:</label>
                                <input id="new-adm-phone" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#9E1B48]" placeholder="05xxxxxxxx">
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">رقم الهوية:</label>
                                <input id="new-adm-nid" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#9E1B48]" placeholder="10xxxxxxxx">
                            </div>
                        </div>
                        <p class="text-[11px] text-slate-500 bg-slate-50 rounded-xl p-2 border border-slate-200">
                            الحساب الإداري له صلاحية كاملة كالمدير. كلمة المرور الافتراضية <b>1234</b>.
                        </p>
                        <div class="pt-2 flex justify-end space-x-2 space-x-reverse">
                            <button type="button" onclick="closeModal('add-admin-modal')" class="px-3 py-1.5 bg-slate-100 font-bold text-slate-600 rounded-xl">إلغاء</button>
                            <button type="submit" class="px-4 py-1.5 bg-[#9E1B48] hover:bg-[#7d1439] text-white font-bold rounded-xl transition shadow-xs">حفظ</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    document.body.insertAdjacentHTML("beforeend", modalHtml);
  },

  handleAdminSubmit() {
    addNewAdmin({
      name: document.getElementById("new-adm-name").value,
      phone: document.getElementById("new-adm-phone").value,
      nationalId: document.getElementById("new-adm-nid").value,
    });
  },

  openEditAdminModal(adminId) {
    const adm = db.users.find((u) => u.id === adminId);
    if (!adm) return;
    const modalHtml = `
            <div id="edit-admin-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden border-t-4 border-t-[#9E1B48]">
                    <div class="bg-[#9E1B48] text-white px-5 py-4 flex justify-between items-center">
                        <h3 class="font-bold text-sm flex items-center"><i class="fa-solid fa-user-pen ml-1.5"></i> تعديل حساب إداري</h3>
                        <button onclick="closeModal('edit-admin-modal')" class="text-white/80 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <form onsubmit="event.preventDefault(); views.handleEditAdminSubmit('${adm.id}');" class="p-5 space-y-3 text-xs">
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">الاسم:</label>
                            <input id="edit-adm-name" value="${adm.name}" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:outline-none focus:border-[#9E1B48]">
                        </div>
                        <div class="grid grid-cols-2 gap-2.5">
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">رقم الجوال:</label>
                                <input id="edit-adm-phone" value="${adm.phone || ""}" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#9E1B48]">
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">رقم الهوية:</label>
                                <input id="edit-adm-nid" value="${adm.nationalId || ""}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#9E1B48]">
                            </div>
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">كلمة المرور:</label>
                            <input id="edit-adm-pass" value="${adm.password || "1234"}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:outline-none focus:border-[#9E1B48]">
                        </div>
                        <div class="pt-2 flex justify-end space-x-2 space-x-reverse">
                            <button type="button" onclick="closeModal('edit-admin-modal')" class="px-3 py-1.5 bg-slate-100 font-bold text-slate-600 rounded-xl">إلغاء</button>
                            <button type="submit" class="px-4 py-1.5 bg-[#9E1B48] hover:bg-[#7d1439] text-white font-bold rounded-xl transition shadow-xs">حفظ</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    document.body.insertAdjacentHTML("beforeend", modalHtml);
  },

  handleEditAdminSubmit(adminId) {
    const adm = db.users.find((u) => u.id === adminId);
    if (!adm) return;
    updateSupervisorData(adminId, {
      name: document.getElementById("edit-adm-name").value,
      phone: document.getElementById("edit-adm-phone").value,
      nationalId: document.getElementById("edit-adm-nid").value,
      password: document.getElementById("edit-adm-pass").value,
      assignedPrograms: adm.assignedPrograms,
    });
    // updateSupervisorData يغلق edit-supervisor-modal؛ نغلق مودال الإداري يدوياً
    closeModal("edit-admin-modal");
  },

  // 17. مودال التحضير بالجداول التقليدي
  openAttendanceModal(scheduleId) {
    closeModal("attendance-modal");
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

    const attDate =
      typeof attendanceContextDate === "function"
        ? attendanceContextDate()
        : new Date().toISOString().split("T")[0];
    const isPastDate = attDate < (typeof todayStr === "function" ? todayStr() : "");
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
                            <div class="text-[10px] mt-0.5 ${isPastDate ? "text-amber-300 font-bold" : "text-slate-300"}">
                                تاريخ التحضير: ${attDate}${isPastDate ? " (يوم سابق)" : " (اليوم)"}
                            </div>
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
                                const wa = waLink(
                                  st.fatherPhone || st.phone,
                                  fillTemplate(
                                    (getAppSettings().waTemplates || {}).absence || "",
                                    {
                                      student: st.name,
                                      date: attDate,
                                      program: getProgramName(st.currentProgramId),
                                    },
                                  ),
                                );
                                return `
                                    <div class="flex items-center justify-between p-2.5 bg-white rounded-2xl border border-slate-200 hover:border-[#D4A359] transition">
                                        <div class="flex items-center space-x-2.5 space-x-reverse">
                                            <input type="checkbox" value="${st.id}" class="stu-att-checkbox accent-[#D4A359]">
                                            <div class="w-7 h-7 rounded-full bg-[#0B2533] text-[#D4A359] font-bold flex items-center justify-center text-[11px] border border-[#D4A359]/30">
                                                ${escHtml(st.avatar)}
                                            </div>
                                            <div class="font-bold text-slate-800 text-xs">${escHtml(st.name)}</div>
                                        </div>

                                        <div class="flex items-center gap-1">
                                            ${
                                              currentStatus === "غائب" && wa
                                                ? `<a href="${wa}" target="_blank" class="text-emerald-600 hover:text-emerald-800 text-sm" title="إشعار ولي الأمر واتساب"><i class="fa-brands fa-whatsapp"></i></a>`
                                                : ""
                                            }
                                            <select onchange="handleAttendanceChange('${scheduleId}', '${st.id}', this.value)"
                                                    class="bg-slate-50 border border-slate-300 font-bold text-[11px] rounded-xl px-2 py-1 focus:outline-none focus:border-[#D4A359]">
                                                <option value="غير محدد" ${currentStatus === "غير محدد" ? "selected" : ""}>-- غير مرصود --</option>
                                                <option value="حاضر" ${currentStatus === "حاضر" ? "selected" : ""}>حاضر ✓</option>
                                                <option value="غائب" ${currentStatus === "غائب" ? "selected" : ""}>غائب ✗</option>
                                                <option value="متأخر" ${currentStatus === "متأخر" ? "selected" : ""}>متأخر ⏱</option>
                                                <option value="مستأذن" ${currentStatus === "مستأذن" ? "selected" : ""}>مستأذن ✉</option>
                                            </select>
                                        </div>
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

  // 18. الإعدادات
  renderSettingsView() {
    const user = state.currentUser;
    const isAdmin = user.role === "admin";
    const needsApproval = !isAdmin;

    return `
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5 border-t-4 border-t-[#D4A359]">
                <div class="border-b border-slate-100 pb-3">
                    <h2 class="text-lg font-extrabold text-[#0B2533]"><i class="fa-solid fa-gear text-[#D4A359] ml-1.5"></i> إعدادات الحساب</h2>
                </div>

                <div class="max-w-xl space-y-3.5 text-xs">
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">الاسم:</label>
                        <input id="set-user-name" value="${user.name}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:outline-none focus:border-[#D4A359]">
                    </div>

                    <div class="grid grid-cols-2 gap-2.5">
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">رقم الجوال:</label>
                            <input id="set-user-phone" value="${user.phone || ""}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#D4A359]">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">رقم الهوية:</label>
                            <input id="set-user-nid" value="${user.nationalId || ""}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#D4A359]">
                        </div>
                    </div>

                    <div>
                        <label class="block font-bold text-slate-700 mb-1">البريد الإلكتروني:</label>
                        <input id="set-user-email" value="${user.email || ""}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-[#D4A359]">
                    </div>

                    <div class="bg-amber-50/60 border border-amber-200 rounded-xl p-3">
                        <label class="block font-bold text-[#0B2533] mb-1"><i class="fa-solid fa-key text-[#D4A359] ml-1"></i> تغيير كلمة المرور:</label>
                        <input id="set-user-pass" type="text" placeholder="اترك الحقل فارغاً لعدم التغيير" class="w-full bg-white border border-amber-300 rounded-xl p-2 font-bold text-slate-800 focus:outline-none focus:border-[#D4A359]">
                        ${
                          needsApproval
                            ? `<p class="text-[10px] text-amber-800 mt-1">تغيير كلمة المرور أو البيانات يحتاج <b>اعتماد المدير</b>.</p>`
                            : ""
                        }
                    </div>

                    <div class="pt-2">
                        <button onclick="updateProfile()" class="px-5 py-2 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-bold rounded-xl transition shadow-xs">
                            ${needsApproval ? "إرسال طلب التعديل للاعتماد" : "حفظ التعديلات"}
                        </button>
                    </div>
                </div>
            </div>
        `;
  },

  // شاشة "مراجعة يوم محدد" للمدير: كل ما جرى في يوم معيّن (جدول + مهام + تحضير)
  renderDayReviewView() {
    const dateISO = state.reviewDate || todayStr();
    const d = new Date(dateISO + "T00:00:00");
    const weekday = d.getDay();
    const dayNames = [
      "الأحد",
      "الاثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت",
    ];
    let hijri = "";
    try {
      hijri = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(d);
    } catch (e) {
      hijri = "";
    }

    const activeIds = getActivePrograms().map((p) => p.id);
    const daySchedules = (db.schedules || []).filter(
      (s) => s.dayOfWeek === weekday && activeIds.includes(s.programId),
    );
    const dayTasks = (db.tasks || []).filter(
      (t) => (t.date === dateISO || t.dayOfWeek === weekday) && activeIds.includes(t.programId),
    );
    const dayAttendance = (db.attendanceRecords || []).filter(
      (r) => (r.date || "") === dateISO,
    );

    const statusColor = (s) =>
      s === "حاضر"
        ? "text-emerald-700"
        : s === "غائب"
          ? "text-rose-700"
          : s === "متأخر"
            ? "text-amber-700"
            : s === "مستأذن"
              ? "text-sky-700"
              : "text-slate-500";

    // الجلسات التي نعرض تحضيرها: جلسات هذا اليوم من الجدول + أي جلسة سُجّل فيها تحضير في هذا التاريخ
    const schedIdsWithRecords = [
      ...new Set(dayAttendance.map((r) => r.scheduleId)),
    ];
    const attSchedIds = [
      ...new Set([
        ...daySchedules.filter((s) => s.requiresAttendance).map((s) => s.id),
        ...schedIdsWithRecords,
      ]),
    ];

    const attendanceBlock = attSchedIds
      .map((sid) => (db.schedules || []).find((s) => s.id === sid))
      .filter(Boolean)
      .map((sch) => {
        const students = db.users.filter(
          (u) => u.role === "student" && u.currentProgramId === sch.programId,
        );
        const rows = students
          .map((st) => {
            const rec = dayAttendance.find(
              (r) => r.scheduleId === sch.id && r.studentId === st.id,
            );
            const status = rec ? rec.status : "غير مرصود";
            const wa =
              status === "غائب"
                ? waLink(
                    st.fatherPhone || st.phone,
                    fillTemplate(
                      (getAppSettings().waTemplates || {}).absence || "",
                      {
                        student: st.name,
                        date: dateISO,
                        program: getProgramName(st.programId || sch.programId),
                      },
                    ),
                  )
                : "";
            return `<div class="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                        <span class="text-slate-700">${escHtml(st.name)}</span>
                        <span class="flex items-center gap-1.5">
                          ${wa ? `<a href="${wa}" target="_blank" class="text-emerald-600 hover:text-emerald-800" title="إشعار ولي الأمر"><i class="fa-brands fa-whatsapp"></i></a>` : ""}
                          <span class="font-bold ${statusColor(status)}">${escHtml(status)}${rec && rec.auto ? " (تلقائي)" : ""}${rec && rec.excuseReason ? " — " + escHtml(rec.excuseReason) : ""}</span>
                        </span>
                    </div>`;
          })
          .join("");
        return `<div class="bg-white rounded-2xl border border-slate-200 p-3">
                    <div class="font-black text-[#0B2533] text-xs mb-1.5">${escHtml(sch.title)} — ${escHtml(getProgramName(sch.programId))} <span class="text-slate-400 font-medium">(${escHtml(sch.time)})</span></div>
                    ${rows || '<div class="text-slate-400 text-[11px]">لا يوجد طلاب</div>'}
                    <button onclick="views.openAttendanceModal('${sch.id}')" class="mt-2 px-3 py-1 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white text-[11px] font-bold rounded-lg transition">فتح/تعديل التحضير لهذا اليوم</button>
                </div>`;
      })
      .join("");

    return `
        <div class="space-y-4">
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 border-t-4 border-t-[#0B2533]">
                <h2 class="text-lg sm:text-xl font-extrabold text-[#0B2533] mb-3"><i class="fa-solid fa-calendar-day text-[#D4A359] ml-2"></i> مراجعة يوم محدد</h2>
                <div class="flex flex-wrap items-center gap-2">
                    <button onclick="shiftReviewDate(-1)" class="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50"><i class="fa-solid fa-chevron-right"></i> اليوم السابق</button>
                    <input type="date" value="${dateISO}" onchange="setReviewDate(this.value)" class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#0B2533]">
                    <button onclick="shiftReviewDate(1)" class="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50">اليوم التالي <i class="fa-solid fa-chevron-left"></i></button>
                    <button onclick="setReviewDate(todayStr())" class="px-3 py-2 bg-teal-50 text-[#169BA2] border border-teal-200 rounded-xl text-xs font-bold">اليوم</button>
                </div>
                <div class="mt-2 text-xs text-slate-500 font-bold">${dayNames[weekday]} — ${dateISO}${hijri ? ` — ${hijri}` : ""}</div>
            </div>

            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5">
                <h3 class="font-black text-[#0B2533] text-sm mb-2"><i class="fa-solid fa-calendar-week text-[#D4A359] ml-1.5"></i> جلسات وأنشطة اليوم (${daySchedules.length})</h3>
                ${
                  daySchedules.length
                    ? daySchedules
                        .map(
                          (s) => `<div class="py-1.5 border-b border-slate-100 last:border-0 text-xs">
                            <span class="font-bold text-slate-800">${s.title}</span>
                            <span class="text-slate-400"> — ${getProgramName(s.programId)} — ${s.time} — ${s.typeLabel || ""}</span>
                        </div>`,
                        )
                        .join("")
                    : '<div class="text-slate-400 text-xs">لا توجد جلسات في هذا اليوم</div>'
                }
            </div>

            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5">
                <h3 class="font-black text-[#0B2533] text-sm mb-2"><i class="fa-solid fa-list-check text-[#D4A359] ml-1.5"></i> مهام اليوم (${dayTasks.length})</h3>
                ${
                  dayTasks.length
                    ? dayTasks
                        .map(
                          (t) => `<div onclick="views.openTaskModal('${t.id}')" class="py-1.5 border-b border-slate-100 last:border-0 text-xs cursor-pointer hover:bg-slate-50 rounded px-1">
                            <span class="font-bold text-slate-800">${t.title}</span>
                            <span class="text-slate-400"> — ${getUserName(t.assignedTo)} — ${t.startTime}</span>
                            <span class="badge ${t.status === "مكتملة" ? "badge-completed" : t.status === "معفى بعذر" ? "badge-exempt" : "badge-pending"} text-[9px] mr-1">${t.status}</span>
                        </div>`,
                        )
                        .join("")
                    : '<div class="text-slate-400 text-xs">لا توجد مهام في هذا اليوم</div>'
                }
            </div>

            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-2.5">
                <h3 class="font-black text-[#0B2533] text-sm"><i class="fa-solid fa-clipboard-user text-[#D4A359] ml-1.5"></i> تحضير الطلاب في هذا اليوم</h3>
                ${attendanceBlock || '<div class="text-slate-400 text-xs">لا توجد جلسات تحضير في هذا اليوم</div>'}
            </div>
        </div>
        `;
  },

  // 19. إرسال الإشعارات
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
                                    <option value="all">الجميع</option>
                                    <option value="supervisors">جميع المشرفين فقط</option>
                                    ${getActivePrograms()
                                      .map(
                                        (p) =>
                                          `<option value="${p.id}">طلاب برنامج ${p.name}</option>`,
                                      )
                                      .join("")}
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

  // 20. لوحة المشرف
  renderSupervisorDashboard(supervisor) {
    const visibleTasks = getVisibleTasks(supervisor);
    const myTasks = visibleTasks.filter((t) => t.assignedTo === supervisor.id);
    const supProgId =
      (supervisor.assignedPrograms || []).find((p) => isProgramActive(p)) ||
      firstActiveProgramId();

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
                        <button onclick="views.openAddTaskModal('${supProgId}')" class="text-xs text-[#0B2533] font-bold hover:text-[#D4A359]">
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

                ${this.renderScheduleWidget(supProgId)}
            </div>
        `;
  },

  // 21. سجلات التحضير (مقيدة للمشرف ببرامجه فقط)
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

  // 22. مركز المهام
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

  // 23. لوحة الإعلانات
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

  // 24. إضافة إعلان جديد
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
                                    <option value="all">الجميع</option>
                                    <option value="supervisors">جميع المشرفين</option>
                                    ${getActivePrograms()
                                      .map(
                                        (p) =>
                                          `<option value="${p.id}">طلاب برنامج ${p.name}</option>`,
                                      )
                                      .join("")}
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

  // =====================================================================
  // 25. إدارة جلسات الجدول (المدير)
  // =====================================================================
  renderScheduleManageView() {
    const dayNames = [
      "الأحد",
      "الاثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت",
    ];
    const schedules = (db.schedules || [])
      .slice()
      .sort((a, b) => (a.dayOfWeek || 0) - (b.dayOfWeek || 0));

    return `
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4 border-t-4 border-t-[#169BA2]">
        <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
          <h2 class="text-lg sm:text-xl font-extrabold text-[#0B2533]"><i class="fa-solid fa-calendar-plus text-[#169BA2] ml-2"></i> إدارة جلسات الجدول</h2>
          <button onclick="views.openScheduleModal()" class="px-3.5 py-1.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white text-xs font-bold rounded-xl transition shadow-xs">
            <i class="fa-solid fa-plus ml-1 text-[#D4A359]"></i> إضافة جلسة
          </button>
        </div>
        <p class="text-[11px] text-slate-500">هذه الجلسات هي التي تظهر في الجدول والتحضير ومراجعة اليوم. أضِف أيام الحلقة الفعلية.</p>
        <div class="space-y-2">
          ${
            schedules.length === 0
              ? '<div class="text-center py-8 text-slate-400 text-sm">لا توجد جلسات. أضِف أول جلسة.</div>'
              : schedules
                  .map(
                    (s) => `
            <div class="p-3 rounded-2xl border border-slate-200 bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-2 hover:border-[#D4A359] transition">
              <div>
                <div class="font-bold text-slate-800 text-xs sm:text-sm">${escHtml(s.title)}</div>
                <div class="text-[11px] text-slate-500 mt-0.5">
                  ${dayNames[s.dayOfWeek] || "?"} — ${escHtml(s.time || "")} — ${escHtml(getProgramName(s.programId))} — ${escHtml(s.typeLabel || "درس")}
                  ${s.requiresAttendance ? '<span class="badge badge-active text-[9px] mr-1">تحضير إلزامي</span>' : '<span class="badge badge-exempt text-[9px] mr-1">بدون تحضير</span>'}
                </div>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <button onclick="views.openScheduleModal('${s.id}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold">تعديل</button>
                <button onclick="deleteSchedule('${s.id}')" class="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl"><i class="fa-solid fa-trash-can"></i></button>
              </div>
            </div>`,
                  )
                  .join("")
          }
        </div>
      </div>
    `;
  },

  openScheduleModal(schId) {
    closeModal("schedule-modal");
    const s = schId ? (db.schedules || []).find((x) => x.id === schId) : null;
    const dayOpts = [
      "الأحد",
      "الاثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت",
    ]
      .map(
        (d, i) =>
          `<option value="${i}" ${s && s.dayOfWeek === i ? "selected" : ""}>${d}</option>`,
      )
      .join("");
    const progOpts = getActivePrograms()
      .map(
        (p) =>
          `<option value="${p.id}" ${s && s.programId === p.id ? "selected" : ""}>${escHtml(p.name)}</option>`,
      )
      .join("");

    const html = `
      <div id="schedule-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden border-t-4 border-t-[#169BA2]">
          <div class="bg-[#0B2533] text-white px-5 py-4 flex justify-between items-center border-b border-[#D4A359]">
            <h3 class="font-bold text-sm">${s ? "تعديل جلسة" : "إضافة جلسة جديدة"}</h3>
            <button onclick="closeModal('schedule-modal')" class="text-slate-300 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <form onsubmit="event.preventDefault(); views.handleScheduleSubmit(${s ? "'" + s.id + "'" : "null"});" class="p-5 space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">عنوان الجلسة:</label>
              <input id="sch-title" value="${s ? escHtml(s.title) : ""}" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold focus:outline-none focus:border-[#D4A359]" placeholder="مثال: حلقة التلاوة">
            </div>
            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <label class="block font-bold text-slate-700 mb-1">البرنامج:</label>
                <select id="sch-prog" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold">${progOpts}</select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">اليوم:</label>
                <select id="sch-day" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold">${dayOpts}</select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <label class="block font-bold text-slate-700 mb-1">الوقت:</label>
                <input id="sch-time" value="${s ? escHtml(s.time || "") : "04:30 م"}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium" placeholder="04:30 م">
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">النوع:</label>
                <input id="sch-type" value="${s ? escHtml(s.typeLabel || "درس") : "درس"}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium" placeholder="درس / لقاء / نشاط">
              </div>
            </div>
            <label class="flex items-center gap-2 font-bold text-slate-800 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <input type="checkbox" id="sch-att" class="accent-[#D4A359]" ${!s || s.requiresAttendance ? "checked" : ""}>
              <span>تتطلب رصد تحضير (حضور/غياب)</span>
            </label>
            <div>
              <label class="block font-bold text-slate-700 mb-1">تفاصيل (اختياري):</label>
              <textarea id="sch-details" rows="2" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium">${s ? escHtml(s.details || "") : ""}</textarea>
            </div>
            <div class="pt-2 flex justify-end gap-2">
              <button type="button" onclick="closeModal('schedule-modal')" class="px-3 py-1.5 bg-slate-100 font-bold text-slate-600 rounded-xl">إلغاء</button>
              <button type="submit" class="px-4 py-1.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-bold rounded-xl">حفظ</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", html);
  },

  handleScheduleSubmit(schId) {
    const data = {
      title: document.getElementById("sch-title").value,
      programId: document.getElementById("sch-prog").value,
      dayOfWeek: document.getElementById("sch-day").value,
      time: document.getElementById("sch-time").value,
      typeLabel: document.getElementById("sch-type").value,
      requiresAttendance: document.getElementById("sch-att").checked,
      details: document.getElementById("sch-details").value,
    };
    if (schId) updateSchedule(schId, data);
    else addSchedule(data);
  },

  // =====================================================================
  // 26. سجل العمليات (المدير)
  // =====================================================================
  renderAuditLogView() {
    const logs = (db.auditLog || []).slice(0, 300);
    return `
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-3 border-t-4 border-t-[#64748B]">
        <div class="flex justify-between items-center border-b border-slate-100 pb-3">
          <h2 class="text-lg sm:text-xl font-extrabold text-[#0B2533]"><i class="fa-solid fa-clock-rotate-left text-[#64748B] ml-2"></i> سجل العمليات</h2>
          <span class="text-[11px] text-slate-400">${(db.auditLog || []).length} عملية</span>
        </div>
        <div class="max-h-[70vh] overflow-y-auto divide-y divide-slate-100">
          ${
            logs.length === 0
              ? '<div class="text-center py-8 text-slate-400 text-sm">لا توجد عمليات مسجّلة بعد</div>'
              : logs
                  .map(
                    (l) => `
            <div class="py-2 flex items-start gap-2 text-xs">
              <div class="w-1.5 h-1.5 rounded-full bg-[#D4A359] mt-1.5 shrink-0"></div>
              <div class="flex-1">
                <div class="font-bold text-slate-800">${escHtml(l.action)} <span class="text-slate-400 font-normal">— ${escHtml(l.details || "")}</span></div>
                <div class="text-[10px] text-slate-400 mt-0.5">${escHtml(l.userName || "")} (${escHtml(l.role || "")}) — ${escHtml(l.date || "")}</div>
              </div>
            </div>`,
                  )
                  .join("")
          }
        </div>
      </div>
    `;
  },

  // =====================================================================
  // 27. الفصل الدراسي (المدير)
  // =====================================================================
  renderTermManageView() {
    const app = getAppSettings();
    const t = app.currentTerm || {};
    const terms = app.terms || [];
    return `
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4 border-t-4 border-t-[#9E1B48]">
        <h2 class="text-lg sm:text-xl font-extrabold text-[#0B2533] border-b border-slate-100 pb-3"><i class="fa-solid fa-graduation-cap text-[#9E1B48] ml-2"></i> الفصل الدراسي</h2>

        <div class="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 text-xs">
          <div class="font-black text-[#0B2533]">الفصل الحالي</div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">اسم الفصل:</label>
            <input id="term-name" value="${escHtml(t.name || "")}" class="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">تاريخ بداية الفصل (تُحسب منه الإحصاءات):</label>
            <input id="term-start" type="date" value="${t.startDate || ""}" class="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold">
          </div>
          <button onclick="updateCurrentTerm(document.getElementById('term-name').value, document.getElementById('term-start').value)" class="px-4 py-1.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-bold rounded-xl">حفظ إعدادات الفصل</button>
        </div>

        <div class="bg-amber-50/60 rounded-2xl border border-amber-200 p-4 space-y-2 text-xs">
          <div class="font-black text-[#0B2533]">بدء فصل دراسي جديد</div>
          <p class="text-[11px] text-amber-800">لا تُحذف أي بيانات. تبقى سجلات الفصل السابق محفوظة، وتبدأ الإحصاءات (نسبة الانضباط، التقارير) من تاريخ الفصل الجديد.</p>
          <div class="grid grid-cols-2 gap-2">
            <input id="new-term-name" placeholder="اسم الفصل الجديد" class="bg-white border border-amber-300 rounded-xl p-2 font-bold">
            <input id="new-term-start" type="date" value="${new Date().toISOString().split("T")[0]}" class="bg-white border border-amber-300 rounded-xl p-2 font-bold">
          </div>
          <button onclick="if(confirm('بدء فصل جديد؟ البيانات السابقة تبقى محفوظة.')) startNewTerm(document.getElementById('new-term-name').value, document.getElementById('new-term-start').value)" class="px-4 py-1.5 bg-[#9E1B48] hover:bg-[#7d1439] text-white font-bold rounded-xl">بدء الفصل الجديد</button>
        </div>

        <div>
          <div class="text-xs font-black text-slate-500 mb-2">الفصول (${terms.length})</div>
          <div class="space-y-1.5">
            ${terms
              .map(
                (x) => `
              <div class="flex justify-between items-center p-2 rounded-xl border ${x.id === t.id ? "border-[#9E1B48] bg-rose-50/30" : "border-slate-200"} text-xs">
                <span class="font-bold text-slate-800">${escHtml(x.name)}</span>
                <span class="text-slate-400">يبدأ ${x.startDate}${x.id === t.id ? " — (الحالي)" : ""}</span>
              </div>`,
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  },

  // =====================================================================
  // 28. الاستئذانات
  // =====================================================================
  renderExcusesView() {
    const u = state.currentUser;
    const isStaff = u.role === "admin" || u.role === "supervisor";
    let reqs = (db.excuseRequests || []).slice();
    if (u.role === "supervisor") {
      const progs = u.assignedPrograms || [];
      reqs = reqs.filter((r) => progs.includes(r.programId));
    }
    reqs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const pending = reqs.filter((r) => r.status === "بانتظار الاعتماد");
    const decided = reqs.filter((r) => r.status !== "بانتظار الاعتماد");

    const card = (r) => `
      <div class="p-3 rounded-2xl border ${r.status === "معتمد" ? "border-emerald-200 bg-emerald-50/20" : r.status === "مرفوض" ? "border-rose-200 bg-rose-50/20" : "border-amber-200 bg-amber-50/20"} text-xs space-y-1">
        <div class="flex justify-between items-start gap-2">
          <div>
            <span class="font-bold text-slate-800">${escHtml(r.studentName || "")}</span>
            <span class="text-slate-400"> — ${escHtml(getProgramName(r.programId))}</span>
          </div>
          <span class="badge ${r.status === "معتمد" ? "badge-completed" : r.status === "مرفوض" ? "badge-overdue" : "badge-pending"} text-[9px]">${escHtml(r.status)}</span>
        </div>
        <div class="text-slate-600">التاريخ: ${r.fromDate}${r.toDate && r.toDate !== r.fromDate ? " إلى " + r.toDate : ""}</div>
        <div class="text-slate-600">السبب: ${escHtml(r.reason || "")}</div>
        ${
          isStaff && r.status === "بانتظار الاعتماد"
            ? `<div class="flex gap-1.5 pt-1">
                <button onclick="decideExcuseRequest('${r.id}', true)" class="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg">اعتماد</button>
                <button onclick="decideExcuseRequest('${r.id}', false)" class="px-3 py-1 bg-rose-100 text-rose-700 font-bold rounded-lg">رفض</button>
              </div>`
            : ""
        }
      </div>`;

    return `
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4 border-t-4 border-t-[#8AA838]">
        <div class="flex justify-between items-center border-b border-slate-100 pb-3">
          <h2 class="text-lg sm:text-xl font-extrabold text-[#0B2533]"><i class="fa-solid fa-file-circle-check text-[#8AA838] ml-2"></i> الاستئذانات المسبقة</h2>
          <button onclick="views.openExcuseModal()" class="px-3.5 py-1.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white text-xs font-bold rounded-xl">
            <i class="fa-solid fa-plus ml-1 text-[#D4A359]"></i> ${u.role === "student" ? "تقديم استئذان" : "تسجيل استئذان لطالب"}
          </button>
        </div>
        ${
          pending.length
            ? `<div><div class="text-xs font-black text-amber-700 mb-2">بانتظار الاعتماد (${pending.length})</div><div class="space-y-2">${pending.map(card).join("")}</div></div>`
            : ""
        }
        <div>
          <div class="text-xs font-black text-slate-500 mb-2">السجل (${decided.length})</div>
          <div class="space-y-2">
            ${decided.length ? decided.map(card).join("") : '<div class="text-center py-6 text-slate-400 text-xs">لا يوجد</div>'}
          </div>
        </div>
      </div>
    `;
  },

  openExcuseModal(prefillStudentId) {
    closeModal("excuse-modal");
    const u = state.currentUser;
    const isStudent = u.role === "student";
    let students = [];
    if (!isStudent) {
      students = db.users.filter((x) => x.role === "student" && !x.isRestricted);
      if (u.role === "supervisor") {
        const progs = u.assignedPrograms || [];
        students = students.filter((x) => progs.includes(x.currentProgramId));
      }
    }
    const today = new Date().toISOString().split("T")[0];
    const html = `
      <div id="excuse-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden border-t-4 border-t-[#8AA838]">
          <div class="bg-[#0B2533] text-white px-5 py-4 flex justify-between items-center border-b border-[#D4A359]">
            <h3 class="font-bold text-sm">تقديم استئذان</h3>
            <button onclick="closeModal('excuse-modal')" class="text-slate-300 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <form onsubmit="event.preventDefault(); views.handleExcuseSubmit();" class="p-5 space-y-3 text-xs">
            ${
              isStudent
                ? ""
                : `<div>
                    <label class="block font-bold text-slate-700 mb-1">الطالب:</label>
                    <select id="exc-student" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold">
                      <option value="">— اختر —</option>
                      ${students.map((s) => `<option value="${s.id}" ${prefillStudentId === s.id ? "selected" : ""}>${escHtml(s.name)}</option>`).join("")}
                    </select>
                  </div>`
            }
            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <label class="block font-bold text-slate-700 mb-1">من تاريخ:</label>
                <input id="exc-from" type="date" value="${today}" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold">
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">إلى تاريخ:</label>
                <input id="exc-to" type="date" value="${today}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold">
              </div>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">السبب:</label>
              <textarea id="exc-reason" rows="2" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium" placeholder="مرض / سفر / ظرف عائلي..."></textarea>
            </div>
            ${isStudent ? '<p class="text-[10px] text-slate-500">سيُرسل الطلب للإدارة للاعتماد.</p>' : '<p class="text-[10px] text-emerald-700">سيُعتمد مباشرة ولن يُحتسب غياباً.</p>'}
            <div class="pt-2 flex justify-end gap-2">
              <button type="button" onclick="closeModal('excuse-modal')" class="px-3 py-1.5 bg-slate-100 font-bold text-slate-600 rounded-xl">إلغاء</button>
              <button type="submit" class="px-4 py-1.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-bold rounded-xl">إرسال</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", html);
  },

  handleExcuseSubmit() {
    const isStudent = state.currentUser.role === "student";
    submitExcuseRequest({
      studentId: isStudent
        ? state.currentUser.id
        : (document.getElementById("exc-student") || {}).value,
      fromDate: document.getElementById("exc-from").value,
      toDate: document.getElementById("exc-to").value,
      reason: document.getElementById("exc-reason").value,
    });
  },

  // =====================================================================
  // 29. تقرير الطالب (في حساب الطالب)
  // =====================================================================
  renderMyReportView() {
    const u = state.currentUser;
    const prog = db.programs.find((p) => p.id === u.currentProgramId) || {};
    const app = getAppSettings();
    const termName = (app.currentTerm && app.currentTerm.name) || "";

    const all = studentAttendanceStats(u.id);
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const week = studentAttendanceStats(u.id, localDateStr(weekAgo));
    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 30);
    const month = studentAttendanceStats(u.id, localDateStr(monthAgo));

    const myTasks = (db.tasks || []).filter((t) => t.assignedTo === u.id);
    const doneTasks = myTasks.filter((t) => t.status === "مكتملة");
    const myExcuses = (db.excuseRequests || []).filter(
      (e) => e.studentId === u.id,
    );

    const statBox = (label, s, color) => `
      <div class="rounded-2xl border border-slate-200 p-3 bg-white text-center">
        <div class="text-[10px] text-slate-500 font-bold mb-1">${label}</div>
        <div class="text-2xl font-black" style="color:${color}">${s.rate}%</div>
        <div class="text-[9px] text-slate-400 mt-1">حاضر ${s.present} · غائب ${s.absent} · متأخر ${s.late} · مستأذن ${s.excused}</div>
      </div>`;

    return `
      <div class="space-y-4">
        <div class="bg-gradient-to-r from-[#0B2533] to-[#2B1736] rounded-3xl p-5 text-white border-t-4 border-t-[#D4A359]">
          <span class="inline-block bg-[#D4A359] text-[#0B2533] text-[11px] font-black px-3 py-0.5 rounded-full mb-1.5">تقريري — ${escHtml(termName)}</span>
          <h2 class="text-xl font-black">${escHtml(u.name)}</h2>
          <p class="text-xs text-slate-300 mt-0.5">برنامج ${escHtml(prog.name || "")}</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          ${statBox("انضباط هذا الأسبوع", week, "#169BA2")}
          ${statBox("انضباط هذا الشهر", month, "#D4A359")}
          ${statBox("انضباط الفصل كامل", all, "#9E1B48")}
        </div>

        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <h3 class="font-black text-[#0B2533] text-sm mb-2"><i class="fa-solid fa-list-check text-[#D4A359] ml-1.5"></i> واجباتي (${doneTasks.length}/${myTasks.length} مكتملة)</h3>
          ${
            myTasks.length === 0
              ? '<div class="text-slate-400 text-xs">لا توجد واجبات</div>'
              : myTasks
                  .map((t) => {
                    const ev = getTaskEvaluation(t.id);
                    return `
              <div class="py-2 border-b border-slate-100 last:border-0 text-xs">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-slate-800">${escHtml(t.title)}</span>
                  <span class="badge ${t.status === "مكتملة" ? "badge-completed" : "badge-pending"} text-[9px]">${escHtml(t.status)}</span>
                </div>
                ${
                  ev
                    ? `<div class="mt-1 text-[11px] text-emerald-700 bg-emerald-50/50 rounded-lg px-2 py-1">التقييم: <b>${escHtml(ev.rating || "")}</b>${ev.note ? " — " + escHtml(ev.note) : ""}</div>`
                    : ""
                }
              </div>`;
                  })
                  .join("")
          }
        </div>

        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-black text-[#0B2533] text-sm"><i class="fa-solid fa-file-circle-check text-[#8AA838] ml-1.5"></i> استئذاناتي</h3>
            <button onclick="views.openExcuseModal()" class="px-3 py-1 bg-[#0B2533] text-white text-[11px] font-bold rounded-lg">تقديم استئذان</button>
          </div>
          ${
            myExcuses.length === 0
              ? '<div class="text-slate-400 text-xs">لا يوجد</div>'
              : myExcuses
                  .slice(0, 8)
                  .map(
                    (e) => `
              <div class="py-1.5 border-b border-slate-100 last:border-0 text-xs flex justify-between">
                <span class="text-slate-700">${e.fromDate}${e.toDate && e.toDate !== e.fromDate ? " → " + e.toDate : ""} — ${escHtml(e.reason || "")}</span>
                <span class="badge ${e.status === "معتمد" ? "badge-completed" : e.status === "مرفوض" ? "badge-overdue" : "badge-pending"} text-[9px]">${escHtml(e.status)}</span>
              </div>`,
                  )
                  .join("")
          }
        </div>
      </div>
    `;
  },
};
