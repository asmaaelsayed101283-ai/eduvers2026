/* =================================================================
   EDUVERSE — LESSON 1 SCRIPT: "Structure of the Atom"
   (Science World → Unit 1: The Matter → Lesson 1)

   Phase 2: this lesson is now a full interactive experience —
   EduBot conversation, an instant-feedback quiz, a Pointer-Events
   drag-and-drop matching activity, a live "Build an Atom" virtual
   lab, embedded educational videos, real XP/coins/badges via the
   shared Core Gamification System, and saved progress.

   Content source: ONLY the attached Lesson 1 PDF (pages 9–23), plus
   standard, uncontroversial periodic-table facts (element symbols
   and proton counts for elements 1–20) used only inside the Atom
   Lab — nothing beyond what the lesson itself already names.

   This file is co-loaded with js/gamification.js on lesson1.html
   (loaded first), so it reuses that file's global `addXP`,
   `addCoins`, `unlockBadge`, `recordLessonCompleted`, and the
   shared ripple-click delegation — no duplicate identifiers here.
   ================================================================= */

/** This lesson always belongs to the Science World. */
const subject = { name: "عالم العلوم", icon: "🧪", w1: "#3A7BFF", w2: "#22D3EE" };

/** Labels/icons for the base block types used by the Lesson Engine. */
const blockTypeMeta = {
  illustration: { icon: "🖼️", label: "عنصر توضيحي" },
  interactive: { icon: "📖", label: "شرح تفاعلي" },
  video: { icon: "🎬", label: "فيديو تعليمي" },
  lab: { icon: "🧪", label: "المعمل الافتراضي" },
  quiz: { icon: "❓", label: "اختبار سريع" },
  dragdrop: { icon: "🧲", label: "نشاط السحب والإفلات" },
};

const engagementMeta = {
  "click-discover": { icon: "\uD83D\uDD0D", label: "Click to Discover" },
  timeline: { icon: "\uD83D\uDD70\uFE0F", label: "Interactive Timeline" },
  matching: { icon: "\uD83D\uDD17", label: "Matching" },
  puzzle: { icon: "\uD83E\uDDE9", label: "Puzzle" },
};

/* -----------------------------------------------------------------
   PERIODIC TABLE DATA (elements 1–20) — used only by the Atom Lab.
   Standard, uncontroversial facts; every element here is already
   named somewhere in the source lesson's own tables.
   ----------------------------------------------------------------- */
const ELEMENTS_1_TO_20 = [
  "Hydrogen", "Helium", "Lithium", "Beryllium", "Boron", "Carbon", "Nitrogen",
  "Oxygen", "Fluorine", "Neon", "Sodium", "Magnesium", "Aluminium", "Silicon",
  "Phosphorus", "Sulphur", "Chlorine", "Argon", "Potassium", "Calcium",
];
const ELEMENT_SYMBOLS_1_TO_20 = [
  "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne",
  "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca",
];

/**
 * Distributes electrons into K/L/M/N energy levels using the exact
 * rule taught in the lesson: the first level fills first, then the
 * next; no level shown here holds more than 8 (K holds at most 2) —
 * this matches the lesson's own worked example (Potassium → 2,8,8,1).
 */
function distributeElectrons(count) {
  const capacities = [2, 8, 8, 8];
  const levels = [0, 0, 0, 0];
  let remaining = count;
  for (let i = 0; i < capacities.length && remaining > 0; i++) {
    const fill = Math.min(capacities[i], remaining);
    levels[i] = fill;
    remaining -= fill;
  }
  return levels;
}

/* -----------------------------------------------------------------
   EDUBOT CONVERSATION SCRIPTS — one guided chat per mission, played
   the first time the student reaches that mission.
   ----------------------------------------------------------------- */
const conversations = {
  1: [
    { en: "Hi! I'm EduBot \uD83D\uDC4B I'll be with you for this whole lesson on the atom.", ar: "أهلاً! أنا EduBot، هكون معاك طول الدرس ده عن الذرة." },
    { en: "Everything around you — this screen, the air, even you — is made of matter. Ready to find out what matter is really made of?", tag: "hint",
      choices: [{ label: "Let's go! \uD83D\uDE80" }, { label: "Tell me more first" }] },
    { en: "Great! Watch the short video below, then read on — matter is anything that has mass and takes up space.", tag: "hint" },
    { en: "Later in this mission you'll get to build your own atom in the Atom Lab. I'll be right here if you want a hint \uD83D\uDCA1", tag: "hint" },
  ],
  2: [
    { en: "Nice work reaching Mission 2! Now let's meet the three particles every atom is built from.", tag: "welcome" },
    { en: "Protons, neutrons, and electrons each have their own charge and mass — watch the video, then try the matching activity below.", tag: "hint" },
  ],
  3: [
    { en: "Final mission! Electrons don't just float around the nucleus randomly — they fill specific energy levels.", tag: "welcome" },
    { en: "Try working out the pattern yourself before checking the rule below \uD83E\uDDEE", tag: "hint" },
  ],
};

/* -----------------------------------------------------------------
   MISSIONS DATA
   ----------------------------------------------------------------- */
const missionsData = [
  {
    number: 1,
    title: "Matter & The Atom",
    icon: "\u269B\uFE0F",
    objective: "Understand what matter is, and learn that the atom is the building unit of matter — through the history of how scientists discovered its structure.",
    blocks: [
      {
        type: "video",
        youtubeId: "7VZApOzxYC4",
        caption: "What Is An Atom? — FuseSchool",
      },
      {
        type: "interactive",
        engagement: "click-discover",
        content: "<strong>Matter:</strong> Anything that has mass and volume (occupies space). Matter exists in three states: solid, liquid, and gas.<br/><br/>Take care: some people believe gases are not matter because they are invisible — but gases ARE matter.",
      },
      {
        type: "illustration",
        caption: "'Building Units' — a house is built of floors → apartments → walls → bricks, so the brick is the building unit of the house. Similarly, the atom is the building and structural unit of matter.",
      },
      {
        type: "interactive",
        engagement: "timeline",
        content: "A brief history of the atomic model:<br/>• <strong>Ancient times:</strong> Greek philosophers believed matter was made up of small, indivisible parts called atoms.<br/>• <strong>Early 19th century:</strong> Scientist Dalton proposed the first scientific atomic theory, suggesting atoms are indivisible.<br/>• <strong>1909:</strong> Scientist Rutherford developed the first experimental model of the atom.<br/><br/><em>Ernest Rutherford</em> was a New Zealand scientist, born in 1871. He was awarded the Nobel Prize in Chemistry in 1908.",
      },
      {
        type: "interactive",
        engagement: "click-discover",
        content: "Rutherford's model: a central <strong>nucleus</strong> (protons + neutrons) surrounded by <strong>electrons</strong> revolving around it at high speed. If the atom were the size of a baseball field, the nucleus would be the size of a pinhead at the center.",
      },
      { type: "lab" },
      {
        type: "quiz",
        question: "Using the Sphinx example (Limestone rocks → Calcium carbonate → molecules → atoms), what is the building unit of the Sphinx statue?",
        options: ["A rock", "A molecule", "The atom", "A crystal"],
        correctIndex: 2,
        explanation: "Correct! Just like a brick builds a house, the atom is the building and structural unit of all matter — including the Sphinx.",
      },
    ],
    summary: "Matter is anything that has mass and volume, and it exists as a solid, liquid, or gas. The atom is the building and structural unit of all matter. From ancient Greek philosophers to Dalton and Rutherford, scientists gradually discovered that the atom has an internal structure: a central nucleus surrounded by revolving electrons.",
    rewards: { xp: 40, coins: 15, stars: 3, badgeIcon: "\uD83E\uDD49", badgeName: "Atom Basics Badge" },
  },
  {
    number: 2,
    title: "Components of the Atom & Chemical Symbols",
    icon: "\uD83E\uDDEC",
    objective: "Learn the properties of the atom's three subatomic particles, and the rules used to write the chemical symbols of elements.",
    blocks: [
      {
        type: "video",
        youtubeId: "cpBb2bgFO6I",
        caption: "Parts Of An Atom — FuseSchool",
      },
      {
        type: "interactive",
        engagement: "matching",
        content: "Protons, neutrons, and electrons are subatomic particles, with these properties:<br/>• <strong>Proton (p):</strong> charge +1, mass ≈ 1 u — positively charged.<br/>• <strong>Neutron (n):</strong> charge 0, mass ≈ 1 u — neutrally charged.<br/>• <strong>Electron (e⁻):</strong> charge −1, mass ≈ 1/1836 u — negatively charged.<br/><br/>The charge of a proton equals the charge of an electron in quantity, but opposite in type.",
      },
      {
        type: "interactive",
        engagement: "click-discover",
        content: "Key facts: the nucleus is positively charged (protons are + , neutrons are neutral). The mass of a proton equals the mass of a neutron. Electron mass is negligible, so the mass of an atom is concentrated in its nucleus.",
      },
      {
        type: "dragdrop",
        instructions: "Drag each element to its correct chemical symbol.",
        pairs: [
          { id: "h", label: "Hydrogen", symbol: "H" },
          { id: "o", label: "Oxygen", symbol: "O" },
          { id: "c", label: "Carbon", symbol: "C" },
          { id: "na", label: "Sodium", symbol: "Na" },
          { id: "fe", label: "Iron", symbol: "Fe" },
        ],
      },
      {
        type: "quiz",
        question: "Life Application — NPK Fertilizer: which of these substances contains all three elements essential for plant growth (Nitrogen, Phosphorus, Potassium)?",
        options: ["H\u2083PO\u2084", "KNO\u2083", "NH\u2084K\u2082PO\u2084", "NH\u2084NO\u2083"],
        correctIndex: 2,
        explanation: "Correct! NH\u2084K\u2082PO\u2084 contains Nitrogen (N), Phosphorus (P), and Potassium (K) — all three elements plants need.",
      },
    ],
    summary: "An atom is made of three subatomic particles — protons (+), neutrons (neutral), and electrons (−) — and almost all of its mass is concentrated in the nucleus. Elements are represented using chemical symbols, based on either their English or their Latin names.",
    rewards: { xp: 55, coins: 20, stars: 2, badgeIcon: "\uD83E\uDD48", badgeName: "Symbols & Particles Badge" },
  },
  {
    number: 3,
    title: "Energy Levels & Isotopes",
    icon: "\uD83C\uDF00",
    objective: "Learn how electrons are distributed in energy levels, how to find an element's atomic number, and understand what isotopes are.",
    blocks: [
      {
        type: "video",
        youtubeId: "4SQEJJa1uDc",
        caption: "Atom Structure — FuseSchool",
      },
      {
        type: "interactive",
        engagement: "click-discover",
        content: "Electrons revolve around the nucleus in up to seven main energy levels. Each of the first four levels is saturated with electrons given by <strong>2n\u00b2</strong> (n = level number): K → 2e\u207B, L → 8e\u207B, M → 18e\u207B, N → 32e\u207B. Energy increases the farther a level is from the nucleus.",
      },
      {
        type: "interactive",
        engagement: "puzzle",
        content: "Rules for electron configuration: (1) the first level fills first, then the next levels fill successively. (2) the outermost level of any atom cannot hold more than 8 electrons, except level K (max 2).<br/><br/><strong>Example — Potassium (Z=19):</strong> K=2e\u207B (17 left) → L=8e\u207B (9 left) → M can only take 8 (1 left) → N=1e\u207B. Configuration: 2, 8, 8, 1.<br/><br/>\uD83D\uDD2C Scroll back up to the <strong>Atom Lab</strong> in Mission 1 and try building Potassium (19 protons, 19 electrons) yourself — watch the rings fill in the same order!",
      },
      {
        type: "quiz",
        question: "Isotopes of the same element always have the same number of…",
        options: ["Protons", "Neutrons", "Energy levels only", "Electrons only"],
        correctIndex: 0,
        explanation: "Correct! Isotopes share the same atomic number (protons), but differ in mass number because they have different numbers of neutrons — like Hydrogen's Protium, Deuterium, and Tritium.",
      },
    ],
    summary: "Electrons fill energy levels starting from the one closest to the nucleus, and the outermost level never holds more than 8 electrons. An element's atomic number equals its total number of electrons. Isotopes are atoms of the same element that share the same atomic number but differ in mass number.",
    rewards: { xp: 70, coins: 25, stars: 3, badgeIcon: "\uD83E\uDD47", badgeName: "Atomic Structure Master Badge" },
  },
];

/* -----------------------------------------------------------------
   LESSON STATE (renamed from `state` to avoid a global-scope clash
   with js/gamification.js, which is co-loaded on this page).
   ----------------------------------------------------------------- */
const PROGRESS_KEY = "eduverse:lesson1:progress";

function loadLessonState() {
  const defaults = { missionIndex: 0, level: 4, achievements: 0, quizResults: {} };
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

const lessonState = loadLessonState();

/** BUG FIX — "lesson always opens on the last mission":
 *  `loadLessonState()` above restores everything the student has
 *  earned so far (xp, level, achievements, quizResults) AND, until
 *  this fix, also restored `missionIndex` — so the very first render
 *  silently jumped straight to whatever mission the student had last
 *  reached, instead of Mission 1.
 *
 *  The XP/level/achievements/quizResults restoration above is left
 *  completely untouched — that's the real progress system and it
 *  must keep working exactly as before. Only `missionIndex` is special-
 *  cased: the value that was actually saved is kept here in
 *  `savedMissionIndex` (still 100% intact in localStorage too — this
 *  does not erase or overwrite anything), while `lessonState.missionIndex`
 *  itself is forced back to 0 so that a normal, silent page load
 *  always renders Mission 1. `initLesson1()` then decides, using
 *  `savedMissionIndex`, whether to show the "ابدأ من البداية /
 *  استكمال من حيث توقفت" choice before the student sees anything —
 *  the saved position is only ever applied to `lessonState.missionIndex`
 *  once the student explicitly picks "استكمال من حيث توقفت". */
const savedMissionIndex = lessonState.missionIndex;
lessonState.missionIndex = 0;

function saveLessonState() {
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(lessonState));
  } catch {
    /* best-effort only */
  }
}

/** Shared count-up animation (ease-out cubic), used for XP/coins in the top bar. */
function countUp(el, from, to, duration = 900) {
  if (!el) return;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (to - from) * eased).toLocaleString("en");
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Scatters a few faint floating shapes behind the mission stage. */
function renderStageBackground() {
  const bg = document.getElementById("missionStageBg");
  if (!bg) return;
  const positions = [
    { top: "10%", left: "8%" }, { top: "20%", left: "85%" },
    { top: "55%", left: "5%" }, { top: "65%", left: "90%" },
    { top: "85%", left: "15%" },
  ];
  bg.innerHTML = positions
    .map((p, i) => `<span class="mission-stage__shape" style="top:${p.top}; left:${p.left}; animation-delay:${i * 0.6}s">${subject.icon}</span>`)
    .join("");
}

/** Sets the top bar's subject colors (Science theme, fixed for this lesson). */
function renderTopbarIdentity() {
  document.querySelectorAll(".mission-topbar, .mission-card, .mission-card__illustration").forEach((el) => {
    el.style.setProperty("--w1", subject.w1);
    el.style.setProperty("--w2", subject.w2);
  });
}

/** Renders the mission-step dots (one per mission) in the top bar. */
function renderMissionDots() {
  const dotsEl = document.getElementById("topbarMissionDots");
  if (!dotsEl) return;
  dotsEl.innerHTML = missionsData
    .map((_, i) => {
      let cls = "mission-topbar__dot";
      if (i < lessonState.missionIndex) cls += " is-done";
      if (i === lessonState.missionIndex) cls += " is-current";
      return `<span class="${cls}"></span>`;
    })
    .join("");
}

/** Updates the top bar's lesson label, progress bar, and stat chips. */
function renderTopbarStatus() {
  const missionLabel = document.getElementById("topbarMissionLabel");
  const progressFill = document.getElementById("topbarProgressFill");
  const levelEl = document.getElementById("topbarLevel");
  const achievementsEl = document.getElementById("topbarAchievements");

  if (missionLabel) missionLabel.textContent = `Mission ${lessonState.missionIndex + 1} of ${missionsData.length}`;
  if (levelEl) levelEl.textContent = lessonState.level;
  if (achievementsEl) achievementsEl.textContent = lessonState.achievements;

  if (progressFill) {
    const pct = Math.round((lessonState.missionIndex / missionsData.length) * 100);
    requestAnimationFrame(() => (progressFill.style.width = `${pct}%`));
  }

  renderMissionDots();
}

/* -----------------------------------------------------------------
   VIRTUAL LAB — "Build an Atom"
   A persistent widget (survives mission changes) so Mission 3 can
   send the student back to it. Built once and appended as a sibling
   of the mission card inside #missionContent's parent.
   ----------------------------------------------------------------- */
const labState = { protons: 1, neutrons: 0, electrons: 1 };

function labIdentifyElement() {
  if (labState.protons < 1 || labState.protons > 20) return null;
  return {
    name: ELEMENTS_1_TO_20[labState.protons - 1],
    symbol: ELEMENT_SYMBOLS_1_TO_20[labState.protons - 1],
  };
}

function buildAtomLabMarkup() {
  return `
    <section class="atom-lab" id="atomLab" style="--w1:${subject.w1}; --w2:${subject.w2}">
      <div class="atom-lab__header">
        <h3>\uD83E\uDDEA Atom Lab \u2014 Build Your Own Atom</h3>
        <p>Add protons, neutrons, and electrons and watch the atom change live.</p>
      </div>
      <div class="atom-lab__body">
        <div class="atom-lab__visual" id="atomLabVisual" aria-hidden="true"></div>

        <div class="atom-lab__panel">
          <div class="atom-lab__controls" id="atomLabControls"></div>
          <div class="atom-lab__stats" id="atomLabStats"></div>
        </div>
      </div>
    </section>
  `;
}

function renderAtomLabVisual() {
  const visual = document.getElementById("atomLabVisual");
  if (!visual) return;

  const nucleusDots = [];
  const totalNucleons = labState.protons + labState.neutrons;
  for (let i = 0; i < totalNucleons; i++) {
    const angle = (i * 137.5) % 360; // golden-angle packing, looks natural
    const radius = 3 + Math.sqrt(i) * 4.2;
    const x = 50 + (radius * Math.cos((angle * Math.PI) / 180)) / 1.4;
    const y = 50 + (radius * Math.sin((angle * Math.PI) / 180)) / 1.4;
    const isProton = i < labState.protons;
    nucleusDots.push(
      `<span class="atom-lab__particle atom-lab__particle--${isProton ? "proton" : "neutron"}" style="left:${x}%; top:${y}%"></span>`
    );
  }

  const levels = distributeElectrons(labState.electrons);
  const ringSizes = [36, 56, 76, 96]; // % of visual box
  const ringsMarkup = levels
    .map((count, levelIndex) => {
      if (count === 0) return "";
      const size = ringSizes[levelIndex];
      const electronDots = Array.from({ length: count })
        .map((_, i) => {
          const angle = (360 / count) * i - 90;
          return `<span class="atom-lab__electron" style="transform: rotate(${angle}deg) translate(${size / 2}%) rotate(${-angle}deg)"></span>`;
        })
        .join("");
      return `<span class="atom-lab__ring" style="width:${size}%; height:${size}%">${electronDots}</span>`;
    })
    .join("");

  visual.innerHTML = `
    <div class="atom-lab__rings">${ringsMarkup}</div>
    <div class="atom-lab__nucleus">${nucleusDots.join("")}</div>
  `;
}

function renderAtomLabStats() {
  const stats = document.getElementById("atomLabStats");
  if (!stats) return;
  const element = labIdentifyElement();
  const charge = labState.protons - labState.electrons;
  const chargeLabel = charge === 0 ? "Neutral (0)" : charge > 0 ? `+${charge}` : `${charge}`;

  stats.innerHTML = `
    <div class="atom-lab__stat"><span>Atomic Number (Z)</span><strong>${labState.protons}</strong></div>
    <div class="atom-lab__stat"><span>Mass Number (A)</span><strong>${labState.protons + labState.neutrons}</strong></div>
    <div class="atom-lab__stat"><span>Charge</span><strong>${chargeLabel}</strong></div>
    <div class="atom-lab__stat atom-lab__stat--element">
      <span>Element</span>
      <strong>${element ? `${element.name} (${element.symbol})` : "\u2014"}</strong>
    </div>
  `;
}

function renderAtomLabControls() {
  const controls = document.getElementById("atomLabControls");
  if (!controls) return;

  const rows = [
    { key: "protons", icon: "\uD83D\uDD34", label: "Protons" },
    { key: "neutrons", icon: "\u26AA", label: "Neutrons" },
    { key: "electrons", icon: "\uD83D\uDD35", label: "Electrons" },
  ];

  controls.innerHTML = rows
    .map(
      (row) => `
      <div class="atom-lab__control">
        <span class="atom-lab__control-label">${row.icon} ${row.label}</span>
        <div class="atom-lab__stepper">
          <button type="button" class="atom-lab__step-btn has-ripple" data-lab-action="dec" data-lab-particle="${row.key}" aria-label="Decrease ${row.label}">\u2212</button>
          <strong id="labCount-${row.key}">${labState[row.key]}</strong>
          <button type="button" class="atom-lab__step-btn has-ripple" data-lab-action="inc" data-lab-particle="${row.key}" aria-label="Increase ${row.label}">+</button>
        </div>
      </div>
    `
    )
    .join("");
}

function refreshAtomLab() {
  renderAtomLabVisual();
  renderAtomLabStats();
  const protonCountEl = document.getElementById("labCount-protons");
  const neutronCountEl = document.getElementById("labCount-neutrons");
  const electronCountEl = document.getElementById("labCount-electrons");
  if (protonCountEl) protonCountEl.textContent = labState.protons;
  if (neutronCountEl) neutronCountEl.textContent = labState.neutrons;
  if (electronCountEl) electronCountEl.textContent = labState.electrons;
}

function setupAtomLab() {
  const controls = document.getElementById("atomLabControls");
  if (!controls) return;

  controls.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-lab-action]");
    if (!btn) return;
    const particle = btn.dataset.labParticle;
    const delta = btn.dataset.labAction === "inc" ? 1 : -1;
    labState[particle] = Math.max(0, Math.min(20, labState[particle] + delta));
    refreshAtomLab();
    if (typeof EduBot !== "undefined") EduBot.sound("pop");
  });

  renderAtomLabControls();
  refreshAtomLab();
}

/* -----------------------------------------------------------------
   QUIZ COMPONENT — instant feedback, awards real XP/coins.
   ----------------------------------------------------------------- */
function buildQuizMarkup(block, missionNumber, blockIndex) {
  const quizId = `quiz-${missionNumber}-${blockIndex}`;
  const optionsMarkup = block.options
    .map(
      (opt, i) => `
      <button type="button" class="quiz-option has-ripple" data-quiz-id="${quizId}" data-option-index="${i}">
        <span class="quiz-option__letter">${String.fromCharCode(65 + i)}</span>
        <span>${opt}</span>
        <span class="quiz-option__icon" aria-hidden="true"></span>
      </button>
    `
    )
    .join("");

  return `
    <div class="mission-block quiz-block" data-quiz-container="${quizId}">
      <h3>\u2753 Quick Check</h3>
      <p class="quiz-question">${block.question}</p>
      <div class="quiz-options">${optionsMarkup}</div>
      <p class="quiz-feedback" id="feedback-${quizId}" hidden></p>
    </div>
  `;
}

function setupQuizzes(missionNumber) {
  const container = document.getElementById("missionContent");
  if (!container) return;

  container.querySelectorAll(".quiz-options").forEach((optionsEl) => {
    optionsEl.addEventListener("click", (event) => {
      const btn = event.target.closest(".quiz-option");
      if (!btn || optionsEl.dataset.answered === "true") return;

      const quizId = btn.dataset.quizId;
      const blockIndex = Number(quizId.split("-")[2]);
      const mission = missionsData.find((m) => m.number === missionNumber);
      const block = mission.blocks[blockIndex];
      const chosen = Number(btn.dataset.optionIndex);
      const correct = chosen === block.correctIndex;

      optionsEl.dataset.answered = "true";
      optionsEl.querySelectorAll(".quiz-option").forEach((opt, i) => {
        opt.disabled = true;
        const iconEl = opt.querySelector(".quiz-option__icon");
        if (i === block.correctIndex) {
          opt.classList.add("is-correct");
          if (iconEl) iconEl.textContent = "\u2705";
        } else if (i === chosen) {
          opt.classList.add("is-wrong");
          if (iconEl) iconEl.textContent = "\u274C";
        }
      });

      const feedback = document.getElementById(`feedback-${quizId}`);
      if (feedback) {
        feedback.hidden = false;
        feedback.textContent = correct ? `\u2705 ${block.explanation}` : `\u274C Not quite. ${block.explanation}`;
        feedback.classList.add(correct ? "is-correct" : "is-wrong");
      }

      lessonState.quizResults[quizId] = correct;
      saveLessonState();

      if (typeof EduBot !== "undefined") EduBot.sound(correct ? "correct" : "wrong");

      if (correct) {
        if (typeof addXP === "function") addXP(10, "perfect-quiz");
        if (typeof EduBot !== "undefined") {
          EduBot.celebrate("Nice! That's correct \uD83C\uDF89 +10 XP", "صح! أحسنت، +10 نقاط خبرة.");
        }
      } else if (typeof EduBot !== "undefined") {
        EduBot.encourage("Not this time \u2014 read the explanation and you'll have it next round \uD83D\uDCAA");
      }
    });
  });
}

/* -----------------------------------------------------------------
   DRAG & DROP COMPONENT (Pointer Events — works for mouse + touch)
   ----------------------------------------------------------------- */
function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildDragDropMarkup(block) {
  const shuffledChips = shuffle(block.pairs);
  const shuffledZones = shuffle(block.pairs);

  const chipsMarkup = shuffledChips
    .map((p) => `<div class="dragdrop-chip has-ripple" draggable="false" data-chip-id="${p.id}">${p.label}</div>`)
    .join("");
  const zonesMarkup = shuffledZones
    .map((p) => `<div class="dragdrop-zone" data-zone-id="${p.id}"><span class="dragdrop-zone__symbol">${p.symbol}</span></div>`)
    .join("");

  return `
    <div class="mission-block dragdrop-block">
      <h3>\uD83E\uDDF2 Drag & Drop</h3>
      <p class="dragdrop-instructions">${block.instructions}</p>
      <div class="dragdrop-area">
        <div class="dragdrop-tray" id="dragdropTray">${chipsMarkup}</div>
        <div class="dragdrop-zones">${zonesMarkup}</div>
      </div>
    </div>
  `;
}

function setupDragDrop() {
  const tray = document.getElementById("dragdropTray");
  if (!tray) return;

  let draggedChip = null;
  let offsetX = 0;
  let offsetY = 0;

  tray.querySelectorAll(".dragdrop-chip").forEach((chip) => {
    chip.addEventListener("pointerdown", (event) => {
      if (chip.classList.contains("is-placed")) return;
      draggedChip = chip;
      const rect = chip.getBoundingClientRect();
      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;

      chip.setPointerCapture(event.pointerId);
      chip.classList.add("is-dragging");
      chip.style.position = "fixed";
      chip.style.zIndex = "1300";
      chip.style.width = `${rect.width}px`;
      moveChipTo(event.clientX, event.clientY);
    });

    chip.addEventListener("pointermove", (event) => {
      if (draggedChip !== chip) return;
      moveChipTo(event.clientX, event.clientY);
    });

    chip.addEventListener("pointerup", (event) => {
      if (draggedChip !== chip) return;
      handleDrop(chip, event.clientX, event.clientY);
      draggedChip = null;
    });
  });

  function moveChipTo(x, y) {
    draggedChip.style.left = `${x - offsetX}px`;
    draggedChip.style.top = `${y - offsetY}px`;
  }

  function handleDrop(chip, x, y) {
    chip.classList.remove("is-dragging");
    const zoneEl = document
      .elementsFromPoint(x, y)
      .find((el) => el.classList && el.classList.contains("dragdrop-zone"));

    const resetChip = () => {
      chip.style.position = "";
      chip.style.left = "";
      chip.style.top = "";
      chip.style.width = "";
      chip.style.zIndex = "";
    };

    if (zoneEl && zoneEl.dataset.zoneId === chip.dataset.chipId && !zoneEl.classList.contains("is-filled")) {
      // Correct match
      resetChip();
      zoneEl.classList.add("is-filled", "is-correct-flash");
      zoneEl.querySelector(".dragdrop-zone__symbol").insertAdjacentHTML(
        "beforebegin",
        `<span class="dragdrop-zone__label">${chip.textContent}</span>`
      );
      chip.classList.add("is-placed");
      chip.style.visibility = "hidden";

      if (typeof EduBot !== "undefined") EduBot.sound("correct");
      if (typeof addCoins === "function") addCoins(5, "Matching activity");

      const allFilled = document.querySelectorAll(".dragdrop-zone").length === document.querySelectorAll(".dragdrop-zone.is-filled").length;
      if (allFilled && typeof EduBot !== "undefined") {
        EduBot.celebrate("You matched every element to its symbol! \uD83C\uDF89", "طابقت كل العناصر برموزها!");
      }
    } else {
      // Incorrect / empty drop — snap back
      resetChip();
      chip.classList.add("is-shake");
      window.setTimeout(() => chip.classList.remove("is-shake"), 400);
      if (typeof EduBot !== "undefined") {
        EduBot.sound("wrong");
        EduBot.encourage("Not quite that symbol \u2014 look at the first letter(s) of the element's name \uD83D\uDD0D");
      }
    }
  }
}

/* -----------------------------------------------------------------
   BLOCK RENDERING
   ----------------------------------------------------------------- */
function renderBlock(block, missionNumber, blockIndex) {
  if (block.type === "illustration") {
    return `
      <div class="illustration-placeholder">
        <span class="illustration-placeholder__icon">\uD83D\uDDBC\uFE0F</span>
        <p class="illustration-placeholder__caption">${block.caption}</p>
      </div>
    `;
  }

  if (block.type === "video") {
    return `
      <div class="mission-block video-block">
        <h3>\uD83C\uDFAC Watch & Learn</h3>
        <div class="video-embed">
          <iframe
            src="https://www.youtube-nocookie.com/embed/${block.youtubeId}"
            title="${block.caption}"
            loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
        <p class="video-caption">${block.caption}</p>
      </div>
    `;
  }

  if (block.type === "lab") {
    return `<div class="mission-block lab-block-slot" id="labSlot-${missionNumber}-${blockIndex}"></div>`;
  }

  if (block.type === "quiz") {
    return buildQuizMarkup(block, missionNumber, blockIndex);
  }

  if (block.type === "dragdrop") {
    return buildDragDropMarkup(block);
  }

  const meta = blockTypeMeta[block.type] || { icon: "\uD83E\uDDE9", label: "Content" };
  const engagement = block.engagement ? engagementMeta[block.engagement] : null;
  const engagementBadge = engagement
    ? `<span class="engagement-badge engagement-badge--${block.engagement}">${engagement.icon} ${engagement.label}</span>`
    : "";

  return `
    <div class="mission-block" data-block-type="${block.type}">
      <h3>${meta.icon} ${meta.label}</h3>
      ${engagementBadge}
      <div class="placeholder-box placeholder-box--content">
        ${block.content}
      </div>
    </div>
  `;
}

/** Builds the full mission card markup for one mission object. */
function buildMissionCard(mission) {
  const stepsMarkup = mission.blocks
    .filter((b) => b.type !== "illustration")
    .map((b) => {
      const meta = blockTypeMeta[b.type] || { icon: "\uD83E\uDDE9", label: "Content" };
      return `<span class="mission-step"><span class="mission-step__icon">${meta.icon}</span>${meta.label}</span>`;
    })
    .join("");

  return `
    <article class="mission-card" style="--w1:${subject.w1}; --w2:${subject.w2}">
      <div class="mission-card__header">
        <span class="mission-card__badge">Mission ${mission.number} of ${missionsData.length}</span>
        <h1 class="mission-card__title">${mission.title}</h1>
        <p class="mission-card__objective"><strong>Learning objective:</strong> ${mission.objective}</p>
      </div>

      <div class="mission-card__illustration"><span>${mission.icon}</span></div>

      <div class="mission-steps">${stepsMarkup}</div>

      ${mission.blocks.map((b, i) => renderBlock(b, mission.number, i)).join("")}

      <div class="mission-summary">
        <h3>\uD83D\uDCCB Mission Summary</h3>
        <p>${mission.summary}</p>
      </div>

      <button type="button" class="btn btn--primary btn--lg mission-card__next-inline has-ripple" id="inlineNextMissionBtn">
        Finish this Mission \u25B6
      </button>
    </article>
  `;
}

/** Renders the current mission into the stage and refreshes the top bar. */
function renderMission() {
  const content = document.getElementById("missionContent");
  const mission = missionsData[lessonState.missionIndex];
  if (!content || !mission) return;

  content.innerHTML = buildMissionCard(mission);
  renderTopbarIdentity();
  renderTopbarStatus();

  // Mount the persistent Atom Lab into whichever mission currently
  // requests it (only Mission 1 does, but the same live instance
  // keeps its state if the student navigates away and back).
  const labSlot = content.querySelector(".lab-block-slot");
  if (labSlot) {
    labSlot.outerHTML = buildAtomLabMarkup();
    setupAtomLab();
  }

  setupQuizzes(mission.number);
  setupDragDrop();

  const inlineBtn = document.getElementById("inlineNextMissionBtn");
  if (inlineBtn) inlineBtn.addEventListener("click", handleNextMissionClick);

  updateNavButtonsState();
  saveLessonState();

  // Play this mission's EduBot conversation the first time it's reached.
  if (!renderMission._seenMissions) renderMission._seenMissions = {};
  if (!renderMission._seenMissions[mission.number] && typeof EduBot !== "undefined" && conversations[mission.number]) {
    renderMission._seenMissions[mission.number] = true;
    window.setTimeout(() => EduBot.converse(conversations[mission.number]), 700);
  }
}

/** Disables the "previous" button on the first mission. */
function updateNavButtonsState() {
  const prevBtn = document.getElementById("prevMissionBtn");
  if (!prevBtn) return;
  prevBtn.disabled = lessonState.missionIndex === 0;
  prevBtn.style.opacity = lessonState.missionIndex === 0 ? "0.45" : "1";
  prevBtn.style.cursor = lessonState.missionIndex === 0 ? "not-allowed" : "pointer";
}

/** Spawns a small confetti burst inside the mission-complete card. */
function playConfetti() {
  const field = document.getElementById("completeConfetti");
  if (!field) return;
  field.innerHTML = "";
  const colors = ["#3A7BFF", "#8B5CF6", "#22D3EE", "#FF9F45"];

  for (let i = 0; i < 18; i++) {
    const dot = document.createElement("span");
    dot.className = "confetti-dot";
    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 60;
    dot.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
    dot.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
    dot.style.setProperty("--rot", `${Math.random() * 360}deg`);
    dot.style.setProperty("--c", colors[i % colors.length]);
    dot.style.animationDelay = `${Math.random() * 0.15}s`;
    field.appendChild(dot);
  }
}

/** Shows the Mission Complete overlay with that mission's rewards,
 *  and feeds real XP/coins/badges into the shared gamification system. */
function showMissionComplete(mission) {
  const overlay = document.getElementById("missionCompleteOverlay");
  const xpEl = document.getElementById("completeXp");
  const coinsEl = document.getElementById("completeCoins");
  const starsEl = document.getElementById("completeStars");
  const badgeIconEl = document.getElementById("completeBadgeRow");
  const badgeNameEl = document.getElementById("completeBadgeName");
  const continueBtn = document.getElementById("completeContinueBtn");
  const isLastMission = lessonState.missionIndex === missionsData.length - 1;

  if (!overlay) return;

  lessonState.achievements += 1;

  if (xpEl) countUp(xpEl, 0, mission.rewards.xp);
  if (coinsEl) countUp(coinsEl, 0, mission.rewards.coins);
  if (starsEl) starsEl.textContent = "\u2B50".repeat(mission.rewards.stars) + "\u2606".repeat(3 - mission.rewards.stars);
  if (badgeIconEl) badgeIconEl.querySelector(".mission-complete-card__badge-icon").textContent = mission.rewards.badgeIcon;
  if (badgeNameEl) badgeNameEl.textContent = mission.rewards.badgeName;
  if (continueBtn) {
    continueBtn.textContent = isLastMission ? "Finish the Lesson \u2192 Rewards" : "Continue to Next Mission";
  }

  overlay.classList.add("is-active");
  playConfetti();

  // Feed the shared, persistent Core Gamification System.
  if (typeof addXP === "function") addXP(mission.rewards.xp, "mission-complete");
  if (typeof addCoins === "function") addCoins(mission.rewards.coins, "Mission reward");

  if (isLastMission) {
    if (typeof recordLessonCompleted === "function") recordLessonCompleted();
    if (typeof unlockBadge === "function") unlockBadge("problem-solver");

    const allCorrect = Object.values(lessonState.quizResults).length >= 3 &&
      Object.values(lessonState.quizResults).every(Boolean);
    if (allCorrect && typeof unlockBadge === "function") {
      window.setTimeout(() => unlockBadge("perfect-score"), 1200);
    }
  }

  saveLessonState();
}

/** Hides the Mission Complete overlay. */
function hideMissionComplete() {
  const overlay = document.getElementById("missionCompleteOverlay");
  if (overlay) overlay.classList.remove("is-active");
}

/** Handles both the bottom-bar and inline "next mission" buttons. */
function handleNextMissionClick() {
  const mission = missionsData[lessonState.missionIndex];
  showMissionComplete(mission);
}

/**
 * Handles the overlay's "Continue" button: advances to the next
 * mission, or — after the final mission — shows the Final
 * Achievement Certificate (100% lesson completion).
 */
function handleCompleteContinue() {
  const isLastMission = lessonState.missionIndex === missionsData.length - 1;
  hideMissionComplete();

  if (isLastMission) {
    if (typeof EduBot !== "undefined") EduBot.stopSpeech();

    const unitHref = document.getElementById("returnToUnitBtn")?.href || "units.html";
    if (typeof Certificate === "undefined") {
      // Defensive fallback so the lesson still ends gracefully even
      // if the certificate module failed to load for any reason.
      window.location.href = unitHref;
      return;
    }

    const totalXp = missionsData.reduce((sum, m) => sum + (m.rewards?.xp || 0), 0);
    const totalCoins = missionsData.reduce((sum, m) => sum + (m.rewards?.coins || 0), 0);
    const totalStars = missionsData.reduce((sum, m) => sum + (m.rewards?.stars || 0), 0);
    const maxStars = missionsData.length * 3;
    const lessonBadge = typeof getBadgeById === "function" ? getBadgeById("problem-solver") : null;
    const lessonNameEl = document.getElementById("topbarLessonName");

    if (typeof Progress !== "undefined") {
      Progress.markLessonComplete("science", "lesson1", { totalLessons: 4 });
    }

    Certificate.show({
      subject: subject.name,
      lessonName: lessonNameEl ? lessonNameEl.textContent.trim() : document.title,
      xpEarned: totalXp,
      coinsEarned: totalCoins,
      stars: totalStars,
      maxStars,
      badge: lessonBadge ? { icon: lessonBadge.icon, name: lessonBadge.name } : null,
      nextHref: unitHref,
      dashboardHref: "gamification.html",
    });
    return;
  }

  if (typeof EduBot !== "undefined") EduBot.stopSpeech();
  lessonState.missionIndex += 1;
  saveLessonState();
  renderMission();
}

/** Moves to the previous mission (no celebration, just navigation). */
function handlePrevMissionClick() {
  if (lessonState.missionIndex === 0) return;
  if (typeof EduBot !== "undefined") EduBot.stopSpeech();
  lessonState.missionIndex -= 1;
  saveLessonState();
  renderMission();
}

/** Always jumps back to Mission 1 — used by both the "🏠 البداية" nav
 *  button and the "ابدأ من البداية" choice in the resume prompt. This
 *  is a real, explicit navigation action (same as prev/next), so it
 *  saves like any other move — it does not touch xp/level/
 *  achievements/quizResults, only where the student currently is. */
function goToFirstMission() {
  if (typeof EduBot !== "undefined") EduBot.stopSpeech();
  lessonState.missionIndex = 0;
  saveLessonState();
  renderMission();
}

/** Shown once, at page load, only when the student has real saved
 *  progress beyond Mission 1 (`savedMissionIndex > 0`). Lets them
 *  choose between starting over and picking up where they left off,
 *  instead of the page silently deciding for them. */
function showResumeChoice(savedIndex) {
  const overlay = document.createElement("div");
  overlay.className = "resume-choice-overlay";
  overlay.innerHTML = `
    <div class="resume-choice-card">
      <p class="resume-choice-card__title">كيف تريد البدء؟</p>
      <p class="resume-choice-card__hint">آخر موضع محفوظ لك: المهمة ${savedIndex + 1} من ${missionsData.length}</p>
      <div class="resume-choice-card__actions">
        <button type="button" class="btn btn--secondary btn--sm has-ripple" id="resumeStartOverBtn">ابدأ من البداية 🚀</button>
        <button type="button" class="btn btn--primary btn--sm has-ripple" id="resumeContinueBtn">استكمال من حيث توقفت ▶</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const closeAndRender = () => {
    overlay.remove();
    renderMission();
  };

  document.getElementById("resumeStartOverBtn").addEventListener("click", () => {
    lessonState.missionIndex = 0;
    saveLessonState();
    closeAndRender();
  });
  document.getElementById("resumeContinueBtn").addEventListener("click", () => {
    lessonState.missionIndex = savedIndex;
    saveLessonState();
    closeAndRender();
  });
}

/** Manual "Save Progress" click — persists immediately + confirms visually. */
function handleSaveProgressClick() {
  saveLessonState();
  let toast = document.querySelector(".save-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "save-toast";
    toast.textContent = "\u2705 Progress saved";
    document.body.appendChild(toast);
  }
  toast.classList.add("is-visible");
  window.clearTimeout(handleSaveProgressClick._timer);
  handleSaveProgressClick._timer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
  if (typeof EduBot !== "undefined") EduBot.sound("pop");
}

/** Wires up the bottom bar and overlay controls (static elements, bound once). */
function setupControls() {
  document.getElementById("homeMissionBtn")?.addEventListener("click", goToFirstMission);
  document.getElementById("nextMissionBtn")?.addEventListener("click", handleNextMissionClick);
  document.getElementById("prevMissionBtn")?.addEventListener("click", handlePrevMissionClick);
  document.getElementById("saveProgressBtn")?.addEventListener("click", handleSaveProgressClick);
  document.getElementById("completeContinueBtn")?.addEventListener("click", handleCompleteContinue);
}

/** Page entry point.
 *  Always sets up the page and controls first. Then: if there's real
 *  saved progress beyond Mission 1, show the resume choice (which
 *  renders the mission itself once the student picks); otherwise —
 *  brand-new student, or already at Mission 1 — render Mission 1
 *  immediately with no prompt, per the required behavior. */
function initLesson1() {
  renderStageBackground();
  setupControls();
  if (savedMissionIndex > 0) {
    showResumeChoice(savedMissionIndex);
  } else {
    renderMission();
  }
  // Ripple-click delegation is provided globally by js/gamification.js,
  // which is loaded before this file on lesson1.html.
}

document.addEventListener("DOMContentLoaded", initLesson1);
