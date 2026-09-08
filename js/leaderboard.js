/* =================================================================
   EDUVERSE — LEADERBOARD
   Loaded as a plain classic script. There is no backend yet, so this
   combines the real signed-in student (their live XP from
   js/gamification.js) with a small set of illustrative classmate
   entries — generated once and persisted to localStorage so the
   list stays stable across visits instead of re-rolling every time.
   Once a backend exists, `loadDemoStudents()` is the one function
   that would be swapped for a real class-roster fetch — everything
   else (getRankings(), the rendering below) stays the same.
   ================================================================= */

const Leaderboard = (function () {
  const DEMO_KEY = "eduverse:leaderboard:demo";

  const DEMO_ROSTER = [
    { name: "سارة أحمد", avatar: "🦄" },
    { name: "يوسف كريم", avatar: "🐯" },
    { name: "لين عبدالله", avatar: "🐼" },
    { name: "عمر خالد", avatar: "🐸" },
    { name: "مريم سالم", avatar: "🦋" },
    { name: "زياد ناصر", avatar: "🐵" },
    { name: "نور حسن", avatar: "🦁" },
  ];

  function loadDemoStudents() {
    try {
      const raw = window.localStorage.getItem(DEMO_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* fall through and regenerate */
    }
    const generated = DEMO_ROSTER.map((s, i) => ({
      id: `demo-${i}`,
      name: s.name,
      avatar: s.avatar,
      xp: 180 + Math.round(Math.random() * 1500),
    }));
    try {
      window.localStorage.setItem(DEMO_KEY, JSON.stringify(generated));
    } catch {
      /* leaderboard still works for this session */
    }
    return generated;
  }

  /** Ranked list (highest XP first), the signed-in student included
   *  and flagged with `isMe: true`. Every field about the student
   *  comes from their own saved profile/stats — never hardcoded. */
  function getRankings() {
    const demo = loadDemoStudents();
    const profile = typeof getStudentProfile === "function" ? getStudentProfile() : {};
    const snapshot = typeof getGamificationSnapshot === "function" ? getGamificationSnapshot() : { xp: 0, level: 1 };

    const me = {
      id: "me",
      name: profile.name || "طالب EduVerse",
      avatar: profile.avatar || "🧑‍🚀",
      xp: snapshot.xp || 0,
      level: snapshot.level || 1,
      isMe: true,
    };

    const ranked = [...demo, me].sort((a, b) => b.xp - a.xp);
    ranked.forEach((s, i) => { s.rank = i + 1; });
    return ranked;
  }

  return { getRankings };
})();

/* -----------------------------------------------------------------
   PAGE RENDERING (leaderboard.html only — no-ops elsewhere since the
   container ids simply won't exist on other pages).
   ----------------------------------------------------------------- */
function renderLeaderboardPage() {
  const list = document.getElementById("leaderboardList");
  if (!list) return;

  const rankings = Leaderboard.getRankings();
  const medal = (rank) => (rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`);

  list.innerHTML = rankings
    .map(
      (s) => `
      <li class="leaderboard-row${s.isMe ? " is-me" : ""}">
        <span class="leaderboard-row__rank">${medal(s.rank)}</span>
        <span class="leaderboard-row__avatar">${s.avatar}</span>
        <span class="leaderboard-row__name">${s.name}${s.isMe ? " <em>(أنت)</em>" : ""}</span>
        <span class="leaderboard-row__xp">⭐ ${s.xp}</span>
      </li>`
    )
    .join("");

  const me = rankings.find((s) => s.isMe);
  const meRankEl = document.getElementById("myRankChip");
  if (meRankEl && me) {
    meRankEl.textContent = `ترتيبك الحالي: ${medal(me.rank)} من أصل ${rankings.length}`;
  }
}

/** Renders just the top few rows — used as a small preview widget on
 *  the Student Dashboard (gamification.html). */
function renderLeaderboardPreview(containerId = "leaderboardPreview", topN = 3) {
  const container = document.getElementById(containerId);
  if (!container || typeof Leaderboard === "undefined") return;

  const rankings = Leaderboard.getRankings();
  const top = rankings.slice(0, topN);
  const me = rankings.find((s) => s.isMe);
  const medal = (rank) => (rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`);

  container.innerHTML = `
    <ul class="leaderboard-preview__list">
      ${top
        .map(
          (s) => `
        <li class="${s.isMe ? "is-me" : ""}">
          <span>${medal(s.rank)}</span>
          <span>${s.avatar}</span>
          <span>${s.name}</span>
          <strong>${s.xp}</strong>
        </li>`
        )
        .join("")}
    </ul>
    ${me && me.rank > topN ? `<p class="leaderboard-preview__me">ترتيبك: ${medal(me.rank)} — ⭐ ${me.xp}</p>` : ""}
  `;
}

document.addEventListener("DOMContentLoaded", renderLeaderboardPage);
