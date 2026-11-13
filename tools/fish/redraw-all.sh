#!/bin/sh
# Redraw every fish after a rule change, e.g. Ken's template averages pasted into tools/fish-format/templates.json (Ken, 2 Nov:
# "how am I going to know that you'll push those changes to be updated on the printable version and the digital version for the
# devotional and English and every other language"). One command, everything in order:
#   the 153 and designs, the 623 plan fish (the 365 too), the 24 in the other languages, every built-in copy, the Go Fish net,
#   the daily catch, the email pictures of every fish that changed, and the print files of every run.
# Needs OPENTYPE, HOBO, HARFBUZZ (see tools/fish-format/README.md).
set -e
cd "$(dirname "$0")/../.."
node tools/fish/pull-rule.mjs || true   # the rule tool's saved settings (/edit/rule/)
( cd tools/fish-format && node build.js && node build.js daily-lines.json && node build.js extra-lines.json && node build-lang.js )
python3 tools/fish/sync.py
python3 tools/fish/net.py
python3 tools/fish/catch.py
for f in $(git status --short -- 'fish/*.svg' | awk '{print $2}'); do rm -f "w/img/$(basename "$f" .svg | tr A-Z a-z).png"; done
node tools/fish/catch-img.mjs && /usr/bin/python3 tools/fish/catch-img.py
node tools/print/make.mjs --all
python3 tools/fish/in-verse.py --check
