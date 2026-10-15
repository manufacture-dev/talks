// Link-preview images (Open Graph, 1200×630) for the timeline and for each talk, in both page languages,
// plus the touch icon. Run after changing talks.json or the page style, then commit og/:
//   node scripts/og.mjs
// Uses the local Chrome in headless mode (CHROME=… to point elsewhere).
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "og");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const data = JSON.parse(readFileSync(join(ROOT, "talks.json"), "utf8"));
const series = new Map(data.series.map((s) => [s.id, s]));
const mark = readFileSync(join(ROOT, "mark.svg"), "utf8");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const T = {
  fr: { locale: "fr-FR", audience: { public: "public", internal: "interne" }, talks: "talks", series: "séries",
        lead: "Conférences, meetups, interventions en entreprise. À lire en ligne, en PDF ou en PowerPoint." },
  en: { locale: "en-GB", audience: { public: "public", internal: "internal" }, talks: "talks", series: "series",
        lead: "Conferences, meetups, in-house talks. Read them online, as PDF or PowerPoint." },
};
const date = (lang, d) => new Intl.DateTimeFormat(T[lang].locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));

const fonts = `file://${join(ROOT, "fonts", "fonts.css")}`;
const frame = (body) => `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${fonts}"><style>
*{margin:0;box-sizing:border-box}
html,body{width:1200px;height:630px;background:#FF5A1F;color:#120B06;font-family:'Hanken Grotesk',sans-serif;overflow:hidden}
.sheet{position:absolute;inset:28px;border:2px solid #120B06;display:grid;grid-template-rows:84px 1fr 72px}
.bar{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #120B06;padding:0 32px}
.brand{display:flex;align-items:center;gap:16px;font-weight:900;font-size:30px;letter-spacing:-.01em}
.brand svg{height:40px;width:auto}
.mono{font-family:'Red Hat Mono',monospace;font-weight:600;font-size:22px;letter-spacing:.08em;text-transform:uppercase}
.main{padding:28px 36px 24px;display:flex;flex-direction:column;justify-content:flex-end;gap:16px;overflow:hidden}
h1{font-weight:900;letter-spacing:-.045em;line-height:.92}
.sub{font-size:34px;font-weight:600;line-height:1.2}
.foot{border-top:2px solid #120B06;display:flex;align-items:center;gap:20px;padding:0 32px;background:#120B06;color:#FFE9DE}
.foot b{color:#FF5A1F;font-weight:600}
.badge{border:2px solid #120B06;border-radius:999px;padding:6px 16px;font-size:20px}
</style></head><body><div class="sheet">${body}</div></body></html>`;

const bar = (right) => `<div class="bar"><div class="brand">${mark}Manufacture</div><span class="mono">${right}</span></div>`;

const pages = [];
for (const lang of Object.keys(T)) {
  const t = T[lang];
  pages.push({ file: `${lang}/index.png`, html: frame(`${bar("manufacture.dev/talks")}
    <div class="main"><h1 style="font-size:230px">Talks.</h1><p class="sub" style="font-size:30px;max-width:900px">${esc(t.lead)}</p></div>
    <div class="foot mono"><b>${data.talks.length}</b> ${t.talks} · <b>${data.series.length}</b> ${t.series}</div>`) });
  for (const talk of data.talks) {
    const s = series.get(talk.series);
    const size = talk.event.length > 22 ? 96 : 120;
    pages.push({ file: `${lang}/${talk.id}.png`, html: frame(`${bar(esc(s.title[lang]))}
      <div class="main"><p><span class="badge mono">${esc(t.audience[talk.audience])}</span></p>
      <h1 style="font-size:${size}px">${esc(talk.event)}</h1><p class="sub">${esc(talk.title)}</p></div>
      <div class="foot mono"><b>${esc(date(lang, talk.date))}</b> · ${esc(talk.speakers.join(" & "))}</div>`) });
  }
}
// touch icon: the mark on the orange ground
pages.push({ file: "apple-touch-icon.png", size: [180, 180], html: `<!doctype html><html><head><style>*{margin:0}html,body{width:180px;height:180px;background:#FF5A1F;display:grid;place-items:center}svg{width:112px;height:auto}</style></head><body>${mark}</body></html>` });

const tmp = mkdtempSync(join(tmpdir(), "og-"));
try {
  for (const p of pages) {
    const src = join(tmp, "page.html"), dest = join(OUT, p.file);
    writeFileSync(src, p.html);
    mkdirSync(dirname(dest), { recursive: true });
    const [w, h] = p.size || [1200, 630];
    const r = spawnSync(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--user-data-dir=${join(tmp, "profile")}`,
      "--allow-file-access-from-files", `--window-size=${w},${h}`, "--virtual-time-budget=3000", `--screenshot=${dest}`, `file://${src}`], { stdio: "ignore" });
    if (r.status !== 0) throw new Error(`chrome failed on ${p.file}`);
    console.log(`og/${p.file}`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
