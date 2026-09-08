/* =================================================================
   EDUVERSE — VIRTUAL LAB ENGINE
   -------------------------------------------------------------------
   Renders one lesson's teacher-authored virtual lab:
     { title, materials[], steps[], safety[], simulation: { options[],
       correctCombo: [a, b] }, questions[] }
   All real data from the Teacher Dashboard's new "🧪 Virtual Lab"
   editor — nothing here is hardcoded to one subject.
   ================================================================= */

const VirtualLab = (function () {
  function renderList(items, icon) {
    if (!items?.length) return "";
    return `<ul class="lab-list">${items.map((i) => `<li>${icon} ${i}</li>`).join("")}</ul>`;
  }

  /** Renders the full lab flow into `container`. `onFinish(score, max)`
   *  fires once, after the questions stage completes, so the caller
   *  (lesson-engine.js) can fold the lab's score into the mission's
   *  reward/summary flow. */
  function render(container, lab, onFinish) {
    if (!lab || !lab.title) {
      container.innerHTML = `<p class="game-instructions">لم يتم إعداد معمل افتراضي لهذا الدرس بعد.</p>`;
      return;
    }

    let simScore = 0;
    let simMax = lab.simulation?.correctCombo?.length === 2 ? 1 : 0;
    let picked = [];

    function renderIntro() {
      container.innerHTML = `
        <div class="lab-card">
          <h3 class="lab-card__title">🧪 ${lab.title}</h3>

          ${lab.materials?.length ? `<h4>📦 المواد المطلوبة</h4>${renderList(lab.materials, "•")}` : ""}
          ${lab.steps?.length ? `<h4>🔢 خطوات التجربة</h4><ol class="lab-list lab-list--ordered">${lab.steps.map((s) => `<li>${s}</li>`).join("")}</ol>` : ""}
          ${lab.safety?.length ? `<div class="lab-safety"><h4>⚠️ تعليمات السلامة</h4>${renderList(lab.safety, "🛡️")}</div>` : ""}

          ${simMax ? `<div id="labSimStage"></div>` : ""}
          ${!simMax ? `<button type="button" class="btn btn--primary btn--sm has-ripple" id="labToQuestionsBtn">متابعة إلى أسئلة المعمل ▶</button>` : ""}
        </div>
      `;
      if (simMax) renderSimulation();
      document.getElementById("labToQuestionsBtn")?.addEventListener("click", renderQuestions);
    }

    function renderSimulation() {
      const stage = document.getElementById("labSimStage");
      const options = lab.simulation.options?.length ? lab.simulation.options : lab.materials || [];
      stage.innerHTML = `
        <h4>⚗️ المحاكاة التفاعلية</h4>
        <p class="game-instructions">اختر مادتين ثم اضغط "امزج" لترى ماذا يحدث.</p>
        <div class="lab-sim__bank">${options.map((m) => `<button type="button" class="dragdrop-chip lab-sim__chip" data-material="${m}">${m}</button>`).join("")}</div>
        <div class="lab-sim__beaker" id="labBeaker">🧪 <span id="labBeakerContents">(فارغ)</span></div>
        <button type="button" class="btn btn--secondary btn--sm has-ripple" id="labCombineBtn">امزج ⚗️</button>
        <p id="labSimResult" class="lab-sim__result"></p>
        <button type="button" class="btn btn--primary btn--sm has-ripple" id="labToQuestionsBtn2" style="margin-top:10px;">متابعة إلى أسئلة المعمل ▶</button>
      `;
      stage.querySelector(".lab-sim__bank").addEventListener("click", (e) => {
        const chip = e.target.closest(".lab-sim__chip");
        if (!chip || picked.includes(chip.dataset.material)) return;
        if (picked.length >= 2) return;
        picked.push(chip.dataset.material);
        chip.classList.add("is-selected");
        document.getElementById("labBeakerContents").textContent = picked.join(" + ");
      });
      document.getElementById("labCombineBtn").addEventListener("click", () => {
        const resultEl = document.getElementById("labSimResult");
        if (picked.length !== 2) {
          resultEl.textContent = "اختر مادتين أولًا.";
          return;
        }
        const combo = lab.simulation.correctCombo;
        const isMatch = combo && picked.every((m) => combo.includes(m)) && combo.every((m) => picked.includes(m));
        if (isMatch) {
          resultEl.textContent = "✅ تفاعل ناجح! لاحظ التغيّر الناتج عن هذا المزيج.";
          resultEl.classList.add("is-correct");
          if (simScore === 0) simScore = 1;
        } else {
          resultEl.textContent = "🔄 لا يوجد تفاعل ملحوظ بهذا المزيج — جرّب مزيجًا آخر.";
          resultEl.classList.remove("is-correct");
        }
        picked = [];
        document.getElementById("labBeakerContents").textContent = "(فارغ)";
        stage.querySelectorAll(".lab-sim__chip").forEach((c) => c.classList.remove("is-selected"));
      });
      document.getElementById("labToQuestionsBtn2").addEventListener("click", renderQuestions);
    }

    function renderQuestions() {
      const questions = lab.questions || [];
      if (!questions.length) return finish(simScore, simMax);

      let qIndex = 0;
      let qCorrect = 0;

      function renderQ() {
        const q = questions[qIndex];
        container.innerHTML = `
          <div class="lab-card">
            <h4>❓ سؤال المعمل ${qIndex + 1} من ${questions.length}</h4>
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
          </div>
        `;
        container.querySelector(".quiz-options").addEventListener("click", (e) => {
          const btn = e.target.closest(".quiz-option");
          if (!btn) return;
          const chosen = Number(btn.dataset.optionIndex);
          if (chosen === q.correctIndex) qCorrect += 1;
          container.querySelectorAll(".quiz-option").forEach((opt, i) => {
            opt.disabled = true;
            const iconEl = opt.querySelector(".quiz-option__icon");
            if (i === q.correctIndex) { opt.classList.add("is-correct"); if (iconEl) iconEl.textContent = "✅"; }
            else if (i === chosen) { opt.classList.add("is-wrong"); if (iconEl) iconEl.textContent = "❌"; }
          });
          window.setTimeout(() => {
            qIndex += 1;
            if (qIndex < questions.length) renderQ();
            else finish(simScore + qCorrect, simMax + questions.length);
          }, 900);
        });
      }
      renderQ();
    }

    function finish(score, max) {
      container.innerHTML = `
        <div class="lab-card lab-card--result">
          <h3>🏁 النتيجة النهائية للمعمل</h3>
          <p class="lab-final-score">${score} / ${max}</p>
          <p class="game-instructions">${score === max ? "🎉 عمل ممتاز! أتقنت هذه التجربة بالكامل." : "أحسنت! يمكنك مراجعة التجربة لتحسين نتيجتك."}</p>
        </div>
      `;
      if (typeof onFinish === "function") onFinish(score, max);
    }

    renderIntro();
  }

  return { render };
})();
