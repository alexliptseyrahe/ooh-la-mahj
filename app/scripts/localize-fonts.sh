#!/usr/bin/env bash
# Downloads Cormorant Garamond + Jost as .woff2 into www/fonts and rewrites
# www/index.html to use them locally, so the app needs no internet for fonts.
# Run once on the Mac:  npm run fonts
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p www/fonts

UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

fetch_family () {           # $1 = css2 query   $2 = filename prefix
  local css
  css=$(curl -sL -A "$UA" "https://fonts.googleapis.com/css2?family=$1&display=swap")
  local i=0
  while read -r url; do
    i=$((i+1))
    curl -sL -A "$UA" "$url" -o "www/fonts/$2-$i.woff2"
  done < <(printf '%s' "$css" | grep -o "https://fonts.gstatic.com[^)]*\.woff2" | sort -u)
  printf '%s' "$css"
}

echo "→ fetching Cormorant Garamond…"
CSS1=$(fetch_family "Cormorant+Garamond:wght@500;600;700" "cormorant")
echo "→ fetching Jost…"
CSS2=$(fetch_family "Jost:wght@400;500;600" "jost")

# Build @font-face rules that point at the downloaded files.
{
  echo "<style>"
  n=1
  for f in www/fonts/cormorant-*.woff2; do
    [ -e "$f" ] || continue
    echo "@font-face{font-family:'Cormorant Garamond';font-style:normal;font-weight:400 700;font-display:swap;src:url('fonts/$(basename "$f")') format('woff2')}"
    n=$((n+1))
  done
  for f in www/fonts/jost-*.woff2; do
    [ -e "$f" ] || continue
    echo "@font-face{font-family:'Jost';font-style:normal;font-weight:300 700;font-display:swap;src:url('fonts/$(basename "$f")') format('woff2')}"
  done
  echo "</style>"
} > /tmp/olm-fontface.html

python3 - <<'PY'
import re, pathlib
p = pathlib.Path('www/index.html')
html = p.read_text()
face = pathlib.Path('/tmp/olm-fontface.html').read_text()
# strip the three Google Fonts <link> tags
html = re.sub(r'\s*<link rel="preconnect" href="https://fonts\.(googleapis|gstatic)\.com"[^>]*>', '', html)
html = re.sub(r'\s*<link href="https://fonts\.googleapis\.com/css2[^>]*>', '\n' + face.strip(), html, count=1)
p.write_text(html)
print('✓ index.html now uses local fonts')
PY

echo "✓ done — $(ls www/fonts | wc -l | tr -d ' ') font files in www/fonts"
