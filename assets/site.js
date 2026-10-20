(function () {
  var root = document.documentElement;

  // ---------- Language ----------
  var meta = {
    cs: {
      title: "Taya: Učení hrou pro děti",
      description: "Taya je vzdělávací aplikace pro děti od 5 do 10 let. Matematika a čtení na ostrovech plných her, bez reklam a bez sledování.",
      soon: "Již brzy"
    },
    en: {
      title: "Taya Kids: Learning Islands",
      description: "Taya is a learning app for kids aged 5 to 10. Math and reading on islands full of games, with no ads and no tracking.",
      soon: "Coming soon"
    }
  };
  // Pages can override the title (the privacy page does).
  var pageTitles = { cs: root.getAttribute("data-title-cs"), en: root.getAttribute("data-title-en") };

  function stored() {
    try { return localStorage.getItem("taya.lang"); } catch (e) { return null; }
  }

  function initialLang() {
    var q = new URLSearchParams(location.search).get("lang");
    if (q === "cs" || q === "en") return q;
    if (location.hash === "#en" || location.hash === "#cs") return location.hash.slice(1);
    var s = stored();
    if (s === "cs" || s === "en") return s;
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || "cs";
    return /^(cs|sk)/i.test(nav) ? "cs" : "en";
  }

  function setLang(lang, remember) {
    root.lang = lang;
    root.setAttribute("data-lang", lang);
    document.title = pageTitles[lang] || meta[lang].title;
    var d = document.querySelector('meta[name="description"]');
    if (d && !pageTitles[lang]) d.setAttribute("content", meta[lang].description);
    document.querySelectorAll("[data-set-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-set-lang") === lang));
    });
    document.querySelectorAll(".store.soon").forEach(function (a) {
      a.setAttribute("aria-label", a.getAttribute("data-name") + ", " + meta[lang].soon);
    });
    if (remember) { try { localStorage.setItem("taya.lang", lang); } catch (e) {} }
  }

  document.querySelectorAll("[data-set-lang]").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.getAttribute("data-set-lang"), true); });
  });

  // ---------- Store buttons ----------
  var links = window.TAYA_STORES || {};
  var soonNotes = {
    both: '<span lang="cs">Již brzy v App Store a na Google Play</span><span lang="en">Coming soon to the App Store and Google Play</span>',
    ios: '<span lang="cs">V App Store již brzy</span><span lang="en">Coming soon to the App Store</span>',
    android: '<span lang="cs">Na Google Play již brzy</span><span lang="en">Coming soon to Google Play</span>'
  };
  document.querySelectorAll(".stores").forEach(function (row) {
    var missing = [];
    row.querySelectorAll(".store[data-store]").forEach(function (a) {
      var store = a.getAttribute("data-store");
      var url = links[store];
      if (url) {
        a.href = url;
        a.rel = "noopener";
      } else {
        missing.push(store);
        a.classList.add("soon");
        a.removeAttribute("href");
        a.setAttribute("role", "link");
        a.setAttribute("aria-disabled", "true");
      }
    });
    // The official badges stay untouched (no dimming, nothing on top); a line under them names the stores still to come.
    if (missing.length) {
      var note = document.createElement("p");
      note.className = "stores-soon";
      note.setAttribute("aria-hidden", "true");
      note.innerHTML = missing.length > 1 ? soonNotes.both : soonNotes[missing[0]];
      row.appendChild(note);
    }
  });

  setLang(initialLang(), false);

  // ---------- Top bar border once scrolled ----------
  var bar = document.querySelector(".topbar");
  if (bar) {
    var onScroll = function () { bar.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ---------- Hero Taya follows the pointer ----------
  // The face (eyes, cheeks, mouth) shifts a little so she turns her head, the pupils go further
  // inside the eye whites (clipped), and she leans a few degrees toward the pointer.
  var taya = document.querySelector(".hero .taya");
  var face = taya && taya.querySelector(".face");
  var pupils = taya && taya.querySelector(".pupils");
  var lean = taya && taya.querySelector(".lean");
  var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (taya && face && pupils && lean && !still) {
    var target = { x: 0, y: 0 }, cur = { x: 0, y: 0 }, raf = 0;
    var MAX_FACE = 3, MAX_EYE = 4, MAX_LEAN = 4, REACH = 320; // svg units, svg units, degrees, css px

    var tick = function () {
      cur.x += (target.x - cur.x) * 0.14;
      cur.y += (target.y - cur.y) * 0.14;
      face.setAttribute("transform", "translate(" + (cur.x * MAX_FACE).toFixed(2) + " " + (cur.y * MAX_FACE * 0.7).toFixed(2) + ")");
      pupils.setAttribute("transform", "translate(" + (cur.x * MAX_EYE).toFixed(2) + " " + (cur.y * MAX_EYE).toFixed(2) + ")");
      lean.setAttribute("transform", "rotate(" + (cur.x * MAX_LEAN).toFixed(2) + " 100 190)");
      raf = Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) > 0.002 ? requestAnimationFrame(tick) : 0;
    };
    var aim = function (x, y) {
      target.x = x; target.y = y;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    var look = function (e) {
      var r = taya.getBoundingClientRect();
      // Eyes sit at (100, 110) in the 200×200 viewBox.
      var dx = e.clientX - (r.left + r.width * 0.5);
      var dy = e.clientY - (r.top + r.height * 0.55);
      var d = Math.hypot(dx, dy) || 1;
      var k = Math.min(1, d / REACH) / d;
      aim(dx * k, dy * k);
    };
    window.addEventListener("pointermove", look, { passive: true });
    window.addEventListener("pointerdown", look, { passive: true });
    document.addEventListener("pointerleave", function () { aim(0, 0); });
    window.addEventListener("blur", function () { aim(0, 0); });
  }

  // ---------- Tap Taya: she cheers like after a right answer ----------
  var stage = document.querySelector(".hero .stage");
  if (stage) {
    var cheerTimer = 0;
    stage.addEventListener("click", function () {
      clearTimeout(cheerTimer);
      stage.classList.remove("cheering");
      void stage.offsetWidth; // restart the CSS animations on a repeat tap
      stage.classList.add("cheering");
      cheerTimer = setTimeout(function () { stage.classList.remove("cheering"); }, 2050);
    });
  }

  // ---------- Reveal on scroll ----------
  var items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  items.forEach(function (el) { io.observe(el); });
})();
