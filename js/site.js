/* Landing page behaviour */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Service worker (PWA)
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  // // Scroll progress + nav shadow
  // const bar = document.createElement("div"); bar.id = "progress"; document.body.appendChild(bar);
  // const nav = $("#nav");
  // const onScroll = () => {
  //   const h = document.documentElement;
  //   bar.style.width = (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)) * 100 + "%";
  //   nav.classList.toggle("scrolled", h.scrollTop > 8);
  // };
  // addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // Reveal on scroll
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: .12 }) : null;
  $$(".reveal").forEach((el) => (io ? io.observe(el) : el.classList.add("in")));

  // Count up
  const cio = "IntersectionObserver" in window ? new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return; cio.unobserve(e.target);
      const end = +e.target.dataset.count, t0 = performance.now();
      const step = (t) => { const p = Math.min(1, (t - t0) / 1200); e.target.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
      reduce ? (e.target.textContent = end) : requestAnimationFrame(step);
    });
  }) : null;
  $$("[data-count]").forEach((el) => (cio ? cio.observe(el) : (el.textContent = el.dataset.count)));

  // Hero demo: typing -> tasks -> ticking
  const demoLines = ["Morning reset 7am 20 min", "Focus time 9am 2h", "Lunch 1pm 45 min", "Evening walk 6pm"];
  const typed = $("#typed"), list = $("#demoTasks"), pctEl = $("#demoPct");
  $("#demoDate").textContent = new Date().toLocaleDateString(undefined, { weekday: "long" });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function demo() {
    for (;;) {
      typed.textContent = ""; list.innerHTML = ""; pctEl.textContent = "0%";
      const tasks = DBParse.parse(demoLines.join("\n"));
      for (const line of demoLines) {
        for (const ch of line + "\n") { typed.textContent += ch; if (!reduce) await sleep(28); }
      }
      await sleep(400);
      tasks.forEach((t, i) => {
        const li = document.createElement("li"); li.style.animationDelay = i * 120 + "ms";
        li.innerHTML = `<span class="ck"></span><div><b></b><small></small></div>`;
        $("b", li).textContent = t.title; $("small", li).textContent = `${DBParse.fmt(t.start)} · ${t.dur} min`;
        list.appendChild(li);
      });
      await sleep(1200);
      const lis = $$("li", list);
      for (let i = 0; i < lis.length; i++) {
        lis[i].classList.add("done"); $(".ck", lis[i]).innerHTML = '<svg class="i" aria-hidden="true"><use href="#i-check"/></svg>';
        pctEl.textContent = Math.round(((i + 1) / lis.length) * 100) + "%";
        await sleep(700);
      }
      await sleep(2200);
      if (reduce) return;
    }
  }
  demo();

  // Feature filters
  $$(".pill").forEach((p) => p.addEventListener("click", () => {
    $$(".pill").forEach((x) => { x.classList.toggle("active", x === p); x.setAttribute("aria-selected", x === p); });
    const f = p.dataset.f;
    $$("#featGrid .card").forEach((c) => c.classList.toggle("hide", f !== "all" && c.dataset.cat !== f));
  }));

  // Try-it parser
  const samples = [
    "Morning reset 7am 20 min\nFocus time 9am 2 hours\nLunch break 1pm 45 min\nRevise chemistry 2:30pm 1h\nEvening walk\nWrap up and plan tomorrow 30 min",
    "Gym 6:30am 45 min\nBreakfast and emails\nProject work 10am 2h\nLunch 1pm\nCall mum at 6 pm\nRead 30 min",
    "Math practice 4pm 1h\nPhysics notes 5:15pm 45 min\nDinner 7pm\nRevise flashcards 8pm 20 min\nPack bag for tomorrow",
  ];
  let si = 0;
  const tt = $("#tryText"), tl = $("#tryList"), tot = $("#tryTotal");
  function renderTry() {
    const tasks = DBParse.parse(tt.value).sort((a, b) => a.start - b.start);
    tl.innerHTML = "";
    let mins = 0;
    tasks.forEach((t, i) => {
      mins += t.dur;
      const li = document.createElement("li"); li.style.animationDelay = i * 50 + "ms";
      const left = document.createElement("div");
      const b = document.createElement("b"); b.textContent = t.title;
      const s = document.createElement("small"); s.textContent = `${DBParse.fmt(t.start)} – ${DBParse.fmt(t.start + t.dur)} · ${t.dur} min`;
      left.append(b, s); li.appendChild(left);
      if (t.guessed || t.defaultedTime) {
        const tag = document.createElement("span"); tag.className = "tag"; tag.textContent = t.guessed ? "guessed AM/PM" : "time follows previous"; li.appendChild(tag);
      }
      tl.appendChild(li);
    });
    tot.textContent = tasks.length ? `${tasks.length} tasks · ${Math.floor(mins / 60)}h ${mins % 60}m` : "Nothing yet";
  }
  tt.addEventListener("input", renderTry); renderTry();
  $("#tryRandom").addEventListener("click", () => { si = (si + 1) % samples.length; tt.value = samples[si]; renderTry(); });

  // Summary sheet demo
  const sd = $("#sheetDemo");
  function toggleSheet(open) {
    sd.classList.toggle("open", open);
    const p = open ? 75 : 0;
    $("#ringF").style.strokeDashoffset = 314 - (314 * p) / 100;
    $("#ringT").textContent = p + "%"; $("#sdDone").textContent = open ? 3 : 0;
  }
  sd.addEventListener("click", () => toggleSheet(!sd.classList.contains("open")));
  if ("IntersectionObserver" in window) {
    const so = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { setTimeout(() => toggleSheet(true), 500); so.disconnect(); } }), { threshold: .6 });
    so.observe(sd);
  }

  // Sound lab (WebAudio)
  let ctx; const vol = $("#soundVol");
  function tone(freq, t0, dur, type = "sine", gain = .3, slideTo) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, ctx.currentTime + t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + t0 + dur);
    const v = gain * (vol.value / 100);
    g.gain.setValueAtTime(0.0001, ctx.currentTime + t0);
    g.gain.exponentialRampToValueAtTime(Math.max(v, .0002), ctx.currentTime + t0 + .01);
    g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + t0 + dur);
    o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + t0); o.stop(ctx.currentTime + t0 + dur + .05);
  }
  const sounds = {
    pop: () => tone(520, 0, .14, "sine", .5, 920),
    chime: () => { tone(880, 0, .35, "sine", .35); tone(1320, .09, .45, "sine", .25); },
    click: () => tone(1800, 0, .035, "square", .18),
    bell: () => { tone(660, 0, .9, "triangle", .35); tone(1320, 0, .7, "sine", .15); },
    soft: () => tone(440, 0, .18, "sine", .4, 300),
    drop: () => tone(700, 0, .22, "triangle", .4, 180),
  };
  $$("#soundBtns button").forEach((b) => b.addEventListener("click", () => {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    sounds[b.dataset.s](); b.classList.add("playing"); setTimeout(() => b.classList.remove("playing"), 300);
  }));

  // Theme playground
  const activeTheme = () => DBTheme.theme();
  function syncThemeBtns() { $$(".theme-btn").forEach((b) => b.classList.toggle("active", b.dataset.t === activeTheme())); }
  $$(".theme-btn").forEach((b) => b.addEventListener("click", () => { DBTheme.setTheme(b.dataset.t); syncThemeBtns(); }));
  addEventListener("daybreak:theme", syncThemeBtns); syncThemeBtns();
  $$("#swatches [data-c]").forEach((b) => b.addEventListener("click", () => DBTheme.setAccent(b.dataset.c)));
  $("#customColor").addEventListener("input", (e) => DBTheme.setAccent(e.target.value));
  $("#resetAccent").addEventListener("click", () => DBTheme.setAccent(""));

  // Install prompt
  let deferred;
  const ib = $("#installBtn");
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; ib.hidden = false; });
  ib.addEventListener("click", async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; ib.hidden = true; });
  addEventListener("appinstalled", () => { ib.hidden = true; });
})();
