// Builds the talks timeline into dist/ from talks.json.
//   node scripts/build.mjs
// Each talk lists its formats (web deck, PDF, PPTX). A format is a local path (copied into dist/)
// or an absolute URL (another site, e.g. gastown-presentations), so any slide tool can feed the timeline.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const data = JSON.parse(readFileSync(join(ROOT, "talks.json"), "utf8"));

const KINDS = { web: "En ligne", pdf: "PDF", pptx: "PowerPoint" };
const LANGS = { fr: "FR", en: "EN" };
const series = new Map(data.series.map((s) => [s.id, s]));

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const isUrl = (h) => /^https?:\/\//.test(h);
const day = (d) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`)).replace(".", "");
const full = (d) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));
const size = (h) => { const mb = statSync(join(ROOT, h)).size / 1e6; return mb >= 1 ? `${Math.round(mb)} Mo` : `${Math.max(1, Math.round(mb * 1000))} Ko`; };

// check every talk before writing anything
const errors = [];
for (const t of data.talks) {
  if (!series.has(t.series)) errors.push(`${t.id}: unknown series ${t.series}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t.date)) errors.push(`${t.id}: bad date ${t.date}`);
  for (const f of t.formats) {
    if (!KINDS[f.kind]) errors.push(`${t.id}: unknown format ${f.kind}`);
    for (const h of [f.href, f.extra?.href].filter(Boolean))
      if (!isUrl(h) && !existsSync(join(ROOT, h))) errors.push(`${t.id}: missing file ${h}`);
  }
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }

const talks = [...data.talks].sort((a, b) => b.date.localeCompare(a.date));

function formatLink(f) {
  const local = !isUrl(f.href);
  const meta = [f.kind !== "web" && local ? size(f.href) : null].filter(Boolean).join(" · ");
  const attrs = f.kind === "web" ? "" : local ? " download" : "";
  const note = f.degraded ? `<span class="degraded">${esc(f.degraded)}</span>` : f.note ? `<span class="note">${esc(f.note)}</span>` : "";
  const extra = f.extra ? ` <a class="extra" href="${esc(f.extra.href)}" download>${esc(f.extra.label)}</a>` : "";
  return `<li class="fmt fmt-${f.kind}"><a class="btn${f.kind === "web" ? " primary" : ""}" href="${esc(f.href)}"${attrs}>${f.kind === "web" ? "▶ " : ""}${KINDS[f.kind]}${meta ? ` <small>${meta}</small>` : ""}</a>${note}${extra}</li>`;
}

function talkItem(t) {
  const s = series.get(t.series);
  const chips = [LANGS[t.lang] || t.lang, t.format].filter(Boolean).map((c) => `<span class="chip">${esc(c)}</span>`).join("");
  return `<li class="talk s-${esc(t.series)}" id="${esc(t.id)}">
  <div class="when"><time datetime="${t.date}">${day(t.date)}</time></div>
  <div class="dot" aria-hidden="true"></div>
  <article>
    <p class="eyebrow">${esc(s.short || s.id)} ${chips}</p>
    <h3>${esc(t.event)}</h3>
    <p class="title">${esc(t.title || s.title)}</p>
    <p class="meta">${esc(full(t.date))} · ${esc(t.speakers.join(" & "))}</p>
    <ul class="formats">${t.formats.map(formatLink).join("")}</ul>
  </article>
</li>`;
}

const years = [...new Set(talks.map((t) => t.date.slice(0, 4)))];
const timeline = years.map((y) => `<section class="year"><h2>${y}</h2><ul class="timeline">
${talks.filter((t) => t.date.startsWith(y)).map(talkItem).join("\n")}
</ul></section>`).join("\n");

const seriesCards = data.series.map((s) => {
  const mine = talks.filter((t) => t.series === s.id);
  const n = mine.length;
  return `<li class="series s-${esc(s.id)}">
  <p class="eyebrow">${esc(s.short || s.id)} · ${n} talk${n > 1 ? "s" : ""}</p>
  <h3>${esc(s.title)}</h3>
  <p>${esc(s.summary)}</p>
  <p class="events">${mine.map((t) => `<a href="#${esc(t.id)}">${esc(t.event)}</a>`).join(" · ")}</p>
  ${s.source ? `<p class="src"><a href="${esc(s.source)}">sources de la série ↗</a></p>` : ""}
</li>`;
}).join("\n");

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Talks · Manufacture</title>
<meta name="description" content="Les présentations de Manufacture, par date : à lire en ligne, en PDF ou en PowerPoint.">
<link rel="stylesheet" href="fonts/fonts.css">
<style>
:root{--bg:#0A0B0D;--panel:#0F1114;--line:#1E2127;--line2:#262A31;--text:#ECEDEE;--soft:#B4BAC2;--mute:#9AA1AB;--accent:#FF7A4D;--accent2:#FF9B7A;--green:#C9F27A;
  --mono:'Geist Mono','Courier New',monospace;--sans:'Geist',system-ui,sans-serif;color-scheme:dark}
*{box-sizing:border-box;margin:0}
body{background:var(--bg);color:var(--text);font:400 17px/1.55 var(--sans);-webkit-font-smoothing:antialiased}
a{color:inherit}
main{max-width:980px;margin:0 auto;padding:88px 32px 120px}
.eyebrow{font:500 13px/1.4 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--mute);display:flex;flex-wrap:wrap;gap:10px;align-items:center}
header .eyebrow{color:var(--accent)}
h1{font:600 clamp(56px,10vw,104px)/1 var(--sans);letter-spacing:-.03em;margin:20px 0 24px}
.lead{font-size:clamp(19px,2.4vw,24px);color:var(--soft);max-width:44ch}
.rule{height:2px;width:120px;background:var(--accent);margin:48px 0 0}
.seriesl{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin:56px 0 0}
.series{background:var(--panel);border:1px solid var(--line);border-top:3px solid var(--accent);border-radius:14px;padding:24px 26px;display:flex;flex-direction:column;gap:10px}
.series.s-gastown{border-top-color:var(--green)}
.series h3{font:600 22px/1.25 var(--sans);letter-spacing:-.01em}
.series p{color:var(--soft);font-size:16px}
.series .events{font:400 14px/1.6 var(--mono);color:var(--mute)}
.series .events a,.src a{text-decoration:none;border-bottom:1px solid var(--line2)}
.series .events a:hover,.src a:hover{color:var(--accent);border-color:var(--accent)}
.src{font:400 14px var(--mono)}
.year{margin-top:80px}
.year h2{font:600 15px var(--mono);letter-spacing:.12em;color:var(--accent);margin-bottom:28px}
.timeline{list-style:none;padding:0;position:relative}
.timeline::before{content:"";position:absolute;left:111px;top:10px;bottom:10px;width:1px;background:var(--line2)}
.talk{display:grid;grid-template-columns:88px 46px minmax(0,1fr);align-items:start;margin-bottom:44px}
.when{text-align:right;font:500 15px/1.4 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--soft);padding-top:3px}
.dot{width:13px;height:13px;border-radius:999px;background:var(--accent);margin:6px auto 0;position:relative;z-index:1;box-shadow:0 0 0 6px var(--bg)}
.s-gastown .dot{background:var(--green)}
.s-gastown .eyebrow{color:var(--mute)}
.chip{font:500 12px var(--mono);letter-spacing:.08em;color:var(--text);border:1px solid var(--line2);border-radius:6px;padding:1px 7px}
article h3{font:600 clamp(24px,3.4vw,30px)/1.2 var(--sans);letter-spacing:-.015em;margin:8px 0 4px}
.title{color:var(--soft);font-size:18px}
.meta{color:var(--mute);font-size:15px;margin-top:4px}
.formats{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:12px 16px;margin-top:18px;align-items:flex-start}
.fmt{display:flex;flex-direction:column;gap:6px;max-width:260px}
.btn{display:inline-flex;align-items:baseline;gap:8px;min-height:44px;padding:11px 18px;border:1px solid var(--line2);border-radius:999px;font:600 15px var(--sans);text-decoration:none;background:var(--panel);transition:border-color .2s,color .2s}
.btn small{font:400 13px var(--mono);color:var(--mute)}
.btn:hover,.btn:focus-visible{border-color:var(--accent);color:var(--accent2);outline:none}
.btn.primary{background:var(--accent);border-color:var(--accent);color:var(--bg)}
.btn.primary:hover,.btn.primary:focus-visible{background:var(--accent2);border-color:var(--accent2);color:var(--bg)}
.s-gastown .btn.primary{background:transparent;color:var(--green);border-color:var(--green)}
.s-gastown .btn.primary:hover{background:var(--green);color:var(--bg)}
.note,.degraded{font:400 13px/1.45 var(--mono);color:var(--mute);padding-left:18px}
.degraded{color:var(--accent2)}
.degraded::before{content:"⚠ "}
.extra{font:400 13px var(--mono);color:var(--soft);padding-left:18px}
.extra:hover{color:var(--accent)}
footer{margin-top:96px;padding-top:28px;border-top:1px solid var(--line);color:var(--mute);font:400 14px/1.6 var(--mono)}
footer a{color:var(--soft)}
@media (max-width:640px){
  main{padding:56px 16px 80px}
  .timeline::before{left:5px}
  .talk{grid-template-columns:12px minmax(0,1fr);column-gap:18px}
  .when{grid-column:2;grid-row:1;text-align:left;padding:0}
  .dot{grid-column:1;grid-row:1 / span 2;margin:5px 0 0}
  article{grid-column:2}
  .fmt{max-width:none;width:100%}
}
</style>
</head>
<body>
<main>
<header>
  <p class="eyebrow">manufacture · talks</p>
  <h1>Talks</h1>
  <p class="lead">Les présentations, de la plus récente à la plus ancienne. À lire en ligne, en PDF ou en PowerPoint.</p>
  <div class="rule"></div>
</header>
<ul class="seriesl">
${seriesCards}
</ul>
${timeline}
<footer>Les decks en ligne se pilotent au clavier : → ou espace pour avancer, f pour le plein écran.<br>
<a href="https://manufacture.dev">manufacture.dev</a> · <a href="https://github.com/manufacture-dev/talks">sources</a></footer>
</main>
</body>
</html>
`;

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
writeFileSync(join(DIST, "index.html"), html);
for (const dir of ["fonts", "decks", "downloads"]) if (existsSync(join(ROOT, dir))) cpSync(join(ROOT, dir), join(DIST, dir), { recursive: true });
writeFileSync(join(DIST, ".nojekyll"), "");
console.log(`dist/: ${talks.length} talks, ${data.series.length} series`);
