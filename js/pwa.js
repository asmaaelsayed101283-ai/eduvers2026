/* =================================================================
   EDUVERSE — PWA REGISTRATION
   Included on every page. Registers sw.js (offline app-shell caching)
   and remembers the browser's "install this app" prompt so any page
   can offer an Install button later via PWA.promptInstall().
   Fails silently on browsers/contexts without service worker support
   (e.g. file://) — it never blocks the rest of the page.
   ================================================================= */

const PWA = (function () {
  let deferredInstallPrompt = null;

  /**
   * FAIL-SAFE for the branded `.page-loader` splash overlay.
   * Normally the overlay fades itself out via a pure-CSS animation
   * (see css/style.css) about 1s after the page starts rendering.
   * That's intentionally CSS-only so it can never get stuck if a
   * script fails to load — but as extra insurance (some older
   * WebViews / reduced-motion setups can behave unpredictably with
   * long-running fixed-position overlays), this forces the loader
   * out of the way after a short timeout no matter what, so it can
   * never sit on top of the page and swallow clicks/taps.
   */
  function failSafeHideLoader() {
    window.setTimeout(() => {
      const loader = document.querySelector(".page-loader");
      if (!loader) return;
      loader.style.opacity = "0";
      loader.style.visibility = "hidden";
      loader.style.pointerEvents = "none";
    }, 1200);
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    // file:// and some sandboxed contexts don't support SW registration —
    // guard so this never throws and breaks page load.
    if (window.location.protocol === "file:") return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {
        /* offline-support just won't be available this session */
      });
    });
  }

  function listenForInstallPrompt() {
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      document.dispatchEvent(new CustomEvent("pwa-installable"));
    });
  }

  async function promptInstall() {
    if (!deferredInstallPrompt) return false;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return outcome === "accepted";
  }

  function isInstallable() {
    return Boolean(deferredInstallPrompt);
  }

  /**
   * file:// pages can't register a service worker at all, and some
   * browsers (Safari in particular) partition or restrict
   * localStorage differently for file:// than for a real http(s)
   * origin. That mismatch is a real, previously-seen cause of
   * "the teacher published it, but the student doesn't see it" —
   * even though the underlying save/publish code is correct. Rather
   * than fail silently, tell whoever is testing exactly what to do.
   */
  function warnIfFileProtocol() {
    if (window.location.protocol !== "file:") return;
    if (document.getElementById("fileProtocolWarning")) return;

    const banner = document.createElement("div");
    banner.id = "fileProtocolWarning";
    banner.setAttribute("role", "alert");
    banner.style.cssText = [
      "position:fixed", "top:0", "inset-inline:0", "z-index:99999",
      "background:#B45309", "color:#fff", "font:700 13px/1.5 Tajawal, sans-serif",
      "padding:10px 16px", "text-align:center", "direction:rtl",
    ].join(";");
    banner.innerHTML =
      '⚠️ الصفحة مفتوحة مباشرة من الملفات (file://) — قد لا يعمل التخزين المحلي بشكل موثوق بين الصفحات. ' +
      "شغّل المشروع عبر خادم محلي بدلاً من ذلك: <code style=\"background:rgba(0,0,0,0.2);padding:2px 6px;border-radius:4px;\">python3 serve.py</code> ثم افتح http://localhost:8000" +
      ' <button type="button" id="fileProtocolWarningClose" style="margin-inline-start:10px;background:rgba(255,255,255,0.25);border:none;color:#fff;border-radius:6px;padding:3px 10px;cursor:pointer;">إغلاق</button>';
    document.body.prepend(banner);
    document.getElementById("fileProtocolWarningClose").addEventListener("click", () => banner.remove());
  }

  registerServiceWorker();
  listenForInstallPrompt();
  failSafeHideLoader();
  document.addEventListener("DOMContentLoaded", warnIfFileProtocol);

  return { promptInstall, isInstallable };
})();
