#!/usr/bin/env bash
# Build one cPanel-ready zip per site: index.html sits at the top of each zip.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$root/dist"
for site in demo faq; do
  out="$root/dist/peyajflow-$site.zip"
  rm -f "$out"
  (cd "$root/$site" && zip -qr -X "$out" . -x 'README.md' -x '.*')
  echo "$out ($(du -h "$out" | cut -f1))"
done
