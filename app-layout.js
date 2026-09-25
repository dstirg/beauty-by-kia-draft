(function initializeBeautyByKiaLayout(root) {
  "use strict";

  function normalizeViewLayout(documentRef) {
    const appShell = documentRef.getElementById("app");
    const siteFooter = documentRef.querySelector(".site-footer");
    if (!appShell) return;

    // Re-parent every routed view, including views accidentally nested inside
    // another hidden view by malformed legacy markup.
    documentRef.querySelectorAll(".view").forEach(view => appShell.append(view));
    if (siteFooter) appShell.append(siteFooter);
  }

  root.BBK_LAYOUT = { normalizeViewLayout };
})(typeof window === "undefined" ? globalThis : window);
