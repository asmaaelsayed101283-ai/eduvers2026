/* =================================================================
   EDUVERSE — LESSON ENGINE SCRIPT
   Vanilla JS, no frameworks. This is a TEMPLATE ENGINE ONLY:
   it contains no real subject content — every string below is a
   placeholder that a future authoring step (manual or auto-generated
   from an uploaded PDF/Word/PPTX file) will replace.

   ===============================================================
   FUTURE CAPABILITY — DOCUMENT-TO-MISSION PIPELINE
   ===============================================================
   The whole engine is built around one data shape: a mission is a
   title + objective + an ordered list of "blocks". A future document
   parser only needs to produce objects shaped like the ones in
   `missionsData` below — nothing in the rendering code
   (`buildMissionCard`, `renderBlock`, `renderMission`) needs to know
   or care whether a mission came from a teacher's manual entry or
   from an automatic PDF/Word/PPTX import. That parser would plug in
   at `loadMissionsFromDocument()` at the bottom of this file, which
   is intentionally left as a documented hook, not implemented here.
   ================================================================= */

/**
 * SUBJECT VISUAL IDENTITY LOOKUP (theming only — no lesson content)
 * Same pattern used on units.js, so a mission opened from any world
 * keeps that world's colors and icon. Falls back to a generic theme
 * when no ?world= param is present.
 */
const subjectsMeta = {
  general: { name: "مادتك الدراسية", icon: "📘", w1: "#3A7BFF", w2: "#8B5CF6" },
  science: { name: "عالم العلوم", icon: "🧪", w1: "#3A7BFF", w2: "#22D3EE" },
  english: { name: "عالم اللغة الإنجليزية", icon: "🇬🇧", w1: "#8B5CF6", w2: "#3A7BFF" },
  math: { name: "عالم الرياضيات", icon: "➗", w1: "#22D3EE", w2: "#8B5CF6" },
  arabic: { name: "عالم اللغة العربية", icon: "📖", w1: "#FF9F45", w2: "#8B5CF6" },
  social: { name: "عالم الدراسات الاجتماعية", icon: "🌍", w1: "#22D3EE", w2: "#FF9F45" },
  ict: { name: "عالم الحاسوب وتقنية المعلومات", icon: "💻", w1: "#3A7BFF", w2: "#8B5CF6" },
};

/**
 * Labels/icons for known block types. `renderBlock()` falls back to a
 * generic label for any type it doesn't recognize, so a future
 * document parser can introduce new block types without this file
 * needing an update for the engine to keep working.
 */
const blockTypeMeta = {
  interactive: { icon: "📖", label: "منطقة المحتوى التفاعلي" },
  activity: { icon: "🎮", label: "منطقة النشاط" },
  challenge: { icon: "🏆", label: "التحدي" },
  objectives: { icon: "🎯", label: "أهداف الدرس" },
  image: { icon: "🖼️", label: "صورة الدرس" },
  video: { icon: "🎬", label: "شاهد وتعلّم" },
  audio: { icon: "🔊", label: "استمع" },
  pdf: { icon: "📄", label: "ملف PDF" },
  ppt: { icon: "📊", label: "عرض تقديمي" },
  vocabulary: { icon: "🔤", label: "المفردات" },
  homework: { icon: "📝", label: "الواجب المنزلي" },
  quiz: { icon: "❓", label: "اختبار سريع" },
  games: { icon: "🕹️", label: "الألعاب التعليمية" },
  lab: { icon: "🧪", label: "المعمل الافتراضي" },
  summary: { icon: "📌", label: "ملخص الدرس" },
  warmup: { icon: "👋", label: "تمهيد ومقدمة" },
  learningcards: { icon: "🧠", label: "بطاقات التعلّم" },
  gallery: { icon: "🖼️", label: "معرض الصور" },
  concept: { icon: "📐", label: "الشرح والمفاهيم" },
  examples: { icon: "✨", label: "أمثلة" },
  mindmap: { icon: "🗺️", label: "الخريطة الذهنية" },
  keypoints: { icon: "🔑", label: "النقاط الرئيسية" },
};

/**
 * MISSIONS DATA (template placeholders only)
 * `blocks` is an ordered array so the number/order of content areas
 * per mission is flexible — a document-generated mission might have
 * 2 blocks, another might have 4.
 */
let missionsData = [
  {
    number: 1,
    title: "عنوان المهمة الأولى",
    objective: "سيظهر هدف هذه المهمة هنا بعد إضافة محتوى الدرس.",
    icon: "🎯",
    blocks: [
      { type: "interactive", placeholder: "سيتم إنشاء المحتوى التفاعلي تلقائيًا هنا من ملف الدرس المرفوع (PDF / Word / PowerPoint) أو يُضاف يدويًا." },
      { type: "activity", placeholder: "عنصر نائب لنشاط تطبيقي قصير مرتبط بهذه المهمة." },
      { type: "challenge", placeholder: "عنصر نائب لتحدٍّ يختبر فهم الطالب لهذه المهمة." },
    ],
    summary: "سيظهر هنا ملخص لما تعلمه الطالب في هذه المهمة.",
    rewards: { xp: 40, coins: 15, stars: 3, badgeIcon: "🥉", badgeName: "شارة البداية" },
  },
  {
    number: 2,
    title: "عنوان المهمة الثانية",
    objective: "سيظهر هدف هذه المهمة هنا بعد إضافة محتوى الدرس.",
    icon: "🧩",
    blocks: [
      { type: "interactive", placeholder: "عنصر نائب لمحتوى تفاعلي — سيُستبدل بمحتوى حقيقي لاحقًا." },
      { type: "activity", placeholder: "عنصر نائب لنشاط تطبيقي." },
      { type: "challenge", placeholder: "عنصر نائب لتحدٍّ إضافي." },
    ],
    summary: "سيظهر هنا ملخص لما تعلمه الطالب في هذه المهمة.",
    rewards: { xp: 55, coins: 20, stars: 2, badgeIcon: "🥈", badgeName: "شارة الاستمرار" },
  },
  {
    number: 3,
    title: "عنوان المهمة الثالثة",
    objective: "سيظهر هدف هذه المهمة هنا بعد إضافة محتوى الدرس.",
    icon: "🚀",
    blocks: [
      { type: "interactive", placeholder: "عنصر نائب لمحتوى تفاعلي ختامي." },
      { type: "activity", placeholder: "عنصر نائب لنشاط ختامي." },
      { type: "challenge", placeholder: "عنصر نائب للتحدي الأخير في هذا الدرس." },
    ],
    summary: "سيظهر هنا ملخص لما تعلمه الطالب في هذه المهمة.",
    rewards: { xp: 70, coins: 25, stars: 3, badgeIcon: "🥇", badgeName: "شارة إتمام الدرس" },
  },
];

/** In-memory session engineState — no backend/storage yet, per platform architecture. */
const engineState = {
  subject: subjectsMeta.general,
  worldId: "general",
  lessonId: null, // set once a real ContentStore lesson is loaded
  currentLesson: null,
  unitId: null,
  lessonTitle: null,
  missionIndex: 0,
  level: 4,
  xp: 0,
  coins: 0,
  achievements: 0,
  quizResults: {}, // quizId -> boolean, used to gate mission completion
};

/** Reads ?world=<id> from the URL, falling back to the generic theme.
 *  Prefers the live ContentStore (so a teacher's edited name/icon/
 *  colors are reflected here too), same pattern as units.js. Accepts
 *  an optional explicit worldId (used once a real lesson has resolved
 *  its subject from the unit itself, e.g. a shared link that only
 *  carries `?lessonId=` without `&world=`). */
function getSelectedSubject(explicitWorldId) {
  const params = new URLSearchParams(window.location.search);
  const worldId = explicitWorldId || params.get("world");
  const demo = subjectsMeta[worldId];

  if (typeof ContentStore !== "undefined") {
    const live = ContentStore.getSubjectById(worldId);
    if (live) return { name: live.name, icon: live.icon, w1: live.c1, w2: live.c2 };
  }

  return demo || subjectsMeta.general;
}

/* ===================================================================
   REAL LESSON CONTENT — converts one ContentStore lesson (authored in
   the Teacher Dashboard) into the same `missionsData` shape the
   engine already knows how to render. This is the hook the file's
   own header comment described as a "future capability" — it's wired
   in now, but note nothing about `buildMissionCard`/`renderBlock`'s
   core contract changed to make this possible, exactly as planned.
   =================================================================== */

/** Builds an embeddable video block from a plain URL: recognizes
 *  YouTube links (nicer, chromeless embed) and falls back to a native
 *  <video> tag for direct file links, or a plain open-link button for
 *  anything else (e.g. an unlisted platform's share link). */
function buildVideoEmbedHtml(url) {
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/);
  if (ytMatch) {
    return `<div class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/${ytMatch[1]}" title="فيديو الدرس" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
  }
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) {
    return `<div class="video-embed"><video controls preload="metadata" src="${url}" style="width:100%; height:100%; border-radius:inherit;"></video></div>`;
  }
  return `<p class="video-caption"><a class="btn btn--secondary btn--sm" href="${url}" target="_blank" rel="noopener">🎬 فتح الفيديو</a></p>`;
}

function buildPdfEmbedHtml(url) {
  const isDataUrl = url.startsWith("data:");
  const downloadAttr = isDataUrl ? ` download="lesson.pdf"` : "";
  return `
    <div class="video-embed"><iframe src="${url}" title="ملف PDF" loading="lazy"></iframe></div>
    <p class="video-caption"><a class="btn btn--ghost btn--sm" href="${url}" target="_blank" rel="noopener"${downloadAttr}>📄 فتح الملف في نافذة جديدة</a></p>
  `;
}

function buildPptEmbedHtml(url) {
  const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  return `
    <div class="video-embed"><iframe src="${viewerUrl}" title="عرض تقديمي" loading="lazy"></iframe></div>
    <p class="video-caption">إذا لم يظهر العرض، <a href="${url}" target="_blank" rel="noopener">افتحه مباشرة من هنا</a> (يتطلب رابطًا متاحًا للعامة).</p>
  `;
}

/** Builds a "read aloud" button that speaks arbitrary text via the
 *  browser's Web Speech API — the same zero-asset approach EduBot
 *  uses for Arabic, extended here to auto-detect Arabic vs. English
 *  text so an English vocabulary term is pronounced correctly too. */
function buildReadAloudButton(text) {
  const safe = String(text || "").replace(/"/g, "&quot;");
  return `<button type="button" class="read-aloud-btn has-ripple" data-speak="${safe}" aria-label="استماع">🔊</button>`;
}

/** Detects Arabic script to pick a matching speech-synthesis voice. */
function speakLessonText(text) {
  if (!window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const isArabic = /[\u0600-\u06FF]/.test(text);
  utterance.lang = isArabic ? "ar-EG" : "en-US";
  window.speechSynthesis.speak(utterance);
}

/** Wires up every "read aloud" button currently on screen. */
function setupReadAloudButtons() {
  const container = document.getElementById("missionContent");
  if (!container) return;
  container.querySelectorAll(".read-aloud-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      speakLessonText(btn.dataset.speak);
    });
  });
}

/** The warm-up: EduBot's own animated welcome for this specific
 *  lesson — always present (it needs no teacher-authored data), so
 *  every lesson opens with a friendly, personal introduction instead
 *  of a blank first screen. */
function buildWarmupHtml(lesson) {
  const title = lesson?.title || engineState.lessonTitle || engineState.subject.name;
  return `
    <div class="warmup-card">
      <span class="warmup-card__bot">🤖</span>
      <div class="warmup-card__bubble">
        <strong>أهلًا بك! 👋</strong>
        <p>اليوم سنتعلّم معًا في درس «${title}» — استعد لمغامرة تعليمية ممتعة! 🚀</p>
      </div>
    </div>
  `;
}

/** Splits the teacher's free-text description into short "learning
 *  cards" (one per sentence/line) plus one card per stated objective
 *  — each with its own icon, optional read-aloud button, and a
 *  same-page "next" control that just scrolls to the card after it. */
function buildLearningCardsHtml(lesson) {
  const icons = ["💡", "📚", "🔎", "🧩", "🌟", "📌"];
  const cards = [];

  if (lesson.objectives?.length) {
    lesson.objectives.forEach((o) => cards.push(o));
  } else if (lesson.description) {
    lesson.description
      .split(/(?<=[.!؟?])\s+|\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => cards.push(s));
  }
  if (!cards.length) return "";

  return `
    <div class="learning-cards" id="learningCardsRow">
      ${cards
        .map(
          (text, i) => `
        <article class="learning-card" data-card-index="${i}">
          <span class="learning-card__icon">${icons[i % icons.length]}</span>
          <p class="learning-card__text">${text}</p>
          <div class="learning-card__actions">
            ${buildReadAloudButton(text)}
            ${i < cards.length - 1 ? `<button type="button" class="btn btn--ghost btn--sm learning-card__next" data-goto-card="${i + 1}">التالي ▶</button>` : `<span class="learning-card__done">✓ آخر بطاقة</span>`}
          </div>
        </article>`
        )
        .join("")}
    </div>
  `;
}

/** Wires the learning cards' own "next" buttons to smoothly scroll to
 *  the following card — a lightweight, same-page sense of progression
 *  without needing a separate carousel/paging engineState machine. */
function setupLearningCardNav() {
  const row = document.getElementById("learningCardsRow");
  if (!row) return;
  row.querySelectorAll("[data-goto-card]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = row.querySelector(`[data-card-index="${btn.dataset.gotoCard}"]`);
      target?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    });
  });
}

/** Enhanced vocabulary flip-cards: front shows the word, back shows
 *  the meaning + (when the teacher provided them) an image and a
 *  pronunciation hint — plus a real 🔊 pronunciation button powered
 *  by speech synthesis on both faces, since no audio file upload
 *  exists for single words yet. */
function buildVocabularyHtml(vocabulary) {
  if (!vocabulary?.length) return "";
  return `
    <div class="vocab-flip-grid">
      ${vocabulary
        .map((v, i) => {
          const image = v.image ? `<img src="${v.image}" alt="${v.term}" class="vocab-flip-card__image" />` : "";
          return `
        <div class="vocab-flip-card" data-flip-index="${i}" role="button" tabindex="0">
          <div class="vocab-flip-card__inner">
            <div class="vocab-flip-card__face vocab-flip-card__face--front">
              <span>${v.term}</span>
              ${buildReadAloudButton(v.term)}
            </div>
            <div class="vocab-flip-card__face vocab-flip-card__face--back">
              ${image}
              <span>${v.definition}</span>
              ${v.pronunciation ? `<em class="vocab-flip-card__pronunciation">/${v.pronunciation}/</em>` : ""}
              ${buildReadAloudButton(v.term)}
            </div>
          </div>
        </div>`;
        })
        .join("")}
    </div>
  `;
}

/** Responsive image gallery — supports a single teacher-uploaded
 *  `lesson.image`, or a future `lesson.images[]` array, whichever is
 *  present. Returns "" (hidden) when there's nothing to show. */
function buildGalleryHtml(lesson) {
  const images = lesson.images?.length ? lesson.images : lesson.image ? [lesson.image] : [];
  if (!images.length) return "";
  return `
    <div class="lesson-gallery">
      ${images.map((src) => `<div class="lesson-gallery__item"><img src="${src}" alt="${lesson.title || ''}" loading="lazy" /></div>`).join("")}
    </div>
  `;
}

/** Converts a lesson's own content fields into "warm-up → gallery →
 *  watch → listen → learning cards → vocabulary" — skipping every
 *  section the teacher left empty. A lesson is never rendered with
 *  an empty placeholder card; if truly nothing was authored yet, one
 *  friendly "content coming soon" engineState replaces the whole mission. */
function buildContentBlocks(lesson) {
  const blocks = [];

  blocks.push({ type: "warmup", content: buildWarmupHtml(lesson) });

  const gallery = buildGalleryHtml(lesson);
  if (gallery) blocks.push({ type: "gallery", content: gallery });

  if (lesson.video) blocks.push({ type: "video", content: buildVideoEmbedHtml(lesson.video) });
  if (lesson.audio) blocks.push({ type: "audio", content: `<div class="modern-audio-player"><span class="modern-audio-player__icon">🎧</span><audio controls preload="metadata" src="${lesson.audio}"></audio></div>` });

  const learningCards = buildLearningCardsHtml(lesson);
  if (learningCards) blocks.push({ type: "learningcards", content: learningCards });

  const vocab = buildVocabularyHtml(lesson.vocabulary);
  if (vocab) blocks.push({ type: "vocabulary", content: vocab });

  if (!blocks.length || (blocks.length === 1 && blocks[0].type === "warmup")) {
    blocks.push({ type: "interactive", content: `<div class="coming-soon-card">✨ محتوى هذا الدرس قيد الإعداد — عد قريبًا!</div>` });
  }

  return blocks;
}

/** An animated "concept explanation" block — the lesson's own
 *  description, presented as short staggered animated lines instead
 *  of one dense paragraph, giving the practice mission its own
 *  explanatory moment distinct from the bite-sized learning cards. */
function buildConceptHtml(lesson) {
  if (!lesson.description) return "";
  const lines = lesson.description
    .split(/(?<=[.!؟?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return `
    <div class="concept-block">
      ${lines.map((line, i) => `<p class="concept-block__line" style="--d:${i * 0.15}s">${line}</p>`).join("")}
    </div>
  `;
}

/** Beautiful numbered example cards, built from the teacher's own
 *  "Sentence Builder" example sentences when present. */
function buildExamplesHtml(sentences) {
  if (!sentences?.length) return "";
  return `
    <div class="examples-grid">
      ${sentences
        .map(
          (s, i) => `
        <div class="example-card">
          <span class="example-card__num">${i + 1}</span>
          <p>${s}</p>
          ${buildReadAloudButton(s)}
        </div>`
        )
        .join("")}
    </div>
  `;
}

function buildPracticeBlocks(lesson) {
  const blocks = [];

  const concept = buildConceptHtml(lesson);
  if (concept) blocks.push({ type: "concept", content: concept });

  const examples = buildExamplesHtml(lesson.sentences);
  if (examples) blocks.push({ type: "examples", content: examples });

  if (lesson.pdf) blocks.push({ type: "pdf", content: buildPdfEmbedHtml(lesson.pdf) });
  if (lesson.ppt) blocks.push({ type: "ppt", content: buildPptEmbedHtml(lesson.ppt) });

  const playableGames = typeof GamesEngine !== "undefined" ? GamesEngine.getPlayableGames(lesson, engineState.worldId) : [];
  if (playableGames.length) {
    blocks.push({ type: "games", gameKeys: playableGames.map((g) => g.key) });
  }

  if (lesson.homework) blocks.push({ type: "homework", content: `<p>${lesson.homework}</p>` });

  if (!blocks.length) {
    blocks.push({ type: "activity", content: `<div class="coming-soon-card">🎮 لا يوجد نشاط إضافي لهذا الدرس بعد.</div>` });
  }
  return blocks;
}

/** An animated, CSS-only "mind map": the lesson title as a central
 *  hub with each objective/key idea branching off it — a visual,
 *  interactive-feeling summary instead of a plain paragraph. */
function buildMindmapHtml(lesson) {
  const nodes = lesson.objectives?.length ? lesson.objectives : lesson.summary ? [lesson.summary] : [];
  if (!nodes.length) return "";
  return `
    <div class="mindmap">
      <div class="mindmap__hub"><span>${lesson.title || engineState.lessonTitle || "الدرس"}</span></div>
      <div class="mindmap__branches">
        ${nodes.map((n, i) => `<div class="mindmap__node" style="--d:${i * 0.12}s">${n}</div>`).join("")}
      </div>
    </div>
  `;
}

/** Modern colorful "key points" cards — reuses the lesson's own
 *  objectives (already the most concise statements of what matters),
 *  falling back to the summary split into short points when a lesson
 *  has no explicit objectives list. */
function buildKeyPointsHtml(lesson) {
  const points = lesson.objectives?.length
    ? lesson.objectives
    : lesson.summary
    ? lesson.summary.split(/(?<=[.!؟?])\s+/).map((s) => s.trim()).filter(Boolean)
    : [];
  if (!points.length) return "";
  const colors = ["var(--blue)", "var(--purple)", "var(--cyan)", "var(--orange)"];
  return `
    <div class="keypoints-grid">
      ${points
        .map(
          (p, i) => `
        <div class="keypoint-card" style="--kp-color:${colors[i % colors.length]}">
          <span class="keypoint-card__icon">🔑</span>
          <p>${p}</p>
        </div>`
        )
        .join("")}
    </div>
  `;
}

function buildChallengeBlocks(lesson) {
  const blocks = [];

  const mindmap = buildMindmapHtml(lesson);
  if (mindmap) blocks.push({ type: "mindmap", content: mindmap });

  const keypoints = buildKeyPointsHtml(lesson);
  if (keypoints) blocks.push({ type: "keypoints", content: keypoints });

  if (lesson.challenge) blocks.push({ type: "challenge", content: `<p>${lesson.challenge}</p>` });

  (lesson.quiz || []).forEach((q, i) => {
    blocks.push({ type: "quiz", question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation || "" , quizIndex: i });
  });

  if (lesson.summary) blocks.push({ type: "summary", content: `<p>${lesson.summary}</p>` });

  if (!blocks.length) {
    blocks.push({ type: "challenge", content: `<div class="coming-soon-card">🏆 لا يوجد تحدٍ إضافي لهذا الدرس بعد.</div>` });
  }
  return blocks;
}

/** Splits a lesson's total XP/coins across the generated missions. */
function splitRewards(total, ratios) {
  return ratios.map((r, i) =>
    i === ratios.length - 1
      ? total - ratios.slice(0, -1).reduce((s, rr) => s + Math.round(total * rr), 0)
      : Math.round(total * r)
  );
}

/** Converts one real ContentStore lesson into a `missionsData` array:
 *  Content → Practice → (Virtual Lab, only if the teacher configured
 *  one) → Challenge & Quiz. Every block type is one the engine really
 *  renders (see `renderBlock`), so the same mission-card/complete-
 *  overlay flow now shows real, teacher-authored material. */
function buildMissionsFromLesson(lesson) {
  const hasLab = !!(lesson.virtualLab && lesson.virtualLab.title);
  const ratios = hasLab ? [0.3, 0.25, 0.25, 0.2] : [0.4, 0.3, 0.3];
  const xpParts = splitRewards(lesson.xp || 0, ratios);
  const coinParts = splitRewards(lesson.coins || 0, ratios);

  const missions = [
    {
      title: "استكشاف الدرس",
      objective: lesson.description || `تعرّف على أساسيات "${lesson.title}".`,
      icon: "📖",
      blocks: buildContentBlocks(lesson),
      summary: lesson.description || "راجعت المحتوى الأساسي لهذا الدرس.",
      badgeIcon: "📖", badgeName: "مستكشف المحتوى",
    },
    {
      title: "التطبيق والأنشطة",
      objective: "طبّق ما تعلمته من خلال المرفقات والألعاب والأنشطة المرتبطة بالدرس.",
      icon: "🎮",
      blocks: buildPracticeBlocks(lesson),
      summary: "تدرّبت على تطبيق ما تعلمته من خلال الأنشطة والمرفقات.",
      badgeIcon: "🎮", badgeName: "لاعب نشيط",
    },
  ];

  if (hasLab) {
    missions.push({
      title: "المعمل الافتراضي",
      objective: `أجرِ تجربة "${lesson.virtualLab.title}" خطوة بخطوة، والتزم بتعليمات السلامة، ثم أجب عن أسئلة المعمل.`,
      icon: "🧪",
      blocks: [{ type: "lab" }],
      summary: "أتممت التجربة العملية التفاعلية لهذا الدرس.",
      badgeIcon: "🧪", badgeName: "عالم صغير",
    });
  }

  missions.push({
    title: "التحدي والاختبار الختامي",
    objective: "أثبت فهمك من خلال التحدي والاختبار النهائي لهذا الدرس.",
    icon: "🏆",
    blocks: buildChallengeBlocks(lesson),
    summary: lesson.summary || "أحسنت! أنهيت هذا الدرس بنجاح.",
    badgeIcon: "🏆", badgeName: "بطل الدرس",
  });

  return missions.map((m, i) => ({
    number: i + 1,
    title: m.title,
    objective: m.objective,
    icon: m.icon,
    blocks: m.blocks,
    summary: m.summary,
    rewards: { xp: xpParts[i], coins: coinParts[i], stars: 3, badgeIcon: m.badgeIcon, badgeName: m.badgeName },
  }));
}

/** Renders the persistent Hero Banner above the mission card: lesson
 *  title, a colorful subject-themed illustration, overall lesson
 *  progress (across all missions, not just the current one), a rough
 *  time estimate, and the lesson's total XP reward. Runs every time a
 *  mission renders so the progress ring always reflects where the
 *  student actually is. */
function renderHeroBanner() {
  const el = document.getElementById("lessonHeroBanner");
  if (!el) return;

  const title = engineState.lessonTitle || engineState.subject.name;
  const totalXp = missionsData.reduce((sum, m) => sum + (m.rewards?.xp || 0), 0);
  const estimatedMinutes = missionsData.reduce((sum, m) => sum + (m.blocks?.length || 1) * 2, 5);
  const progressPct = Math.round((engineState.missionIndex / missionsData.length) * 100);

  el.style.setProperty("--w1", engineState.subject.w1);
  el.style.setProperty("--w2", engineState.subject.w2);
  el.innerHTML = `
    <div class="lesson-hero__illustration"><span>${engineState.subject.icon}</span></div>
    <div class="lesson-hero__body">
      <span class="lesson-hero__eyebrow">${engineState.subject.name}</span>
      <h1 class="lesson-hero__title">${title}</h1>
      <div class="lesson-hero__meta">
        <span class="lesson-hero__chip">⏱️ ${estimatedMinutes} دقيقة تقريبًا</span>
        <span class="lesson-hero__chip">⭐ ${totalXp} XP</span>
      </div>
    </div>
    <div class="lesson-hero__progress">
      <svg viewBox="0 0 80 80" class="lesson-hero__ring">
        <circle cx="40" cy="40" r="34" class="lesson-hero__ring-track" />
        <circle cx="40" cy="40" r="34" class="lesson-hero__ring-fill" style="stroke-dasharray:${2 * Math.PI * 34}; stroke-dashoffset:${2 * Math.PI * 34 * (1 - progressPct / 100)}" />
      </svg>
      <span class="lesson-hero__progress-label">${progressPct}%</span>
    </div>
  `;
}

/* -----------------------------------------------------------------
   DARK MODE — a simple persisted toggle. Because every existing color
   in css/style.css and css/lesson-engine.css is already a CSS custom
   property (var(--card-bg), var(--ink), ...), overriding those same
   variable names on <body> is enough for the whole page to re-theme
   itself — no other stylesheet needs to change.
   ----------------------------------------------------------------- */
function applyStoredTheme() {
  try {
    const saved = window.localStorage.getItem("eduverse:theme");
    if (saved === "dark") document.body.dataset.theme = "dark";
  } catch {
    /* theme just won't persist this session */
  }
}

function setupThemeToggle() {
  const btn = document.getElementById("themeToggleBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const isDark = document.body.dataset.theme === "dark";
    document.body.dataset.theme = isDark ? "light" : "dark";
    btn.textContent = isDark ? "🌙" : "☀️";
    try {
      window.localStorage.setItem("eduverse:theme", isDark ? "light" : "dark");
    } catch {
      /* ignore */
    }
  });
  btn.textContent = document.body.dataset.theme === "dark" ? "☀️" : "🌙";
}

/** Shared count-up animation (ease-out cubic), used for XP/coins in the top bar. */
function countUp(el, from, to, duration = 900) {
  if (!el) return;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (to - from) * eased).toLocaleString("ar");
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/**
 * Scatters a few faint floating shapes behind the mission stage,
 * using the current subject's icon for a subtle themed ambiance.
 */
function renderStageBackground(subject) {
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

/** Sets the top bar's subject icon/name, lesson name, and the
 *  "return to unit" link. Uses `engineState.worldId` directly (the actual
 *  `?world=` the student arrived with) instead of reverse-searching
 *  `subjectsMeta`, since a ContentStore-sourced subject object won't
 *  be found there by reference. */
function renderTopbarIdentity(subject) {
  const iconEl = document.getElementById("topbarSubjectIcon");
  const link = document.getElementById("topbarSubjectLink");
  const returnBtn = document.getElementById("returnToUnitBtn");
  const lessonNameEl = document.getElementById("topbarLessonName");
  const worldQuery = `units.html?world=${encodeURIComponent(engineState.worldId || "general")}`;

  if (iconEl) iconEl.textContent = subject.icon;
  if (link) link.href = worldQuery;
  if (returnBtn) returnBtn.href = worldQuery;
  if (lessonNameEl) lessonNameEl.textContent = engineState.lessonTitle || subject.name;

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
      if (i < engineState.missionIndex) cls += " is-done";
      if (i === engineState.missionIndex) cls += " is-current";
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

  if (missionLabel) missionLabel.textContent = `المهمة ${engineState.missionIndex + 1} من ${missionsData.length}`;
  if (levelEl) levelEl.textContent = engineState.level;
  if (achievementsEl) achievementsEl.textContent = engineState.achievements;

  if (progressFill) {
    const pct = Math.round((engineState.missionIndex / missionsData.length) * 100);
    requestAnimationFrame(() => (progressFill.style.width = `${pct}%`));
  }

  renderMissionDots();
}

/**
 * Renders one content block. Recognized rich types (image / video /
 * audio / pdf / ppt / vocabulary / quiz / objectives / homework /
 * games / summary / challenge) get real markup; anything else falls
 * back to the original generic placeholder-box treatment so the
 * template placeholders this engine shipped with still work exactly
 * as before.
 */
function renderBlock(block, missionNumber) {
  const meta = blockTypeMeta[block.type] || { icon: "🧩", label: "منطقة محتوى" };

  if (block.type === "quiz") {
    return buildQuizMarkup(block, missionNumber);
  }
  if (block.type === "games") {
    return buildGamesMarkup(block, missionNumber);
  }
  if (block.type === "lab") {
    return `
      <div class="mission-block" data-block-type="lab">
        <h3>🧪 المعمل الافتراضي</h3>
        <div id="labMount-${missionNumber}"></div>
      </div>
    `;
  }

  // Every other recognized/unrecognized type shares the same simple
  // "titled card" shell — only what's inside `content`/`placeholder`
  // differs, so rich HTML (an <img>, an <iframe>, a flip-card grid...)
  // renders exactly as built by buildMissionsFromLesson().
  const inner = block.content !== undefined ? block.content : `<div class="placeholder-box">${block.placeholder || ""}</div>`;
  return `
    <div class="mission-block" data-block-type="${block.type}">
      <h3>${meta.icon} ${meta.label}</h3>
      ${inner}
    </div>
  `;
}

/** Games block markup: a tab per enabled+available game, plus a
 *  mount point the active tab renders into via GamesEngine.render(). */
function buildGamesMarkup(block, missionNumber) {
  const tabs = (block.gameKeys || [])
    .map((key, i) => {
      const def = typeof GamesEngine !== "undefined" ? GamesEngine.getGameDef(key) : null;
      if (!def) return "";
      return `<button type="button" class="games-tab-btn${i === 0 ? " is-active" : ""}" data-game-key="${key}">${def.icon} ${def.label}</button>`;
    })
    .join("");

  return `
    <div class="mission-block" data-block-type="games" data-games-block="${missionNumber}">
      <h3>🕹️ الألعاب التعليمية</h3>
      <div class="games-tab-list">${tabs}</div>
      <div class="games-stage" id="gamesStage-${missionNumber}"></div>
    </div>
  `;
}

/** Wires up every games block currently on screen: tab-switch renders
 *  the chosen game via GamesEngine; the first tab auto-renders. */
function setupGamesBlocks() {
  if (typeof GamesEngine === "undefined" || !engineState.currentLesson) return;
  document.querySelectorAll("[data-games-block]").forEach((block) => {
    const missionNumber = block.dataset.gamesBlock;
    const stage = document.getElementById(`gamesStage-${missionNumber}`);
    const firstTab = block.querySelector(".games-tab-btn");
    if (firstTab && stage) GamesEngine.render(stage, firstTab.dataset.gameKey, engineState.currentLesson);

    block.querySelectorAll(".games-tab-btn").forEach((tab) => {
      tab.addEventListener("click", () => {
        block.querySelectorAll(".games-tab-btn").forEach((t) => t.classList.remove("is-active"));
        tab.classList.add("is-active");
        GamesEngine.render(stage, tab.dataset.gameKey, engineState.currentLesson);
      });
    });
  });
}

/** Mounts the Virtual Lab (if this mission has one) into its block. */
function setupLabBlocks() {
  if (typeof VirtualLab === "undefined" || !engineState.currentLesson) return;
  document.querySelectorAll('[id^="labMount-"]').forEach((mount) => {
    VirtualLab.render(mount, engineState.currentLesson.virtualLab, () => {
      if (typeof EduBot !== "undefined") EduBot.encourage();
    });
  });
}

/** Quiz block markup + the exact same instant-feedback interaction
 *  pattern used on the flagship Lesson 1 page (js/lesson1.js), so a
 *  teacher-authored quiz question feels identical to the hand-built
 *  one — same CSS classes, same correct/wrong states, same rewards. */
function buildQuizMarkup(block, missionNumber) {
  const quizId = `quiz-${missionNumber}-${block.quizIndex}`;
  const optionsMarkup = (block.options || [])
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
    <div class="mission-block quiz-block" data-quiz-container="${quizId}" data-mission="${missionNumber}" data-quiz-index="${block.quizIndex}">
      <h3>❓ اختبار سريع</h3>
      <p class="quiz-question">${block.question}</p>
      <div class="quiz-options">${optionsMarkup}</div>
      <p class="quiz-feedback" id="feedback-${quizId}" hidden></p>
    </div>
  `;
}

/** Wires up every quiz block currently on screen: pick an option,
 *  get instant right/wrong feedback + a small bonus XP reward, same
 *  as Lesson 1's quizzes. Safe to call even if there are no quizzes
 *  in the current mission (querySelectorAll just finds nothing). */
function setupQuizzes() {
  const container = document.getElementById("missionContent");
  if (!container) return;

  container.querySelectorAll(".quiz-options").forEach((optionsEl) => {
    optionsEl.addEventListener("click", (event) => {
      const btn = event.target.closest(".quiz-option");
      if (!btn || optionsEl.dataset.answered === "true") return;

      const quizBlock = optionsEl.closest(".quiz-block");
      const missionNumber = Number(quizBlock.dataset.mission);
      const quizIndex = Number(quizBlock.dataset.quizIndex);
      const mission = missionsData.find((m) => m.number === missionNumber);
      const block = mission.blocks.find((b) => b.type === "quiz" && b.quizIndex === quizIndex);
      const chosen = Number(btn.dataset.optionIndex);
      const correct = chosen === block.correctIndex;

      optionsEl.dataset.answered = "true";
      optionsEl.querySelectorAll(".quiz-option").forEach((opt, i) => {
        opt.disabled = true;
        const iconEl = opt.querySelector(".quiz-option__icon");
        if (i === block.correctIndex) {
          opt.classList.add("is-correct");
          if (iconEl) iconEl.textContent = "✅";
        } else if (i === chosen) {
          opt.classList.add("is-wrong");
          if (iconEl) iconEl.textContent = "❌";
        }
      });

      const feedback = document.getElementById(`feedback-${btn.dataset.quizId}`);
      if (feedback) {
        feedback.hidden = false;
        feedback.textContent = correct
          ? `✅ ${block.explanation || "إجابة صحيحة!"}`
          : `❌ إجابة غير صحيحة. ${block.explanation || ""}`;
        feedback.classList.add(correct ? "is-correct" : "is-wrong");
      }

      engineState.quizResults[btn.dataset.quizId] = correct;

      if (typeof EduBot !== "undefined") EduBot.sound(correct ? "correct" : "wrong");
      if (correct && typeof addXP === "function") {
        addXP(10, "quiz-correct");
        if (typeof EduBot !== "undefined") EduBot.celebrate("Nice! That's correct 🎉 +10 XP", "صح! أحسنت، +10 نقاط خبرة.");
      }
    });
  });
}

/** Wires up every vocabulary flip-card currently on screen: a click
 *  toggles the `.is-flipped` class, swapping which face (term vs.
 *  definition) is shown — a small, self-contained "game" built from
 *  the lesson's own vocabulary, no separate authoring needed. */
function setupVocabFlipCards() {
  const container = document.getElementById("missionContent");
  if (!container) return;
  container.querySelectorAll(".vocab-flip-card").forEach((card) => {
    card.addEventListener("click", () => card.classList.toggle("is-flipped"));
  });
}

/** Builds the full mission card markup for one mission object. */
function buildMissionCard(mission, subject) {
  const stepsMarkup = mission.blocks
    .filter((b, i, arr) => arr.findIndex((x) => x.type === b.type) === i) // one step chip per type
    .map((b) => {
      const meta = blockTypeMeta[b.type] || { icon: "🧩", label: "محتوى" };
      return `<span class="mission-step"><span class="mission-step__icon">${meta.icon}</span>${meta.label}</span>`;
    })
    .join("");

  return `
    <article class="mission-card" style="--w1:${subject.w1}; --w2:${subject.w2}">
      <div class="mission-card__header">
        <span class="mission-card__badge">المهمة ${mission.number} من ${missionsData.length}</span>
        <h1 class="mission-card__title">${mission.title}</h1>
        <p class="mission-card__objective"><strong>هدف المهمة:</strong> ${mission.objective}</p>
      </div>

      <div class="mission-card__illustration"><span>${mission.icon}</span></div>

      <div class="mission-steps">${stepsMarkup}</div>

      ${mission.blocks.map((b) => renderBlock(b, mission.number)).join("")}

      <div class="mission-summary">
        <h3>📋 ملخص المهمة</h3>
        <p>${mission.summary}</p>
      </div>

      <button type="button" class="btn btn--primary btn--lg mission-card__next-inline has-ripple" id="inlineNextMissionBtn">
        إنهاء هذه المهمة ▶
      </button>
    </article>
  `;
}

/** Renders the current mission into the stage and refreshes the top bar. */
function renderMission() {
  const content = document.getElementById("missionContent");
  const mission = missionsData[engineState.missionIndex];
  if (!content || !mission) return;

  content.innerHTML = buildMissionCard(mission, engineState.subject);
  renderTopbarStatus();
  renderHeroBanner();
  setupQuizzes();
  setupVocabFlipCards();
  setupGamesBlocks();
  setupLabBlocks();
  setupReadAloudButtons();
  setupLearningCardNav();

  // Both the inline button and the bottom-bar button trigger the same action.
  const inlineBtn = document.getElementById("inlineNextMissionBtn");
  if (inlineBtn) inlineBtn.addEventListener("click", handleNextMissionClick);

  updateNavButtonsState();
}

/** Disables the "previous" button on the first mission. */
function updateNavButtonsState() {
  const prevBtn = document.getElementById("prevMissionBtn");
  if (!prevBtn) return;
  prevBtn.disabled = engineState.missionIndex === 0;
  prevBtn.style.opacity = engineState.missionIndex === 0 ? "0.45" : "1";
  prevBtn.style.cursor = engineState.missionIndex === 0 ? "not-allowed" : "pointer";
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

/** Shows the Mission Complete overlay with that mission's rewards. */
function showMissionComplete(mission) {
  const overlay = document.getElementById("missionCompleteOverlay");
  const xpEl = document.getElementById("completeXp");
  const coinsEl = document.getElementById("completeCoins");
  const starsEl = document.getElementById("completeStars");
  const badgeIconEl = document.getElementById("completeBadgeRow");
  const badgeNameEl = document.getElementById("completeBadgeName");
  const continueBtn = document.getElementById("completeContinueBtn");
  const isLastMission = engineState.missionIndex === missionsData.length - 1;

  if (!overlay) return;

  const prevXp = engineState.xp;
  const prevCoins = engineState.coins;
  engineState.xp += mission.rewards.xp;
  engineState.coins += mission.rewards.coins;
  engineState.achievements += 1;

  if (xpEl) countUp(xpEl, 0, mission.rewards.xp);
  if (coinsEl) countUp(coinsEl, 0, mission.rewards.coins);
  if (starsEl) starsEl.textContent = "⭐".repeat(mission.rewards.stars) + "☆".repeat(3 - mission.rewards.stars);
  if (badgeIconEl) badgeIconEl.querySelector(".mission-complete-card__badge-icon").textContent = mission.rewards.badgeIcon;
  if (badgeNameEl) badgeNameEl.textContent = mission.rewards.badgeName;
  if (continueBtn) {
    continueBtn.textContent = isLastMission ? "إنهاء الدرس والانتقال للمكافآت" : "المتابعة إلى المهمة التالية";
  }

  overlay.classList.add("is-active");
  playConfetti();

  // Feed the shared, persistent Core Gamification System (same modules
  // Lesson 1 uses) — so rewards earned here are real, not just a local
  // topbar number that resets on reload.
  if (typeof addXP === "function") addXP(mission.rewards.xp, "mission-complete");
  if (typeof addCoins === "function") addCoins(mission.rewards.coins, "Mission reward");

  // Reflect the new cumulative XP/coins in the top bar behind the overlay.
  const topbarXp = document.getElementById("topbarXp");
  const topbarCoins = document.getElementById("topbarCoins");
  countUp(topbarXp, prevXp, engineState.xp);
  countUp(topbarCoins, prevCoins, engineState.coins);
}

/** Hides the Mission Complete overlay. */
function hideMissionComplete() {
  const overlay = document.getElementById("missionCompleteOverlay");
  if (overlay) overlay.classList.remove("is-active");
}

/** Handles both the bottom-bar and inline "next mission" buttons. */
function handleNextMissionClick() {
  const mission = missionsData[engineState.missionIndex];
  showMissionComplete(mission);
}

/**
 * Handles the overlay's "Continue" button: advances to the next
 * mission (playing its unlock via the dot/progress transitions), or
 * — on the final mission — completes the lesson.
 *
 * For a real, teacher-authored lesson (engineState.lessonId set), this
 * marks it done in Progress and shows the actual Final Achievement
 * Certificate — the exact same flow Lesson 1 ends with. For the
 * generic template placeholders (no real lesson loaded), it falls
 * back to the original behavior of returning to the Units page, so
 * any old `?world=&unit=` link still works exactly as before.
 */
function handleCompleteContinue() {
  const isLastMission = engineState.missionIndex === missionsData.length - 1;
  hideMissionComplete();

  if (isLastMission) {
    if (typeof EduBot !== "undefined") EduBot.stopSpeech();

    const unitHref = document.getElementById("returnToUnitBtn")?.href || "units.html";

    if (engineState.lessonId && typeof Certificate !== "undefined") {
      const totalXp = missionsData.reduce((sum, m) => sum + (m.rewards?.xp || 0), 0);
      const totalCoins = missionsData.reduce((sum, m) => sum + (m.rewards?.coins || 0), 0);
      const totalStars = missionsData.reduce((sum, m) => sum + (m.rewards?.stars || 0), 0);
      const maxStars = missionsData.length * 3;
      const finalMission = missionsData[missionsData.length - 1];

      if (typeof Progress !== "undefined") {
        const unit = typeof ContentStore !== "undefined" ? ContentStore.getUnitById(engineState.unitId) : null;
        const totalLessons = unit && typeof ContentStore !== "undefined" ? ContentStore.getPublishedLessons(unit.id).length : 1;
        Progress.markLessonComplete(engineState.worldId, engineState.lessonId, { totalLessons });
      }

      Certificate.show({
        subject: engineState.subject.name,
        lessonName: engineState.lessonTitle,
        xpEarned: totalXp,
        coinsEarned: totalCoins,
        stars: totalStars,
        maxStars,
        badge: { icon: finalMission.rewards.badgeIcon, name: finalMission.rewards.badgeName },
        nextHref: unitHref,
        dashboardHref: "gamification.html",
      });
      return;
    }

    // Generic/template flow (no real lesson loaded) — unchanged.
    window.location.href = unitHref;
    return;
  }

  engineState.missionIndex += 1;
  renderMission(); // mission-card's entrance animation doubles as the "unlock" effect
}

/** Moves to the previous mission (no celebration, just navigation). */
function handlePrevMissionClick() {
  if (engineState.missionIndex === 0) return;
  engineState.missionIndex -= 1;
  renderMission();
}

/** Brief toast acknowledging a manual "Save Progress" click. */
function handleSaveProgressClick() {
  let toast = document.querySelector(".save-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "save-toast";
    toast.textContent = "✅ تم حفظ تقدمك";
    document.body.appendChild(toast);
  }
  toast.classList.add("is-visible");
  window.clearTimeout(handleSaveProgressClick._timer);
  handleSaveProgressClick._timer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

/** Ripple effect for any `.has-ripple` button (shared visual language with other pages). */
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

/** Wires up the bottom bar and overlay controls (static elements, bound once). */
function setupControls() {
  document.getElementById("nextMissionBtn")?.addEventListener("click", handleNextMissionClick);
  document.getElementById("prevMissionBtn")?.addEventListener("click", handlePrevMissionClick);
  document.getElementById("saveProgressBtn")?.addEventListener("click", handleSaveProgressClick);
  document.getElementById("completeContinueBtn")?.addEventListener("click", handleCompleteContinue);
}

/**
 * FUTURE HOOK (not implemented in this phase):
 * A later phase will let a teacher upload a PDF/Word/PPTX file and
 * have a parser generate an array of mission objects shaped exactly
 * like the ones in `missionsData`. That function would end by calling
 * something like `missionsData = parsedMissions; renderMission();` —
 * no other part of this engine would need to change.
 */
function loadMissionsFromDocument(/* file */) {
  // Intentionally left unimplemented for this phase.
}

/**
 * Attempts to load a real ContentStore lesson from `?lessonId=`.
 * On success, sets `engineState.lessonId/unitId/worldId/lessonTitle/subject`
 * and rebuilds `missionsData` from that lesson's real content. Falls
 * back to the generic template flow (unchanged) if there's no
 * `lessonId` param, or if it doesn't match any real lesson.
 */
function loadRealLessonIfPresent() {
  const params = new URLSearchParams(window.location.search);
  const lessonId = params.get("lessonId");
  if (!lessonId || typeof ContentStore === "undefined") return false;

  const lesson = ContentStore.getLessonById(lessonId);
  if (!lesson) {
    console.warn(`EduVerse: no lesson found for lessonId="${lessonId}" — showing the generic template instead.`);
    return false;
  }

  const unit = ContentStore.getUnitById(lesson.unitId);
  const worldIdFromUrl = params.get("world");
  const worldId = worldIdFromUrl || unit?.subjectId || "general";

  engineState.lessonId = lesson.id;
  engineState.currentLesson = lesson;
  engineState.unitId = lesson.unitId;
  engineState.worldId = worldId;
  engineState.lessonTitle = lesson.title;
  engineState.subject = getSelectedSubject(worldId); // re-reads the (now-known) worldId's real identity

  missionsData = buildMissionsFromLesson(lesson);
  return true;
}

/** Page entry point. */
function initLessonEngine() {
  applyStoredTheme();

  const params = new URLSearchParams(window.location.search);
  engineState.worldId = params.get("world") || "general";
  engineState.subject = getSelectedSubject();

  loadRealLessonIfPresent();

  renderStageBackground(engineState.subject);
  renderTopbarIdentity(engineState.subject);
  renderMission();
  setupControls();
  setupThemeToggle();
  setupRippleDelegation();
}

document.addEventListener("DOMContentLoaded", initLessonEngine);
