/* =================================================================
   EDUVERSE — GAMES ENGINE
   -------------------------------------------------------------------
   Every game below is fully playable and driven entirely by a
   lesson's own real data (vocabulary / quiz / image / diagram labels
   / sentences) — nothing here is a placeholder or a "coming soon"
   badge. A game is only ever offered to a student if the lesson
   actually has enough data to play it (see `isGameAvailable`), so a
   button never leads to an empty/broken screen.

   10 real mechanics power the 14 named games from the spec (some
   names share one mechanic, re-labeled per subject — e.g. "Match" and
   "Vocabulary Match" are the same click-to-pair mechanic):

     match          → Match (science) / Vocabulary Match (english)
     memory         → Memory Cards (science) / Flip Cards (english)
     dragDrop       → Drag & Drop (science)
     classification → Classification (science)
     labelDiagram   → Label Diagram (science)
     puzzle         → Puzzle (science)
     quizChallenge  → Quiz Challenge (science) / Grammar Challenge (english, category="grammar") / Reading Quiz (english, category="reading")
     sentenceBuilder→ Sentence Builder (english)
     listening      → Listening Game (english)
     wordSearch     → Word Search (english)
   ================================================================= */

const GamesEngine = (function () {
  /** Full catalog. `subjects` controls which subjects offer this
   *  toggle in the Teacher Dashboard; `engine` is the actual mechanic;
   *  `category` (optional) filters `lesson.quiz` for the quizChallenge
   *  engine so Grammar/Reading only show questions tagged that way. */
  const CATALOG = [
    { key: "dragDrop", engine: "dragDrop", subjects: ["science"], icon: "🧲", label: "السحب والإفلات" },
    { key: "match", engine: "match", subjects: ["science"], icon: "🔗", label: "لعبة المطابقة" },
    { key: "memory", engine: "memory", subjects: ["science"], icon: "🧠", label: "بطاقات الذاكرة" },
    { key: "classification", engine: "classification", subjects: ["science"], icon: "🗂️", label: "التصنيف" },
    { key: "labelDiagram", engine: "labelDiagram", subjects: ["science"], icon: "📍", label: "تسمية الرسم" },
    { key: "puzzle", engine: "puzzle", subjects: ["science"], icon: "🧩", label: "البازل" },
    { key: "quizChallenge", engine: "quizChallenge", subjects: ["science", "general"], icon: "❓", label: "تحدي الاختبار" },

    { key: "vocabMatch", engine: "match", subjects: ["english"], icon: "🔗", label: "مطابقة المفردات" },
    { key: "flipCards", engine: "memory", subjects: ["english"], icon: "🃏", label: "البطاقات القابلة للقلب" },
    { key: "sentenceBuilder", engine: "sentenceBuilder", subjects: ["english"], icon: "🧱", label: "بناء الجملة" },
    { key: "listening", engine: "listening", subjects: ["english"], icon: "🎧", label: "لعبة الاستماع" },
    { key: "grammar", engine: "quizChallenge", category: "grammar", subjects: ["english"], icon: "📐", label: "تحدي القواعد" },
    { key: "wordSearch", engine: "wordSearch", subjects: ["english"], icon: "🔍", label: "البحث عن الكلمات" },
    { key: "reading", engine: "quizChallenge", category: "reading", subjects: ["english"], icon: "📚", label: "اختبار القراءة" },

    // Generic fallback set for subjects that aren't science/english
    // (math, arabic, social, ict) — the same real mechanics, generic
    // labels, so no subject is ever left with zero playable games.
    { key: "genMatch", engine: "match", subjects: ["general"], icon: "🔗", label: "لعبة المطابقة" },
    { key: "genMemory", engine: "memory", subjects: ["general"], icon: "🧠", label: "بطاقات الذاكرة" },
    { key: "genPuzzle", engine: "puzzle", subjects: ["general"], icon: "🧩", label: "البازل" },
  ];

  function getCatalogForSubject(subjectId) {
    const bucket = subjectId === "science" || subjectId === "english" ? subjectId : "general";
    return CATALOG.filter((g) => g.subjects.includes(bucket));
  }

  function getGameDef(key) {
    return CATALOG.find((g) => g.key === key) || null;
  }

  function quizForCategory(lesson, category) {
    const quiz = lesson.quiz || [];
    if (!category) return quiz;
    const tagged = quiz.filter((q) => q.category === category);
    // If nothing was explicitly tagged for this category yet, fall
    // back to the full set rather than pretending the game doesn't
    // exist — an un-tagged quiz is still a real, playable quiz.
    return tagged.length ? tagged : quiz;
  }

  /** True only if the lesson actually has enough real data to play
   *  this game — this is what keeps every offered button genuinely
   *  playable and nothing "coming soon". */
  function isGameAvailable(gameDef, lesson) {
    switch (gameDef.engine) {
      case "match":
      case "memory":
      case "dragDrop":
        return (lesson.vocabulary || []).length >= 2;
      case "classification":
        return (lesson.quiz || []).length >= 1;
      case "labelDiagram":
        return !!lesson.image && (lesson.diagramLabels || []).length >= 1;
      case "puzzle":
        return true; // always playable — falls back to a generated tile image
      case "quizChallenge":
        return quizForCategory(lesson, gameDef.category).length >= 1;
      case "sentenceBuilder":
        return (lesson.sentences || []).length >= 1 || (lesson.vocabulary || []).length >= 1;
      case "listening":
        return typeof window !== "undefined" && "speechSynthesis" in window && (lesson.vocabulary || []).length >= 2;
      case "wordSearch":
        return (lesson.vocabulary || []).filter((v) => v.term && v.term.replace(/\s/g, "").length <= 10).length >= 2;
      default:
        return false;
    }
  }

  /** Returns only the enabled (teacher-toggled) games that also pass
   *  `isGameAvailable` for this specific lesson's data. */
  function getPlayableGames(lesson, subjectId) {
    const catalog = getCatalogForSubject(subjectId);
    return catalog.filter((g) => lesson.gameSettings?.[g.key] && isGameAvailable(g, lesson));
  }

  /* -----------------------------------------------------------------
     SHARED HELPERS
     ----------------------------------------------------------------- */
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function scoreFooter(container, correct, total, label = "النتيجة") {
    let bar = container.querySelector(".game-score-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "game-score-bar";
      container.appendChild(bar);
    }
    bar.innerHTML = `<span>🏁 ${label}: ${correct} / ${total}</span>`;
    if (correct === total && total > 0) {
      bar.classList.add("is-complete");
      bar.innerHTML += ` <span class="game-score-bar__done">🎉 اكتملت اللعبة!</span>`;
      if (typeof addXP === "function") addXP(15, "game-complete");
      if (typeof EduBot !== "undefined") EduBot.celebrate("Great job finishing the game! 🎮", "أحسنت! أنهيت اللعبة بنجاح 🎮");
    }
    return bar;
  }

  /* -----------------------------------------------------------------
     1) MATCH — click a term, then click its definition
     ----------------------------------------------------------------- */
  function renderMatch(container, lesson) {
    const pairs = shuffle(lesson.vocabulary).slice(0, 8);
    const terms = shuffle(pairs.map((p, i) => ({ ...p, pairId: i })));
    const defs = shuffle(pairs.map((p, i) => ({ ...p, pairId: i })));
    let selectedTerm = null;
    let matched = 0;

    container.innerHTML = `
      <p class="game-instructions">اضغط على مصطلح ثم اضغط على تعريفه المطابق.</p>
      <div class="match-game">
        <div class="match-game__col" data-col="terms">
          ${terms.map((t) => `<button type="button" class="match-tile" data-pair-id="${t.pairId}">${t.term}</button>`).join("")}
        </div>
        <div class="match-game__col" data-col="defs">
          ${defs.map((d) => `<button type="button" class="match-tile match-tile--def" data-pair-id="${d.pairId}">${d.definition}</button>`).join("")}
        </div>
      </div>
    `;

    scoreFooter(container, 0, pairs.length);

    container.querySelector('[data-col="terms"]').addEventListener("click", (e) => {
      const tile = e.target.closest(".match-tile");
      if (!tile || tile.classList.contains("is-matched")) return;
      container.querySelectorAll('[data-col="terms"] .match-tile').forEach((t) => t.classList.remove("is-selected"));
      tile.classList.add("is-selected");
      selectedTerm = tile;
    });

    container.querySelector('[data-col="defs"]').addEventListener("click", (e) => {
      const tile = e.target.closest(".match-tile");
      if (!tile || tile.classList.contains("is-matched") || !selectedTerm) return;

      if (tile.dataset.pairId === selectedTerm.dataset.pairId) {
        tile.classList.add("is-matched");
        selectedTerm.classList.add("is-matched");
        matched += 1;
        scoreFooter(container, matched, pairs.length);
      } else {
        tile.classList.add("is-wrong-flash");
        selectedTerm.classList.add("is-wrong-flash");
        window.setTimeout(() => {
          tile.classList.remove("is-wrong-flash");
          selectedTerm?.classList.remove("is-wrong-flash");
        }, 450);
      }
      selectedTerm.classList.remove("is-selected");
      selectedTerm = null;
    });
  }

  /* -----------------------------------------------------------------
     2) MEMORY — concentration-style flip pairs (term ↔ its definition)
     ----------------------------------------------------------------- */
  function renderMemory(container, lesson) {
    const pairs = shuffle(lesson.vocabulary).slice(0, 6);
    const cards = shuffle(
      pairs.flatMap((p, i) => [
        { pairId: i, face: p.term, kind: "term" },
        { pairId: i, face: p.definition, kind: "def" },
      ])
    );
    let firstPick = null;
    let lock = false;
    let matched = 0;

    container.innerHTML = `
      <p class="game-instructions">اقلب بطاقتين في كل مرة وابحث عن المصطلح وتعريفه.</p>
      <div class="memory-grid">
        ${cards
          .map(
            (c, i) => `
          <button type="button" class="memory-card" data-index="${i}" data-pair-id="${c.pairId}">
            <span class="memory-card__inner">
              <span class="memory-card__face memory-card__face--back">?</span>
              <span class="memory-card__face memory-card__face--front">${c.face}</span>
            </span>
          </button>`
          )
          .join("")}
      </div>
    `;
    scoreFooter(container, 0, pairs.length);

    container.querySelector(".memory-grid").addEventListener("click", (e) => {
      const card = e.target.closest(".memory-card");
      if (!card || lock || card.classList.contains("is-matched") || card.classList.contains("is-flipped")) return;

      card.classList.add("is-flipped");

      if (!firstPick) {
        firstPick = card;
        return;
      }

      if (firstPick.dataset.pairId === card.dataset.pairId && firstPick !== card) {
        firstPick.classList.add("is-matched");
        card.classList.add("is-matched");
        matched += 1;
        scoreFooter(container, matched, pairs.length);
        firstPick = null;
      } else {
        lock = true;
        window.setTimeout(() => {
          firstPick.classList.remove("is-flipped");
          card.classList.remove("is-flipped");
          firstPick = null;
          lock = false;
        }, 700);
      }
    });
  }

  /* -----------------------------------------------------------------
     3) DRAG & DROP — tap a term, then tap its correct drop zone
        (also supports real mouse drag as a progressive enhancement)
     ----------------------------------------------------------------- */
  function renderDragDrop(container, lesson) {
    const pairs = shuffle(lesson.vocabulary).slice(0, 6);
    const terms = shuffle(pairs.map((p, i) => ({ ...p, pairId: i })));
    let placed = 0;

    container.innerHTML = `
      <p class="game-instructions">اسحب كل مصطلح (أو اضغط عليه) ثم اضغط على التعريف الصحيح لإسقاطه هناك.</p>
      <div class="dragdrop-game">
        <div class="dragdrop-game__bank">
          ${terms.map((t) => `<span class="dragdrop-chip" draggable="true" data-pair-id="${t.pairId}">${t.term}</span>`).join("")}
        </div>
        <div class="dragdrop-game__zones">
          ${shuffle(pairs)
            .map((p, i) => `<div class="dragdrop-zone" data-pair-id="${p.pairId}"><span class="dragdrop-zone__label">${p.definition}</span><span class="dragdrop-zone__slot"></span></div>`)
            .join("")}
        </div>
      </div>
    `;
    scoreFooter(container, 0, pairs.length);

    let selectedChip = null;
    const bank = container.querySelector(".dragdrop-game__bank");
    const zones = container.querySelector(".dragdrop-game__zones");

    function tryPlace(chip, zone) {
      if (!chip || zone.classList.contains("is-filled")) return;
      if (chip.dataset.pairId === zone.dataset.pairId) {
        zone.classList.add("is-filled", "is-correct");
        zone.querySelector(".dragdrop-zone__slot").textContent = chip.textContent;
        chip.remove();
        placed += 1;
        scoreFooter(container, placed, pairs.length);
      } else {
        zone.classList.add("is-wrong-flash");
        window.setTimeout(() => zone.classList.remove("is-wrong-flash"), 450);
      }
    }

    bank.addEventListener("click", (e) => {
      const chip = e.target.closest(".dragdrop-chip");
      if (!chip) return;
      bank.querySelectorAll(".dragdrop-chip").forEach((c) => c.classList.remove("is-selected"));
      chip.classList.add("is-selected");
      selectedChip = chip;
    });
    zones.addEventListener("click", (e) => {
      const zone = e.target.closest(".dragdrop-zone");
      if (!zone || !selectedChip) return;
      tryPlace(selectedChip, zone);
      selectedChip = null;
    });

    bank.addEventListener("dragstart", (e) => {
      const chip = e.target.closest(".dragdrop-chip");
      if (chip) e.dataTransfer.setData("text/plain", chip.dataset.pairId);
    });
    zones.querySelectorAll(".dragdrop-zone").forEach((zone) => {
      zone.addEventListener("dragover", (e) => e.preventDefault());
      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        const pairId = e.dataTransfer.getData("text/plain");
        const chip = bank.querySelector(`.dragdrop-chip[data-pair-id="${pairId}"]`);
        tryPlace(chip, zone);
      });
    });
  }

  /* -----------------------------------------------------------------
     4) CLASSIFICATION — sort quiz answer options into correct/wrong
     ----------------------------------------------------------------- */
  function renderClassification(container, lesson) {
    const items = [];
    (lesson.quiz || []).forEach((q, qi) => {
      (q.options || []).forEach((opt, oi) => {
        if (opt) items.push({ text: opt, correct: oi === q.correctIndex, id: `${qi}-${oi}` });
      });
    });
    const pool = shuffle(items).slice(0, 10);
    let placed = 0;
    let selected = null;

    container.innerHTML = `
      <p class="game-instructions">اضغط على كل عبارة، ثم اضغط على "إجابات صحيحة" أو "إجابات خاطئة" لتصنيفها.</p>
      <div class="classify-game">
        <div class="classify-game__pool">${pool.map((it) => `<span class="dragdrop-chip" data-id="${it.id}" data-correct="${it.correct}">${it.text}</span>`).join("")}</div>
        <div class="classify-game__bins">
          <div class="classify-bin classify-bin--correct" data-bin="true">✅ إجابات صحيحة</div>
          <div class="classify-bin classify-bin--wrong" data-bin="false">❌ إجابات خاطئة</div>
        </div>
      </div>
    `;
    scoreFooter(container, 0, pool.length);

    const poolEl = container.querySelector(".classify-game__pool");
    poolEl.addEventListener("click", (e) => {
      const chip = e.target.closest(".dragdrop-chip");
      if (!chip) return;
      poolEl.querySelectorAll(".dragdrop-chip").forEach((c) => c.classList.remove("is-selected"));
      chip.classList.add("is-selected");
      selected = chip;
    });

    container.querySelectorAll(".classify-bin").forEach((bin) => {
      bin.addEventListener("click", () => {
        if (!selected) return;
        const isCorrectBin = bin.dataset.bin === "true";
        const isCorrectItem = selected.dataset.correct === "true";
        if (isCorrectBin === isCorrectItem) {
          selected.remove();
          placed += 1;
          scoreFooter(container, placed, pool.length);
        } else {
          bin.classList.add("is-wrong-flash");
          window.setTimeout(() => bin.classList.remove("is-wrong-flash"), 450);
        }
        selected = null;
      });
    });
  }

  /* -----------------------------------------------------------------
     5) LABEL DIAGRAM — pins on the lesson image, assign the right term
     ----------------------------------------------------------------- */
  function renderLabelDiagram(container, lesson) {
    const pins = lesson.diagramLabels || [];
    let assigned = 0;

    container.innerHTML = `
      <p class="game-instructions">اضغط على كل دبوس رقمي على الصورة، واختر المصطلح الصحيح له.</p>
      <div class="label-diagram">
        <div class="label-diagram__image" style="background-image:url('${lesson.image}')">
          ${pins.map((p, i) => `<button type="button" class="label-diagram__pin" data-index="${i}" style="left:${p.x}%; top:${p.y}%;">${i + 1}</button>`).join("")}
        </div>
        <div class="label-diagram__picker" id="labelDiagramPicker" hidden></div>
      </div>
    `;
    scoreFooter(container, 0, pins.length);

    const options = shuffle(pins.map((p) => p.term));
    const picker = container.querySelector("#labelDiagramPicker");

    container.querySelectorAll(".label-diagram__pin").forEach((pin) => {
      pin.addEventListener("click", () => {
        if (pin.classList.contains("is-solved")) return;
        picker.hidden = false;
        picker.innerHTML = `<p>ما اسم الجزء رقم ${pin.dataset.index * 1 + 1}؟</p>` + options.map((opt) => `<button type="button" class="btn btn--secondary btn--sm">${opt}</button>`).join(" ");

        picker.querySelectorAll("button").forEach((btn) => {
          btn.addEventListener("click", () => {
            const pinData = pins[pin.dataset.index];
            if (btn.textContent === pinData.term) {
              pin.classList.add("is-solved");
              pin.textContent = "✓";
              assigned += 1;
              scoreFooter(container, assigned, pins.length);
              picker.hidden = true;
            } else {
              btn.classList.add("is-wrong-flash");
              window.setTimeout(() => btn.classList.remove("is-wrong-flash"), 450);
            }
          });
        });
      });
    });
  }

  /* -----------------------------------------------------------------
     6) PUZZLE — 3x3 sliding tile puzzle. Uses lesson.image, or a
        generated colorful canvas pattern if no image was provided so
        the game is never unavailable.
     ----------------------------------------------------------------- */
  function generateFallbackImage(lesson) {
    const canvas = document.createElement("canvas");
    canvas.width = 300; canvas.height = 300;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 300, 300);
    grad.addColorStop(0, "#3A7BFF");
    grad.addColorStop(1, "#8B5CF6");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 300, 300);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 120px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText((lesson.title || "E")[0], 150, 160);
    return canvas.toDataURL();
  }

  function renderPuzzle(container, lesson) {
    const imageUrl = lesson.image || generateFallbackImage(lesson);
    const size = 3;
    let tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    // Shuffle via random legal slide-moves from the solved state, so
    // the puzzle is always guaranteed solvable.
    for (let i = 0; i < 60; i++) {
      const blank = tiles.indexOf(0);
      const row = Math.floor(blank / size), col = blank % size;
      const neighbors = [];
      if (row > 0) neighbors.push(blank - size);
      if (row < size - 1) neighbors.push(blank + size);
      if (col > 0) neighbors.push(blank - 1);
      if (col < size - 1) neighbors.push(blank + 1);
      const swapWith = neighbors[Math.floor(Math.random() * neighbors.length)];
      [tiles[blank], tiles[swapWith]] = [tiles[swapWith], tiles[blank]];
    }

    container.innerHTML = `
      <p class="game-instructions">اضغط على أي قطعة مجاورة للمساحة الفارغة لتحريكها، حتى تكتمل الصورة.</p>
      <div class="puzzle-grid" style="--puzzle-size:${size};"></div>
    `;
    const grid = container.querySelector(".puzzle-grid");

    function draw() {
      grid.innerHTML = tiles
        .map((val, i) => {
          if (val === 0) return `<div class="puzzle-tile puzzle-tile--blank"></div>`;
          const r = Math.floor((val - 1) / size), c = (val - 1) % size;
          return `<button type="button" class="puzzle-tile" data-index="${i}" style="background-image:url('${imageUrl}'); background-size:${size * 100}% ${size * 100}%; background-position:${(c * 100) / (size - 1)}% ${(r * 100) / (size - 1)}%;"></button>`;
        })
        .join("");
    }
    draw();

    grid.addEventListener("click", (e) => {
      const tile = e.target.closest(".puzzle-tile:not(.puzzle-tile--blank)");
      if (!tile) return;
      const i = Number(tile.dataset.index);
      const blank = tiles.indexOf(0);
      const sameRow = Math.floor(i / size) === Math.floor(blank / size) && Math.abs(i - blank) === 1;
      const sameCol = Math.abs(i - blank) === size;
      if (sameRow || sameCol) {
        [tiles[i], tiles[blank]] = [tiles[blank], tiles[i]];
        draw();
        const solved = tiles.every((v, idx) => (idx === tiles.length - 1 ? v === 0 : v === idx + 1));
        if (solved) scoreFooter(container, 1, 1, "الصورة");
      }
    });
    scoreFooter(container, 0, 1, "الصورة");
  }

  /* -----------------------------------------------------------------
     7) QUIZ CHALLENGE — a short multi-question quiz session with a
        final score screen (reuses the same visual quiz-option classes
        as the mission quiz, just run back-to-back with one scoreboard)
     ----------------------------------------------------------------- */
  function renderQuizChallenge(container, lesson, category) {
    const pool = shuffle(quizForCategory(lesson, category)).slice(0, 6);
    let index = 0;
    let correctCount = 0;

    function renderQuestion() {
      const q = pool[index];
      container.innerHTML = `
        <p class="game-instructions">سؤال ${index + 1} من ${pool.length}</p>
        <div class="quiz-block">
          <p class="quiz-question">${q.question}</p>
          <div class="quiz-options">
            ${q.options
              .map(
                (opt, i) => `
              <button type="button" class="quiz-option has-ripple" data-option-index="${i}">
                <span class="quiz-option__letter">${String.fromCharCode(65 + i)}</span>
                <span>${opt}</span>
                <span class="quiz-option__icon" aria-hidden="true"></span>
              </button>`
              )
              .join("")}
          </div>
        </div>
      `;
      container.querySelector(".quiz-options").addEventListener("click", (e) => {
        const btn = e.target.closest(".quiz-option");
        if (!btn) return;
        const chosen = Number(btn.dataset.optionIndex);
        const correct = chosen === q.correctIndex;
        if (correct) correctCount += 1;

        container.querySelectorAll(".quiz-option").forEach((opt, i) => {
          opt.disabled = true;
          const iconEl = opt.querySelector(".quiz-option__icon");
          if (i === q.correctIndex) { opt.classList.add("is-correct"); if (iconEl) iconEl.textContent = "✅"; }
          else if (i === chosen) { opt.classList.add("is-wrong"); if (iconEl) iconEl.textContent = "❌"; }
        });

        window.setTimeout(() => {
          index += 1;
          if (index < pool.length) renderQuestion();
          else finish();
        }, 900);
      });
    }

    function finish() {
      container.innerHTML = `<p class="game-instructions">🏁 انتهى التحدي!</p>`;
      scoreFooter(container, correctCount, pool.length, "النتيجة النهائية");
    }

    renderQuestion();
  }

  /* -----------------------------------------------------------------
     8) SENTENCE BUILDER — tap scrambled words back into order
     ----------------------------------------------------------------- */
  function buildSentencePool(lesson) {
    if (lesson.sentences?.length) return lesson.sentences;
    return (lesson.vocabulary || []).slice(0, 5).map((v) => `${v.term} means ${v.definition}`.replace(/\.$/, ""));
  }

  function renderSentenceBuilder(container, lesson) {
    const sentences = shuffle(buildSentencePool(lesson)).slice(0, 5);
    let index = 0;
    let solvedCount = 0;

    function renderSentence() {
      const sentence = sentences[index];
      const words = shuffle(sentence.split(" "));
      const built = [];

      function draw() {
        container.innerHTML = `
          <p class="game-instructions">رتّب الكلمات لتكوين الجملة الصحيحة (${index + 1} / ${sentences.length})</p>
          <div class="sentence-slot" id="sentenceSlot">${built.map((w) => `<span class="sentence-word sentence-word--placed">${w}</span>`).join("") || "&nbsp;"}</div>
          <div class="sentence-bank" id="sentenceBank">${words
            .filter((w) => !built.includes(w) || words.filter((x) => x === w).length > built.filter((x) => x === w).length)
            .map((w) => `<button type="button" class="sentence-word">${w}</button>`)
            .join("")}</div>
          <button type="button" class="btn btn--ghost btn--sm" id="sentenceResetBtn">↺ إعادة</button>
        `;
        container.querySelector("#sentenceBank").addEventListener("click", (e) => {
          const btn = e.target.closest(".sentence-word");
          if (!btn) return;
          built.push(btn.textContent);
          btn.remove();
          if (built.length === words.length) {
            const correct = built.join(" ") === sentence;
            const slot = container.querySelector("#sentenceSlot");
            slot.classList.add(correct ? "is-correct" : "is-wrong");
            if (correct) solvedCount += 1;
            window.setTimeout(() => {
              index += 1;
              if (index < sentences.length) renderSentence();
              else { container.innerHTML = `<p class="game-instructions">🏁 انتهت اللعبة!</p>`; scoreFooter(container, solvedCount, sentences.length); }
            }, 900);
          } else {
            draw();
          }
        });
        container.querySelector("#sentenceResetBtn").addEventListener("click", () => { built.length = 0; draw(); });
        container.querySelector("#sentenceSlot").innerHTML = built.map((w) => `<span class="sentence-word sentence-word--placed">${w}</span>`).join("") || "&nbsp;";
      }
      draw();
    }

    renderSentence();
  }

  /* -----------------------------------------------------------------
     9) LISTENING GAME — speaks a term aloud (Web Speech API), student
        picks which term was spoken
     ----------------------------------------------------------------- */
  function renderListening(container, lesson) {
    const pool = shuffle(lesson.vocabulary).slice(0, 6);
    let index = 0;
    let correctCount = 0;

    function speak(text) {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-US";
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    }

    function renderRound() {
      const target = pool[index];
      const options = shuffle([target, ...shuffle(pool.filter((p) => p !== target)).slice(0, 3)]);

      container.innerHTML = `
        <p class="game-instructions">استمع جيدًا، ثم اختر الكلمة الصحيحة (${index + 1} / ${pool.length})</p>
        <button type="button" class="btn btn--secondary btn--sm" id="listeningPlayBtn">🔊 استمع مرة أخرى</button>
        <div class="quiz-options" id="listeningOptions" style="margin-top:14px;">
          ${options.map((o) => `<button type="button" class="quiz-option has-ripple" data-term="${o.term}"><span>${o.term}</span></button>`).join("")}
        </div>
      `;
      speak(target.term);
      container.querySelector("#listeningPlayBtn").addEventListener("click", () => speak(target.term));
      container.querySelector("#listeningOptions").addEventListener("click", (e) => {
        const btn = e.target.closest(".quiz-option");
        if (!btn) return;
        const correct = btn.dataset.term === target.term;
        if (correct) correctCount += 1;
        container.querySelectorAll("#listeningOptions .quiz-option").forEach((opt) => {
          opt.disabled = true;
          if (opt.dataset.term === target.term) opt.classList.add("is-correct");
          else if (opt === btn) opt.classList.add("is-wrong");
        });
        window.setTimeout(() => {
          index += 1;
          if (index < pool.length) renderRound();
          else { container.innerHTML = `<p class="game-instructions">🏁 انتهت اللعبة!</p>`; scoreFooter(container, correctCount, pool.length); }
        }, 900);
      });
    }

    renderRound();
  }

  /* -----------------------------------------------------------------
     10) WORD SEARCH — classic letter grid, click-drag to select a line
     ----------------------------------------------------------------- */
  function renderWordSearch(container, lesson) {
    const words = shuffle((lesson.vocabulary || []).map((v) => v.term.toUpperCase().replace(/[^A-Z]/g, ""))).filter((w) => w.length >= 2 && w.length <= 10).slice(0, 6);
    const gridSize = 10;
    const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
    const directions = [[0, 1], [1, 0], [1, 1], [-1, 1]];
    const placed = [];

    words.forEach((word) => {
      for (let attempt = 0; attempt < 40; attempt++) {
        const [dr, dc] = directions[Math.floor(Math.random() * directions.length)];
        const row = Math.floor(Math.random() * gridSize);
        const col = Math.floor(Math.random() * gridSize);
        const endRow = row + dr * (word.length - 1);
        const endCol = col + dc * (word.length - 1);
        if (endRow < 0 || endRow >= gridSize || endCol < 0 || endCol >= gridSize) continue;

        let fits = true;
        for (let i = 0; i < word.length; i++) {
          const r = row + dr * i, c = col + dc * i;
          if (grid[r][c] && grid[r][c] !== word[i]) { fits = false; break; }
        }
        if (!fits) continue;

        for (let i = 0; i < word.length; i++) {
          const r = row + dr * i, c = col + dc * i;
          grid[r][c] = word[i];
        }
        placed.push({ word, cells: Array.from({ length: word.length }, (_, i) => `${row + dr * i}-${col + dc * i}`) });
        break;
      }
    });

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let r = 0; r < gridSize; r++) for (let c = 0; c < gridSize; c++) if (!grid[r][c]) grid[r][c] = letters[Math.floor(Math.random() * letters.length)];

    container.innerHTML = `
      <p class="game-instructions">اضغط مع الاستمرار واسحب فوق الحروف لتكوين كلمة، أو اضغط على أول وآخر حرف بالكلمة.</p>
      <div class="wordsearch-wrap">
        <div class="wordsearch-grid" style="--ws-size:${gridSize};">
          ${grid.map((row, r) => row.map((letter, c) => `<span class="wordsearch-cell" data-cell="${r}-${c}">${letter}</span>`).join("")).join("")}
        </div>
        <div class="wordsearch-words">${placed.map((p) => `<span class="wordsearch-word" data-word="${p.word}">${p.word}</span>`).join("")}</div>
      </div>
    `;
    scoreFooter(container, 0, placed.length, "كلمات مكتشفة");

    let start = null;
    let found = 0;
    const gridEl = container.querySelector(".wordsearch-grid");

    function cellsBetween(a, b) {
      const [ar, ac] = a.split("-").map(Number);
      const [br, bc] = b.split("-").map(Number);
      const dr = Math.sign(br - ar), dc = Math.sign(bc - ac);
      const steps = Math.max(Math.abs(br - ar), Math.abs(bc - ac));
      const cells = [];
      for (let i = 0; i <= steps; i++) cells.push(`${ar + dr * i}-${ac + dc * i}`);
      return cells;
    }

    function trySelection(a, b) {
      const selectedCells = cellsBetween(a, b);
      const match = placed.find((p) => !p.found && (p.cells.join(",") === selectedCells.join(",") || p.cells.join(",") === [...selectedCells].reverse().join(",")));
      if (match) {
        match.found = true;
        found += 1;
        selectedCells.forEach((key) => gridEl.querySelector(`[data-cell="${key}"]`)?.classList.add("is-found"));
        container.querySelector(`.wordsearch-word[data-word="${match.word}"]`)?.classList.add("is-found");
        scoreFooter(container, found, placed.length, "كلمات مكتشفة");
      }
    }

    gridEl.addEventListener("mousedown", (e) => { const cell = e.target.closest(".wordsearch-cell"); if (cell) start = cell.dataset.cell; });
    gridEl.addEventListener("mouseup", (e) => { const cell = e.target.closest(".wordsearch-cell"); if (cell && start) trySelection(start, cell.dataset.cell); start = null; });
    // Touch-friendly fallback: tap first letter, tap last letter.
    gridEl.addEventListener("click", (e) => {
      const cell = e.target.closest(".wordsearch-cell");
      if (!cell) return;
      if (!start) { start = cell.dataset.cell; cell.classList.add("is-anchor"); }
      else { gridEl.querySelector(".is-anchor")?.classList.remove("is-anchor"); trySelection(start, cell.dataset.cell); start = null; }
    });
  }

  /* -----------------------------------------------------------------
     PUBLIC ENTRY POINT
     ----------------------------------------------------------------- */
  const ENGINES = {
    match: renderMatch,
    memory: renderMemory,
    dragDrop: renderDragDrop,
    classification: renderClassification,
    labelDiagram: renderLabelDiagram,
    puzzle: renderPuzzle,
    quizChallenge: (container, lesson, gameDef) => renderQuizChallenge(container, lesson, gameDef.category),
    sentenceBuilder: renderSentenceBuilder,
    listening: renderListening,
    wordSearch: renderWordSearch,
  };

  /** Renders one game (by catalog key) into `container`. */
  function render(container, gameKey, lesson) {
    const gameDef = getGameDef(gameKey);
    if (!gameDef || !ENGINES[gameDef.engine]) {
      container.innerHTML = `<p class="game-instructions">تعذر تحميل هذه اللعبة.</p>`;
      return;
    }
    ENGINES[gameDef.engine](container, lesson, gameDef);
  }

  return { CATALOG, getCatalogForSubject, getGameDef, isGameAvailable, getPlayableGames, render };
})();
