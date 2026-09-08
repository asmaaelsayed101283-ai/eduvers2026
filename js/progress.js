/* =================================================================
   EDUVERSE — PROGRESS (cross-subject save/resume)
   Loaded as a plain classic script, same pattern as the other core
   modules. Tracks which lessons the student has completed, per
   subject ("world"), independent of any one lesson's own local
   `eduverse:lesson1:state`-style save. A lesson page calls:

       Progress.markLessonComplete("science", "lesson1", { totalLessons: 4 });

   ...once, at 100% completion, and any page (the Student Dashboard,
   Units page, etc.) can call Progress.getSubjectProgress("science")
   or Progress.getAllProgress() to read it back — all from
   localStorage, so it survives reloads without a backend.
   ================================================================= */

const Progress = (function () {
  const KEY = "eduverse:progress";

  function load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function save(all) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(all));
    } catch {
      /* localStorage unavailable — progress just won't persist */
    }
  }

  /** Marks one lesson as completed for a subject. Safe to call more
   *  than once for the same lesson (no duplicate entries). */
  function markLessonComplete(worldId, lessonId, meta = {}) {
    if (!worldId || !lessonId) return;
    const all = load();
    if (!all[worldId]) all[worldId] = { completedLessons: [], totalLessons: 0, lastAccessed: null };

    if (!all[worldId].completedLessons.includes(lessonId)) {
      all[worldId].completedLessons.push(lessonId);
    }
    if (meta.totalLessons) all[worldId].totalLessons = meta.totalLessons;
    all[worldId].lastAccessed = new Date().toISOString();

    save(all);
  }

  /** Returns { completedLessons: [...], totalLessons, lastAccessed }
   *  for one subject (all zeros/empty if never touched). */
  function getSubjectProgress(worldId) {
    const all = load();
    return all[worldId] || { completedLessons: [], totalLessons: 0, lastAccessed: null };
  }

  /** Returns the full { worldId: {...} } map, for dashboards that
   *  need to show every subject at once. */
  function getAllProgress() {
    return load();
  }

  return { markLessonComplete, getSubjectProgress, getAllProgress };
})();
