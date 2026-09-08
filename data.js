/**
 * data.js - قاعدة البيانات الأولية (البذور) وتهيئة الربط السحابي مع Firebase Firestore
 * المشروع: toti-ae62c
 *
 * ملاحظة: البيانات هنا هي "القيم الافتراضية" فقط. الحفظ والمزامنة الفعلية تتم عبر store.js
 * (تخزين محلي localStorage دائماً + مزامنة سحابية Firestore عند توفر الاتصال).
 */

// تهيئة إعدادات Firebase الخاصة بمشروعك
const firebaseConfig = {
  apiKey: "AIzaSyDR4KcHKSIxRGzrFmkJ536j9pPGLzo18-k",
  authDomain: "toti-ae62c.firebaseapp.com",
  projectId: "toti-ae62c",
  storageBucket: "toti-ae62c.firebasestorage.app",
  messagingSenderId: "42863617740",
  appId: "1:42863617740:web:e1ad90b5b8ab752c84c469",
  measurementId: "G-YYVRCKPMQR",
};

// تشغيل Firebase وربط Firestore
try {
  if (typeof firebase !== "undefined" && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    window.dbFirestore = firebase.firestore();

    // تسجيل دخول مجهول (Anonymous Auth) - أساس لتأمين قواعد Firestore.
    // الخطوات: 1) فعّل "Anonymous" في Firebase Console > Authentication
    //          2) غيّر القيمة أدناه إلى true   3) انشر التطبيق   4) طبّق قواعد الأمان
    window.USE_ANON_AUTH = false;
    if (window.USE_ANON_AUTH && firebase.auth) {
      window.__authReady = firebase
        .auth()
        .signInAnonymously()
        .then(() => true)
        .catch((e) => {
          console.warn("تعذّر تسجيل الدخول المجهول:", e && e.code);
          return false;
        });
    } else {
      window.__authReady = Promise.resolve(false);
    }
  }
} catch (e) {
  console.warn("تعذر تهيئة Firebase:", e);
}

window.db = {
  // 1. قائمة المعايير والمهام الـ 29 المعتمدة كقوالب جاهزة للتكليف
  taskTemplates: [
    "أن يقوم مسؤول شؤون الطلاب بنفسه بالتحضير الأسبوعي",
    "أن يتضمن التحضير الأسبوعي فرز لنوع الغياب (بعذر / بدون عذر)",
    "إبلاغ مشرفي الحلقات والمجمعات القرآنية بانضباط طلابهم بالحضور الأسبوعي",
    "أن تتواصل إدارة البرنامج مع الطلاب المتغيبين بدون عذر",
    "أن يسلم الشرح قبل أول يوم من أيام الدرس الأسبوعي",
    "أن يسلم للطلاب جدول قراءة الشرح قبل 5 أيام من بداية الدرس الأسبوعي",
    "أن يذكر الطلاب بقراءة المقدار الأسبوعي للمتن في المجموعة الطلابية قبل الدرس",
    "أن يذكر الطلاب بقراءة المقدار الأسبوعي للشرح في المجموعة الطلابية بعد الدرس",
    "أن يرصد إنجاز الطلاب في القراءة القبلية للمتن والشرح",
    "أن تعد إدارة البرنامج السؤال الأسبوعي ويكون متعلق بما تم شرحه في هذا الأسبوع",
    "أن يكرم في كل أسبوع الفائز بالسؤال الأسبوعي",
    "أن يكرم المتميزين في أداء القراءة وعدم الغياب بعد آخر درس مباشرة",
    "أن يتم تنفيذ ساعات المقرر وفق الخطة العلمية",
    "أن يتم التنسيق مع ملقي مناسب قبل بداية الدرس الأسبوعي بمدة لا تقل عن أسبوع",
    "أن يصل توصيف المقرر للملقي",
    "أن يصل تقسيم المقرر للملقي",
    "أن يتابع الملقي أسبوعياً في إنجاز المقرر الأسبوعي المحدد",
    "استخدام الملقي للأدوات التعليمية المساندة وتفعيله لها أثناء الإلقاء",
    "أن يتم تقييم الملقي بعد انتهاء الدرس الأسبوعي",
    "أن يتم رصد مدى رضا الملقي عن الدرس الأسبوعي",
    "أن يكون الحد الأعلى لوقت الدرس 90 دقيقة والحد الأدنى 60 دقيقة",
    "أن يكون الدرس الأسبوعي حضورياً بنسبة 80% ولا يصار إلى تنفيذه عن بعد إلا عند الظروف الاستثنائية",
    "أن تكون أسئلة الاختبار متنوعة بين المقالي والموضوعي على أن تكون نسبة الأسئلة المقالية 30% من الاختبار",
    "أن يقام اختبار الدرس الأسبوعي حضورياً",
    "أن يقام الاختبار النهائي بعد آخر درس بمدة لا تقل عن 4 أيام ولا تزيد عن 7 أيام",
    "أن يتم إجراء اختبار بديل للمتغيبين والراسبين بعد الاختبار الأساسي للدرس الأسبوعي",
    "أن يبلغ الطلاب ومشرفي الحلقات بدرجات الاختبار",
    "أن يكون مكان الدرس الأسبوعي مهيئاً بالأدوات التعليمية المساندة (سبورة - شاشة - سماعات - بروجكتر)",
    "أن يتم رصد مدى رضا الطلاب عن الدرس الأسبوعي",
  ],

  // 2. برامج المنصة الأساسية - تأصيل ورسوخ مغلقان حالياً (isClosed) ولا يتم العمل عليهما
  programs: [
    {
      id: "prog_taheel",
      name: "تأهيل",
      color: "#169BA2",
      levelsCount: 2,
    },
    {
      id: "prog_taseel",
      name: "تأصيل",
      color: "#0B2533",
      levelsCount: 3,
      isClosed: true,
    },
    {
      id: "prog_rasookh",
      name: "رسوخ",
      color: "#D4A359",
      levelsCount: 2,
      isClosed: true,
    },
  ],

  // 3. مستويات البرامج
  levels: [
    {
      id: "lvl_th_1",
      programId: "prog_taheel",
      name: "المستوى الأول - تأسيس",
      order: 1,
    },
    {
      id: "lvl_th_2",
      programId: "prog_taheel",
      name: "المستوى الثاني - تمكين",
      order: 2,
    },
    {
      id: "lvl_ts_1",
      programId: "prog_taseel",
      name: "المستوى الأول - أصول وتمهيد",
      order: 1,
    },
    {
      id: "lvl_ts_2",
      programId: "prog_taseel",
      name: "المستوى الثاني - تأصيل وتعميق",
      order: 2,
    },
    {
      id: "lvl_ts_3",
      programId: "prog_taseel",
      name: "المستوى الثالث - إتقان وبحث",
      order: 3,
    },
    {
      id: "lvl_rs_1",
      programId: "prog_rasookh",
      name: "المستوى المتقدم الأول",
      order: 1,
    },
    {
      id: "lvl_rs_2",
      programId: "prog_rasookh",
      name: "المستوى المتقدم الثاني",
      order: 2,
    },
  ],

  // 4. المجموعات الدراسية
  groups: [
    {
      id: "grp_th_001",
      levelId: "lvl_th_1",
      programId: "prog_taheel",
      name: "المجموعة الأولى - تأهيل",
      supervisorId: null,
    },
  ],

  // 5. المستخدمون والحسابات - حساب المدير فقط (كل الحسابات الوهمية حُذفت)
  //    تُضاف بقية الحسابات من داخل التطبيق. كلمة المرور الافتراضية للجميع: 1234
  users: [
    {
      id: "admin",
      name: "مدير المنصة",
      role: "admin",
      phone: "0500000000",
      nationalId: "1000000000",
      password: "1234",
      email: "admin@totin.sa",
      avatar: "مد",
      color: "#0B2533",
      isRestricted: false,
    },
  ],

  // 6. طلبات التسجيل الجديدة
  registrationRequests: [],

  // 7. طلبات تعديل البيانات وكلمات المرور المقدمة للاعتماد
  pendingProfileEdits: [],

  // 8. سجل مشاركات الطلاب في البرامج
  studentPrograms: [],

  // 9. مسار التاريخ التعليمي للطالب
  studentPaths: [],

  // 10. عناصر الجدول الأسبوعي (نماذج لبرنامج تأهيل فقط)
  schedules: [
    {
      id: "sch_th_1",
      programId: "prog_taheel",
      groupId: "grp_th_001",
      dayOfWeek: 1,
      time: "04:30 م",
      title: "مدخل البناء العلمي والتأسيس",
      type: "lesson",
      typeLabel: "درس",
      status: "قادم",
      requiresAttendance: true,
      details: "شرح المقدمة المنهجية لطلاب التأهيل.",
    },
    {
      id: "sch_th_2",
      programId: "prog_taheel",
      groupId: "grp_th_001",
      dayOfWeek: 4,
      time: "05:00 م",
      title: "حلقة مدارسة التلاوة وضبط الأداء",
      type: "lesson",
      typeLabel: "نشاط",
      status: "قادم",
      requiresAttendance: true,
      details: "تطبيق أحكام التجويد ومخارج الحروف.",
    },
  ],

  // 11. سجلات الحضور والتحضير
  attendanceRecords: [],

  // 12. سجل المهام والتكليفات
  tasks: [],

  // 13. لوحة الإعلانات العامة
  announcements: [],

  // 14. التنبيهات والإشعارات
  notifications: [],

  // 15. طلبات الاستئذان المسبق (الطالب يقدّم، المدير/المشرف يعتمد)
  excuseRequests: [],

  // 16. سجل العمليات (Audit log) - من فعل ماذا ومتى
  auditLog: [],

  // 17. تقييمات مهام الطلاب (rating + note لكل مهمة موجّهة لطالب)
  taskEvaluations: [],

  // 18. إعدادات التطبيق (وثيقة واحدة) - الفصل الدراسي الحالي، اسم الجهة، رسائل واتساب
  appSettings: [
    {
      id: "app",
      currentTerm: { id: "term_1", name: "الفصل الأول", startDate: "2026-01-01" },
      terms: [
        { id: "term_1", name: "الفصل الأول", startDate: "2026-01-01" },
      ],
      waTemplates: {
        absence:
          "السلام عليكم، نفيدكم بأن الطالب {student} تغيّب عن جلسة اليوم ({date}) في برنامج {program}. نرجو المتابعة.",
        report:
          "تقرير الطالب {student} — برنامج {program}\nالحضور: {present} | الغياب: {absent} | التأخر: {late} | نسبة الانضباط: {rate}%\n{note}",
      },
    },
  ],
};

// نسخة من البذور الافتراضية للرجوع إليها عند الحاجة (لا تُعدّل)
window.__DB_SEED__ = JSON.parse(JSON.stringify(window.db));
