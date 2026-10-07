/**
 * parents.js - حساب ولي الأمر
 *
 *  - يدخل ولي الأمر برقم جواله المسجّل كـ"جوال ولي الأمر" عند أبنائه.
 *  - كلمة المرور الأولى = آخر 3 أرقام من جواله، ويُلزَم بتغييرها عند أول دخول،
 *    ويستطيع تغييرها لاحقاً من الإعدادات (مباشرة دون اعتماد).
 *  - يرى لكل ابن: الحضور، الدرجات، الإنذارات، الدروس والتكاليف.
 *  - الحسابات في قائمة مستقلة db.parents (لا تختلط بالطلاب والمشرفين، ولا تؤثر
 *    على فحص تكرار أرقام الجوال). يُنشأ الحساب تلقائياً عند أول دخول صحيح.
 *  - لا شرط على عدد أرقام الجوال حالياً (بطلب الإدارة).
 *
 * db.parents : [{ id: "par_<الجوال>", role: "parent", name, avatar, phone, passHash,
 *                 mustChangePassword, createdAt, lastLoginAt, updatedAt }]
 */

window.parents = (function () {
  function digitsOf(v) {
    return normalizeDigits(v).replace(/\D/g, "");
  }
  function defaultPassword(phoneDigits) {
    return phoneDigits.slice(-3);
  }
  function allParents() {
    if (!Array.isArray(db.parents)) db.parents = [];
    return db.parents;
  }
  function parentIdFor(phoneDigits) {
    return "par_" + phoneDigits;
  }

  // أبناء ولي أمر (الطلاب الذين جوال ولي أمرهم = جواله)
  function childrenOf(phoneDigits) {
    if (!phoneDigits) return [];
    return (db.users || []).filter(
      (u) => u && u.role === "student" && digitsOf(u.fatherPhone) === phoneDigits,
    );
  }

  function displayName(children) {
    const first = children[0] ? String(children[0].name || "").split(" ")[0] : "";
    return first ? `ولي أمر ${first}` : "ولي أمر";
  }

  // =====================================================================
  // الدخول
  // =====================================================================
  // يعيد true إذا تولّى عملية الدخول (نجاحاً أو برسالة خطأ)، وfalse ليكمل الدخول العادي.
  function tryLogin(phoneInput, passInput, matchedUser, programId) {
    const phone = digitsOf(phoneInput);
    if (!phone) return false;
    const kids = childrenOf(phone);
    const existing = allParents().find((p) => p && p.phone === phone) || null;
    if (!kids.length && !existing) return false;

    // إن طابقت كلمة المرور حساب مستخدم بنفس الرقم (طالب/مشرف)، فهو صاحب الدخول
    if (matchedUser && checkUserPassword(matchedUser, passInput)) return false;

    const pid = existing ? existing.id : parentIdFor(phone);
    const lockedMin = loginLockedMinutes(pid);
    if (lockedMin > 0) {
      alert(`تم إيقاف الدخول مؤقتاً بسبب محاولات خاطئة متكررة.\nحاول بعد ${lockedMin} دقيقة.`);
      return true;
    }

    if (phone.length < 3) {
      alert("رقم جوال ولي الأمر غير مكتمل في بيانات الطالب. تواصل مع إدارة المنصة.");
      return true;
    }

    const ok = existing
      ? checkUserPassword(existing, passInput)
      : passInput === defaultPassword(phone);

    if (!ok) {
      if (matchedUser) return false; // نترك الدخول العادي يعرض رسالته
      const left = recordLoginFail(pid);
      alert(
        left > 0
          ? `كلمة المرور غير صحيحة! (متبقٍ ${left} محاولات قبل الإيقاف المؤقت)` +
              (existing ? "" : "\nكلمة المرور الأولى لولي الأمر: آخر 3 أرقام من رقم جواله.")
          : "كلمة المرور غير صحيحة! تم إيقاف الدخول 5 دقائق.",
      );
      return true;
    }
    clearLoginFails(pid);

    let parent = existing;
    if (!parent) {
      parent = {
        id: pid,
        role: "parent",
        name: displayName(kids),
        avatar: "ول",
        phone,
        mustChangePassword: true,
        createdAt: Date.now(),
      };
      setUserPassword(parent, defaultPassword(phone));
      allParents().push(parent);
    }
    parent.lastLoginAt = Date.now();
    parent.updatedAt = Date.now();
    persist("parents");

    state.currentUser = parent;
    state.currentRole = "parent";
    state.currentProgramId = isProgramActive(programId) ? programId : firstActiveProgramId();
    closeModal("login-modal");
    showAppControls(parent);
    updateNotificationsBadge();
    window.__seenNotifInit = false;
    checkNewNotifications();
    registerPushDevice(parent);
    saveSession();
    try {
      logAudit("دخول ولي أمر", parent.name);
    } catch (e) {}
    navigateTo("home");
    if (parent.mustChangePassword) openForceChange();
    return true;
  }

  // نافذة إلزامية لتغيير كلمة المرور الأولى (لا تُغلق قبل التغيير)
  function openForceChange() {
    closeModal("parent-force-pass-modal");
    const html = `
      <div id="parent-force-pass-modal" class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex justify-center items-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border-t-4 border-t-[#D4A359]">
          <div class="bg-[#0B2533] text-white p-5">
            <div class="text-[10px] text-[#D4A359] font-bold">خطوة أخيرة لحماية حسابك</div>
            <h3 class="font-black text-base">اختر كلمة مرور جديدة</h3>
            <p class="text-[11px] text-slate-300 mt-1">كلمة المرور الحالية (آخر 3 أرقام من جوالك) مؤقتة ويسهل تخمينها.</p>
          </div>
          <div class="p-5 space-y-3 text-xs">
            <input id="pf-pass1" type="password" autocomplete="new-password" placeholder="كلمة المرور الجديدة (4 أحرف أو أرقام على الأقل)" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800">
            <input id="pf-pass2" type="password" autocomplete="new-password" placeholder="أعد كتابتها للتأكيد" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800">
            <button onclick="parents.saveNewPassword(true)" class="w-full py-2.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-black rounded-xl transition">حفظ والمتابعة</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", html);
  }

  function saveNewPassword(fromForce) {
    const me = state.currentUser;
    if (!me || me.role !== "parent") return;
    const p1 = String((document.getElementById("pf-pass1") || {}).value || "").trim();
    const p2 = String((document.getElementById("pf-pass2") || {}).value || "").trim();
    if (p1.length < 4) {
      alert("كلمة المرور يجب أن تكون 4 أحرف أو أرقام على الأقل.");
      return;
    }
    if (p1 !== p2) {
      alert("كلمتا المرور غير متطابقتين.");
      return;
    }
    if (p1 === defaultPassword(me.phone)) {
      alert("اختر كلمة مرور مختلفة عن آخر 3 أرقام من جوالك.");
      return;
    }
    setUserPassword(me, cleanText(p1, 60));
    me.mustChangePassword = false;
    me.updatedAt = Date.now();
    persist("parents");
    logAudit("تغيير كلمة مرور ولي أمر", me.name);
    if (fromForce) closeModal("parent-force-pass-modal");
    alert("تم حفظ كلمة المرور الجديدة ✓");
    navigateTo(fromForce ? "home" : "settings");
  }

  // =====================================================================
  // واجهة ولي الأمر
  // =====================================================================
  function renderHome() {
    const me = state.currentUser;
    if (me && me.mustChangePassword && !document.getElementById("parent-force-pass-modal")) {
      setTimeout(openForceChange, 0);
    }
    const kids = childrenOf(me.phone);

    // إكمال إحصاء الفصل من الأرشيف إن لزم (كما في تقرير الطالب)
    if (
      typeof liveAttendanceCutoff === "function" &&
      termStartDate() < liveAttendanceCutoff()
    ) {
      ensureAttendanceArchive(termStartDate(), todayStr(), () => {
        if (state.currentView === "home") navigateTo("home");
      });
    }

    const app = getAppSettings();
    const termName = (app.currentTerm && app.currentTerm.name) || "";

    const kidCard = (k) => {
      const prog = (db.programs || []).find((p) => p.id === k.currentProgramId) || {};
      const all = studentAttendanceStats(k.id);
      const cs = window.content && window.content.studentSummary ? window.content.studentSummary(k) : null;
      return `
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="bg-gradient-to-l from-[#0B2533] to-[#2B1736] text-white p-4 flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-[#D4A359] text-[#0B2533] flex items-center justify-center font-black">${escHtml(String(k.name || "").substring(0, 2))}</div>
            <div>
              <div class="font-black text-sm">${escHtml(k.name)}</div>
              <div class="text-[11px] text-slate-300">برنامج ${escHtml(prog.name || "")}</div>
            </div>
          </div>
          <div class="p-4 space-y-3">
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="rounded-2xl border border-slate-200 p-2.5">
                <div class="text-[10px] text-slate-500 font-bold">الانضباط</div>
                <div class="text-xl font-black text-[#169BA2]">${all.rate}%</div>
                <div class="text-[9px] text-slate-400">حاضر ${all.present} · غائب ${all.absent}</div>
              </div>
              <div class="rounded-2xl border border-slate-200 p-2.5">
                <div class="text-[10px] text-slate-500 font-bold">الدرجات</div>
                <div class="text-xl font-black ${window.grades && window.grades.studentTotal(k.id) < 0 ? "text-rose-700" : "text-emerald-700"}">${window.grades ? fmtPoints(window.grades.studentTotal(k.id)) : "—"}</div>
                <div class="text-[9px] text-slate-400">المجموع</div>
              </div>
              <div class="rounded-2xl border border-slate-200 p-2.5">
                <div class="text-[10px] text-slate-500 font-bold">الدروس والتكاليف</div>
                <div class="text-xl font-black text-[#D4A359]">${cs && cs.ready ? `${cs.done}/${cs.total}` : "…"}</div>
                <div class="text-[9px] text-slate-400">أنجز</div>
              </div>
            </div>
            ${window.grades ? window.grades.renderStudentCard(k.id, "درجاته") : ""}
            ${window.comms ? window.comms.renderStudentWarningsCard(k.id, "إنذاراته") : ""}
          </div>
        </div>`;
    };

    return `
      <div class="space-y-4">
        <div class="bg-gradient-to-r from-[#0B2533] to-[#2B1736] rounded-3xl p-5 text-white border-t-4 border-t-[#D4A359]">
          <span class="inline-block bg-[#D4A359] text-[#0B2533] text-[11px] font-black px-3 py-0.5 rounded-full mb-1.5">متابعة ولي الأمر${termName ? " — " + escHtml(termName) : ""}</span>
          <h2 class="text-xl font-black">أبنائي (${kids.length})</h2>
          <p class="text-xs text-slate-300 mt-0.5">الحضور والدرجات والإنذارات والتكاليف لكل ابن.</p>
        </div>
        ${
          kids.length === 0
            ? '<div class="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500 text-xs">لم نجد طلاباً مسجلين برقم جوالك كولي أمر. تواصل مع إدارة المنصة لتحديث البيانات.</div>'
            : `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">${kids.map(kidCard).join("")}</div>`
        }
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div class="text-xs text-slate-600"><i class="fa-solid fa-bell text-[#D4A359] ml-1"></i> فعّل الإشعارات ليصلك أي إنذار لابنك فوراً.</div>
          <button onclick="views.installAppAndNotify()" class="js-install-notify-btn px-4 py-2 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white text-xs font-black rounded-xl transition">تثبيت التطبيق وتفعيل الإشعارات</button>
        </div>
      </div>`;
  }

  function fmtPoints(n) {
    const v = Math.round((Number(n) || 0) * 100) / 100;
    return (v > 0 ? "+" : "") + v;
  }

  function renderSettings() {
    const me = state.currentUser;
    return `
      <div class="max-w-md space-y-4">
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3 text-xs">
          <h3 class="font-black text-[#0B2533] text-sm"><i class="fa-solid fa-user ml-1.5 text-[#D4A359]"></i> حسابي</h3>
          <div class="flex justify-between border-b border-slate-100 pb-2"><span class="text-slate-500">الاسم</span><span class="font-bold">${escHtml(me.name)}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">رقم الجوال</span><span class="font-bold" dir="ltr">${escHtml(me.phone)}</span></div>
        </div>
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3 text-xs">
          <h3 class="font-black text-[#0B2533] text-sm"><i class="fa-solid fa-key ml-1.5 text-[#D4A359]"></i> تغيير كلمة المرور</h3>
          <input id="pf-pass1" type="password" autocomplete="new-password" placeholder="كلمة المرور الجديدة" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800">
          <input id="pf-pass2" type="password" autocomplete="new-password" placeholder="أعد كتابتها للتأكيد" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800">
          <button onclick="parents.saveNewPassword(false)" class="w-full py-2.5 bg-[#0B2533] hover:bg-[#D4A359] hover:text-[#0B2533] text-white font-black rounded-xl transition">حفظ</button>
        </div>
      </div>`;
  }

  // =====================================================================
  // إدارة أولياء الأمور (المدير)
  // =====================================================================
  function renderAdminView() {
    if (!state.currentUser || state.currentUser.role !== "admin") return "";
    // كل أرقام أولياء الأمور المسجلة عند الطلاب
    const groups = new Map();
    (db.users || []).forEach((u) => {
      if (!u || u.role !== "student") return;
      const ph = digitsOf(u.fatherPhone);
      if (!ph) return;
      if (!groups.has(ph)) groups.set(ph, []);
      groups.get(ph).push(u);
    });
    const rows = Array.from(groups.entries())
      .map(([ph, kids]) => ({ ph, kids, acc: allParents().find((p) => p.phone === ph) || null }))
      .sort((a, b) => (b.acc ? 1 : 0) - (a.acc ? 1 : 0) || String(a.kids[0].name).localeCompare(String(b.kids[0].name), "ar"));
    const activated = rows.filter((r) => r.acc).length;
    const noPhone = (db.users || []).filter((u) => u && u.role === "student" && !digitsOf(u.fatherPhone)).length;

    return `
      <div class="space-y-4">
        <div class="bg-gradient-to-r from-[#0B2533] to-[#2B1736] rounded-3xl p-5 text-white border-t-4 border-t-[#D4A359]">
          <span class="inline-block bg-[#D4A359] text-[#0B2533] text-[11px] font-black px-3 py-0.5 rounded-full mb-1.5">أولياء الأمور</span>
          <h2 class="text-xl font-black">${activated} حساب مفعّل من ${rows.length}</h2>
          <p class="text-xs text-slate-300 mt-1 leading-relaxed">يدخل ولي الأمر من رابط الطلاب برقم جواله المسجّل عند ابنه، وكلمة المرور الأولى آخر 3 أرقام من جواله، ثم يُلزَم بتغييرها. يُفعَّل الحساب تلقائياً عند أول دخول.</p>
        </div>
        ${noPhone ? `<div class="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900"><i class="fa-solid fa-circle-info ml-1"></i> (${noPhone}) طالب بلا رقم جوال ولي أمر — أضفه من بيانات الطالب ليتمكن ولي أمره من الدخول.</div>` : ""}
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5">
          ${
            rows.length === 0
              ? '<div class="text-center py-6 text-slate-400 text-xs">لا توجد أرقام أولياء أمور مسجلة بعد</div>'
              : `<div class="overflow-x-auto rounded-2xl border border-slate-200"><table class="w-full text-xs text-right">
                  <thead class="bg-slate-50 text-slate-500"><tr><th class="p-2.5 font-bold">جوال ولي الأمر</th><th class="p-2.5 font-bold">الأبناء</th><th class="p-2.5 font-bold">الحالة</th><th class="p-2.5"></th></tr></thead>
                  <tbody>${rows
                    .map(
                      (r) => `
                    <tr class="border-t border-slate-100">
                      <td class="p-2.5 font-bold text-slate-800" dir="ltr">${escHtml(r.ph)}</td>
                      <td class="p-2.5 text-slate-600">${r.kids.map((k) => escHtml(k.name)).join("، ")}</td>
                      <td class="p-2.5">${
                        r.acc
                          ? `<span class="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">مفعّل${r.acc.mustChangePassword ? " (لم يغيّر كلمة المرور)" : ""}</span>`
                          : '<span class="text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-50 text-slate-500 border border-slate-200">لم يدخل بعد</span>'
                      }</td>
                      <td class="p-2.5 text-left">${r.acc ? `<button onclick="parents.resetPassword('${r.acc.id}')" class="px-2.5 py-1 bg-slate-100 hover:bg-[#9E1B48] hover:text-white text-slate-700 rounded-lg text-[10px] font-bold">إعادة تعيين كلمة المرور</button>` : ""}</td>
                    </tr>`,
                    )
                    .join("")}</tbody></table></div>`
          }
        </div>
      </div>`;
  }

  function resetPassword(parentId) {
    if (!state.currentUser || state.currentUser.role !== "admin") return;
    const p = allParents().find((x) => x.id === parentId);
    if (!p) return;
    if (!confirm(`إعادة كلمة مرور ${p.name} (${p.phone}) إلى آخر 3 أرقام من جواله؟\nسيُطلب منه تغييرها عند الدخول.`)) return;
    setUserPassword(p, defaultPassword(p.phone));
    p.mustChangePassword = true;
    p.updatedAt = Date.now();
    persist("parents");
    logAudit("إعادة تعيين كلمة مرور ولي أمر", `${p.name} ${p.phone}`);
    alert("تمت إعادة التعيين ✓");
    navigateTo("parents");
  }

  // حسابات أولياء أمور طالب (لإرسال إشعار الإنذار لهم)
  function parentsOfStudent(student) {
    const ph = student ? digitsOf(student.fatherPhone) : "";
    if (!ph) return [];
    return allParents().filter((p) => p.phone === ph);
  }

  return {
    tryLogin,
    saveNewPassword,
    renderHome,
    renderSettings,
    renderAdminView,
    resetPassword,
    parentsOfStudent,
  };
})();
