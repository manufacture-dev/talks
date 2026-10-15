#!/usr/bin/env bash
# Rebuilds the Gas Town talks from a clean checkout of manufacture-dev/gastown-presentations and copies
# them into this repo (decks/gastown/<route>/ and downloads/). The QR codes and the « open the
# presentation » links are regenerated to point at manufacture.dev/talks, and the speaker notes are
# dropped (they are preparation notes, not meant for the public); the checkout is restored after.
#   scripts/import-gastown.sh ../gastown-presentations
set -euo pipefail

SRC=$(cd "$1" && pwd)
DEST=$(cd "$(dirname "$0")/.." && pwd)
BASE=https://manufacture.dev/talks/decks/gastown/

cd "$SRC"
git diff --quiet || { echo "$SRC has local changes: commit or stash them first" >&2; exit 1; }
trap 'git -C "$SRC" checkout -- lib/presentation-links.mjs public/images/talk-qrs slides.md' EXIT
sed -i.bak "s#^export const PUBLIC_PRESENTATIONS_BASE_URL = .*#export const PUBLIC_PRESENTATIONS_BASE_URL = '$BASE'#" lib/presentation-links.mjs
rm lib/presentation-links.mjs.bak
grep -q "$BASE" lib/presentation-links.mjs
perl -0pi -e 's/<!--.*?-->\n?//gs' slides.md   # Slidev speaker notes
! grep -q "<!--" slides.md

npm ci
npx playwright install chromium
npm run generate:talk-qrs
npm run build:all

mkdir -p "$DEST/decks/gastown" "$DEST/downloads"
for f in talks/*.json; do
  route=$(node -p "require('./$f').route")
  rm -rf "$DEST/decks/gastown/$route"
  cp -R "dist/$route" "$DEST/decks/gastown/$route"
  echo "decks/gastown/$route"
done
cp dist/downloads/* "$DEST/downloads/"
echo "gastown-presentations $(git rev-parse --short HEAD) -> $DEST: review, commit and push there"
