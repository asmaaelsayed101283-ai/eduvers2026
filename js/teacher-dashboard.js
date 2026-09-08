/* =================================================================
   EDUVERSE — TEACHER DASHBOARD SCRIPT
   Vanilla JS, no frameworks, no backend. Everything here manipulates
   one in-memory content store (mirrored to localStorage) shaped so
   it maps directly onto the rest of the platform's data model:

     Subject  →  a Learning World card (learning-worlds.html)
     Unit     →  a Unit card            (units.html)
     Lesson   →  a Lesson Engine instance, with its own Missions

   This file never hardcodes "Science" or "English" as special
   cases — every manager (Subjects/Units/Lessons) operates on
   whatever data exists, and a teacher can add any subject, in any
   language, with any icon/color.
   ================================================================= */

const STORAGE_KEY = "eduverse:teacher-content";

/* -----------------------------------------------------------------
   REUSABLE PICKER OPTIONS (icons, colors, difficulty levels)
   ----------------------------------------------------------------- */
const ICON_CHOICES = ["🧪", "📖", "➗", "✍️", "🌍", "💻", "🇬🇧", "🇫🇷", "🎨", "🎵", "⚽", "🧬", "🔬", "📐", "🏛️", "🧭"];
const COLOR_PRESETS = [
  { c1: "#3A7BFF", c2: "#22D3EE" },
  { c1: "#8B5CF6", c2: "#3A7BFF" },
  { c1: "#22D3EE", c2: "#8B5CF6" },
  { c1: "#FF9F45", c2: "#8B5CF6" },
  { c1: "#22D3EE", c2: "#FF9F45" },
  { c1: "#3A7BFF", c2: "#8B5CF6" },
];
const DIFFICULTY_LEVELS = ["مبتدئ", "متوسط", "متقدم"];

const UPLOAD_TYPES = [
  { type: "pdf", icon: "📄", label: "PDF", accept: ".pdf" },
  { type: "word", icon: "📝", label: "Word", accept: ".doc,.docx" },
  { type: "ppt", icon: "📊", label: "PowerPoint", accept: ".ppt,.pptx" },
  { type: "image", icon: "🖼️", label: "صورة", accept: "image/*" },
  { type: "video", icon: "🎬", label: "فيديو", accept: "video/*" },
];

/* Game toggle catalog now lives in js/games-engine.js (GamesEngine.CATALOG)
   so the Teacher Dashboard and the student-facing Lesson Engine always
   agree on exactly which games exist and what data each one needs. */

/** Resolves which subject a lesson belongs to, via its unit — used to
 *  decide which game catalog (science/english/general) to offer. */
function getSubjectIdForLesson(lesson) {
  const unit = content.units.find((u) => u.id === lesson.unitId);
  return unit?.subjectId || "general";
}

/* -----------------------------------------------------------------
   DEFAULT CONTENT (seed data — a teacher would build on top of this)
   ----------------------------------------------------------------- */
const defaultContent = {
  subjects: [
    { id: "science", name: "العلوم", icon: "🧪", c1: "#3A7BFF", c2: "#22D3EE" },
    { id: "english", name: "اللغة الإنجليزية", icon: "🇬🇧", c1: "#8B5CF6", c2: "#3A7BFF" },
    { id: "math", name: "الرياضيات", icon: "➗", c1: "#22D3EE", c2: "#8B5CF6" },
    { id: "arabic", name: "اللغة العربية", icon: "📖", c1: "#FF9F45", c2: "#8B5CF6" },
    { id: "social", name: "الدراسات الاجتماعية", icon: "🌍", c1: "#22D3EE", c2: "#FF9F45" },
    { id: "ict", name: "الحاسوب وتقنية المعلومات", icon: "💻", c1: "#3A7BFF", c2: "#8B5CF6" },
  ],
  units: [
    { id: "u-science-1", subjectId: "science", title: "الوحدة الأولى: المادة", difficulty: "متوسط", grade: "grade5" },
  ],
  lessons: [
    {
      id: "l-science-1",
      unitId: "u-science-1",
      title: "الدرس الأول: بنية الذرة",
      grade: "grade5",
      status: "published",
      published: true,
      description: "رحلة داخل الذرة لاكتشاف مكوناتها الأساسية: البروتونات والنيوترونات والإلكترونات، وكيف بُنيت أول نماذج علمية لوصفها.",
      objectives: [
        "تعريف المادة والذرة كوحدة بنائية لها.",
        "التعرف على مكونات الذرة الفرعية وخصائصها.",
        "كتابة الرموز الكيميائية للعناصر بشكل صحيح.",
      ],
      image: "",
      video: "",
      pdf: "",
      ppt: "",
      audio: "",
      vocabulary: [
        { term: "Atom", definition: "الوحدة البنائية الأساسية لكل المادة." },
        { term: "Nucleus", definition: "مركز الذرة ويحتوي على البروتونات والنيوترونات." },
      ],
      homework: "اكتب فقرة قصيرة تشرح بها الفرق بين البروتون والنيوترون والإلكترون.",
      quiz: [
        {
          question: "ما هي الوحدة البنائية لكل المادة؟",
          options: ["الجزيء", "الذرة", "الخلية", "المركب"],
          correctIndex: 1,
          explanation: "الذرة هي الوحدة البنائية والتركيبية لكل المادة.",
        },
      ],
      challenge: "تحدٍ إضافي: ابحث عن عنصر كيميائي رمزه يختلف عن اسمه بالإنجليزية، ووضّح السبب.",
      summary: "المادة كل ما له كتلة ويشغل حيزًا، والذرة هي وحدتها البنائية، وتتكون من نواة (بروتونات ونيوترونات) تدور حولها الإلكترونات.",
      xp: 165,
      coins: 60,
      difficulty: "متوسط",
      sentences: [],
      diagramLabels: [
        { x: 50, y: 35, term: "Nucleus" },
      ],
      virtualLab: {
        title: "تجربة بناء نموذج الذرة",
        materials: ["كرات بلاستيكية صغيرة (بروتونات)", "كرات بيضاء (نيوترونات)", "خرز أزرق (إلكترونات)", "قاعدة نموذج"],
        steps: [
          "ضع البروتونات والنيوترونات معًا في المنتصف لتكوين النواة.",
          "رتّب الإلكترونات حول النواة في مسارات دائرية.",
          "قارن نموذجك بنموذج راذرفورد الأصلي.",
        ],
        safety: ["تعامل مع القطع الصغيرة بحذر.", "لا تضع أي قطعة في فمك."],
        simulation: { correctCombo: ["البروتونات", "النيوترونات"] },
        questions: [
          {
            question: "أين توجد البروتونات والنيوترونات في نموذج الذرة؟",
            options: ["في النواة", "خارج الذرة", "في المدارات الخارجية", "لا مكان محدد"],
            correctIndex: 0,
          },
        ],
      },
      missions: [
        { id: "m1", order: 1, icon: "⚛️", xp: 40, coins: 15, stars: 3 },
        { id: "m2", order: 2, icon: "🧬", xp: 55, coins: 20, stars: 2 },
        { id: "m3", order: 3, icon: "🌀", xp: 70, coins: 25, stars: 3 },
      ],
      gameSettings: { dragDrop: true, match: true, memory: true, classification: true, quizChallenge: true, puzzle: true, labelDiagram: true },
    },
  ],
  activities: [],
};

/** A brand-new lesson (via "+ إضافة درس") starts with this shape — every
 *  field the brief requires exists from the start, just empty/default,
 *  so the edit form never has to guess about a missing property. */
function emptyLesson() {
  return {
    description: "",
    objectives: [],
    image: "",
    video: "",
    pdf: "",
    ppt: "",
    audio: "",
    vocabulary: [],
    homework: "",
    quiz: [],
    challenge: "",
    summary: "",
    sentences: [],
    diagramLabels: [],
    virtualLab: { title: "", materials: [], steps: [], safety: [], simulation: { correctCombo: ["", ""] }, questions: [] },
    missions: [{ id: makeId("mission"), order: 1, icon: "🎯", xp: 20, coins: 10, stars: 3 }],
    gameSettings: {},
  };
}

let content = loadContent();
let uploadedFiles = []; // session-only, intentionally not persisted

function loadContent() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const merged = raw ? { ...structuredClone(defaultContent), ...JSON.parse(raw) } : structuredClone(defaultContent);
    // DATA SAFETY / MIGRATION: lessons saved before draft/publish existed
    // had no status at all — they were simply always visible to
    // students, so we preserve that behavior by treating any lesson
    // missing a `published` flag as already published, rather than
    // silently hiding a teacher's existing work.
    merged.lessons = (merged.lessons || []).map((l) =>
      l.published === undefined ? { ...l, status: l.status || "published", published: true } : l
    );
    return merged;
  } catch {
    return structuredClone(defaultContent);
  }
}

/** Persists `content` to localStorage. Returns true on success, false
 *  if the write failed (most commonly QuotaExceededError — the
 *  browser's per-origin storage limit, which a large uploaded lesson
 *  image can hit) so callers can tell the teacher instead of the
 *  lesson silently vanishing on the next reload. */
function saveContent() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
    return true;
  } catch (err) {
    console.error("EduVerse: failed to save lesson content —", err);
    return false;
  }
}

/** Adds an entry to the top of the recent-activity feed (capped at 8). */
function logActivity(icon, text) {
  content.activities.unshift({ icon, text, time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }) });
  content.activities = content.activities.slice(0, 8);
  saveContent();
  renderActivity();
}

/* -----------------------------------------------------------------
   SMALL ID HELPER (client-side only — a real backend would assign these)
   ----------------------------------------------------------------- */
function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

/* ===================================================================
   TEACHER PROFILE (separate localStorage key from the curriculum
   content, so a teacher's name/avatar/bio is independent of their
   subjects/units/lessons — and survives even if content is reset).
   =================================================================== */
const PROFILE_STORAGE_KEY = "eduverse:teacher-profile";
const PROFILE_AVATAR_CHOICES = ["🧑‍🏫", "👩‍🏫", "👨‍🏫", "🧑‍💻", "👩‍🔬", "👨‍🔬", "🧕", "👳", "🧑‍🎨", "👩‍🎓", "👨‍🎓", "🦉"];

const defaultProfile = {
  name: "",
  email: "",
  subject: "",
  school: "",
  bio: "",
  avatar: PROFILE_AVATAR_CHOICES[0],
};

let profile = loadProfile();

function loadProfile() {
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return { ...defaultProfile };
    return { ...defaultProfile, ...JSON.parse(raw) };
  } catch {
    return { ...defaultProfile };
  }
}

function saveProfile() {
  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    /* localStorage unavailable — profile still works for this session */
  }
}

/** Reflects the saved profile in the small topbar chip on every panel. */
function renderTopbarProfile() {
  const avatarEl = document.getElementById("tdTopbarAvatar");
  const nameEl = document.getElementById("tdTopbarName");
  if (avatarEl) avatarEl.textContent = profile.avatar || "🧑‍🏫";
  if (nameEl) nameEl.textContent = profile.name || "معلّم/ة EduVerse";
}

/** Fills in the Profile panel's form + avatar picker + header preview. */
function renderProfilePanel() {
  const picker = document.getElementById("profileAvatarPicker");
  if (picker) {
    picker.innerHTML = PROFILE_AVATAR_CHOICES.map(
      (icon) => `<button type="button" class="td-emoji-btn${profile.avatar === icon ? " is-selected" : ""}" data-icon="${icon}">${icon}</button>`
    ).join("");
  }

  const nameInput = document.getElementById("profileNameInput");
  const emailInput = document.getElementById("profileEmailInput");
  const subjectInput = document.getElementById("profileSubjectInput");
  const schoolInput = document.getElementById("profileSchoolInput");
  const bioInput = document.getElementById("profileBioInput");
  if (nameInput) nameInput.value = profile.name;
  if (emailInput) emailInput.value = profile.email;
  if (subjectInput) subjectInput.value = profile.subject;
  if (schoolInput) schoolInput.value = profile.school;
  if (bioInput) bioInput.value = profile.bio;

  updateProfileHeaderPreview();
}

function updateProfileHeaderPreview() {
  const avatarPreview = document.getElementById("profileAvatarPreview");
  const headerName = document.getElementById("profileHeaderName");
  const headerRole = document.getElementById("profileHeaderRole");
  if (avatarPreview) avatarPreview.textContent = profile.avatar || "🧑‍🏫";
  if (headerName) headerName.textContent = profile.name || "معلّم/ة EduVerse";
  if (headerRole) headerRole.textContent = [profile.subject, profile.school].filter(Boolean).join(" — ") || "أضف بياناتك أدناه";
}

function setupProfilePanel() {
  document.getElementById("profileAvatarPicker")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".td-emoji-btn");
    if (!btn) return;
    document.querySelectorAll("#profileAvatarPicker .td-emoji-btn").forEach((b) => b.classList.remove("is-selected"));
    btn.classList.add("is-selected");
    profile.avatar = btn.dataset.icon;
    updateProfileHeaderPreview();
  });

  ["profileNameInput", "profileSubjectInput", "profileSchoolInput"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", updateProfileHeaderPreview);
  });

  document.getElementById("saveProfileBtn")?.addEventListener("click", () => {
    profile.name = document.getElementById("profileNameInput").value.trim();
    profile.email = document.getElementById("profileEmailInput").value.trim();
    profile.subject = document.getElementById("profileSubjectInput").value.trim();
    profile.school = document.getElementById("profileSchoolInput").value.trim();
    profile.bio = document.getElementById("profileBioInput").value.trim();

    saveProfile();
    renderTopbarProfile();
    updateProfileHeaderPreview();
    logActivity("👤", "تم تحديث الملف الشخصي");
    showToast("✅ تم حفظ الملف الشخصي");
  });
}

/* ===================================================================
   LOGIN VIEW → DASHBOARD VIEW
   =================================================================== */
function setupLoginForm() {
  const form = document.getElementById("teacherLoginForm");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const emailInput = form.querySelector('input[type="email"]');
    const name = emailInput?.value ? emailInput.value.split("@")[0] : "المعلم/ـة";

    if (typeof Auth !== "undefined") {
      Auth.login("teacher", { name });
    }

    // First-time convenience: seed the Profile panel from the login
    // form so the topbar isn't blank before a teacher visits "الملف
    // الشخصي" themselves. Never overwrites a profile they already saved.
    if (!profile.name) {
      profile.name = name;
      if (emailInput?.value) profile.email = emailInput.value.trim();
      saveProfile();
    }

    document.getElementById("teacherLoginView").hidden = true;
    document.getElementById("teacherDashboardView").hidden = false;
    renderEverything();
  });

  // If a teacher session already exists (from a previous visit, or
  // from choosing "معلم" on login.html), skip straight to the
  // dashboard instead of showing the login view again.
  if (typeof Auth !== "undefined") {
    const user = Auth.getUser();
    if (user && user.role === "teacher") {
      document.getElementById("teacherLoginView").hidden = true;
      document.getElementById("teacherDashboardView").hidden = false;
      renderEverything();
    }
  }

  document.getElementById("teacherLogoutBtn")?.addEventListener("click", (e) => {
    if (typeof Auth !== "undefined") {
      e.preventDefault();
      Auth.logout("index.html");
    }
    // if Auth isn't loaded for any reason, the link's own href="index.html" still works
  });
}

/* ===================================================================
   SIDEBAR NAVIGATION (panel switching)
   =================================================================== */
const PANEL_TITLES = {
  home: "الرئيسية",
  profile: "الملف الشخصي",
  subjects: "إدارة المواد",
  units: "إدارة الوحدات",
  lessons: "إدارة الدروس",
  uploads: "رفع الملفات",
  missions: "إعدادات المهام",
  games: "إعدادات الألعاب",
};

function setupSidebarNav() {
  const navButtons = document.querySelectorAll(".td-nav__item");
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const panelId = btn.dataset.panel;

      navButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
      document.querySelectorAll(".td-panel").forEach((panel) => {
        panel.classList.toggle("is-active", panel.dataset.panel === panelId);
      });

      document.getElementById("tdPanelTitle").textContent = PANEL_TITLES[panelId] || "";
    });
  });
}

/* ===================================================================
   HOME PANEL — stats + recent activity
   =================================================================== */
function renderStats() {
  const grid = document.getElementById("tdStatsGrid");
  if (!grid) return;

  const totalMissions = content.lessons.reduce((sum, l) => sum + l.missions.length, 0);

  const stats = [
    { icon: "🧭", label: "إجمالي المواد", value: content.subjects.length, c1: "#3A7BFF", c2: "#22D3EE" },
    { icon: "📦", label: "إجمالي الوحدات", value: content.units.length, c1: "#8B5CF6", c2: "#3A7BFF" },
    { icon: "📘", label: "إجمالي الدروس", value: content.lessons.length, c1: "#22D3EE", c2: "#8B5CF6" },
    { icon: "🎯", label: "إجمالي المهام", value: totalMissions, c1: "#FF9F45", c2: "#8B5CF6" },
    { icon: "🧑‍🎓", label: "إجمالي الطلاب", value: "—", c1: "#94A3B8", c2: "#CBD5E1", placeholder: true },
  ];

  grid.innerHTML = stats
    .map(
      (s) => `
      <div class="td-stat-card${s.placeholder ? " td-stat-card--placeholder" : ""}">
        <div class="td-stat-card__icon" style="--c1:${s.c1}; --c2:${s.c2}">${s.icon}</div>
        <strong>${s.value}</strong>
        <span>${s.label}${s.placeholder ? " (سيُربط لاحقًا بقاعدة بيانات الطلاب)" : ""}</span>
      </div>
    `
    )
    .join("");
}

function renderActivity() {
  const list = document.getElementById("tdActivityList");
  if (!list) return;

  if (content.activities.length === 0) {
    list.innerHTML = `<li class="td-activity-empty">لا توجد أنشطة بعد — ابدأ بإضافة مادة أو وحدة أو درس</li>`;
    return;
  }

  list.innerHTML = content.activities
    .map(
      (a) => `
      <li class="td-activity-item">
        <span class="td-activity-item__icon">${a.icon}</span>
        <span>${a.text}</span>
        <span class="td-activity-item__time">${a.time}</span>
      </li>
    `
    )
    .join("");
}

/* ===================================================================
   SUBJECT MANAGER
   =================================================================== */
function renderSubjectsTable() {
  const body = document.getElementById("subjectsTableBody");
  if (!body) return;

  if (content.subjects.length === 0) {
    body.innerHTML = `<tr class="td-empty-row"><td colspan="5">لا توجد مواد بعد</td></tr>`;
    return;
  }

  body.innerHTML = content.subjects
    .map((s) => {
      const unitsCount = content.units.filter((u) => u.subjectId === s.id).length;
      const lessonsCount = content.lessons.filter((l) => {
        const unit = content.units.find((u) => u.id === l.unitId);
        return unit && unit.subjectId === s.id;
      }).length;

      return `
        <tr>
          <td>
            <div class="td-table__name">
              <span class="td-table__icon" style="background: linear-gradient(135deg, ${s.c1}, ${s.c2})">${s.icon}</span>
              ${s.name}
            </div>
          </td>
          <td><span class="td-color-dot" style="background: linear-gradient(135deg, ${s.c1}, ${s.c2})"></span></td>
          <td>${unitsCount}</td>
          <td>${lessonsCount}</td>
          <td>
            <div class="td-row-actions">
              <button type="button" class="td-row-btn" data-action="edit-subject" data-id="${s.id}" title="تعديل">✏️</button>
              <button type="button" class="td-row-btn td-row-btn--danger" data-action="delete-subject" data-id="${s.id}" title="حذف">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

/** Builds the Add/Edit Subject modal form. */
function openSubjectModal(subjectId = null) {
  const existing = subjectId ? content.subjects.find((s) => s.id === subjectId) : null;
  const selectedColor = existing ? { c1: existing.c1, c2: existing.c2 } : COLOR_PRESETS[0];

  const bodyHtml = `
    <label class="td-field">
      <span>اسم المادة</span>
      <input type="text" id="subjectNameInput" value="${existing?.name || ""}" placeholder="مثال: الفرنسية" />
    </label>

    <label class="td-field">
      <span>أيقونة المادة</span>
      <div class="td-emoji-picker" id="subjectIconPicker">
        ${ICON_CHOICES.map((icon) => `<button type="button" class="td-emoji-btn${existing?.icon === icon ? " is-selected" : ""}" data-icon="${icon}">${icon}</button>`).join("")}
      </div>
    </label>

    <label class="td-field">
      <span>لون المادة</span>
      <div class="td-swatches" id="subjectColorPicker">
        ${COLOR_PRESETS.map(
          (c) => `<span class="td-swatch${c.c1 === selectedColor.c1 && c.c2 === selectedColor.c2 ? " is-selected" : ""}" data-c1="${c.c1}" data-c2="${c.c2}" style="background: linear-gradient(135deg, ${c.c1}, ${c.c2})"></span>`
        ).join("")}
      </div>
    </label>

    <div class="td-form-grid">
      <label class="td-field">
        <span>أيقونة المادة (رفع صورة)</span>
        <input type="file" accept="image/*" id="subjectIconUpload" />
        <div class="td-upload-preview" id="subjectIconPreview">لا توجد صورة</div>
      </label>
      <label class="td-field">
        <span>بانر المادة (رفع صورة)</span>
        <input type="file" accept="image/*" id="subjectBannerUpload" />
        <div class="td-upload-preview" id="subjectBannerPreview">لا توجد صورة</div>
      </label>
    </div>

    <p style="font-size:0.8rem; color:var(--ink-soft)">💡 حفظ هذه المادة سيُنشئ تلقائيًا "عالم تعلّم" جديدًا لها على صفحة عوالم التعلّم.</p>

    <div class="td-form-actions">
      <button type="button" class="btn btn--ghost btn--sm" id="modalCancelBtn">إلغاء</button>
      <button type="button" class="btn btn--primary btn--sm has-ripple" id="modalSubmitBtn">${existing ? "حفظ التعديلات" : "إضافة المادة"}</button>
    </div>
  `;

  openModal(existing ? "تعديل مادة" : "إضافة مادة جديدة", bodyHtml);

  let selectedIcon = existing?.icon || ICON_CHOICES[0];
  let selectedC1 = selectedColor.c1;
  let selectedC2 = selectedColor.c2;

  document.getElementById("subjectIconPicker").addEventListener("click", (e) => {
    const btn = e.target.closest(".td-emoji-btn");
    if (!btn) return;
    document.querySelectorAll("#subjectIconPicker .td-emoji-btn").forEach((b) => b.classList.remove("is-selected"));
    btn.classList.add("is-selected");
    selectedIcon = btn.dataset.icon;
  });

  document.getElementById("subjectColorPicker").addEventListener("click", (e) => {
    const swatch = e.target.closest(".td-swatch");
    if (!swatch) return;
    document.querySelectorAll("#subjectColorPicker .td-swatch").forEach((s) => s.classList.remove("is-selected"));
    swatch.classList.add("is-selected");
    selectedC1 = swatch.dataset.c1;
    selectedC2 = swatch.dataset.c2;
  });

  setupImagePreview("subjectIconUpload", "subjectIconPreview");
  setupImagePreview("subjectBannerUpload", "subjectBannerPreview");

  document.getElementById("modalCancelBtn").addEventListener("click", closeModal);
  document.getElementById("modalSubmitBtn").addEventListener("click", () => {
    const name = document.getElementById("subjectNameInput").value.trim();
    if (!name) return;

    if (existing) {
      Object.assign(existing, { name, icon: selectedIcon, c1: selectedC1, c2: selectedC2 });
      logActivity("✏️", `تم تعديل مادة "${name}"`);
    } else {
      content.subjects.push({ id: makeId("subject"), name, icon: selectedIcon, c1: selectedC1, c2: selectedC2 });
      logActivity("➕", `تمت إضافة مادة جديدة: "${name}" (تم إنشاء عالم تعلّم جديد لها تلقائيًا)`);
    }

    if (!saveContent()) {
      showToast("⚠️ فشل حفظ المادة — تحقق من مساحة التخزين.");
      return;
    }
    showToast("✅ تم حفظ المادة بنجاح");
    closeModal();
    renderSubjectsTable();
    renderUnitsSubjectFilter();
    renderStats();
  });
}

function deleteSubject(subjectId) {
  const subject = content.subjects.find((s) => s.id === subjectId);
  if (!subject) return;
  if (!window.confirm(`هل تريد حذف مادة "${subject.name}"؟ سيتم حذف وحداتها ودروسها أيضًا.`)) return;

  const unitIds = content.units.filter((u) => u.subjectId === subjectId).map((u) => u.id);
  content.units = content.units.filter((u) => u.subjectId !== subjectId);
  content.lessons = content.lessons.filter((l) => !unitIds.includes(l.unitId));
  content.subjects = content.subjects.filter((s) => s.id !== subjectId);

  saveContent();
  logActivity("🗑️", `تم حذف مادة "${subject.name}"`);
  renderSubjectsTable();
  renderUnitsSubjectFilter();
  renderLessonsSubjectFilter();
  renderStats();
}

/* ===================================================================
   UNIT MANAGER
   =================================================================== */
function renderUnitsSubjectFilter() {
  const select = document.getElementById("unitsSubjectFilter");
  if (!select) return;
  const currentValue = select.value;

  select.innerHTML = content.subjects.map((s) => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join("");
  if (content.subjects.some((s) => s.id === currentValue)) select.value = currentValue;

  renderUnitsTable();
}

function renderUnitsTable() {
  const body = document.getElementById("unitsTableBody");
  const subjectId = document.getElementById("unitsSubjectFilter")?.value;
  if (!body) return;

  const units = content.units.filter((u) => u.subjectId === subjectId);

  if (units.length === 0) {
    body.innerHTML = `<tr class="td-empty-row"><td colspan="5">لا توجد وحدات لهذه المادة بعد</td></tr>`;
    return;
  }

  body.innerHTML = units
    .map((u) => {
      const lessonsCount = content.lessons.filter((l) => l.unitId === u.id).length;
      const gradeLabel = u.grade && u.grade !== "all" && typeof getGradeLabel === "function" ? getGradeLabel(u.grade) : "كل الصفوف";
      return `
        <tr>
          <td>${u.title}</td>
          <td><span class="td-difficulty-tag">${u.difficulty}</span></td>
          <td><span class="td-difficulty-tag">${gradeLabel}</span></td>
          <td>${lessonsCount}</td>
          <td>
            <div class="td-row-actions">
              <button type="button" class="td-row-btn" data-action="edit-unit" data-id="${u.id}" title="تعديل">✏️</button>
              <button type="button" class="td-row-btn td-row-btn--danger" data-action="delete-unit" data-id="${u.id}" title="حذف">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function openUnitModal(unitId = null) {
  const existing = unitId ? content.units.find((u) => u.id === unitId) : null;
  const defaultSubjectId = existing?.subjectId || document.getElementById("unitsSubjectFilter")?.value || content.subjects[0]?.id;

  const bodyHtml = `
    <label class="td-field">
      <span>المادة</span>
      <select id="unitSubjectSelect">
        ${content.subjects.map((s) => `<option value="${s.id}" ${s.id === defaultSubjectId ? "selected" : ""}>${s.icon} ${s.name}</option>`).join("")}
      </select>
    </label>

    <label class="td-field">
      <span>عنوان الوحدة</span>
      <input type="text" id="unitTitleInput" value="${existing?.title || ""}" placeholder="مثال: الوحدة الثانية: القوى والحركة" />
    </label>

    <label class="td-field">
      <span>صورة الوحدة</span>
      <input type="file" accept="image/*" id="unitImageUpload" />
      <div class="td-upload-preview" id="unitImagePreview">لا توجد صورة</div>
    </label>

    <label class="td-field">
      <span>مستوى الصعوبة</span>
      <select id="unitDifficultySelect">
        ${DIFFICULTY_LEVELS.map((d) => `<option value="${d}" ${existing?.difficulty === d ? "selected" : ""}>${d}</option>`).join("")}
      </select>
    </label>

    <label class="td-field">
      <span>الصف الدراسي المستهدف</span>
      <select id="unitGradeSelect">
        ${typeof buildGradeOptionsHtml === "function" ? buildGradeOptionsHtml(existing?.grade, true) : ""}
      </select>
    </label>

    <div class="td-form-actions">
      <button type="button" class="btn btn--ghost btn--sm" id="modalCancelBtn">إلغاء</button>
      <button type="button" class="btn btn--primary btn--sm has-ripple" id="modalSubmitBtn">${existing ? "حفظ التعديلات" : "إضافة الوحدة"}</button>
    </div>
  `;

  openModal(existing ? "تعديل وحدة" : "إضافة وحدة جديدة", bodyHtml);
  setupImagePreview("unitImageUpload", "unitImagePreview");

  document.getElementById("modalCancelBtn").addEventListener("click", closeModal);
  document.getElementById("modalSubmitBtn").addEventListener("click", () => {
    const title = document.getElementById("unitTitleInput").value.trim();
    const subjectId = document.getElementById("unitSubjectSelect").value;
    const difficulty = document.getElementById("unitDifficultySelect").value;
    const grade = document.getElementById("unitGradeSelect")?.value || "all";
    if (!title) return;

    const unitId = existing ? existing.id : makeId("unit");
    if (existing) {
      Object.assign(existing, { title, subjectId, difficulty, grade });
      logActivity("✏️", `تم تعديل وحدة "${title}"`);
    } else {
      content.units.push({ id: unitId, title, subjectId, difficulty, grade });
      logActivity("➕", `تمت إضافة وحدة جديدة: "${title}"`);
    }

    if (!saveContent()) {
      showToast("⚠️ فشل حفظ الوحدة — تحقق من مساحة التخزين.");
      return;
    }
    showToast("✅ تم حفظ الوحدة بنجاح");
    closeModal();
    document.getElementById("unitsSubjectFilter").value = subjectId;
    renderUnitsTable();
    // Keep the Lessons panel's Subject/Unit filters pointed at the
    // unit that was just created/edited, so "+ إضافة درس" right after
    // creating a unit defaults to THIS unit instead of whatever was
    // last selected (the exact scenario that used to attach a new
    // lesson to the wrong subject's unit).
    if (document.getElementById("lessonsSubjectFilter")) {
      document.getElementById("lessonsSubjectFilter").value = subjectId;
    }
    renderLessonsUnitFilter();
    if (document.getElementById("lessonsUnitFilter")) {
      document.getElementById("lessonsUnitFilter").value = unitId;
    }
    renderLessonsTable();
    renderStats();
  });
}

function deleteUnit(unitId) {
  const unit = content.units.find((u) => u.id === unitId);
  if (!unit) return;
  if (!window.confirm(`هل تريد حذف وحدة "${unit.title}"؟ سيتم حذف دروسها أيضًا.`)) return;

  content.lessons = content.lessons.filter((l) => l.unitId !== unitId);
  content.units = content.units.filter((u) => u.id !== unitId);

  saveContent();
  logActivity("🗑️", `تم حذف وحدة "${unit.title}"`);
  renderUnitsTable();
  renderLessonsUnitFilter();
  renderStats();
}

/* ===================================================================
   LESSON MANAGER
   =================================================================== */
/** ROOT CAUSE FIX (published lesson missing from student list):
 *  `lessonsUnitFilter` used to list EVERY unit from EVERY subject in
 *  one flat, unscoped dropdown. When the panel re-rendered (e.g.
 *  right after a teacher created a brand-new unit under "English"),
 *  the dropdown had no memory of "which subject" and — because a
 *  plain <select> always shows its first <option> when its options
 *  are unset/stale — it silently fell back to whichever unit was
 *  first in `content.units` (the Science seed unit). Clicking
 *  "+ إضافة درس" right after that reads `defaultUnitId` straight from
 *  this dropdown, so the new lesson got saved with the WRONG
 *  `unitId` (a different subject's unit) even though the teacher
 *  filled in English content and published it. The lesson itself was
 *  never broken — lesson-engine.html?lessonId=... always resolves it
 *  directly regardless of unit — but ContentStore.getUnits("english")
 *  never returns that unit, so the student list, which only walks
 *  units that actually belong to the subject, never sees it.
 *
 *  Fix: give the Lessons panel its own Subject filter (mirroring the
 *  Units panel exactly), and always scope the unit dropdown to that
 *  subject. This makes it structurally impossible for the unit list
 *  to silently default to a different subject's unit. */
function renderLessonsSubjectFilter() {
  const select = document.getElementById("lessonsSubjectFilter");
  if (!select) return;
  const currentValue = select.value;

  select.innerHTML = content.subjects.map((s) => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join("");
  if (content.subjects.some((s) => s.id === currentValue)) select.value = currentValue;

  renderLessonsUnitFilter();
}

function renderLessonsUnitFilter() {
  const select = document.getElementById("lessonsUnitFilter");
  if (!select) return;
  const subjectId =
    document.getElementById("lessonsSubjectFilter")?.value || content.subjects[0]?.id;
  const currentValue = select.value;

  const units = content.units.filter((u) => u.subjectId === subjectId);
  select.innerHTML = units.length
    ? units.map((u) => `<option value="${u.id}">${u.title}</option>`).join("")
    : `<option value="">لا توجد وحدات لهذه المادة بعد</option>`;
  if (units.some((u) => u.id === currentValue)) select.value = currentValue;

  renderLessonsTable();
}

function renderLessonsTable() {
  const body = document.getElementById("lessonsTableBody");
  const unitId = document.getElementById("lessonsUnitFilter")?.value;
  if (!body) return;

  const lessons = content.lessons.filter((l) => l.unitId === unitId);

  if (lessons.length === 0) {
    body.innerHTML = `<tr class="td-empty-row"><td colspan="7">لا توجد دروس لهذه الوحدة بعد</td></tr>`;
    return;
  }

  body.innerHTML = lessons
    .map(
      (l) => {
        const gradeLabel = l.grade && l.grade !== "all" && typeof getGradeLabel === "function" ? getGradeLabel(l.grade) : "كل الصفوف";
        const isPublished = l.published === true;
        const statusBadge = isPublished
          ? `<span class="td-status-tag td-status-tag--published">🟢 منشور للطلاب</span>`
          : `<span class="td-status-tag td-status-tag--draft">🟡 مسودة</span>`;
        return `
      <tr>
        <td>${l.title}</td>
        <td>⭐ ${l.xp}</td>
        <td>🪙 ${l.coins}</td>
        <td><span class="td-difficulty-tag">${l.difficulty}</span></td>
        <td><span class="td-difficulty-tag">${gradeLabel}</span></td>
        <td>${statusBadge}</td>
        <td>
          <div class="td-row-actions">
            <button type="button" class="td-row-btn" data-action="edit-lesson" data-id="${l.id}" title="تعديل">✏️</button>
            <button type="button" class="td-row-btn" data-action="toggle-publish-lesson" data-id="${l.id}" title="${isPublished ? "إلغاء النشر" : "نشر للطلاب"}">${isPublished ? "⛔" : "🚀"}</button>
            <button type="button" class="td-row-btn td-row-btn--danger" data-action="delete-lesson" data-id="${l.id}" title="حذف">🗑️</button>
          </div>
        </td>
      </tr>
    `;
      }
    )
    .join("");
}

/* -----------------------------------------------------------------
   LESSON EDITOR — REPEATER HELPERS (Objectives / Vocabulary / Quiz)
   Each repeater keeps its own working array in memory while the modal
   is open; every input syncs straight back into that array so
   add/remove re-renders never lose what was already typed.
   ----------------------------------------------------------------- */
function renderObjectivesRepeater(list) {
  if (list.length === 0) return `<p class="td-repeater__empty">لا توجد أهداف بعد — اضغط "إضافة هدف"</p>`;
  return list
    .map(
      (text, i) => `
      <div class="td-repeater-row" data-index="${i}">
        <div class="td-repeater-row__fields">
          <input type="text" class="obj-input" data-index="${i}" value="${escapeAttr(text)}" placeholder="مثال: يتعرّف الطالب على مكونات الذرة" />
        </div>
        <button type="button" class="td-repeater-row__remove" data-remove-objective="${i}" title="حذف">🗑️</button>
      </div>`
    )
    .join("");
}

function renderVocabRepeater(list) {
  if (list.length === 0) return `<p class="td-repeater__empty">لا توجد مفردات بعد — اضغط "إضافة مفردة"</p>`;
  return list
    .map(
      (item, i) => `
      <div class="td-repeater-row" data-index="${i}">
        <div class="td-repeater-row__fields td-repeater-row__fields--grid">
          <input type="text" class="vocab-term-input" data-index="${i}" value="${escapeAttr(item.term)}" placeholder="المصطلح (Term)" />
          <input type="text" class="vocab-def-input" data-index="${i}" value="${escapeAttr(item.definition)}" placeholder="المعنى / الشرح" />
        </div>
        <button type="button" class="td-repeater-row__remove" data-remove-vocab="${i}" title="حذف">🗑️</button>
      </div>`
    )
    .join("");
}

function renderQuizRepeater(list) {
  if (list.length === 0) return `<p class="td-repeater__empty">لا توجد أسئلة بعد — اضغط "إضافة سؤال"</p>`;
  return list
    .map((q, i) => {
      const options = q.options && q.options.length === 4 ? q.options : ["", "", "", ""];
      return `
      <div class="td-repeater-row" data-index="${i}">
        <div class="td-repeater-row__fields">
          <textarea class="quiz-question-input" data-index="${i}" placeholder="نص السؤال">${escapeHtml(q.question || "")}</textarea>
          <div class="td-repeater-row__options">
            ${options
              .map(
                (opt, oi) => `
              <label class="td-repeater-row__option">
                <input type="radio" name="quizCorrect-${i}" class="quiz-correct-input" data-index="${i}" data-option="${oi}" ${q.correctIndex === oi ? "checked" : ""} />
                <input type="text" class="quiz-option-input" data-index="${i}" data-option="${oi}" value="${escapeAttr(opt)}" placeholder="اختيار ${oi + 1}" />
              </label>`
              )
              .join("")}
          </div>
          <label class="td-repeater-row__category">
            <span>تصنيف السؤال (لتحديات القواعد/القراءة بالإنجليزية):</span>
            <select class="quiz-category-input" data-index="${i}">
              <option value="general" ${(!q.category || q.category === "general") ? "selected" : ""}>عام</option>
              <option value="grammar" ${q.category === "grammar" ? "selected" : ""}>قواعد (Grammar)</option>
              <option value="reading" ${q.category === "reading" ? "selected" : ""}>قراءة (Reading)</option>
            </select>
          </label>
          <textarea class="quiz-explain-input" data-index="${i}" placeholder="توضيح الإجابة الصحيحة (اختياري)">${escapeHtml(q.explanation || "")}</textarea>
        </div>
        <button type="button" class="td-repeater-row__remove" data-remove-quiz="${i}" title="حذف">🗑️</button>
      </div>`;
    })
    .join("");
}

/** Generic single-line repeater used for materials/steps/safety/sentences
 *  lists — same interaction pattern as the Objectives repeater, just
 *  reusable across several different draft arrays via `groupKey`. */
function renderSimpleListRepeater(list, groupKey, placeholder) {
  if (!list.length) return `<p class="td-repeater__empty">لا توجد عناصر بعد</p>`;
  return list
    .map(
      (text, i) => `
      <div class="td-repeater-row" data-index="${i}">
        <div class="td-repeater-row__fields">
          <input type="text" class="simple-list-input" data-group="${groupKey}" data-index="${i}" value="${escapeAttr(text)}" placeholder="${placeholder}" />
        </div>
        <button type="button" class="td-repeater-row__remove" data-remove-simple="${groupKey}:${i}" title="حذف">🗑️</button>
      </div>`
    )
    .join("");
}

function renderLabQuestionsRepeater(list) {
  if (!list.length) return `<p class="td-repeater__empty">لا توجد أسئلة معمل بعد</p>`;
  return list
    .map(
      (q, i) => `
      <div class="td-repeater-row" data-index="${i}">
        <div class="td-repeater-row__fields">
          <textarea class="lab-q-question-input" data-index="${i}" placeholder="نص السؤال">${escapeHtml(q.question || "")}</textarea>
          <div class="td-repeater-row__options">
            ${(q.options || ["", "", "", ""])
              .map(
                (opt, oi) => `
              <label class="td-repeater-row__option">
                <input type="radio" name="labQCorrect-${i}" class="lab-q-correct-input" data-index="${i}" data-option="${oi}" ${q.correctIndex === oi ? "checked" : ""} />
                <input type="text" class="lab-q-option-input" data-index="${i}" data-option="${oi}" value="${escapeAttr(opt)}" placeholder="اختيار ${oi + 1}" />
              </label>`
              )
              .join("")}
          </div>
        </div>
        <button type="button" class="td-repeater-row__remove" data-remove-lab-q="${i}" title="حذف">🗑️</button>
      </div>`
    )
    .join("");
}

/** One row per placed diagram pin: which numbered pin, and a dropdown
 *  to assign it to one of the lesson's vocabulary terms. */
function renderDiagramLabelsRepeater(pins, vocabulary) {
  if (!pins.length) return `<p class="td-repeater__empty">لم تُضف أي دبابيس بعد.</p>`;
  return pins
    .map(
      (p, i) => `
      <div class="td-repeater-row" data-index="${i}">
        <div class="td-repeater-row__fields">
          <span style="font-weight:700;">دبوس رقم ${i + 1}</span>
          <select class="diagram-label-term-input" data-index="${i}">
            <option value="">— اختر المصطلح —</option>
            ${vocabulary.map((v) => `<option value="${escapeAttr(v.term)}" ${p.term === v.term ? "selected" : ""}>${v.term}</option>`).join("")}
          </select>
        </div>
        <button type="button" class="td-repeater-row__remove" data-remove-pin="${i}" title="حذف">🗑️</button>
      </div>`
    )
    .join("");
}

function escapeAttr(str = "") {
  return String(str).replace(/"/g, "&quot;");
}
function escapeHtml(str = "") {
  return String(str).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function openLessonModal(lessonId = null) {
  const existing = lessonId ? content.lessons.find((l) => l.id === lessonId) : null;
  // Scoped to the Lessons panel's own Subject filter so a brand-new
  // lesson always defaults to a unit that actually belongs to the
  // subject the teacher is currently working in (see
  // renderLessonsUnitFilter's comment for the bug this prevents).
  const scopedSubjectId = document.getElementById("lessonsSubjectFilter")?.value;
  const unitsForScopedSubject = content.units.filter((u) => u.subjectId === scopedSubjectId);
  const defaultUnitId =
    existing?.unitId ||
    document.getElementById("lessonsUnitFilter")?.value ||
    unitsForScopedSubject[0]?.id ||
    content.units[0]?.id;

  // Working copies — mutated freely while the modal is open, only
  // written back into `content` when "حفظ" is pressed.
  const base = existing || emptyLesson();
  const draft = {
    image: base.image || "",
    pdf: base.pdf && base.pdf.startsWith("data:") ? base.pdf : "",
    objectives: [...(base.objectives || [])],
    vocabulary: (base.vocabulary || []).map((v) => ({ ...v })),
    quiz: (base.quiz || []).map((q) => ({ ...q, options: [...(q.options || ["", "", "", ""])], category: q.category || "general" })),
    gameSettings: { ...(base.gameSettings || {}) },
    diagramLabels: (base.diagramLabels || []).map((p) => ({ ...p })),
    sentences: [...(base.sentences || [])],
    virtualLab: {
      title: base.virtualLab?.title || "",
      materials: [...(base.virtualLab?.materials || [])],
      steps: [...(base.virtualLab?.steps || [])],
      safety: [...(base.virtualLab?.safety || [])],
      simulation: { correctCombo: [...(base.virtualLab?.simulation?.correctCombo || ["", ""])] },
      questions: (base.virtualLab?.questions || []).map((q) => ({ ...q, options: [...(q.options || ["", "", "", ""])] })),
    },
  };

  const bodyHtml = `
    <div class="td-modal-section td-generator-section">
      <div class="td-modal-section__title">🪄 توليد تلقائي (مسودة أولية)</div>
      <p class="td-modal-section__hint">ارفع ملف PDF أو Word أو PowerPoint وسيتم استخراج نصه تلقائيًا لتعبئة العنوان والوصف والأهداف والمفردات والاختبار والملخص والتحدي كمسودة قابلة للتعديل بالكامل — راجعها قبل الحفظ. (أداة استخراج واقتراح مبنية على قواعد نصية، وليست ذكاءً اصطناعيًا حقيقيًا، وتعمل داخل المتصفح فقط).</p>
      <input type="file" accept=".pdf,.docx,.pptx" id="lessonGeneratorFile" />
      <button type="button" class="btn btn--secondary btn--sm has-ripple" id="lessonGeneratorBtn" style="margin-top:8px;">🪄 توليد محتوى الدرس من الملف</button>
      <p id="lessonGeneratorStatus" class="td-modal-section__hint" style="margin-top:8px;"></p>
    </div>

    <div class="td-modal-section">
      <div class="td-modal-section__title">📘 البيانات الأساسية</div>
      <label class="td-field">
        <span>الوحدة</span>
        <select id="lessonUnitSelect">
          ${content.subjects
            .map((s) => {
              const subjectUnits = content.units.filter((u) => u.subjectId === s.id);
              if (!subjectUnits.length) return "";
              return `<optgroup label="${s.icon} ${s.name}">
                ${subjectUnits.map((u) => `<option value="${u.id}" ${u.id === defaultUnitId ? "selected" : ""}>${u.title}</option>`).join("")}
              </optgroup>`;
            })
            .join("")}
        </select>
      </label>
      <label class="td-field">
        <span>عنوان الدرس</span>
        <input type="text" id="lessonTitleInput" value="${escapeAttr(existing?.title)}" placeholder="مثال: الدرس الثاني: تفاعلات المادة" />
      </label>
      <label class="td-field">
        <span>وصف الدرس</span>
        <textarea id="lessonDescriptionInput" placeholder="وصف قصير لما سيتعلمه الطالب في هذا الدرس">${escapeHtml(existing?.description)}</textarea>
      </label>
      <div class="td-form-grid">
        <label class="td-field">
          <span>نقاط الخبرة (XP)</span>
          <input type="number" id="lessonXpInput" min="0" value="${existing?.xp ?? 100}" />
        </label>
        <label class="td-field">
          <span>مكافأة EduGems</span>
          <input type="number" id="lessonCoinsInput" min="0" value="${existing?.coins ?? 30}" />
        </label>
      </div>
      <label class="td-field">
        <span>مستوى الصعوبة</span>
        <select id="lessonDifficultySelect">
          ${DIFFICULTY_LEVELS.map((d) => `<option value="${d}" ${existing?.difficulty === d ? "selected" : ""}>${d}</option>`).join("")}
        </select>
      </label>
      <label class="td-field">
        <span>الصف الدراسي المستهدف</span>
        <select id="lessonGradeSelect">
          ${typeof buildGradeOptionsHtml === "function" ? buildGradeOptionsHtml(existing?.grade, true) : ""}
        </select>
      </label>
    </div>

    <div class="td-modal-section">
      <div class="td-modal-section__title">🖼️ الوسائط والمرفقات</div>
      <p class="td-modal-section__hint">صورة الدرس تُحفظ مباشرة. الفيديو وملفات PDF وPowerPoint والصوت تُحفظ كروابط (لا يوجد خادم لرفع الملفات في هذه النسخة).</p>
      <label class="td-field">
        <span>صورة الدرس</span>
        <input type="file" accept="image/*" id="lessonCoverUpload" />
        <div class="td-upload-preview" id="lessonCoverPreview">${draft.image ? `<img src="${draft.image}" alt="معاينة" />` : "لا توجد صورة"}</div>
      </label>
      <div class="td-form-grid">
        <label class="td-field">
          <span>🎬 رابط الفيديو</span>
          <input type="text" id="lessonVideoInput" value="${escapeAttr(existing?.video)}" placeholder="https://..." />
        </label>
        <label class="td-field">
          <span>🔊 رابط ملف صوتي</span>
          <input type="text" id="lessonAudioInput" value="${escapeAttr(existing?.audio)}" placeholder="https://..." />
        </label>
        <label class="td-field">
          <span>📄 رابط ملف PDF (اختياري إن رفعت ملفًا أدناه)</span>
          <input type="text" id="lessonPdfInput" value="${escapeAttr(existing?.pdf && !existing.pdf.startsWith("data:") ? existing.pdf : "")}" placeholder="https://..." />
        </label>
        <label class="td-field">
          <span>📎 أو ارفع ملف PDF مباشرة (الأفضل — يبقى محفوظًا مع الدرس)</span>
          <input type="file" accept="application/pdf" id="lessonPdfUpload" />
          <div class="td-upload-preview" id="lessonPdfPreview">${existing?.pdf?.startsWith("data:") ? `📄 تم إرفاق ملف PDF (${Math.round(existing.pdf.length / 1024)} كيلوبايت تقريبًا)` : "لا يوجد ملف مرفق"}</div>
        </label>
        <label class="td-field">
          <span>📊 رابط عرض PowerPoint</span>
          <input type="text" id="lessonPptInput" value="${escapeAttr(existing?.ppt)}" placeholder="https://..." />
        </label>
      </div>
    </div>

    <div class="td-modal-section">
      <div class="td-modal-section__title">🎯 أهداف الدرس</div>
      <div class="td-repeater" id="objectivesRepeater">${renderObjectivesRepeater(draft.objectives)}</div>
      <button type="button" class="btn btn--ghost btn--sm td-repeater__add" id="addObjectiveBtn">+ إضافة هدف</button>
    </div>

    <div class="td-modal-section">
      <div class="td-modal-section__title">🔤 المفردات (Vocabulary)</div>
      <div class="td-repeater" id="vocabRepeater">${renderVocabRepeater(draft.vocabulary)}</div>
      <button type="button" class="btn btn--ghost btn--sm td-repeater__add" id="addVocabBtn">+ إضافة مفردة</button>
    </div>

    <div class="td-modal-section">
      <div class="td-modal-section__title">📝 الواجب المنزلي</div>
      <label class="td-field">
        <span>نص الواجب</span>
        <textarea id="lessonHomeworkInput" placeholder="اكتب تعليمات الواجب المنزلي">${escapeHtml(existing?.homework)}</textarea>
      </label>
    </div>

    <div class="td-modal-section">
      <div class="td-modal-section__title">❓ أسئلة الاختبار (Quiz)</div>
      <p class="td-modal-section__hint">حدّد الإجابة الصحيحة بالنقر على الدائرة بجانبها.</p>
      <div class="td-repeater" id="quizRepeater">${renderQuizRepeater(draft.quiz)}</div>
      <button type="button" class="btn btn--ghost btn--sm td-repeater__add" id="addQuizBtn">+ إضافة سؤال</button>
    </div>

    <div class="td-modal-section">
      <div class="td-modal-section__title">🕹️ الألعاب التعليمية المرتبطة بالدرس</div>
      <p class="td-modal-section__hint">القائمة تعتمد على مادة الوحدة المختارة أعلاه. فعّل لعبة هنا، واحفظ الدرس أولًا ليتوفر محتواها (مفردات/اختبار) — ثم يمكنك التأكد من جاهزيتها من لوحة "إعدادات الألعاب".</p>
      <div class="td-game-picker" id="lessonGamePicker">
        ${(typeof GamesEngine !== "undefined" ? GamesEngine.getCatalogForSubject(getSubjectIdForLesson({ unitId: defaultUnitId })) : []).map(
          (g) => `
          <label class="td-game-picker__opt${draft.gameSettings[g.key] ? " is-checked" : ""}">
            <input type="checkbox" data-game-key="${g.key}" ${draft.gameSettings[g.key] ? "checked" : ""} />
            ${g.icon} ${g.label}
          </label>`
        ).join("")}
      </div>
    </div>

    <div class="td-modal-section">
      <div class="td-modal-section__title">🧪 المعمل الافتراضي (اختياري)</div>
      <p class="td-modal-section__hint">أنشئ تجربة تفاعلية خاصة بهذا الدرس — ستظهر للطالب كمهمة إضافية داخل مشغّل الدرس.</p>
      <label class="td-field">
        <span>عنوان التجربة</span>
        <input type="text" id="labTitleInput" value="${escapeAttr(draft.virtualLab.title)}" placeholder="مثال: تجربة خلط المحاليل" />
      </label>

      <div class="td-modal-section__title" style="font-size:0.85rem;">📦 المواد المطلوبة</div>
      <div class="td-repeater" id="labMaterialsRepeater">${renderSimpleListRepeater(draft.virtualLab.materials, "labMaterials", "مثال: كوب زجاجي")}</div>
      <button type="button" class="btn btn--ghost btn--sm td-repeater__add" data-add-simple="labMaterials">+ إضافة مادة</button>

      <div class="td-modal-section__title" style="font-size:0.85rem;">🔢 خطوات التجربة</div>
      <div class="td-repeater" id="labStepsRepeater">${renderSimpleListRepeater(draft.virtualLab.steps, "labSteps", "مثال: أضف 10 مل من المحلول الأول")}</div>
      <button type="button" class="btn btn--ghost btn--sm td-repeater__add" data-add-simple="labSteps">+ إضافة خطوة</button>

      <div class="td-modal-section__title" style="font-size:0.85rem;">⚠️ تعليمات السلامة</div>
      <div class="td-repeater" id="labSafetyRepeater">${renderSimpleListRepeater(draft.virtualLab.safety, "labSafety", "مثال: ارتدِ نظارات الوقاية")}</div>
      <button type="button" class="btn btn--ghost btn--sm td-repeater__add" data-add-simple="labSafety">+ إضافة تعليمة</button>

      <div class="td-modal-section__title" style="font-size:0.85rem;">⚗️ المحاكاة التفاعلية (اختياري)</div>
      <p class="td-modal-section__hint">حدّد مزيج المواد الصحيح — سيتفاعل الطالب بتجربة الخلط داخل المعمل.</p>
      <div class="td-form-grid">
        <label class="td-field">
          <span>المادة الأولى الصحيحة</span>
          <input type="text" id="labComboAInput" value="${escapeAttr(draft.virtualLab.simulation.correctCombo[0])}" placeholder="من قائمة المواد أعلاه" />
        </label>
        <label class="td-field">
          <span>المادة الثانية الصحيحة</span>
          <input type="text" id="labComboBInput" value="${escapeAttr(draft.virtualLab.simulation.correctCombo[1])}" placeholder="من قائمة المواد أعلاه" />
        </label>
      </div>

      <div class="td-modal-section__title" style="font-size:0.85rem;">❓ أسئلة المعمل</div>
      <div class="td-repeater" id="labQuestionsRepeater">${renderLabQuestionsRepeater(draft.virtualLab.questions)}</div>
      <button type="button" class="btn btn--ghost btn--sm td-repeater__add" id="addLabQuestionBtn">+ إضافة سؤال معمل</button>
    </div>

    <div class="td-modal-section">
      <div class="td-modal-section__title">📍 تسمية الرسم (اختياري — Label Diagram)</div>
      <p class="td-modal-section__hint">${draft.image ? "اضغط على الصورة لإضافة دبوس، ثم اختر المصطلح الذي يمثله." : "أضف صورة للدرس أولًا (في قسم الوسائط أعلاه) لتفعيل هذا القسم."}</p>
      ${draft.image ? `<div class="label-diagram-editor__image" id="diagramLabelImage" style="background-image:url('${draft.image}')">
        ${draft.diagramLabels.map((p, i) => `<span class="label-diagram__pin" style="left:${p.x}%; top:${p.y}%;">${i + 1}</span>`).join("")}
      </div>` : ""}
      <div class="td-repeater" id="diagramLabelsRepeater">${renderDiagramLabelsRepeater(draft.diagramLabels, draft.vocabulary)}</div>
    </div>

    <div class="td-modal-section">
      <div class="td-modal-section__title">🧱 جُمل لعبة "بناء الجملة" (اختياري)</div>
      <p class="td-modal-section__hint">إن تُركت فارغة، سيتم توليد جمل بسيطة تلقائيًا من قائمة المفردات.</p>
      <div class="td-repeater" id="sentencesRepeater">${renderSimpleListRepeater(draft.sentences, "sentences", "مثال: Water boils at high temperature")}</div>
      <button type="button" class="btn btn--ghost btn--sm td-repeater__add" data-add-simple="sentences">+ إضافة جملة</button>
    </div>

    <div class="td-modal-section">
      <div class="td-modal-section__title">🏆 التحدي الإضافي</div>
      <label class="td-field">
        <span>نص التحدي</span>
        <textarea id="lessonChallengeInput" placeholder="تحدٍ إضافي اختياري للطلاب المتفوقين">${escapeHtml(existing?.challenge)}</textarea>
      </label>
    </div>

    <div class="td-modal-section">
      <div class="td-modal-section__title">📌 ملخص الدرس</div>
      <label class="td-field">
        <span>نص الملخص</span>
        <textarea id="lessonSummaryInput" placeholder="ملخص قصير يظهر للطالب في نهاية الدرس">${escapeHtml(existing?.summary)}</textarea>
      </label>
    </div>

    <div class="td-form-actions">
      <button type="button" class="btn btn--ghost btn--sm" id="modalCancelBtn">إلغاء</button>
      <button type="button" class="btn btn--secondary btn--sm has-ripple" id="modalSubmitBtn">${existing ? "حفظ التعديلات (بدون تغيير حالة النشر)" : "💾 حفظ كمسودة"}</button>
      <button type="button" class="btn btn--primary btn--sm has-ripple" id="modalSubmitPublishBtn">🚀 حفظ ونشر للطلاب</button>
    </div>
  `;

  openModal(existing ? "تعديل درس" : "إضافة درس جديد", bodyHtml);
  document.getElementById("teacherModal").querySelector(".td-modal__card").classList.add("td-modal__card--wide");
  setupImagePreview("lessonCoverUpload", "lessonCoverPreview");

  // Image upload also needs to persist into `draft.image` as a data
  // URL (an object URL alone would break on reload, since it's not
  // serializable to localStorage). A raw phone-camera photo can be
  // several MB — well past what localStorage can safely hold across
  // an entire lesson (plus every other lesson, plus gamification
  // state) — so it's resized/re-compressed first. This is the fix for
  // lessons that used to disappear after saving: `saveContent()` was
  // silently hitting the browser's storage quota.
  document.getElementById("lessonCoverUpload").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    compressImageFile(file, 900, 0.72).then((dataUrl) => {
      draft.image = dataUrl;
    });
  });

  // PDF attachment: read the actual file into a persistent base64
  // data URL (stored on the lesson itself, in the same
  // `eduverse:teacher-content` record as everything else) instead of
  // a `URL.createObjectURL()` blob URL — a blob URL only lives for the
  // current page session and silently breaks after refresh/reopen,
  // which is exactly why PDFs used to go missing. PDFs can't be
  // resized like images, so a straightforward size guard protects the
  // shared localStorage quota instead.
  const pdfPreviewEl = document.getElementById("lessonPdfPreview");
  document.getElementById("lessonPdfUpload").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_PDF_BYTES = 3 * 1024 * 1024; // ~3MB — see PHASE1_REPORT.md for why
    if (file.size > MAX_PDF_BYTES) {
      pdfPreviewEl.textContent = "⚠️ الملف كبير جدًا (الحد الأقصى 3 ميجابايت تقريبًا) — استخدم رابطًا خارجيًا بدلًا من ذلك.";
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      draft.pdf = reader.result;
      pdfPreviewEl.textContent = `📄 تم إرفاق: ${file.name} (${Math.round(file.size / 1024)} كيلوبايت)`;
    };
    reader.onerror = () => {
      pdfPreviewEl.textContent = "⚠️ تعذّرت قراءة الملف — حاول مرة أخرى.";
    };
    reader.readAsDataURL(file);
  });

  // --- Smart Lesson Generator: parse an uploaded PDF/Word/PowerPoint
  // and pre-fill this same form's fields with a real, editable draft. ---
  document.getElementById("lessonGeneratorBtn").addEventListener("click", async () => {
    const fileInput = document.getElementById("lessonGeneratorFile");
    const statusEl = document.getElementById("lessonGeneratorStatus");
    const file = fileInput.files[0];
    if (!file) {
      statusEl.textContent = "⚠️ اختر ملفًا أولًا (PDF أو Word أو PowerPoint).";
      return;
    }
    if (typeof LessonGenerator === "undefined") {
      statusEl.textContent = "⚠️ أداة التوليد التلقائي غير متاحة حاليًا.";
      return;
    }

    statusEl.textContent = "⏳ جاري استخراج المحتوى وتوليد المسودة...";
    try {
      const generated = await LessonGenerator.generateFromFile(file);

      document.getElementById("lessonTitleInput").value = generated.title;
      document.getElementById("lessonDescriptionInput").value = generated.description;
      document.getElementById("lessonSummaryInput").value = generated.summary;
      document.getElementById("lessonChallengeInput").value = generated.challenge;

      draft.objectives = generated.objectives;
      document.getElementById("objectivesRepeater").innerHTML = renderObjectivesRepeater(draft.objectives);

      draft.vocabulary = generated.vocabulary;
      document.getElementById("vocabRepeater").innerHTML = renderVocabRepeater(draft.vocabulary);

      draft.quiz = generated.quiz;
      document.getElementById("quizRepeater").innerHTML = renderQuizRepeater(draft.quiz);

      statusEl.textContent = "✅ تم توليد مسودة الدرس! راجع كل الحقول وعدّلها قبل الحفظ.";
      logActivity("🪄", `تم توليد مسودة درس تلقائيًا من ملف "${file.name}"`);
    } catch (err) {
      statusEl.textContent = `❌ ${err.message || "تعذّر توليد المحتوى من هذا الملف."}`;
    }
  });

  // --- Objectives repeater wiring ---
  const objRepeater = document.getElementById("objectivesRepeater");
  document.getElementById("addObjectiveBtn").addEventListener("click", () => {
    draft.objectives.push("");
    objRepeater.innerHTML = renderObjectivesRepeater(draft.objectives);
  });
  objRepeater.addEventListener("input", (e) => {
    if (!e.target.classList.contains("obj-input")) return;
    draft.objectives[Number(e.target.dataset.index)] = e.target.value;
  });
  objRepeater.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove-objective]");
    if (!btn) return;
    draft.objectives.splice(Number(btn.dataset.removeObjective), 1);
    objRepeater.innerHTML = renderObjectivesRepeater(draft.objectives);
  });

  // --- Vocabulary repeater wiring ---
  const vocabRepeater = document.getElementById("vocabRepeater");
  document.getElementById("addVocabBtn").addEventListener("click", () => {
    draft.vocabulary.push({ term: "", definition: "" });
    vocabRepeater.innerHTML = renderVocabRepeater(draft.vocabulary);
  });
  vocabRepeater.addEventListener("input", (e) => {
    const i = Number(e.target.dataset.index);
    if (e.target.classList.contains("vocab-term-input")) draft.vocabulary[i].term = e.target.value;
    if (e.target.classList.contains("vocab-def-input")) draft.vocabulary[i].definition = e.target.value;
  });
  vocabRepeater.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove-vocab]");
    if (!btn) return;
    draft.vocabulary.splice(Number(btn.dataset.removeVocab), 1);
    vocabRepeater.innerHTML = renderVocabRepeater(draft.vocabulary);
  });

  // --- Quiz repeater wiring ---
  const quizRepeater = document.getElementById("quizRepeater");
  document.getElementById("addQuizBtn").addEventListener("click", () => {
    draft.quiz.push({ question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "", category: "general" });
    quizRepeater.innerHTML = renderQuizRepeater(draft.quiz);
  });
  quizRepeater.addEventListener("input", (e) => {
    const i = Number(e.target.dataset.index);
    if (e.target.classList.contains("quiz-question-input")) draft.quiz[i].question = e.target.value;
    if (e.target.classList.contains("quiz-explain-input")) draft.quiz[i].explanation = e.target.value;
    if (e.target.classList.contains("quiz-option-input")) draft.quiz[i].options[Number(e.target.dataset.option)] = e.target.value;
  });
  quizRepeater.addEventListener("change", (e) => {
    if (e.target.classList.contains("quiz-correct-input")) {
      draft.quiz[Number(e.target.dataset.index)].correctIndex = Number(e.target.dataset.option);
    }
    if (e.target.classList.contains("quiz-category-input")) {
      draft.quiz[Number(e.target.dataset.index)].category = e.target.value;
    }
  });
  quizRepeater.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove-quiz]");
    if (!btn) return;
    draft.quiz.splice(Number(btn.dataset.removeQuiz), 1);
    quizRepeater.innerHTML = renderQuizRepeater(draft.quiz);
  });

  // --- Simple single-line list repeaters: lab materials/steps/safety,
  // and Sentence Builder sentences — one shared handler, dispatched by
  // `data-group`/`data-add-simple` so four different arrays reuse the
  // exact same wiring code. ---
  const simpleGroups = {
    labMaterials: { arr: draft.virtualLab.materials, el: document.getElementById("labMaterialsRepeater"), placeholder: "مثال: كوب زجاجي" },
    labSteps: { arr: draft.virtualLab.steps, el: document.getElementById("labStepsRepeater"), placeholder: "مثال: أضف 10 مل من المحلول الأول" },
    labSafety: { arr: draft.virtualLab.safety, el: document.getElementById("labSafetyRepeater"), placeholder: "مثال: ارتدِ نظارات الوقاية" },
    sentences: { arr: draft.sentences, el: document.getElementById("sentencesRepeater"), placeholder: "مثال: Water boils at high temperature" },
  };
  Object.entries(simpleGroups).forEach(([groupKey, group]) => {
    group.el.addEventListener("input", (e) => {
      if (e.target.dataset.group !== groupKey) return;
      group.arr[Number(e.target.dataset.index)] = e.target.value;
    });
    group.el.addEventListener("click", (e) => {
      const removeBtn = e.target.closest("[data-remove-simple]");
      if (!removeBtn) return;
      const [gKey, idx] = removeBtn.dataset.removeSimple.split(":");
      if (gKey !== groupKey) return;
      group.arr.splice(Number(idx), 1);
      group.el.innerHTML = renderSimpleListRepeater(group.arr, groupKey, group.placeholder);
    });
  });
  document.querySelectorAll("[data-add-simple]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const groupKey = btn.dataset.addSimple;
      const group = simpleGroups[groupKey];
      group.arr.push("");
      group.el.innerHTML = renderSimpleListRepeater(group.arr, groupKey, group.placeholder);
    });
  });

  // --- Lab combo (correct simulation mix) ---
  document.getElementById("labComboAInput").addEventListener("input", (e) => { draft.virtualLab.simulation.correctCombo[0] = e.target.value; });
  document.getElementById("labComboBInput").addEventListener("input", (e) => { draft.virtualLab.simulation.correctCombo[1] = e.target.value; });
  document.getElementById("labTitleInput").addEventListener("input", (e) => { draft.virtualLab.title = e.target.value; });

  // --- Lab questions repeater ---
  const labQRepeater = document.getElementById("labQuestionsRepeater");
  document.getElementById("addLabQuestionBtn").addEventListener("click", () => {
    draft.virtualLab.questions.push({ question: "", options: ["", "", "", ""], correctIndex: 0 });
    labQRepeater.innerHTML = renderLabQuestionsRepeater(draft.virtualLab.questions);
  });
  labQRepeater.addEventListener("input", (e) => {
    const i = Number(e.target.dataset.index);
    if (e.target.classList.contains("lab-q-question-input")) draft.virtualLab.questions[i].question = e.target.value;
    if (e.target.classList.contains("lab-q-option-input")) draft.virtualLab.questions[i].options[Number(e.target.dataset.option)] = e.target.value;
  });
  labQRepeater.addEventListener("change", (e) => {
    if (!e.target.classList.contains("lab-q-correct-input")) return;
    draft.virtualLab.questions[Number(e.target.dataset.index)].correctIndex = Number(e.target.dataset.option);
  });
  labQRepeater.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove-lab-q]");
    if (!btn) return;
    draft.virtualLab.questions.splice(Number(btn.dataset.removeLabQ), 1);
    labQRepeater.innerHTML = renderLabQuestionsRepeater(draft.virtualLab.questions);
  });

  // --- Diagram label pins: click the preview image to place a pin,
  // then assign it a vocabulary term from the repeater's dropdown. ---
  const diagramImage = document.getElementById("diagramLabelImage");
  const diagramRepeater = document.getElementById("diagramLabelsRepeater");
  function redrawDiagramPins() {
    if (diagramImage) {
      diagramImage.querySelectorAll(".label-diagram__pin").forEach((p) => p.remove());
      draft.diagramLabels.forEach((p, i) => {
        const pin = document.createElement("span");
        pin.className = "label-diagram__pin";
        pin.style.left = `${p.x}%`;
        pin.style.top = `${p.y}%`;
        pin.textContent = i + 1;
        diagramImage.appendChild(pin);
      });
    }
    if (diagramRepeater) diagramRepeater.innerHTML = renderDiagramLabelsRepeater(draft.diagramLabels, draft.vocabulary);
  }
  diagramImage?.addEventListener("click", (e) => {
    if (e.target.closest(".label-diagram__pin")) return;
    const rect = diagramImage.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    draft.diagramLabels.push({ x, y, term: draft.vocabulary[0]?.term || "" });
    redrawDiagramPins();
  });
  diagramRepeater?.addEventListener("change", (e) => {
    if (!e.target.classList.contains("diagram-label-term-input")) return;
    draft.diagramLabels[Number(e.target.dataset.index)].term = e.target.value;
  });
  diagramRepeater?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove-pin]");
    if (!btn) return;
    draft.diagramLabels.splice(Number(btn.dataset.removePin), 1);
    redrawDiagramPins();
  });

  // --- Game picker: keep the .is-checked visual class in sync (also
  // works as a fallback for browsers without CSS :has() support) ---
  document.getElementById("lessonGamePicker").addEventListener("change", (e) => {
    const input = e.target.closest("input[data-game-key]");
    if (!input) return;
    input.closest(".td-game-picker__opt")?.classList.toggle("is-checked", input.checked);
  });

  document.getElementById("modalCancelBtn").addEventListener("click", closeModal);

  function performLessonSave(publishNow) {
    const title = document.getElementById("lessonTitleInput").value.trim();
    const unitId = document.getElementById("lessonUnitSelect").value;
    const description = document.getElementById("lessonDescriptionInput").value.trim();
    const xp = parseInt(document.getElementById("lessonXpInput").value, 10) || 0;
    const coins = parseInt(document.getElementById("lessonCoinsInput").value, 10) || 0;
    const difficulty = document.getElementById("lessonDifficultySelect").value;
    const grade = document.getElementById("lessonGradeSelect")?.value || "all";
    const video = document.getElementById("lessonVideoInput").value.trim();
    const audio = document.getElementById("lessonAudioInput").value.trim();
    const pdfUrl = document.getElementById("lessonPdfInput").value.trim();
    const pdf = draft.pdf || pdfUrl;
    const ppt = document.getElementById("lessonPptInput").value.trim();
    const homework = document.getElementById("lessonHomeworkInput").value.trim();
    const challenge = document.getElementById("lessonChallengeInput").value.trim();
    const summary = document.getElementById("lessonSummaryInput").value.trim();
    if (!title) {
      showToast("⚠️ لا يمكن الحفظ بدون عنوان للدرس.");
      return;
    }
    if (!unitId) {
      showToast("⚠️ لا توجد وحدة لهذه المادة بعد — أنشئ وحدة أولًا من تبويب «الوحدات».");
      return;
    }

    document.querySelectorAll("#lessonGamePicker input[data-game-key]").forEach((input) => {
      draft.gameSettings[input.dataset.gameKey] = input.checked;
    });

    const objectives = draft.objectives.map((o) => o.trim()).filter(Boolean);
    const vocabulary = draft.vocabulary
      .map((v) => ({ term: v.term.trim(), definition: v.definition.trim() }))
      .filter((v) => v.term || v.definition);
    const quiz = draft.quiz
      .map((q) => ({ question: q.question.trim(), options: q.options.map((o) => o.trim()), correctIndex: q.correctIndex, explanation: q.explanation.trim(), category: q.category || "general" }))
      .filter((q) => q.question);
    const sentences = draft.sentences.map((s) => s.trim()).filter(Boolean);
    const diagramLabels = draft.diagramLabels.filter((p) => p.term);
    const virtualLabTitle = draft.virtualLab.title.trim();
    const virtualLab = {
      title: virtualLabTitle,
      materials: draft.virtualLab.materials.map((m) => m.trim()).filter(Boolean),
      steps: draft.virtualLab.steps.map((s) => s.trim()).filter(Boolean),
      safety: draft.virtualLab.safety.map((s) => s.trim()).filter(Boolean),
      simulation: { correctCombo: draft.virtualLab.simulation.correctCombo.map((c) => c.trim()).filter(Boolean) },
      questions: draft.virtualLab.questions
        .map((q) => ({ question: q.question.trim(), options: q.options.map((o) => o.trim()), correctIndex: q.correctIndex }))
        .filter((q) => q.question),
    };

    const fields = {
      title, unitId, description, xp, coins, difficulty, grade,
      image: draft.image, video, audio, pdf, ppt,
      objectives, vocabulary, homework, quiz,
      gameSettings: draft.gameSettings, challenge, summary,
      sentences, diagramLabels, virtualLab,
    };
    // "Save & Publish" always sets published:true; the plain "Save"
    // button never changes an existing lesson's publish status (so
    // editing a live lesson doesn't accidentally unpublish it), and
    // defaults a brand-new lesson to draft, exactly as before.
    if (publishNow) {
      fields.status = "published";
      fields.published = true;
    }

    if (existing) {
      Object.assign(existing, fields, { updatedAt: new Date().toISOString() });
      logActivity("✏️", `تم تعديل درس "${title}"${publishNow ? " ونُشر للطلاب" : ""}`);
    } else {
      content.lessons.push({
        id: makeId("lesson"),
        missions: base.missions,
        status: "draft",
        published: false,
        createdAt: new Date().toISOString(),
        ...fields,
      });
      logActivity(publishNow ? "🚀" : "➕", `تمت إضافة درس جديد: "${title}"${publishNow ? " ونُشر للطلاب" : " (مسودة)"}`);
    }

    const saved = saveContent();
    if (!saved) {
      showToast("⚠️ فشل الحفظ — المساحة التخزينية ممتلئة. جرّب صورة أصغر للدرس أو ملف PDF أصغر.");
      return; // keep the modal open so the teacher doesn't lose their edits
    }

    if (publishNow) {
      showToast("🚀 تم حفظ ونشر الدرس للطلاب بنجاح");
    } else {
      showToast(existing ? "✅ تم حفظ التعديلات بنجاح" : "✅ تم حفظ الدرس بنجاح (كمسودة — اضغط «نشر للطلاب» لإظهاره لهم)");
    }

    closeModal();
    const savedUnit = content.units.find((u) => u.id === unitId);
    if (savedUnit && document.getElementById("lessonsSubjectFilter")) {
      document.getElementById("lessonsSubjectFilter").value = savedUnit.subjectId;
    }
    renderLessonsUnitFilter();
    document.getElementById("lessonsUnitFilter").value = unitId;
    renderLessonsTable();
    renderMissionsLessonFilter();
    renderGamesLessonFilter();
    renderStats();
  }

  document.getElementById("modalSubmitBtn").addEventListener("click", () => performLessonSave(false));
  document.getElementById("modalSubmitPublishBtn").addEventListener("click", () => performLessonSave(true));
}


/** Toggles a lesson between draft and published. This is the one
 *  switch that controls whether a lesson shows up in
 *  ContentStore.getPublishedLessons() on the student side — see
 *  js/content-store.js. */
function togglePublishLesson(lessonId) {
  const lesson = content.lessons.find((l) => l.id === lessonId);
  if (!lesson) return;

  const willPublish = !lesson.published;
  lesson.published = willPublish;
  lesson.status = willPublish ? "published" : "draft";
  lesson.updatedAt = new Date().toISOString();

  const saved = saveContent();
  if (!saved) {
    // roll back so the UI never claims something it couldn't persist
    lesson.published = !willPublish;
    lesson.status = willPublish ? "draft" : "published";
    showToast("⚠️ تعذّر حفظ حالة النشر — تحقق من مساحة التخزين.");
    return;
  }

  logActivity(willPublish ? "🚀" : "⛔", `${willPublish ? "تم نشر" : "تم إلغاء نشر"} درس "${lesson.title}"`);
  showToast(willPublish ? "🚀 تم نشر الدرس للطلاب بنجاح" : "⛔ تم إلغاء نشر الدرس");
  renderLessonsTable();
  renderStats();
}

function deleteLesson(lessonId) {
  const lesson = content.lessons.find((l) => l.id === lessonId);
  if (!lesson) return;
  if (!window.confirm(`هل تريد حذف درس "${lesson.title}"؟`)) return;

  content.lessons = content.lessons.filter((l) => l.id !== lessonId);
  saveContent();
  logActivity("🗑️", `تم حذف درس "${lesson.title}"`);
  renderLessonsTable();
  renderMissionsLessonFilter();
  renderGamesLessonFilter();
  renderStats();
}

/* ===================================================================
   FILE UPLOAD PANEL (interface only — no file processing)
   =================================================================== */
function renderUploadGrid() {
  const grid = document.getElementById("uploadGrid");
  if (!grid) return;

  grid.innerHTML = UPLOAD_TYPES.map(
    (u) => `
      <label class="upload-dropzone" data-type="${u.type}">
        <input type="file" accept="${u.accept}" />
        <span class="upload-dropzone__icon">${u.icon}</span>
        <span class="upload-dropzone__label">${u.label}</span>
        <span class="upload-dropzone__hint">اسحب الملف هنا أو انقر للاختيار</span>
      </label>
    `
  ).join("");

  grid.querySelectorAll(".upload-dropzone").forEach((zone) => {
    const input = zone.querySelector("input[type='file']");

    input.addEventListener("change", () => {
      if (input.files[0]) addUploadedFile(input.files[0], zone.dataset.type);
    });

    ["dragover", "dragleave", "drop"].forEach((evtName) => {
      zone.addEventListener(evtName, (e) => {
        e.preventDefault();
        zone.classList.toggle("is-dragover", evtName === "dragover");
        if (evtName === "drop" && e.dataTransfer.files[0]) {
          addUploadedFile(e.dataTransfer.files[0], zone.dataset.type);
        }
      });
    });
  });
}

function addUploadedFile(file, type) {
  uploadedFiles.unshift({
    name: file.name,
    size: (file.size / 1024).toFixed(1) + " KB",
    type,
  });
  renderUploadFileList();
  logActivity("📤", `تم اختيار ملف "${file.name}" (لم تتم معالجته بعد)`);
}

function renderUploadFileList() {
  const list = document.getElementById("uploadFileList");
  if (!list) return;

  if (uploadedFiles.length === 0) {
    list.innerHTML = `<li class="upload-file-list__empty">لم يتم رفع أي ملفات بعد</li>`;
    return;
  }

  const iconFor = (type) => UPLOAD_TYPES.find((u) => u.type === type)?.icon || "📁";

  list.innerHTML = uploadedFiles
    .map(
      (f) => `
      <li class="upload-file-item">
        <span class="upload-file-item__icon">${iconFor(f.type)}</span>
        <span>${f.name}</span>
        <span class="upload-file-item__meta">${f.size}</span>
      </li>
    `
    )
    .join("");
}

/* ===================================================================
   MISSION SETTINGS PANEL
   =================================================================== */
function renderMissionsLessonFilter() {
  const select = document.getElementById("missionsLessonFilter");
  if (!select) return;
  const currentValue = select.value;

  select.innerHTML = content.lessons.map((l) => `<option value="${l.id}">${l.title}</option>`).join("");
  if (content.lessons.some((l) => l.id === currentValue)) select.value = currentValue;

  renderMissionsEditor();
}

function getSelectedLesson(selectId) {
  const id = document.getElementById(selectId)?.value;
  return content.lessons.find((l) => l.id === id) || null;
}

function renderMissionsEditor() {
  const lesson = getSelectedLesson("missionsLessonFilter");
  const list = document.getElementById("missionsEditorList");
  const countLabel = document.getElementById("missionCountLabel");
  if (!list) return;

  if (!lesson) {
    list.innerHTML = `<p style="color:var(--ink-soft); font-size:0.9rem">لا يوجد درس محدد بعد</p>`;
    if (countLabel) countLabel.textContent = "عدد المهام: 0";
    return;
  }

  const missions = [...lesson.missions].sort((a, b) => a.order - b.order);
  if (countLabel) countLabel.textContent = `عدد المهام: ${missions.length}`;

  list.innerHTML = missions
    .map(
      (m, i) => `
      <div class="mission-editor-row" data-mission-id="${m.id}">
        <div class="mission-editor-row__order">
          <button type="button" data-move="up" data-id="${m.id}" ${i === 0 ? "disabled" : ""}>▲</button>
          <button type="button" data-move="down" data-id="${m.id}" ${i === missions.length - 1 ? "disabled" : ""}>▼</button>
        </div>
        <input type="text" value="المهمة ${m.order}" disabled />
        <input type="text" class="mission-icon-input" data-id="${m.id}" value="${m.icon}" maxlength="2" title="أيقونة المهمة" />
        <input type="number" class="mission-xp-input" data-id="${m.id}" value="${m.xp}" min="0" title="XP" />
        <input type="number" class="mission-coins-input" data-id="${m.id}" value="${m.coins}" min="0" title="EduGems" />
        <button type="button" class="mission-editor-row__remove" data-remove="${m.id}" title="حذف المهمة">🗑️</button>
      </div>
    `
    )
    .join("");

  // Reorder buttons
  list.querySelectorAll("[data-move]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const dir = btn.dataset.move;
      const sorted = [...lesson.missions].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((m) => m.id === id);
      const swapWith = dir === "up" ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= sorted.length) return;

      [sorted[idx].order, sorted[swapWith].order] = [sorted[swapWith].order, sorted[idx].order];
      renderMissionsEditor();
    });
  });

  // Remove mission
  list.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      lesson.missions = lesson.missions.filter((m) => m.id !== btn.dataset.remove);
      lesson.missions.forEach((m, i) => (m.order = i + 1));
      renderMissionsEditor();
    });
  });
}

function setupMissionCountControls() {
  document.getElementById("addMissionBtn")?.addEventListener("click", () => {
    const lesson = getSelectedLesson("missionsLessonFilter");
    if (!lesson) return;
    lesson.missions.push({ id: makeId("mission"), order: lesson.missions.length + 1, icon: "🎯", xp: 20, coins: 10, stars: 3 });
    renderMissionsEditor();
  });

  document.getElementById("removeMissionBtn")?.addEventListener("click", () => {
    const lesson = getSelectedLesson("missionsLessonFilter");
    if (!lesson || lesson.missions.length === 0) return;
    const last = [...lesson.missions].sort((a, b) => a.order - b.order).pop();
    lesson.missions = lesson.missions.filter((m) => m.id !== last.id);
    renderMissionsEditor();
  });

  document.getElementById("saveMissionsBtn")?.addEventListener("click", () => {
    const lesson = getSelectedLesson("missionsLessonFilter");
    if (!lesson) return;

    document.querySelectorAll(".mission-icon-input").forEach((input) => {
      const m = lesson.missions.find((mm) => mm.id === input.dataset.id);
      if (m) m.icon = input.value || "🎯";
    });
    document.querySelectorAll(".mission-xp-input").forEach((input) => {
      const m = lesson.missions.find((mm) => mm.id === input.dataset.id);
      if (m) m.xp = parseInt(input.value, 10) || 0;
    });
    document.querySelectorAll(".mission-coins-input").forEach((input) => {
      const m = lesson.missions.find((mm) => mm.id === input.dataset.id);
      if (m) m.coins = parseInt(input.value, 10) || 0;
    });

    saveContent();
    logActivity("🎯", `تم تحديث إعدادات مهام درس "${lesson.title}"`);
    showToast("✅ تم حفظ إعدادات المهام");
    renderStats();
  });
}

/* ===================================================================
   GAME SETTINGS PANEL
   =================================================================== */
function renderGamesLessonFilter() {
  const select = document.getElementById("gamesLessonFilter");
  if (!select) return;
  const currentValue = select.value;

  select.innerHTML = content.lessons.map((l) => `<option value="${l.id}">${l.title}</option>`).join("");
  if (content.lessons.some((l) => l.id === currentValue)) select.value = currentValue;

  renderGameToggles();
}

function renderGameToggles() {
  const grid = document.getElementById("gameTogglesGrid");
  const lesson = getSelectedLesson("gamesLessonFilter");
  if (!grid) return;

  if (!lesson) {
    grid.innerHTML = `<p style="color:var(--ink-soft); font-size:0.9rem">لا يوجد درس محدد بعد</p>`;
    return;
  }

  const catalog = typeof GamesEngine !== "undefined" ? GamesEngine.getCatalogForSubject(getSubjectIdForLesson(lesson)) : [];

  grid.innerHTML = catalog.length
    ? catalog
        .map((g) => {
          const available = GamesEngine.isGameAvailable(g, lesson);
          return `
      <label class="game-toggle${available ? "" : " game-toggle--unavailable"}">
        <span class="game-toggle__info"><span class="game-toggle__icon">${g.icon}</span>${g.label}${available ? "" : ' <em class="game-toggle__hint">(أضف مفردات/اختبار أولاً)</em>'}</span>
        <span class="toggle-switch">
          <input type="checkbox" data-game-key="${g.key}" ${lesson.gameSettings?.[g.key] ? "checked" : ""} ${available ? "" : "disabled"} />
          <span class="toggle-switch__track"></span>
        </span>
      </label>
    `;
        })
        .join("")
    : `<p style="color:var(--ink-soft); font-size:0.9rem">لا توجد ألعاب متاحة لهذه المادة بعد.</p>`;
}

function setupGameSettingsSave() {
  document.getElementById("saveGamesBtn")?.addEventListener("click", () => {
    const lesson = getSelectedLesson("gamesLessonFilter");
    if (!lesson) return;

    document.querySelectorAll("#gameTogglesGrid input[data-game-key]").forEach((input) => {
      lesson.gameSettings[input.dataset.gameKey] = input.checked;
    });

    saveContent();
    logActivity("🕹️", `تم تحديث إعدادات الألعاب لدرس "${lesson.title}"`);
    showToast("✅ تم حفظ إعدادات الألعاب");
  });
}

/* ===================================================================
   SHARED: MODAL, IMAGE PREVIEW, TOAST, RIPPLE
   =================================================================== */
function openModal(title, bodyHtml) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = bodyHtml;
  document.getElementById("teacherModal").hidden = false;
  // Always start from the default (non-wide) card size; callers that
  // need extra room (the Lesson editor) opt in right after calling
  // this, so other modals are never accidentally left "wide".
  document.querySelector("#teacherModal .td-modal__card")?.classList.remove("td-modal__card--wide");
}

function closeModal() {
  document.getElementById("teacherModal").hidden = true;
  document.getElementById("modalBody").innerHTML = "";
}

function setupModalDismiss() {
  document.getElementById("modalCloseBtn")?.addEventListener("click", closeModal);
  document.getElementById("modalBackdrop")?.addEventListener("click", closeModal);
}

/** Live image preview using an object URL — no upload/processing occurs. */
/** Resizes + re-compresses an image file down to a data URL small
 *  enough to safely fit in localStorage (a raw camera photo can be
 *  5-10MB; this typically brings it under ~200KB). Caps the longest
 *  side at `maxDimension` px and re-encodes as JPEG at `quality`.
 *  Falls back to the original file's data URL if canvas processing
 *  fails for any reason (e.g. an already-tiny image, or a format
 *  canvas can't touch) — the teacher never loses their upload. */
function compressImageFile(file, maxDimension = 900, quality = 0.72) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch {
          resolve(reader.result); // couldn't compress — use the original rather than losing the image
        }
      };
      img.onerror = () => resolve(reader.result);
      img.src = reader.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function setupImagePreview(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!input || !preview) return;

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    preview.innerHTML = `<img src="${url}" alt="معاينة" />`;
  });
}

function showToast(message) {
  const toast = document.getElementById("tdToast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function spawnRipple(button, event) {
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const ripple = document.createElement("span");
  ripple.className = "ripple";
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
  button.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
}

function setupRippleDelegation() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest(".has-ripple");
    if (button) spawnRipple(button, event);
  });
}

/* ===================================================================
   TABLE ACTION DELEGATION (edit/delete buttons rendered dynamically)
   =================================================================== */
function setupTableActionDelegation() {
  document.body.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;

    switch (btn.dataset.action) {
      case "edit-subject": openSubjectModal(id); break;
      case "delete-subject": deleteSubject(id); break;
      case "edit-unit": openUnitModal(id); break;
      case "delete-unit": deleteUnit(id); break;
      case "edit-lesson": openLessonModal(id); break;
      case "toggle-publish-lesson": togglePublishLesson(id); break;
      case "delete-lesson": deleteLesson(id); break;
      default: break;
    }
  });
}

/* ===================================================================
   FILTER + "ADD" BUTTON WIRING
   =================================================================== */
function setupFiltersAndAddButtons() {
  document.getElementById("unitsSubjectFilter")?.addEventListener("change", renderUnitsTable);
  document.getElementById("lessonsSubjectFilter")?.addEventListener("change", renderLessonsUnitFilter);
  document.getElementById("lessonsUnitFilter")?.addEventListener("change", renderLessonsTable);
  document.getElementById("missionsLessonFilter")?.addEventListener("change", renderMissionsEditor);
  document.getElementById("gamesLessonFilter")?.addEventListener("change", renderGameToggles);

  document.getElementById("addSubjectBtn")?.addEventListener("click", () => openSubjectModal());
  document.getElementById("addUnitBtn")?.addEventListener("click", () => openUnitModal());
  document.getElementById("addLessonBtn")?.addEventListener("click", () => openLessonModal());
}

/* ===================================================================
   PAGE ENTRY POINT
   =================================================================== */
function renderEverything() {
  renderTopbarProfile();
  renderProfilePanel();
  renderStats();
  renderActivity();
  renderSubjectsTable();
  renderUnitsSubjectFilter();
  renderLessonsSubjectFilter();
  renderUploadGrid();
  renderUploadFileList();
  renderMissionsLessonFilter();
  renderGamesLessonFilter();
}

function initTeacherDashboard() {
  setupLoginForm();
  setupSidebarNav();
  setupProfilePanel();
  setupFiltersAndAddButtons();
  setupTableActionDelegation();
  setupModalDismiss();
  setupMissionCountControls();
  setupGameSettingsSave();
  setupRippleDelegation();
}

document.addEventListener("DOMContentLoaded", initTeacherDashboard);
