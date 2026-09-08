# EduVerse — Mission Restore Bug Fix Report

## Root cause (confirmed, not assumed)

The bug lives in `js/lesson1.js` (the page behind `lesson1.html` —
the Science "بنية الذرة / Atom Structure" lesson, whose Mission 3 is
literally "Energy Levels & Isotopes", matching your example exactly).

```js
const PROGRESS_KEY = "eduverse:lesson1:progress";

function loadLessonState() {
  const defaults = { missionIndex: 0, level: 4, achievements: 0, quizResults: {} };
  const raw = window.localStorage.getItem(PROGRESS_KEY);
  if (!raw) return defaults;
  return { ...defaults, ...JSON.parse(raw) };   // ← restores missionIndex too
}

const lessonState = loadLessonState();   // ← runs immediately at page load
```

`loadLessonState()` restores the whole saved object — including
`missionIndex` — the instant the script loads, and the page then
rendered whatever mission that pointed to, with no check and no
choice. Every mission-navigation click (`handleNextMissionClick`,
`handlePrevMissionClick`) already calls `saveLessonState()`, which is
exactly why the position kept advancing to 2 (Mission 3) and got
reloaded from there every time.

I searched the rest of the codebase for the same pattern
(`currentMission`, `currentStep`, `lastPage`, `resume`, etc., per
your list). The other lesson surface, `js/lesson-engine.js` (used for
teacher-published lessons opened via `?lessonId=`), has **no**
mission-position persistence at all — it's explicitly commented
`"In-memory session engineState — no backend/storage yet"` — so it
already always opens on Mission 1 today. That file needed no change;
only `js/lesson1.js` had the bug.

## Exact fix

**`js/lesson1.js`**
- `loadLessonState()` is unchanged — it still restores everything
  (xp, level, achievements, quizResults) exactly as before. Nothing
  about the gamification/progress system was touched.
- Right after loading, the real saved value is kept in a new
  `savedMissionIndex` constant, and `lessonState.missionIndex` is
  reset to `0` — so a normal page load always renders Mission 1.
  `localStorage` itself is not written to at this point, so nothing
  saved is lost or altered.
- `initLesson1()` now checks `savedMissionIndex`:
  - `0` (brand-new student, or already at Mission 1) → renders
    Mission 1 immediately, no prompt — requirement 5.
  - `> 0` (real prior progress) → shows a new resume-choice card
    ("كيف تريد البدء؟") with **ابدأ من البداية 🚀** and **استكمال من
    حيث توقفت ▶** before rendering anything — requirements 3–4.
- New `goToFirstMission()` helper — always sets `missionIndex = 0`,
  saves, and re-renders. Used by both the new **🏠 البداية** button
  in the bottom nav bar and the resume card's "ابدأ من البداية"
  choice.

**`lesson1.html`**
- Added `<button id="homeMissionBtn">🏠 البداية</button>` to the
  existing bottom nav bar, alongside the existing ◀ السابقة /
  التالية ▶ buttons — requirement 6.

**`css/lesson1.css`**
- Added styling for the new resume-choice overlay/card only. Reuses
  the same design tokens (`--r-lg`, `--shadow-lg`, `--ink`, etc.) as
  the existing level-up overlay, so it matches the rest of the app
  without any new colors or a redesign.

## What was verified

- Ran the exact (unmodified) restore logic and the fixed logic as
  plain Node.js functions against a simulated `localStorage`,
  covering three scenarios: a brand-new student (no saved data), a
  returning student with saved progress at Mission 3 choosing
  "continue", and one choosing "start over." All three matched the
  required behavior, and in the last two, `level`/`achievements`/
  `quizResults` came through unchanged — confirming the fix touches
  only the entry-point mission, not the progress system.
- `node -c js/lesson1.js` — syntax OK.
- Read through `js/lesson-engine.js` in full to confirm it has no
  equivalent bug (no persisted `missionIndex` there at all).

**What could not be tested:** the actual card/animation/RTL layout in
a real browser, and the on-page "🏠 البداية" button's placement next
to the existing buttons at small widths. This environment has no
browser. Please follow the steps below yourself before considering it
closed.

## How to test it

1. `python3 serve.py 8000`, then open
   `http://localhost:8000/units.html?world=science`, open the
   "بنية الذرة" unit, and click into the lesson.
2. Confirm it opens on **Mission 1 of 3**.
3. Click "المهمة التالية ▶" twice to reach Mission 3 ("Energy Levels
   & Isotopes").
4. Close the tab (or navigate away without finishing the lesson).
5. Reopen the same lesson.
6. Confirm the "كيف تريد البدء؟" card appears, showing it knows you
   last reached Mission 3.
7. Click "استكمال من حيث توقفت ▶" → confirm it opens directly on
   Mission 3, and your XP/level from earlier is still shown in the
   top bar.
8. Reopen the lesson again, this time click "ابدأ من البداية 🚀" →
   confirm it opens on Mission 1, and XP/level are still intact (not
   reset to 0).
9. From Mission 1, click "🏠 البداية" after navigating forward a
   mission or two — confirm it always jumps back to Mission 1.
