# EduVerse — Final Test Report

This report replaces all previous audit/fix report files, which were
deleted from this ZIP because they described fixes that this round
of work found were incomplete or incorrect for the two problems
below. Only this file and `TESTING_INSTRUCTIONS.md` describe the
current state of the project.

---

## PROBLEM 1 — Published lesson missing from the student list

### Root cause (confirmed, not assumed)

`js/teacher-dashboard.js` had a **Lessons panel with no Subject
filter**. Its single "الوحدة" (Unit) dropdown — built by
`renderLessonsUnitFilter()` — listed **every unit from every
subject in one flat list**, with nothing tying it to whichever
subject the teacher was actually working in.

Sequence that produced your exact symptom:

1. Teacher opens the dashboard. The Lessons panel's unit dropdown
   defaults to the first unit that happens to exist in storage —
   in a fresh/seed project that's the **Science** unit
   (`u-science-1`).
2. Teacher creates a brand-new **English** unit. The old code
   refreshed the unit dropdown's option list but never pointed the
   dropdown AT the new unit, and — because a plain HTML `<select>`
   keeps its previous value if that value still exists among the
   new options — the dropdown **stayed on the Science unit**.
3. Teacher clicks "+ إضافة درس" (Add Lesson) for their English
   lesson. `openLessonModal()` reads its default unit straight from
   that same stale dropdown:
   ```js
   const defaultUnitId = existing?.unitId
     || document.getElementById("lessonsUnitFilter")?.value   // ← still "Science"
     || content.units[0]?.id;
   ```
4. The lesson is saved with `unitId: "u-science-1"` (or whichever
   unit was stale) instead of the English unit — even though the
   teacher typed English content and clicked "Save & Publish", and
   even though `published: true` was set correctly.
5. Student side: `ContentStore.getUnits("english")` correctly
   returns only real English units; the mis-attached lesson's
   `unitId` doesn't belong to any of them, so
   `ContentStore.getPublishedLessons(unitId)` never surfaces it —
   the lesson is structurally invisible to the "english" world's
   unit/lesson walk, no matter how many times the page is refreshed.
6. `lesson-engine.html?lessonId=<id>` still opens it perfectly,
   because `ContentStore.getLessonById()` looks the lesson up
   directly by ID and never checks which unit/subject it's under —
   exactly matching what you observed.

I reproduced this exact sequence in a Node.js simulation of the
real (unmodified) filter logic before touching any code, and
confirmed the lesson list comes back empty for "english" under the
old code, and non-empty after the fix. (See "What was live-tested"
below for exactly what this simulation does and does not prove.)

### Exact files/functions changed

**`teacher-dashboard.html`**
- Added a `<select id="lessonsSubjectFilter">` to the Lessons panel,
  directly mirroring the existing Units panel's `unitsSubjectFilter`
  pattern. No visual redesign — same label style, same panel.

**`js/teacher-dashboard.js`**
- `renderLessonsUnitFilter()` — now scopes the unit list to
  `document.getElementById("lessonsSubjectFilter")?.value` instead
  of listing every unit from every subject.
- New `renderLessonsSubjectFilter()` — populates the new subject
  dropdown (same pattern as `renderUnitsSubjectFilter()`) and cascades
  into `renderLessonsUnitFilter()`.
- `openLessonModal()` — `defaultUnitId` now resolves against the
  units that actually belong to `lessonsSubjectFilter`'s current
  subject, so a brand-new lesson can never default to a unit from a
  different subject.
- `openUnitModal()`'s save handler — after creating/editing a unit,
  it now also points `lessonsSubjectFilter` **and**
  `lessonsUnitFilter` at that exact unit, so clicking "+ إضافة درس"
  right after creating a unit lands on the correct unit automatically.
- `performLessonSave()` — after saving a lesson, it now syncs
  `lessonsSubjectFilter` to the saved lesson's unit's subject before
  syncing `lessonsUnitFilter`, so the panel never shows a lesson list
  that doesn't match its own subject dropdown.
- `deleteSubject()` and all init/listener wiring updated to call
  `renderLessonsSubjectFilter()` instead of `renderLessonsUnitFilter()`
  wherever the whole panel needs a fresh start (subject deleted,
  page load).

No changes were made to `js/content-store.js` — its filtering logic
(`getUnits`, `getPublishedLessons`) was already correct; the bug was
entirely on the authoring side (which unit a new lesson got attached
to), not the reading side.

### What this does NOT do
- It does not touch, migrate, or attempt to "guess-fix" any lesson
  you may already have saved with a wrong `unitId` in your existing
  browser's `localStorage`. This fix prevents the mis-attachment from
  happening again; it can't retroactively know which unit an already
  mis-saved lesson was *supposed* to belong to. If "the present
  simple tense" is still missing after loading this ZIP with your
  existing browser profile, open it via Edit (✏️) from wherever it
  currently is filed and re-select the correct English unit from the
  "الوحدة" dropdown, then Save — or delete it and recreate it, now
  that the panel makes the correct subject/unit unambiguous.

---

## PROBLEM 2 — Button/icon visually enlarges when tapped

### Root cause (confirmed, not assumed)

I searched **every** `.css` file in the project for `scale(`,
`:active`, `:focus`, `:hover`, and any JS that toggles a class
which changes transform/font-size/padding on tap. Result: **there
is no `transform: scale()` anywhere on any interactive
button/icon/card.** The only `scale()` rules in the whole project
belong to unrelated animations that don't fire on tap (ripple
effects, popup/modal reveals, a level-up card, an idle "floaty"
pulse on the homepage treasure chest, a certificate seal). None of
these are attached to the buttons/icons you're tapping.

The actual cause is the **mobile browser's own native
double-tap-to-zoom gesture** — not any CSS this project wrote. The
previous fix (`touch-action: manipulation` +
`-webkit-tap-highlight-color: transparent`) was real and correct,
but it was only applied to this selector:

```css
a, button, [role="button"], input, select, textarea
```

Several of the app's actual tap targets are **not** semantic
buttons. For example, in `js/learning-worlds.js`, the entire world
card is a delegated click target:

```js
grid.addEventListener("click", (event) => {
  const card = event.target.closest(".world-card[data-world-id]");
  ...
```

and the card's icon is a plain `<span class="world-card__icon">`
sitting *outside* the real `<button class="world-card__start">`
(see the file's own "BUGFIX" comment explaining why the click
listener had to be moved to the whole card). The same delegated-click-
on-a-non-button pattern exists for `.unit-card` in `units.js`. Those
elements were never covered by the old selector, so a tap landing on
the icon/art area (not the literal `<button>`) still triggered the
browser's native double-tap zoom — which visually enlarges the
tapped element and everything around it. That is what looked like
"the icon/button enlarges when tapped."

### Exact CSS change

**`css/style.css`** — the rule that used to be scoped to
`a, button, [role="button"], input, select, textarea` is now:

```css
* {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
```

`css/style.css` is loaded on every page (`index.html`,
`learning-worlds.html`, `units.html`, `lesson-engine.html`,
`lesson1.html`, `teacher-dashboard.html`, `login.html`,
`leaderboard.html`, `gamification.html`), so this applies site-wide
with no per-page or per-component markup changes needed, and no
`role="button"` attributes to add or maintain going forward.

This changes **only** touch-gesture handling. It does not add,
remove, or change any `transform`, `color`, `background`,
`box-shadow`, `border`, layout, or content. The one existing
exception, `.dragdrop-chip { touch-action: none; }` in
`css/lesson1.css` (needed so native scroll/zoom doesn't fight the
drag-and-drop game), still correctly overrides the universal rule
for that one component — verified it still applies (more specific
selector wins).

I confirmed with `grep` that no other stylesheet declares a
conflicting `touch-action` that would silently re-enable zoom on any
tap target.

---

## What was actually live-tested

**Nothing was tested in an actual mobile browser or on a real
device.** This environment has no browser, no phone emulator, and no
GUI — only a Linux shell. Everything above was verified by:

- Reading every relevant source file end-to-end (not just the two
  files touched).
- Running the *exact, unmodified* old filter logic and the new fixed
  logic as plain Node.js functions against a fake DOM `<select>`
  that reproduces real `<select>` behavior (keeps its value if still
  present in the new option list; otherwise falls back to the first
  option — genuine native `<select>` behavior). This confirmed:
  - the OLD logic reproduces your exact bug (new English lesson
    resolves to the Science unit, so it's invisible under "english"),
  - the NEW logic resolves the same scenario to the correct English
    unit, and the lesson becomes visible.
- `node -c` syntax-checking every changed `.js` file.
- `grep`-auditing every `.css` file for `scale(`/`:active`/`:focus`/
  `touch-action` to rule out any other transform-based or
  conflicting cause before concluding it's the browser's native zoom.

**What could not be tested:** the actual look and feel on a real
iOS/Android browser — specifically, whether the native double-tap
zoom is fully gone on every tap target on every page, and whether
the Lessons panel's new Subject/Unit dropdowns look and behave
correctly in the real UI (dropdown styling, `<optgroup>` rendering,
RTL layout). **`TESTING_INSTRUCTIONS.md` describes exactly how to
verify both of these yourself**, and please don't take "fixed" as
confirmed until you've actually clicked through the student list
after publishing a lesson, and tapped around on a real phone (or
Chrome DevTools' device-toolbar touch simulation) — this report is
based on tracing the code, not on watching it run.

---

## Scope discipline

No colors, layout, lesson content, branding, or unrelated
functionality were changed. The only files touched:

- `teacher-dashboard.html` (one new `<select>` + label, same markup
  pattern as the existing Units panel)
- `js/teacher-dashboard.js` (Lessons panel filter logic)
- `css/style.css` (one selector widened)

`js/content-store.js`, `js/units.js`, `js/learning-worlds.js`, and
every other file are unchanged from what you uploaded.
