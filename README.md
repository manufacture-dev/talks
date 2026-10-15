# Talks

Timeline of Manufacture talks, published at https://manufacture.dev/talks/ (French) and https://manufacture.dev/talks/en/ (English).

This repository is an aggregator. Each deck is made in its own repository, with whatever tool suits it, and only its finished public files are copied here: the web deck, the PDF and the PowerPoint. Everything is served from manufacture.dev/talks, so a visitor never leaves the site.

| Series | Source | Import |
|---|---|---|
| Agentic workflow evaluation | manufacture-dev/agentic-workflow-evaluation-presentations (private) | `python3 offline/publish.py ../talks`, run from the source repo |
| Gas Town | [manufacture-dev/gastown-presentations](https://github.com/manufacture-dev/gastown-presentations) | `scripts/import-gastown.sh ../gastown-presentations` |

The Gas Town import rebuilds the talks with their QR codes and « open the presentation » links pointing at manufacture.dev/talks. The gastown-presentations site keeps its own URLs.

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

The build checks every series, talk, text key and local file, then writes `dist/` (French at the root, English in `dist/en/`). The page style is in `site.css`. On every push to `main`, GitHub Actions builds `dist/` and deploys it to GitHub Pages.

Fonts: Geist and Geist Mono, SIL Open Font License 1.1.
