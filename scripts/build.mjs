// Builds the talks timeline into dist/ from talks.json, in French (dist/) and English (dist/en/).
//   node scripts/build.mjs
// Each talk lists its formats (web deck, PDF, PPTX). A format is a local path (copied into dist/)
// or an absolute URL, so any slide tool can feed the timeline.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const SITE = "https://manufacture.dev/talks/";
const data = JSON.parse(readFileSync(join(ROOT, "talks.json"), "utf8"));

// every displayed word, per page language; talks.json refers to notes, audiences and formats by key
const UI = {
  fr: {
    locale: "fr-FR", dir: "", title: "Talks · Manufacture",
    description: "Les présentations de Manufacture, par date : à lire en ligne, en PDF ou en PowerPoint.",
    lead: "Les présentations, de la plus récente à la plus ancienne. À lire en ligne, en PDF ou en PowerPoint.",
    kinds: { web: "En ligne", pdf: "PDF", pptx: "PowerPoint" },
    audience: { public: "public", internal: "interne" },
    format: { workshop: "atelier" },
    langTitle: { fr: "Talk en français", en: "Talk en anglais" },
    notes: { "no-video": "Sans vidéos ni animations", "pptx-clips": "Vidéos intégrées, notes de l'orateur. Installer les polices Geist avant d'ouvrir.", fonts: "polices Geist (zip)" },
    count: (n) => `${n} talk${n > 1 ? "s" : ""}`, source: "sources de la série ↗",
    mb: "Mo", kb: "Ko", switchLabel: "Langue",
    kicker: "Conférences, meetups, interventions en entreprise",
    latestLabel: "Dernier talk", share: "Partager", copied: "Lien copié", copyFallback: "Copiez ce lien", seriesLabel: "Séries", timelineLabel: "Timeline", series: "Série", formats: "Formats", talks: "talks", nav: "Sommaire",
  },
  en: {
    locale: "en-GB", dir: "en/", title: "Talks · Manufacture",
    description: "Manufacture talks by date: read them online, as PDF or PowerPoint.",
    lead: "Talks, newest first. Read them online, as PDF or PowerPoint.",
    kinds: { web: "Online", pdf: "PDF", pptx: "PowerPoint" },
    audience: { public: "public", internal: "internal" },
    format: { workshop: "workshop" },
    langTitle: { fr: "Talk in French", en: "Talk in English" },
    notes: { "no-video": "No videos or animations", "pptx-clips": "Embedded videos, speaker notes. Install the Geist fonts before opening.", fonts: "Geist fonts (zip)" },
    count: (n) => `${n} talk${n > 1 ? "s" : ""}`, source: "series sources ↗",
    mb: "MB", kb: "KB", switchLabel: "Language",
    kicker: "Conferences, meetups, in-house talks",
    latestLabel: "Latest talk", share: "Share", copied: "Link copied", copyFallback: "Copy this link", seriesLabel: "Series", timelineLabel: "Timeline", series: "Series", formats: "Formats", talks: "talks", nav: "Contents",
  },
};
const LANGS = Object.keys(UI);

const series = new Map(data.series.map((s) => [s.id, s]));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const isUrl = (h) => /^https?:\/\//.test(h);
const localPath = (h) => h.split("#")[0];

// check every talk before writing anything
const errors = [];
const known = (lang, group, key, where) => { if (!(key in UI[lang][group])) errors.push(`${where}: no ${lang} text for ${group}.${key}`); };
for (const s of data.series)
  for (const l of LANGS) if (!s.title?.[l] || !s.summary?.[l]) errors.push(`series ${s.id}: missing ${l} title or summary`);
for (const t of data.talks) {
  if (!series.has(t.series)) errors.push(`${t.id}: unknown series ${t.series}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t.date)) errors.push(`${t.id}: bad date ${t.date}`);
  if (!t.title) errors.push(`${t.id}: missing title`);
  for (const l of LANGS) {
    known(l, "audience", t.audience, t.id);
    known(l, "langTitle", t.lang, t.id);
    if (t.format) known(l, "format", t.format, t.id);
    for (const f of t.formats) {
      known(l, "kinds", f.kind, t.id);
      for (const k of [f.note, f.degraded, f.extra?.label].filter(Boolean)) known(l, "notes", k, t.id);
    }
  }
  for (const f of t.formats)
    for (const h of [f.href, f.extra?.href].filter(Boolean))
      if (!isUrl(h) && !existsSync(join(ROOT, localPath(h)))) errors.push(`${t.id}: missing file ${h}`);
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }

const talks = [...data.talks].sort((a, b) => b.date.localeCompare(a.date));

function page(lang) {
  const u = UI[lang];
  const up = u.dir ? "../" : "";   // from dist/en/ back to the shared files
  const href = (h) => (isUrl(h) ? h : up + h);
  const date = (d, opts) => new Intl.DateTimeFormat(u.locale, { ...opts, timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));
  const day = (d) => date(d, { day: "2-digit", month: "short" }).replace(".", "");
  const size = (h) => { const mb = statSync(join(ROOT, h)).size / 1e6; return mb >= 1 ? `${Math.round(mb)} ${u.mb}` : `${Math.max(1, Math.round(mb * 1000))} ${u.kb}`; };

  function formatLink(f) {
    const local = !isUrl(f.href);
    const meta = f.kind !== "web" && local ? size(localPath(f.href)) : "";
    const attrs = f.kind !== "web" && local ? " download" : "";
    const note = f.degraded ? `<span class="degraded">${esc(u.notes[f.degraded])}</span>` : f.note ? `<span class="note">${esc(u.notes[f.note])}</span>` : "";
    const extra = f.extra ? `<a class="extra" href="${esc(href(f.extra.href))}" download>${esc(u.notes[f.extra.label])} ↓</a>` : "";
    return `<li class="fmt"><a class="btn${f.kind === "web" ? " primary" : ""}" href="${esc(href(f.href))}"${attrs}><span>${u.kinds[f.kind]}</span>${meta ? `<small>${meta}</small>` : ""}<i aria-hidden="true">${f.kind === "web" ? "↗" : "↓"}</i></a>${note}${extra}</li>`;
  }

  const seriesNo = new Map(data.series.map((s, i) => [s.id, i + 1]));

  function talkItem(t) {
    const s = series.get(t.series);
    const [y, m, d] = t.date.split("-");
    return `<li class="talk" id="${esc(t.id)}">
  <div class="when"><time datetime="${t.date}"><span>${esc(date(t.date, { month: "long" }))}</span><b>${d}</b></time></div>
  <article>
    <p class="tags"><span>§1.${seriesNo.get(t.series)} ${esc(s.title[lang])}</span><span class="chip" title="${esc(u.langTitle[t.lang])}">${esc(t.lang.toUpperCase())}</span>${t.format ? `<span class="chip">${esc(u.format[t.format])}</span>` : ""}</p>
    <h3><a href="#${esc(t.id)}">${esc(t.event)}</a> <span class="badge">${esc(u.audience[t.audience])}</span></h3>
    <p class="title" lang="${t.lang}">${esc(t.title)}</p>
    <p class="meta">${esc(date(t.date, { dateStyle: "full" }))} · ${esc(t.speakers.join(" & "))}</p>
    <p class="share"><button type="button" data-link="${SITE}${u.dir}#${esc(t.id)}" aria-label="${esc(u.share)} : ${esc(t.event)}" title="${esc(u.share)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3m-5 5 5-5 5 5M5 11v10h14V11"/></svg></button><output aria-live="polite"></output></p>
  </article>
  <ul class="formats" aria-label="${esc(u.formats)}">${t.formats.map(formatLink).join("")}</ul>
</li>`;
  }

  const years = [...new Set(talks.map((t) => t.date.slice(0, 4)))];
  const timeline = years.map((y) => `<li class="year"><h3>${y}</h3><span>${talks.filter((t) => t.date.startsWith(y)).length} ${u.talks}</span></li>
${talks.filter((t) => t.date.startsWith(y)).map(talkItem).join("\n")}`).join("\n");

  const seriesCards = data.series.map((s) => {
    const mine = talks.filter((t) => t.series === s.id);
    return `<li class="series">
  <p class="label">§1.${seriesNo.get(s.id)} · ${esc(u.count(mine.length))}</p>
  <h3>${esc(s.title[lang])}</h3>
  <p>${esc(s.summary[lang])}</p>
  <p class="events">${mine.map((t) => `<a href="#${esc(t.id)}">${esc(t.event)}</a>`).join("")}</p>
  ${s.source ? `<p class="src"><a href="${esc(s.source)}">${esc(u.source)}</a></p>` : ""}
</li>`;
  }).join("\n");

  const switcher = LANGS.map((l) => l === lang
    ? `<span aria-current="page">${l.toUpperCase()}</span>`
    : `<a href="${up}${UI[l].dir || "./"}" hreflang="${l}" lang="${l}">${l.toUpperCase()}</a>`).join("");
  const alternates = LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE}${UI[l].dir}">`).join("\n");
  const last = talks[0];
  const lastWeb = last.formats.find((f) => f.kind === "web");

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(u.title)}</title>
<meta name="description" content="${esc(u.description)}">
<meta name="theme-color" content="#FF5A1F">
<link rel="icon" href="${up}mark.svg" type="image/svg+xml">
<link rel="canonical" href="${SITE}${u.dir}">
${alternates}
<link rel="alternate" hreflang="x-default" href="${SITE}">
<link rel="stylesheet" href="${up}fonts/fonts.css">
<link rel="stylesheet" href="${up}site.css">
</head>
<body>
<div class="sheet">
<header class="bar">
  <a class="brand" href="https://manufacture.dev"><img src="${up}mark.svg" alt="" width="27" height="26">Manufacture</a>
  <nav class="toc" aria-label="${esc(u.nav)}"><a href="#series">§1 ${esc(u.seriesLabel)}</a><a href="#timeline">§2 ${esc(u.timelineLabel)}</a></nav>
  <p class="ref">MFG-TALKS/1.0</p>
  <nav class="lang" aria-label="${esc(u.switchLabel)}">${switcher}</nav>
</header>
<section class="hero">
  <div class="headline">
    <p class="kicker">${esc(u.kicker)}</p>
    <h1>Talks.</h1>
  </div>
  <aside class="latest" aria-label="${esc(u.latestLabel)}">
    <p class="label">${esc(u.latestLabel)} · ${esc(date(last.date, { day: "numeric", month: "long", year: "numeric" }))}</p>
    <p class="ev">${esc(last.event)}</p>
    <p class="tt" lang="${last.lang}">${esc(last.title)}</p>
    ${lastWeb ? `<a class="go" href="${esc(href(lastWeb.href))}">${esc(u.kinds.web)} <span aria-hidden="true">↘</span></a>` : ""}
  </aside>
  <p class="lead">${esc(u.lead)}</p>
</section>
<section id="series" aria-labelledby="series-h">
  <h2 id="series-h" class="section"><span>§1</span>${esc(u.seriesLabel)}</h2>
  <ul class="seriesl">
${seriesCards}
  </ul>
</section>
<section id="timeline" aria-labelledby="timeline-h">
  <h2 id="timeline-h" class="section"><span>§2</span>${esc(u.timelineLabel)}</h2>
  <ol class="timeline">
${timeline}
  </ol>
</section>
<footer class="foot"><p><a href="https://manufacture.dev">manufacture.dev</a></p></footer>
</div>
<script>
document.addEventListener("click", async (e) => {
  const b = e.target.closest("button[data-link]");
  if (!b) return;
  const out = b.nextElementSibling, link = b.dataset.link;
  try { await navigator.clipboard.writeText(link); out.textContent = ${JSON.stringify(u.copied)}; }
  catch { out.textContent = ${JSON.stringify(u.copyFallback)} + " : " + link; }
  clearTimeout(b._t); b._t = setTimeout(() => { out.textContent = ""; }, 4000);
});
</script>
</body>
</html>
`;
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
for (const lang of LANGS) {
  mkdirSync(join(DIST, UI[lang].dir), { recursive: true });
  writeFileSync(join(DIST, UI[lang].dir, "index.html"), page(lang));
}
for (const f of ["site.css", "mark.svg"]) cpSync(join(ROOT, f), join(DIST, f));
for (const dir of ["fonts", "decks", "downloads"]) if (existsSync(join(ROOT, dir))) cpSync(join(ROOT, dir), join(DIST, dir), { recursive: true });
writeFileSync(join(DIST, ".nojekyll"), "");
console.log(`dist/: ${talks.length} talks, ${data.series.length} series, ${LANGS.join(" + ")}`);
