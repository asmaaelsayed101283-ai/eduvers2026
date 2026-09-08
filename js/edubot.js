/* =================================================================
   EDUVERSE — EDUBOT AI COMPANION ENGINE
   Loaded as a plain classic script (not type="module"), same as
   every other script in this project — see the production fix
   notes in js/gamification.js for why. Declared as global functions
   so any page script loaded after this one can call:

       EduBot.hint("Look closely at the diagram — what do you notice?");
       EduBot.celebrate("Awesome! You earned a new badge!");
       EduBot.encourage("Don't worry — let's try that unit again soon!");
       EduBot.converse([{ en: "Ready?", choices: [{ label: "Yes!" }] }]);
       EduBot.sound("correct" | "wrong" | "xp" | "badge" | "pop");

   EduBot also speaks its English lines aloud (Web Speech API) and
   plays short synthesized sound effects (Web Audio API) — both can
   be muted from the panel's speaker icon; the preference persists.

   EduBot never answers a question directly — every built-in message
   in this file is written as a nudge/hint/encouragement, per the
   platform's "hints instead of direct answers" rule.
   ================================================================= */

const EduBot = (function () {
  const AVATAR_SRC = "assets/images/mascot/edubot-96.png";
  const PANEL_AVATAR_SRC = "assets/images/mascot/edubot-64.png";

  /** Default welcome/tip message per page, keyed by the page's
   *  data-edubot-context attribute on <body>. English-first, with
   *  an optional Arabic line for extra support. */
  const CONTEXT_GREETINGS = {
    home: {
      tag: "welcome",
      en: "Hi! I'm EduBot, your AI learning companion \uD83D\uDC4B Ready to explore a subject and start your first mission?",
      ar: "أهلاً! أنا EduBot، رفيقك الذكي في التعلّم. جاهز تبدأ أول مغامرة؟",
    },
    worlds: {
      tag: "welcome",
      en: "Pick a world that excites you \uD83D\uDE80 I'll be right here if you need a hint along the way.",
      ar: "اختر عالمًا يشدّك، وأنا هنا لو احتجت أي مساعدة.",
    },
    units: {
      tag: "welcome",
      en: "Choose a unit to continue your journey. Take it one step at a time \u2014 you've got this! \uD83D\uDCD8",
      ar: "اختر وحدة وكمل رحلتك خطوة بخطوة، أنت قادر عليها.",
    },
    lesson: {
      tag: "hint",
      en: "I'm here for the whole lesson. If a mission feels tricky, tap me for a hint \u2014 I won't give you the answer, just a nudge! \uD83D\uDCA1",
      ar: "أنا معاك طول الدرس. لو حسّيت إن مهمة صعبة، دوس عليّ وهدّيك تلميح مش الإجابة.",
    },
    gamification: {
      tag: "celebrate",
      en: "Look at all you've earned so far! \uD83C\uDF89 Keep collecting XP, coins, and badges \u2014 I'm cheering for you.",
      ar: "شوف كل اللي جمعته لحد دلوقتي! كمّل تجميع النقاط والشارات، أنا معاك.",
    },
    teacher: {
      tag: "welcome",
      en: "Hi there! I help guide students through their lessons \u2014 you're in control of the content. \uD83D\uDC69\u200D\uD83C\uDFEB",
      ar: "أهلاً! أنا بساعد الطلاب أثناء الدروس، وانت اللي بتتحكم في المحتوى.",
    },
    general: {
      tag: "welcome",
      en: "Hi! I'm EduBot, your AI learning companion \uD83D\uDC4B Tap me anytime you'd like a hint or some encouragement.",
      ar: "أهلاً! أنا EduBot، دوس عليّ في أي وقت لو حابب تلميح أو تشجيع.",
    },
  };

  let els = {};
  let autoMinimizeTimer = null;
  let conversationActive = false;

  /* -----------------------------------------------------------------
     MUTE STATE (persisted) — controls both sound effects and speech.
     ----------------------------------------------------------------- */
  const MUTE_KEY = "eduverse:edubot:muted";
  let muted = window.localStorage.getItem(MUTE_KEY) === "true";

  function toggleMute() {
    muted = !muted;
    window.localStorage.setItem(MUTE_KEY, String(muted));
    if (muted) stopSpeech();
    updateSoundButton();
  }

  function updateSoundButton() {
    if (!els.muteBtn) return;
    els.muteBtn.textContent = muted ? "\uD83D\uDD08 Unmute" : "\uD83D\uDD07 Mute";
    els.muteBtn.setAttribute("aria-pressed", String(muted));
    els.muteBtn.setAttribute("aria-label", muted ? "Unmute EduBot" : "Mute EduBot's voice and sounds");
  }

  /* -----------------------------------------------------------------
     SOUND EFFECTS — synthesized with the Web Audio API (no audio
     files to host), so effects work instantly, offline, and never
     404. Each is a short, simple tone/chord.
     ----------------------------------------------------------------- */
  let audioCtx = null;
  function getAudioCtx() {
    if (!window.AudioContext && !window.webkitAudioContext) return null;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  function tone(freq, startAt, duration, type = "sine", peakGain = 0.18) {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime + startAt);
    gain.gain.linearRampToValueAtTime(peakGain, ctx.currentTime + startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startAt + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + startAt);
    osc.stop(ctx.currentTime + startAt + duration + 0.02);
  }

  const SOUND_RECIPES = {
    pop: () => tone(520, 0, 0.08, "sine", 0.12),
    correct: () => { tone(523.25, 0, 0.12, "triangle"); tone(659.25, 0.09, 0.16, "triangle"); tone(783.99, 0.18, 0.22, "triangle"); },
    wrong: () => { tone(220, 0, 0.16, "sawtooth", 0.1); tone(196, 0.12, 0.22, "sawtooth", 0.1); },
    xp: () => { tone(659.25, 0, 0.1, "sine", 0.14); tone(880, 0.08, 0.18, "sine", 0.14); },
    badge: () => { tone(523.25, 0, 0.14, "triangle"); tone(659.25, 0.12, 0.14, "triangle"); tone(783.99, 0.24, 0.14, "triangle"); tone(1046.5, 0.36, 0.3, "triangle"); },
  };

  /** Plays a short synthesized sound effect. Silent if muted or if
   *  the Web Audio API isn't available. */
  function sound(kind) {
    if (muted) return;
    const recipe = SOUND_RECIPES[kind];
    if (recipe) recipe();
  }

  /* -----------------------------------------------------------------
     VOICE — reads EduBot's messages aloud in Arabic (ar-EG) using the
     browser's built-in Speech Synthesis API. No audio files needed.
     `currentSpeechText` remembers the last message so the student can
     tap "Play" to hear it again. Every call to speak() first cancels
     anything already talking, so speech can never overlap itself.
     ----------------------------------------------------------------- */
  let currentSpeechText = "";
  let arabicVoice = null;

  function loadArabicVoice() {
    if (!window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    arabicVoice =
      voices.find((v) => v.lang === "ar-EG") ||
      voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("ar")) ||
      null;
  }
  if (window.speechSynthesis) {
    loadArabicVoice();
    window.speechSynthesis.addEventListener("voiceschanged", loadArabicVoice);
  }

  function stopSpeech() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  /** Speaks Arabic text aloud (ar-EG). Prefers the Arabic line (`ar`)
   *  of a message and falls back to the English line only when no
   *  Arabic text was provided for that message. */
  function speakText(text) {
    if (!window.speechSynthesis || !text) return;
    stopSpeech(); // never let two utterances overlap
    const clean = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim();
    if (!clean) return;
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = "ar-EG";
    if (arabicVoice) utterance.voice = arabicVoice;
    utterance.rate = 0.98;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  /** Called whenever a new message is shown: remembers the text (for
   *  the Play/replay button) and auto-reads it aloud unless muted. */
  function speak(en, ar) {
    currentSpeechText = ar || en || "";
    if (muted) return;
    speakText(currentSpeechText);
  }

  /** "Play" button handler — replays the current message regardless
   *  of mute state, since tapping Play is an explicit request. */
  function replaySpeech() {
    if (currentSpeechText) speakText(currentSpeechText);
  }

  /** Builds and injects the widget markup once per page. */
  function mount() {
    if (document.getElementById("edubotWidget")) return; // already mounted

    const wrapper = document.createElement("div");
    wrapper.className = "edubot";
    wrapper.id = "edubotWidget";
    wrapper.innerHTML = `
      <div class="edubot__panel" id="edubotPanel" role="status" aria-live="polite">
        <div class="edubot__panel-head">
          <img src="${PANEL_AVATAR_SRC}" alt="" class="edubot__panel-avatar" />
          <div>
            <div class="edubot__panel-name">EduBot</div>
            <div class="edubot__panel-tagline">Your AI Learning Companion</div>
          </div>
          <button type="button" class="edubot__panel-close" id="edubotCloseBtn" aria-label="Minimize EduBot">✕</button>
        </div>
        <span class="edubot__panel-tag edubot__panel-tag--welcome" id="edubotTag">Hi!</span>
        <p class="edubot__panel-message" id="edubotMessage"></p>
        <p class="edubot__panel-message--ar" id="edubotMessageAr" hidden></p>
        <div class="edubot__panel-voice-controls">
          <button type="button" class="edubot__panel-voice-btn" id="edubotPlayBtn" aria-label="Play EduBot's message in Arabic">\uD83D\uDD0A Play</button>
          <button type="button" class="edubot__panel-voice-btn" id="edubotMuteBtn" aria-label="Mute EduBot's voice and sounds" aria-pressed="false">\uD83D\uDD07 Mute</button>
        </div>
        <div class="edubot__panel-choices" id="edubotChoices" hidden></div>
        <button type="button" class="edubot__panel-continue" id="edubotContinueBtn" hidden>Continue \u25B8</button>
      </div>

      <button type="button" class="edubot__avatar-btn" id="edubotAvatarBtn" aria-label="Open EduBot, your AI learning companion" aria-expanded="false">
        <span class="edubot__avatar-ring" aria-hidden="true"></span>
        <span class="edubot__badge-dot" aria-hidden="true"></span>
        <img src="${AVATAR_SRC}" alt="" class="edubot__avatar-img" />
      </button>
    `;
    document.body.appendChild(wrapper);

    els = {
      wrapper,
      panel: document.getElementById("edubotPanel"),
      avatarBtn: document.getElementById("edubotAvatarBtn"),
      closeBtn: document.getElementById("edubotCloseBtn"),
      playBtn: document.getElementById("edubotPlayBtn"),
      muteBtn: document.getElementById("edubotMuteBtn"),
      tag: document.getElementById("edubotTag"),
      message: document.getElementById("edubotMessage"),
      messageAr: document.getElementById("edubotMessageAr"),
      choices: document.getElementById("edubotChoices"),
      continueBtn: document.getElementById("edubotContinueBtn"),
    };

    els.avatarBtn.addEventListener("click", () => {
      if (els.panel.classList.contains("is-open")) {
        close();
      } else {
        open();
      }
    });
    els.closeBtn.addEventListener("click", close);
    els.playBtn.addEventListener("click", replaySpeech);
    els.muteBtn.addEventListener("click", toggleMute);
    updateSoundButton();
  }

  const TAG_LABELS = {
    welcome: "Hi!",
    hint: "\uD83D\uDCA1 Hint",
    celebrate: "\uD83C\uDF89 Nice work!",
    encourage: "\uD83D\uDCAA Keep going",
  };

  /** Renders a message into the panel and opens it, with an entrance animation. */
  function render(kind, en, ar) {
    if (!els.panel) mount();

    els.tag.className = `edubot__panel-tag edubot__panel-tag--${kind}`;
    els.tag.textContent = TAG_LABELS[kind] || "Hi!";
    els.message.textContent = en;
    els.choices.hidden = true;
    els.choices.innerHTML = "";
    els.continueBtn.hidden = true;

    if (ar) {
      els.messageAr.textContent = ar;
      els.messageAr.hidden = false;
    } else {
      els.messageAr.hidden = true;
    }

    open();
    speak(en, ar);
    if (kind === "celebrate") sound("badge");
    else if (kind === "encourage") sound("wrong");
    else sound("pop");
  }

  function open() {
    if (!els.panel) return;
    els.panel.classList.add("is-open");
    els.avatarBtn.setAttribute("aria-expanded", "true");
    els.wrapper.classList.remove("has-unread");
    if (!conversationActive) scheduleAutoMinimize();
  }

  function close() {
    if (!els.panel) return;
    els.panel.classList.remove("is-open");
    els.avatarBtn.setAttribute("aria-expanded", "false");
    window.clearTimeout(autoMinimizeTimer);
    stopSpeech();
  }

  /** Auto-collapses to the floating avatar after a few seconds so
   *  EduBot never blocks the page — this is the "exit animation"
   *  moment, handled by the same CSS transition as opening. Paused
   *  while a guided conversation is in progress. */
  function scheduleAutoMinimize(delay = 7000) {
    window.clearTimeout(autoMinimizeTimer);
    autoMinimizeTimer = window.setTimeout(() => {
      close();
      els.wrapper.classList.add("has-unread");
    }, delay);
  }

  /** Public API */
  function say(en, ar) { render("welcome", en, ar); }
  function hint(en, ar) { render("hint", en, ar); }
  function celebrate(en, ar) { render("celebrate", en, ar); }
  function encourage(en, ar) { render("encourage", en, ar); }

  /* -----------------------------------------------------------------
     CONVERSATION PLAYER
     Plays a scripted back-and-forth: EduBot "speaks" one line at a
     time (voiced + shown in the bubble). Each line is either
     advanced with a "Continue" tap, or — if it has `choices` — the
     student taps a reply chip, which can branch to a specific next
     line index. The panel stays open (no auto-minimize) for the
     whole conversation.

     Line shape: { en, ar?, tag?, choices?: [{ label, next? }] }
     ----------------------------------------------------------------- */
  function converse(lines, onComplete) {
    if (!els.panel) mount();
    if (!Array.isArray(lines) || lines.length === 0) return;

    conversationActive = true;
    window.clearTimeout(autoMinimizeTimer);
    let index = 0;

    function showLine(i) {
      const line = lines[i];
      if (!line) {
        conversationActive = false;
        scheduleAutoMinimize();
        if (onComplete) onComplete();
        return;
      }

      const kind = line.tag || "welcome";
      els.tag.className = `edubot__panel-tag edubot__panel-tag--${kind}`;
      els.tag.textContent = TAG_LABELS[kind] || "Hi!";
      els.message.textContent = line.en;
      if (line.ar) {
        els.messageAr.textContent = line.ar;
        els.messageAr.hidden = false;
      } else {
        els.messageAr.hidden = true;
      }

      open();
      speak(line.en, line.ar);
      sound("pop");

      els.choices.innerHTML = "";
      if (line.choices && line.choices.length) {
        els.continueBtn.hidden = true;
        els.choices.hidden = false;
        line.choices.forEach((choice) => {
          const chip = document.createElement("button");
          chip.type = "button";
          chip.className = "edubot__choice-chip";
          chip.textContent = choice.label;
          chip.addEventListener("click", () => {
            sound("pop");
            const nextIndex = typeof choice.next === "number" ? choice.next : i + 1;
            showLine(nextIndex);
          });
          els.choices.appendChild(chip);
        });
      } else {
        els.choices.hidden = true;
        els.continueBtn.hidden = false;
        els.continueBtn.onclick = () => showLine(i + 1);
      }
    }

    showLine(index);
  }

  /** Shows the right default greeting for the current page, based
   *  on the <body data-edubot-context="..."> attribute. */
  function greetForContext() {
    const context = document.body.dataset.edubotContext || "general";
    const g = CONTEXT_GREETINGS[context] || CONTEXT_GREETINGS.general;
    window.setTimeout(() => render(g.tag, g.en, g.ar), 900);
  }

  function init() {
    mount();
    greetForContext();
  }

  document.addEventListener("DOMContentLoaded", init);

  return { say, hint, celebrate, encourage, converse, sound, open, close, stopSpeech };
})();
