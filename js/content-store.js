/* =================================================================
   EDUVERSE — CONTENT STORE (read-only, student-facing side)
   -------------------------------------------------------------------
   The Teacher Dashboard (js/teacher-dashboard.js) is the ONLY place
   that writes to the "eduverse:teacher-content" localStorage key.
   This file is the read-only counterpart loaded on the student pages
   (learning-worlds.html, units.html, lesson-engine.html) so they can
   render whatever subjects/units/lessons a teacher has actually
   created — without duplicating any editing logic here.

   The default seed below is intentionally IDENTICAL to the one in
   teacher-dashboard.js, so a student who visits before any teacher
   has opened the dashboard on this browser still sees the exact same
   baseline content (and once a teacher DOES save changes on this same
   device, this file reads those changes automatically, since both
   sides share the one localStorage key).
   ================================================================= */

const ContentStore = (function () {
  const STORAGE_KEY = "eduverse:teacher-content";

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
        xp: 165,
        coins: 60,
      },
    ],
  };

  function load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(defaultContent));
      const parsed = JSON.parse(raw);
      const lessons = (parsed.lessons || []).map((l) =>
        l.published === undefined ? { ...l, status: l.status || "published", published: true } : l
      );
      return {
        subjects: parsed.subjects || defaultContent.subjects,
        units: parsed.units || [],
        lessons,
      };
    } catch {
      return JSON.parse(JSON.stringify(defaultContent));
    }
  }

  /** Every subject the teacher has created/edited (the seed six, plus any more). */
  function getSubjects() {
    return load().subjects;
  }

  function getSubjectById(id) {
    return load().subjects.find((s) => s.id === id) || null;
  }

  /** Every unit that belongs to one subject, in the order they were created. */
  function getUnits(subjectId) {
    return load().units.filter((u) => u.subjectId === subjectId);
  }

  function getUnitById(id) {
    return load().units.find((u) => u.id === id) || null;
  }

  /** Every lesson that belongs to one unit, in the order they were created. */
  function getLessons(unitId) {
    return load().lessons.filter((l) => l.unitId === unitId);
  }

  function getLessonById(id) {
    return load().lessons.find((l) => l.id === id) || null;
  }

  /** Only the lessons a teacher has actually published — this is what
   *  student-facing pages (units.html) should list. `getLessons()`
   *  above stays unrestricted (used by lesson-engine.html to resolve
   *  a direct `?lessonId=` link, and internally by the count helper
   *  below) so an existing link/preview still opens regardless of
   *  status — only the *listing* is publish-gated. */
  function getPublishedLessons(unitId) {
    return getLessons(unitId).filter((l) => l.published === true);
  }

  /** Total lesson count across every unit of a subject — used for the
   *  Learning Worlds "📘 X درس" stat without a separate query per unit. */
  function getLessonCountForSubject(subjectId) {
    const unitIds = getUnits(subjectId).map((u) => u.id);
    return load().lessons.filter((l) => unitIds.includes(l.unitId) && l.published === true).length;
  }

  return {
    getSubjects,
    getSubjectById,
    getUnits,
    getUnitById,
    getLessons,
    getPublishedLessons,
    getLessonById,
    getLessonCountForSubject,
  };
})();
