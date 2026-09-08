# EduVerse — Testing Instructions

**Do not open these HTML files by double-clicking them (`file://` in
the address bar).** Chrome's warning you saw is correct: under
`file://`, `localStorage` is isolated per-file/per-origin in ways
that don't match real hosting, and navigation between pages can lose
or fail to share that storage — which can make a correctly-published
lesson *look* broken purely because of how you're viewing it, even
when the code and data are fine. Always use a local server.

## 1. Unzip and start the local server

```bash
unzip EduVerse_<version>.zip -d eduverse
cd eduverse
python3 serve.py 8000
```

(The project already includes `serve.py` for exactly this — no
extra install needed, it only uses Python's standard library. If
`python3` isn't found, try `python serve.py 8000`.)

Then open, in an actual browser tab:

```
http://localhost:8000/index.html
```

Keep using `http://localhost:8000/...` for every page from here on
— don't mix in any `file://` tab, and don't open the same site in
two different ports/origins, or they'll see different `localStorage`
and you'll get confusing "missing" content that isn't actually a bug.

## 2. Test Problem 1 — published lesson shows up for students

1. Go to `http://localhost:8000/teacher-dashboard.html` and log in.
2. Open the **الوحدات (Units)** panel. Use the **المادة** dropdown
   to select **English**. Click **+ إضافة وحدة** and create a unit
   (e.g. "Unit 1"). Save.
3. Open the **إدارة الدروس (Lessons)** panel. You should now see
   **two** dropdowns: **المادة** and **الوحدة**. Confirm **المادة**
   already shows **English** and **الوحدة** already shows the unit
   you just created — you shouldn't need to touch either dropdown.
   (This is the fix: previously this panel had no subject dropdown
   at all, and the unit list could silently stay on whatever subject
   you'd last touched.)
4. Click **+ إضافة درس**. In the modal, double-check the "الوحدة"
   field at the top shows your English unit selected. Fill in a
   title (e.g. "the present simple tense") and any content you like.
5. Click **حفظ ونشر للطلاب** (Save & Publish) — not the plain Save
   button, so it actually publishes.
6. Open a **new tab** to `http://localhost:8000/learning-worlds.html`
   (same origin/port as step 1, so it shares the same `localStorage`).
7. Click into the **English** world, then open the unit you created.
8. **Confirm the lesson appears in the list** and that clicking it
   opens the same content you just entered.
9. As a sanity check that nothing regressed: repeat steps 2–8 for the
   **Science** world too, and confirm the existing seeded Science
   lesson ("الدرس الأول: بنية الذرة") still opens exactly as before.

If a lesson you created *before* this fix (in an older session) is
still missing, that lesson was already saved with the wrong
`unitId` and this fix can't retroactively repair it — open it via
✏️ Edit wherever it currently shows up, re-pick the correct unit from
the "الوحدة" field, and Save again.

## 3. Test Problem 2 — no zoom/enlarge on tap

This one specifically needs a **touch-capable** environment — a real
phone/tablet, or Chrome DevTools' device toolbar with touch
simulation enabled (F12 → the device icon → pick a phone preset →
make sure "Show touch" style events are on, since a mouse click alone
won't reproduce a real double-tap-zoom).

1. On your phone, open `http://<your-computer's-LAN-IP>:8000/learning-worlds.html`
   (both devices on the same Wi-Fi; run `python3 serve.py 8000` on
   the computer, then find its IP with `ipconfig`/`ifconfig`/`ip a`).
   Alternatively, use Chrome DevTools' device toolbar directly on
   `http://localhost:8000/learning-worlds.html`.
2. Tap directly on a world card's **icon/emoji** (not just the
   "ابدأ المغامرة" button) several times, including a fast double-tap.
   Confirm the page does not visibly zoom in.
3. Repeat on `units.html` (tap a unit card's body/icon, not just its
   action button) and on `teacher-dashboard.html` (tap around the
   sidebar icons, table row buttons, and emoji/icon pickers in the
   "+ إضافة درس" modal).
4. Confirm the drag-and-drop game inside a lesson (Science → "بنية
   الذرة" → the atom-building activity) still lets you drag chips
   normally — that one intentionally keeps its own touch handling
   (`touch-action: none` on the draggable chips) and should be
   unaffected by this fix.

## 4. If something still looks wrong

Open the browser's DevTools console (F12 → Console) before repeating
the steps above, and note any red errors — screenshot them along
with what you tapped/clicked and the exact page URL. That's the
fastest way to pin down anything this pass didn't catch, since this
round of fixes was verified by code tracing and a logic simulation
in Node.js, not by watching it run in an actual browser (this
environment has no browser or device to test with).
