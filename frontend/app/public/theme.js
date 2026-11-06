// Sets <html data-theme> before first paint: the choice stored under
// `tessera.theme` ("light" or "dark"), else the system's, followed live.
// A plain script, not a module, so it blocks rendering until it has run; an
// external file because the CSP allows no inline script.
(function () {
  var system = matchMedia("(prefers-color-scheme: dark)");
  function apply() {
    var choice;
    try {
      choice = localStorage.getItem("tessera.theme");
    } catch (refused) {}
    document.documentElement.dataset.theme =
      choice === "light" || choice === "dark"
        ? choice
        : system.matches
          ? "dark"
          : "light";
  }
  apply();
  system.addEventListener("change", apply);
  addEventListener("storage", function (event) {
    if (event.key === "tessera.theme") apply();
  });
})();
