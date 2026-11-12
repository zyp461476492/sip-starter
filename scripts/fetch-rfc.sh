#!/usr/bin/env bash
# 抓取 RFC 原文到 sip/raw/rfc/ 或 media/raw/rfc/，并记录来源与校验和。
# 用法：scripts/fetch-rfc.sh 3261            → 抓 RFC 3261
#       scripts/fetch-rfc.sh 3550 media      → 抓到 media/raw/rfc/
set -euo pipefail

RFC="${1:?用法: scripts/fetch-rfc.sh <rfc编号> [sip|media]}"
TOPIC="${2:-sip}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/$TOPIC/raw/rfc"
OUT="$DIR/rfc$RFC.txt"
URL="https://www.rfc-editor.org/rfc/rfc$RFC.txt"

mkdir -p "$DIR"
if [[ -f "$OUT" ]]; then
  echo "已存在，跳过下载：$OUT"
else
  echo "GET $URL"
  curl -sS --compressed --retry 3 --retry-all-errors --max-time 90 \
    -A "Mozilla/5.0" "$URL" -o "$OUT"
fi

SHA="$(sha256sum "$OUT" | cut -d' ' -f1)"
LINES="$(wc -l < "$OUT")"
BYTES="$(wc -c < "$OUT")"
DATE="$(date +%F)"

MANIFEST="$DIR/MANIFEST.md"
if [[ ! -f "$MANIFEST" ]]; then
  printf '> 一句话：raw/rfc 下每个文件的来源与校验和。只追加，不修改既有条目。\n\n# MANIFEST\n\n| 文件 | URL | 抓取日期 | 字节 | 行数 | sha256 |\n|---|---|---|---|---|---|\n' > "$MANIFEST"
fi

if grep -q "| rfc$RFC.txt |" "$MANIFEST"; then
  echo "MANIFEST 已有 rfc$RFC.txt，跳过登记"
else
  printf '| rfc%s.txt | %s | %s | %s | %s | %s |\n' "$RFC" "$URL" "$DATE" "$BYTES" "$LINES" "$SHA" >> "$MANIFEST"
fi

echo "OK  $OUT"
echo "    sha256=$SHA  lines=$LINES"
