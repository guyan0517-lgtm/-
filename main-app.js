// Main application logic is embedded in index.html.
// This script also purges stale Service Worker caches and guarantees NAI preset drawers are populated.
(function () {
  try {
    if (typeof window !== "undefined" && "caches" in window) {
      caches.keys().then(function (keys) {
        keys.forEach(function (k) {
          if (k !== "ephone-tuk-cache-v23.1") {
            caches.delete(k).catch(function () {});
          }
        });
      }).catch(function () {});
    }
    if (typeof navigator !== "undefined" && navigator.serviceWorker && typeof navigator.serviceWorker.getRegistrations === "function") {
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        regs.forEach(function (r) {
          try { r.update(); } catch (_) {}
        });
      }).catch(function () {});
    }
  } catch (_) {}

  function ensureNaiSettingsDrawerStructure() {
    var vTag = document.getElementById("api-settings-version-tag");
    if (vTag && vTag.textContent && vTag.textContent.trim() !== "v23.1") {
      try {
        if (sessionStorage.getItem("ephone_reloaded_v23_1") !== "1") {
          sessionStorage.setItem("ephone_reloaded_v23_1", "1");
          if ("caches" in window) {
            caches.keys().then(function (keys) {
              return Promise.all(keys.map(function (k) { return caches.delete(k); }));
            }).finally(function () {
              window.location.reload();
            });
            return;
          }
          window.location.reload();
          return;
        }
      } catch (_) {}
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureNaiSettingsDrawerStructure);
  } else {
    ensureNaiSettingsDrawerStructure();
  }
})();

