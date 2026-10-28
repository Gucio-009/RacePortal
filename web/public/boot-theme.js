/* Motyw + zasłona intra przed bundlem — zewnętrzny plik (CSP script-src bez unsafe-inline). */
try {
  var s = JSON.parse(localStorage.getItem("raceportal_settings") || "{}");
  var a = s.accent;
  var colors = {
    gold: "#FFD700",
    redline: "#FF3B3B",
    ice: "#7DD3FC",
    arctic: "#266CB3",
    sand: "#B78D54",
    blush: "#C56B89"
  };
  var surfaces = { arctic: "#F3F6FA", sand: "#F7F3EB", blush: "#FFF5F7" };
  if (colors[a]) {
    document.documentElement.dataset.accent = a;
    document.documentElement.style.setProperty("--race-accent", colors[a]);
    if (surfaces[a]) {
      var t = document.querySelector('meta[name="theme-color"]');
      if (t) t.setAttribute("content", surfaces[a]);
      var c = document.querySelector('meta[name="color-scheme"]');
      if (c) c.setAttribute("content", "light");
    }
  }
  if (s.locale === "en" || s.locale === "pl") {
    document.documentElement.lang = s.locale;
  }
} catch (e) {}
try {
  if (sessionStorage.getItem("raceportal_intro_seen") !== "1") {
    document.documentElement.classList.add("intro-cover");
  }
} catch (e) {}
