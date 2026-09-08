/* =================================================================
   EDUVERSE — AUTH (client-only session)
   Loaded as a plain classic script, same pattern as gamification.js
   and edubot.js. There is no backend yet (see teacher-dashboard.html's
   own login note) — this module stores a lightweight "who is using
   this browser right now" session in localStorage, so pages can:

     1. Guard themselves: <body data-auth-required="student"> (or
        "teacher", or "any") redirects to login.html automatically
        if nobody is signed in, or sends a signed-in teacher away
        from a student-only page and vice versa.
     2. Show who's signed in + a Logout button via a small floating
        chip, added automatically to any guarded page.

   Other scripts can also call Auth.login()/Auth.logout()/Auth.getUser()
   directly (e.g. teacher-dashboard.js hooks its own login form into
   this same session so a reload doesn't bounce a signed-in teacher
   back to the login view).
   ================================================================= */

const Auth = (function () {
  const KEY = "eduverse:auth";

  function getUser() {
    try {
      const raw = window.localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /** Starts a session for the given role ("student" | "teacher") and
   *  profile fields (name, grade, subject, etc.). Nothing here is a
   *  real credential check — see the login pages' own "demo only"
   *  notices — it simply remembers who is using this browser. */
  function login(role, profile = {}) {
    const user = { role, ...profile, loggedInAt: new Date().toISOString() };
    try {
      window.localStorage.setItem(KEY, JSON.stringify(user));
    } catch {
      /* localStorage unavailable — session just won't persist across reloads */
    }
    return user;
  }

  function logout(redirectTo = "index.html") {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    if (redirectTo) window.location.href = redirectTo;
  }

  /* -----------------------------------------------------------------
     FLOATING USER CHIP — shows "Avatar Name · Logout" in a corner of
     any guarded page. Purely additive: it doesn't touch each page's
     own navbar markup.
     ----------------------------------------------------------------- */
  function renderUserChip(user) {
    if (document.getElementById("authUserChip")) return;
    const chip = document.createElement("div");
    chip.id = "authUserChip";
    chip.className = "auth-user-chip";
    const roleLabel = user.role === "teacher" ? "معلم/ـة" : "طالب/ـة";
    chip.innerHTML = `
      <span class="auth-user-chip__avatar">${user.avatar || (user.role === "teacher" ? "🧑‍🏫" : "🧑‍🚀")}</span>
      <span class="auth-user-chip__info">
        <strong>${user.name || "بدون اسم"}</strong>
        <span>${roleLabel}</span>
      </span>
      <button type="button" class="auth-user-chip__logout" id="authLogoutBtn" aria-label="تسجيل الخروج">🚪</button>
    `;
    document.body.appendChild(chip);
    document.getElementById("authLogoutBtn").addEventListener("click", () => logout());
  }

  /** Reads <body data-auth-required="student|teacher|any"> and
   *  enforces it. Call this on every guarded page after this script
   *  loads (it also runs itself automatically on DOMContentLoaded). */
  function enforceGuard() {
    const required = document.body.dataset.authRequired;
    if (!required) return;

    const user = getUser();
    if (!user) {
      const dest = required === "teacher" ? "teacher-dashboard.html" : "login.html";
      window.location.href = dest;
      return;
    }
    if (required !== "any" && user.role !== required) {
      window.location.href = user.role === "teacher" ? "teacher-dashboard.html" : "learning-worlds.html";
      return;
    }
    renderUserChip(user);
  }

  document.addEventListener("DOMContentLoaded", enforceGuard);

  return { getUser, login, logout, renderUserChip };
})();
