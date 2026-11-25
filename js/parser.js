/* Daybreak text -> tasks parser. Runs fully in the browser, no AI, no network. */
(function (root) {
  const fmt = (m) => {
    m = ((m % 1440) + 1440) % 1440;
    const h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? "PM" : "AM";
    return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, "0")} ${ap}`;
  };

  function parse(text, opts) {
    opts = Object.assign({ defaultStart: 540, defaultDur: 30 }, opts);
    const out = [];
    let cursor = null;
    const lines = String(text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    for (let raw of lines) {
      let l = raw.replace(/^(?:[-*•–]+\s*|\d+[.)]\s+|\[[ xX]?\]\s*)/, "").trim();
      if (!l) continue;
      // skip headings such as "MY TUESDAY" or "Today:"
      if (/:$/.test(l) || (/^[A-Z][A-Z\s]{2,24}$/.test(l) && l.split(/\s+/).length <= 3)) continue;

      let start = null, dur = null, guessed = false;

      // duration (sum all, e.g. "1 hr 30 min")
      const durRe = /\b(?:for\s+)?(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|min)\b/gi;
      let dm, total = 0, hadDur = false;
      while ((dm = durRe.exec(l))) {
        hadDur = true;
        const n = parseFloat(dm[1]);
        total += /^h/i.test(dm[2]) ? n * 60 : n;
      }
      if (hadDur) { dur = Math.round(total); l = l.replace(durRe, " "); }

      // time: 9am, 9:30 pm, 14:00, at 7
      let tm;
      if ((tm = /(?:\b(?:at|@)\s*)?\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)(?![a-z])/i.exec(l))) {
        let h = +tm[1] % 12; if (/^p/i.test(tm[3])) h += 12;
        start = h * 60 + (+tm[2] || 0);
        l = l.replace(tm[0], " ");
      } else if ((tm = /\b([01]?\d|2[0-3]):([0-5]\d)\b/.exec(l))) {
        start = +tm[1] * 60 + +tm[2];
        l = l.replace(tm[0], " ");
      } else if ((tm = /\b(?:at|@)\s*(\d{1,2})(?::(\d{2}))?\b/i.exec(l))) {
        let h = +tm[1];
        if (h >= 1 && h <= 6) h += 12; else if (h === 12) h = 12; // 1-6 -> pm, 7-11 -> am
        start = h * 60 + (+tm[2] || 0);
        guessed = true; // no AM/PM given
        l = l.replace(tm[0], " ");
      }

      let title = l.replace(/\s{2,}/g, " ").replace(/^[\s\-–:,.@]+|[\s\-–:,.@]+$/g, "")
        .replace(/^(?:at|for|from|until)\s+/i, "").trim();
      if (!title) title = raw.trim();
      title = title.charAt(0).toUpperCase() + title.slice(1);

      const hadTime = start !== null;
      if (start === null) start = cursor !== null ? cursor : opts.defaultStart;
      if (dur === null) dur = opts.defaultDur;
      cursor = start + dur;
      out.push({ title, start, dur, guessed, defaultedTime: !hadTime, defaultedDur: !hadDur });
    }
    return out;
  }

  root.DBParse = { parse, fmt };
  if (typeof module !== "undefined") module.exports = root.DBParse;
})(typeof window !== "undefined" ? window : globalThis);
