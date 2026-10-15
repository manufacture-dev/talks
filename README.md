# Talks

Timeline of Manufacture talks, published at https://manufacture.dev/talks/.

The site is an umbrella: each talk lists its formats (web deck, PDF, PowerPoint), whatever tool produced the slides. A format is either a file in this repository or a link to another site, such as [gastown-presentations](https://github.com/manufacture-dev/gastown-presentations), which stays the source of the Gas Town talks.

## Add a talk

1. Add the talk to `talks.json`: `id`, `series`, `date` (YYYY-MM-DD), `event`, `audience` (`public` or `interne`, shown as a badge next to the event), `lang`, `speakers` and `formats`.
2. Each format has a `kind` (`web`, `pdf` or `pptx`) and an `href`: a path in this repository or an absolute URL.
3. A format that loses something compared to the live deck gets a `degraded` text, shown as a warning (for example `"Sans vidéos ni animations"` for a PDF of a deck with clips). Other remarks go in `note`.
4. A new series goes in `series` with an `id`, a `short` name, a `title` and a `summary`.

Files committed here:

- `decks/<series>/`: self-contained HTML decks with their `assets/` and `fonts/`.
- `downloads/`: PDF and PowerPoint files, named `<talk id>.<lang>.<ext>`.

## Build

```
node scripts/build.mjs
npx serve dist
```

The build checks that every series exists and every local file is present, then writes `dist/`. On every push to `main`, GitHub Actions builds `dist/` and deploys it to GitHub Pages.

## Measurement talks

The « Nos workflows agentiques s'améliorent-ils vraiment ? » decks are produced elsewhere and copied here as finished files:

- the web deck is the offline kit (`deck.html`, `assets/`, `fonts/`), with no speaker notes;
- the PowerPoint keeps the speaker notes and embeds the three clips. It uses Geist and Geist Mono, available in `downloads/polices-geist.zip`;
- the PDF shows every slide in its final state, with each clip replaced by its poster.

Fonts: Geist and Geist Mono, SIL Open Font License 1.1.
