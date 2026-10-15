# Talks

Timeline of Manufacture talks, published at https://manufacture.dev/talks/ (French) and https://manufacture.dev/talks/en/ (English).

Talks given by Manufacture at conferences, meetups and in companies. Each talk can be read online, as a PDF or as a PowerPoint. The site shows them newest first, grouped in series, with the event, the date, the language and the audience (public or internal).

## Agentic workflow evaluation

Measuring what a skill or an agentic workflow really changes on a real use case, and testing the evaluator before trusting it.

| Date | Event | Audience | Talk |
|---|---|---|---|
| 13 October 2026 | BNP Paribas COE Devops | internal | [Nos workflows agentiques s'améliorent-ils vraiment ?](https://manufacture.dev/talks/decks/agentic-workflow-evaluation/bnp-coe-devops-2026.html) |
| 12 October 2026 | Dev With AI 2026 | public | [Nos workflows agentiques s'améliorent-ils vraiment ?](https://manufacture.dev/talks/decks/agentic-workflow-evaluation/dev-with-ai-2026.html) |

## Gas Town

Organizing AI-native software delivery with Gas Town, live on Agreement Hub.

| Date | Event | Audience | Talk |
|---|---|---|---|
| 22 September 2026 | Agile En Seine & IA 2026 (workshop) | public | [Organiser le delivery logiciel AI-native avec Gas Town](https://manufacture.dev/talks/decks/gastown/agile-en-seine-2026/) |
| 10 July 2026 | SACEM · Matinale DSI | internal | [Organiser le delivery logiciel AI-native avec Gas Town](https://manufacture.dev/talks/decks/gastown/sacem-matinale-dsi/) |
| 12 June 2026 | Dev With AI Live #4 | public | [Organiser le delivery logiciel AI-native avec Gas Town](https://manufacture.dev/talks/decks/gastown/dev-with-ai-live-4/) |
| 21 May 2026 | DiliTrust TechDay | internal | [Organizing AI-native software delivery with Gas Town](https://manufacture.dev/talks/decks/gastown/dilitrust-techday/) |

## Add a talk

1. Copy its files into `decks/<series>/` (web deck) and `downloads/` (`<talk id>.<lang>.<ext>`).
2. Add it to `talks.json`:
   - `id`, `series`, `date` (YYYY-MM-DD), `event`, `title` (in the talk's language), `lang`, `speakers`;
   - `audience`: `public` or `internal`, shown as a badge next to the event;
   - optional `format`: `workshop`;
   - `formats`: a `kind` (`web`, `pdf` or `pptx`) and an `href` (a path here or an absolute URL).
3. A format that loses something compared to the live deck gets a `degraded` key, shown as a warning. Other remarks go in `note`. Both refer to texts in `scripts/build.mjs` (`UI.<lang>.notes`), so every page language has its own wording.
4. A new series goes in `series`, with `title` and `summary` in each language.

## Build

```
node scripts/build.mjs
```

The build checks every series, talk, text key and local file, then writes `dist/` (French at the root, English in `dist/en/`). The page style is in `site.css`: the « Protocole » (Q) direction of the Manufacture design exploration, with a safety-orange ground, ink rules, §-numbered sections, Hanken Grotesk and Red Hat Mono (self-hosted in `fonts/`). On every push to `main`, GitHub Actions builds `dist/` and deploys it to GitHub Pages.

Fonts: Hanken Grotesk and Red Hat Mono for the page, Geist and Geist Mono in the measurement decks, all under the SIL Open Font License 1.1.
