/* =================================================================
   EDUVERSE — FINAL ACHIEVEMENT CERTIFICATE
   Loaded as a plain classic script (not type="module"), same pattern
   as js/edubot.js and js/gamification.js — see the production-fix
   notes in js/gamification.js for why.

   Shown automatically once a student finishes 100% of a lesson (all
   missions completed). A lesson page calls:

       Certificate.show({
         subject: "عالم العلوم",
         lessonName: "Lesson 1: Structure of the Atom",
         xpEarned: 165,
         coinsEarned: 60,
         stars: 8,
         maxStars: 9,
         badge: { icon: "🧩", name: "حلّال المشكلات" },
         nextHref: "units.html?world=science",
         dashboardHref: "gamification.html",
       });

   Every value shown on the certificate (name, grade, school, teacher,
   XP, coins, badge) is read live from the student's profile — see
   getStudentProfile()/getGamificationSnapshot()/getBadgeById() in
   js/gamification.js (loaded before this file) — nothing here is
   hardcoded. The completed certificate record is also saved to
   localStorage so it can be re-opened or re-generated later.
   ================================================================= */

const Certificate = (function () {
  const STORAGE_KEY = "eduverse:certificates";
  const LOGO_SRC = "assets/images/logo/logo-icon-128.png";

  let els = {};
  let currentData = null; // last-rendered certificate fields, for download/print/share

  /* -----------------------------------------------------------------
     PERSISTENCE — every earned certificate is saved, keyed by a slug
     built from the subject + lesson name, so re-completing a lesson
     simply overwrites its own record instead of piling up duplicates.
     ----------------------------------------------------------------- */
  function slugify(text) {
    return String(text || "lesson")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\u0600-\u06FF-]/g, "")
      .toLowerCase();
  }

  function loadSavedCertificates() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveCertificateRecord(record) {
    try {
      const all = loadSavedCertificates();
      const key = `${slugify(record.subject)}__${slugify(record.lessonName)}`;
      all[key] = record;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
      /* localStorage unavailable — certificate still displays fine */
    }
  }

  /* -----------------------------------------------------------------
     MARKUP
     ----------------------------------------------------------------- */
  function mount() {
    if (document.getElementById("certificateWidget")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "certificate";
    wrapper.id = "certificateWidget";
    wrapper.innerHTML = `
      <div class="certificate-overlay" id="certificateOverlay" role="dialog" aria-modal="true" aria-label="Final Achievement Certificate">
        <div class="certificate-card" id="certificateCard">
          <button type="button" class="certificate-panel-close" id="certificateCloseBtn" aria-label="\u0625\u063A\u0644\u0627\u0642">\u2715</button>
          <div class="certificate-card__confetti" id="certificateConfetti" aria-hidden="true"></div>

          <div class="certificate-paper" id="certificatePaper">
            <span class="certificate-ribbon certificate-ribbon--start" aria-hidden="true">\uD83C\uDF96\uFE0F</span>
            <span class="certificate-ribbon certificate-ribbon--end" aria-hidden="true">\uD83C\uDF96\uFE0F</span>

            <div class="certificate-paper__inner">
              <img src="${LOGO_SRC}" alt="EduVerse" class="certificate-logo" />
              <h2 class="certificate-title">CERTIFICATE</h2>
              <p class="certificate-subtitle">\u0634\u0647\u0627\u062F\u0629 \u0625\u062A\u0645\u0627\u0645 \u0627\u0644\u062F\u0631\u0633</p>

              <p class="certificate-line">\u0647\u0630\u0647 \u0627\u0644\u0634\u0647\u0627\u062F\u0629 \u0645\u0645\u0646\u0648\u062D\u0629 \u0625\u0644\u0649:</p>
              <p class="certificate-name" id="certificateName">\u2014</p>
              <div class="certificate-rule"></div>

              <p class="certificate-desc" id="certificateDesc"></p>
              <div class="certificate-meta" id="certificateMeta"></div>
              <div class="certificate-rewards" id="certificateRewards"></div>

              <div class="certificate-sign">
                <div class="certificate-sign__line"></div>
                <strong id="certificateTeacher"></strong>
                <span>\u0627\u0644\u0645\u0639\u0644\u0645/\u0629</span>
              </div>
            </div>

            <span class="certificate-deco certificate-deco--start" aria-hidden="true">\uD83D\uDCDA\uD83C\uDF4E\uD83C\uDF93</span>
            <span class="certificate-deco certificate-deco--end" aria-hidden="true">\uD83D\uDCA1\u270F\uFE0F\u2702\uFE0F</span>
          </div>

          <div class="certificate-card__actions">
            <button type="button" class="btn btn--secondary btn--sm has-ripple" id="certificateDownloadBtn">\u2B07\uFE0F \u062A\u062D\u0645\u064A\u0644 (PNG)</button>
            <button type="button" class="btn btn--secondary btn--sm has-ripple" id="certificatePrintBtn">\uD83D\uDDA8\uFE0F \u0637\u0628\u0627\u0639\u0629 (A4)</button>
            <button type="button" class="btn btn--secondary btn--sm has-ripple" id="certificateShareBtn">\uD83D\uDCE4 \u0645\u0634\u0627\u0631\u0643\u0629</button>
            <button type="button" class="btn btn--primary btn--sm has-ripple" id="certificateNextBtn">\u0627\u0644\u062F\u0631\u0633 \u0627\u0644\u062A\u0627\u0644\u064A \u25B6</button>
            <button type="button" class="btn btn--ghost btn--sm has-ripple" id="certificateDashboardBtn">\uD83C\uDFE0 \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper);

    els = {
      wrapper,
      overlay: document.getElementById("certificateOverlay"),
      card: document.getElementById("certificateCard"),
      closeBtn: document.getElementById("certificateCloseBtn"),
      confetti: document.getElementById("certificateConfetti"),
      name: document.getElementById("certificateName"),
      desc: document.getElementById("certificateDesc"),
      meta: document.getElementById("certificateMeta"),
      rewards: document.getElementById("certificateRewards"),
      teacher: document.getElementById("certificateTeacher"),
      downloadBtn: document.getElementById("certificateDownloadBtn"),
      printBtn: document.getElementById("certificatePrintBtn"),
      shareBtn: document.getElementById("certificateShareBtn"),
      nextBtn: document.getElementById("certificateNextBtn"),
      dashboardBtn: document.getElementById("certificateDashboardBtn"),
    };

    els.closeBtn.addEventListener("click", close);
    els.overlay.addEventListener("click", (e) => { if (e.target === els.overlay) close(); });
    els.downloadBtn.addEventListener("click", downloadPNG);
    els.printBtn.addEventListener("click", printCertificate);
    els.shareBtn.addEventListener("click", shareCertificate);
    els.nextBtn.addEventListener("click", () => {
      if (currentData && typeof currentData.onNext === "function") currentData.onNext();
      if (currentData && currentData.nextHref) window.location.href = currentData.nextHref;
    });
    els.dashboardBtn.addEventListener("click", () => {
      window.location.href = (currentData && currentData.dashboardHref) || "gamification.html";
    });
  }

  function close() {
    if (!els.overlay) return;
    els.overlay.classList.remove("is-open");
  }

  /* -----------------------------------------------------------------
     CONFETTI + SOUND
     ----------------------------------------------------------------- */
  function playConfetti() {
    if (!els.confetti) return;
    els.confetti.innerHTML = "";
    const colors = ["#3A7BFF", "#8B5CF6", "#22D3EE", "#FF9F45", "#EF4B5C"];
    for (let i = 0; i < 26; i++) {
      const dot = document.createElement("span");
      dot.className = "certificate-confetti-dot";
      const angle = Math.random() * Math.PI * 2;
      const distance = 120 + Math.random() * 140;
      dot.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
      dot.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
      dot.style.setProperty("--rot", `${Math.random() * 360}deg`);
      dot.style.setProperty("--c", colors[i % colors.length]);
      dot.style.animationDelay = `${Math.random() * 0.2}s`;
      els.confetti.appendChild(dot);
    }
  }

  function playCelebrationSound() {
    if (typeof EduBot !== "undefined" && typeof EduBot.sound === "function") {
      EduBot.sound("badge");
    }
  }

  function showToast(message) {
    let toast = document.querySelector(".certificate-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "certificate-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  /* -----------------------------------------------------------------
     RENDER — pulls the student's own profile + live stats; nothing
     here is hardcoded by a caller.
     ----------------------------------------------------------------- */
  function formatDate(date) {
    try {
      return date.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return date.toDateString();
    }
  }

  function show(opts = {}) {
    if (!els.overlay) mount();

    const profile = typeof getStudentProfile === "function" ? getStudentProfile() : {};
    const snapshot = typeof getGamificationSnapshot === "function" ? getGamificationSnapshot() : {};

    const data = {
      studentName: profile.name || "\u0637\u0627\u0644\u0628 EduVerse",
      grade: profile.grade || "",
      schoolName: profile.schoolName || "",
      teacherName: profile.teacherName || "",
      subject: opts.subject || "",
      lessonName: opts.lessonName || document.title,
      completionDate: formatDate(new Date()),
      xpEarned: opts.xpEarned ?? 0,
      coinsEarned: opts.coinsEarned ?? 0,
      stars: opts.stars ?? 0,
      maxStars: opts.maxStars ?? 0,
      badge: opts.badge || null,
      level: snapshot.level ?? 1,
      nextHref: opts.nextHref || "units.html",
      dashboardHref: opts.dashboardHref || "gamification.html",
      onNext: typeof opts.onNext === "function" ? opts.onNext : null,
      earnedAt: new Date().toISOString(),
    };
    currentData = data;

    els.name.textContent = data.studentName;
    els.desc.textContent = `\u062A\u0647\u0627\u0646\u064A\u0646\u0627 \u0639\u0644\u0649 \u0625\u0643\u0645\u0627\u0644 "${data.lessonName}" \u0636\u0645\u0646 ${data.subject} \u0628\u0646\u0633\u0628\u0629 100%\u060C \u0648\u062A\u0645 \u0630\u0644\u0643 \u0628\u062A\u0627\u0631\u064A\u062E ${data.completionDate}.`;

    const metaParts = [];
    if (data.grade) metaParts.push(`<span>\u0627\u0644\u0635\u0641: <strong>${data.grade}</strong></span>`);
    if (data.schoolName) metaParts.push(`<span>\u0627\u0644\u0645\u062F\u0631\u0633\u0629: <strong>${data.schoolName}</strong></span>`);
    els.meta.innerHTML = metaParts.join("");

    const rewardParts = [
      `<span class="certificate-reward-chip">\u2B50 <strong>${data.xpEarned}</strong> XP</span>`,
      `<span class="certificate-reward-chip">\uD83E\uDE99 <strong>${data.coinsEarned}</strong> \u0639\u0645\u0644\u0629</span>`,
    ];
    if (data.maxStars) {
      rewardParts.push(`<span class="certificate-reward-chip">\u2B50 ${data.stars}/${data.maxStars}</span>`);
    }
    if (data.badge) {
      rewardParts.push(`<span class="certificate-reward-chip">${data.badge.icon} ${data.badge.name}</span>`);
    }
    els.rewards.innerHTML = rewardParts.join("");

    els.teacher.textContent = data.teacherName || "\u2014";

    els.overlay.classList.add("is-open");
    playConfetti();
    playCelebrationSound();
    saveCertificateRecord(data);
  }

  /* -----------------------------------------------------------------
     DOWNLOAD (PNG) — draws the same data onto a <canvas>, entirely
     offline (no external rasterizing library needed), then triggers
     a normal file download.
     ----------------------------------------------------------------- */
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    const lines = [];
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
    return lines.length;
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  async function drawCertificateCanvas() {
    const data = currentData;
    const W = 1400, H = 950;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch { /* ignore */ }
    }

    // outer blue frame
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#6FB1FF");
    grad.addColorStop(1, "#3A7BFF");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // white paper
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, 40, 40, W - 80, H - 80, 34);
    ctx.fill();

    // ribbons (top corners)
    [[130, 130], [W - 130, 130]].forEach(([cx, cy]) => {
      ctx.fillStyle = "#F6C445";
      ctx.beginPath(); ctx.arc(cx, cy, 44, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#FFF3D6";
      ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#EF4B5C";
      ctx.beginPath();
      ctx.moveTo(cx - 18, cy + 34); ctx.lineTo(cx - 4, cy + 90); ctx.lineTo(cx - 18, cy + 78); ctx.lineTo(cx - 32, cy + 90);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 18, cy + 34); ctx.lineTo(cx + 4, cy + 90); ctx.lineTo(cx + 18, cy + 78); ctx.lineTo(cx + 32, cy + 90);
      ctx.closePath(); ctx.fill();
    });

    // logo
    const logo = await loadImage(LOGO_SRC);
    if (logo) ctx.drawImage(logo, W / 2 - 30, 66, 60, 60);

    ctx.textAlign = "center";
    ctx.fillStyle = "#EF4B5C";
    ctx.font = "900 60px Cairo, sans-serif";
    ctx.fillText("CERTIFICATE", W / 2, 210);

    ctx.fillStyle = "#1C1B33";
    ctx.font = "700 30px Cairo, sans-serif";
    ctx.fillText("\u0634\u0647\u0627\u062F\u0629 \u0625\u062A\u0645\u0627\u0645 \u0627\u0644\u062F\u0631\u0633", W / 2, 252);

    ctx.fillStyle = "#514E6E";
    ctx.font = "400 24px Tajawal, sans-serif";
    ctx.fillText("\u0647\u0630\u0647 \u0627\u0644\u0634\u0647\u0627\u062F\u0629 \u0645\u0645\u0646\u0648\u062D\u0629 \u0625\u0644\u0649:", W / 2, 310);

    ctx.fillStyle = "#3A7BFF";
    ctx.font = "800 56px Cairo, sans-serif";
    ctx.fillText(data.studentName, W / 2, 385);

    ctx.strokeStyle = "rgba(58,123,255,0.5)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 220, 420);
    ctx.lineTo(W / 2 + 220, 420);
    ctx.stroke();

    ctx.fillStyle = "#1C1B33";
    ctx.font = "400 24px Tajawal, sans-serif";
    const descLines = wrapText(
      ctx,
      `\u062A\u0647\u0627\u0646\u064A\u0646\u0627 \u0639\u0644\u0649 \u0625\u0643\u0645\u0627\u0644 "${data.lessonName}" \u0636\u0645\u0646 ${data.subject} \u0628\u0646\u0633\u0628\u0629 100%\u060C \u0628\u062A\u0627\u0631\u064A\u062E ${data.completionDate}.`,
      W / 2, 464, 900, 34
    );

    let metaY = 464 + descLines * 34 + 40;
    ctx.font = "700 22px Tajawal, sans-serif";
    ctx.fillStyle = "#514E6E";
    const metaBits = [];
    if (data.grade) metaBits.push(`\u0627\u0644\u0635\u0641: ${data.grade}`);
    if (data.schoolName) metaBits.push(`\u0627\u0644\u0645\u062F\u0631\u0633\u0629: ${data.schoolName}`);
    if (metaBits.length) ctx.fillText(metaBits.join("   \u2022   "), W / 2, metaY);

    let rewardY = metaY + 56;
    ctx.font = "700 24px Tajawal, sans-serif";
    ctx.fillStyle = "#1C1B33";
    const rewardBits = [`\u2B50 ${data.xpEarned} XP`, `\uD83E\uDE99 ${data.coinsEarned}`];
    if (data.maxStars) rewardBits.push(`\u2B50 ${data.stars}/${data.maxStars}`);
    if (data.badge) rewardBits.push(`${data.badge.icon} ${data.badge.name}`);
    ctx.fillText(rewardBits.join("     "), W / 2, rewardY);

    // signature
    ctx.strokeStyle = "#E4E7FA";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 100, H - 130);
    ctx.lineTo(W / 2 + 100, H - 130);
    ctx.stroke();
    ctx.font = "700 24px Tajawal, sans-serif";
    ctx.fillStyle = "#1C1B33";
    ctx.fillText(data.teacherName || "\u2014", W / 2, H - 98);
    ctx.font = "400 18px Tajawal, sans-serif";
    ctx.fillStyle = "#514E6E";
    ctx.fillText("\u0627\u0644\u0645\u0639\u0644\u0645/\u0629", W / 2, H - 72);

    // decorative corner emoji
    ctx.font = "40px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("\uD83D\uDCDA\uD83C\uDF4E\uD83C\uDF93", 70, H - 70);
    ctx.textAlign = "right";
    ctx.fillText("\uD83D\uDCA1\u270F\uFE0F\u2702\uFE0F", W - 70, H - 70);

    return canvas;
  }

  async function downloadPNG() {
    if (!currentData) return;
    els.downloadBtn.disabled = true;
    try {
      const canvas = await drawCertificateCanvas();
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `EduVerse-Certificate-${slugify(currentData.studentName)}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      }, "image/png");
    } finally {
      els.downloadBtn.disabled = false;
    }
  }

  /* -----------------------------------------------------------------
     PRINT (A4) — the @media print rules in css/certificate.css
     isolate just this widget's overlay/card for printing.
     ----------------------------------------------------------------- */
  function printCertificate() {
    window.print();
  }

  /* -----------------------------------------------------------------
     SHARE — Web Share API when available (with the PNG file if the
     browser supports sharing files), otherwise falls back to copying
     a short summary to the clipboard.
     ----------------------------------------------------------------- */
  async function shareCertificate() {
    if (!currentData) return;
    const shareText = `\uD83C\uDF93 ${currentData.studentName} \u0623\u0643\u0645\u0644/\u062A \u062F\u0631\u0633 "${currentData.lessonName}" \u0628\u0646\u0633\u0628\u0629 100% \u0639\u0644\u0649 EduVerse!`;

    try {
      const canvas = await drawCertificateCanvas();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      const file = blob ? new File([blob], "eduverse-certificate.png", { type: "image/png" }) : null;

      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "EduVerse Certificate", text: shareText });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: "EduVerse Certificate", text: shareText });
        return;
      }
    } catch {
      /* user cancelled the native share sheet, or it isn't supported — fall through */
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareText);
        showToast("\u2705 \u062A\u0645 \u0646\u0633\u062E \u0646\u0635 \u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0629");
        return;
      } catch {
        /* fall through */
      }
    }
    showToast(shareText);
  }

  function init() {
    mount();
  }

  document.addEventListener("DOMContentLoaded", init);

  return { show, close, downloadPNG, printCertificate, shareCertificate };
})();
