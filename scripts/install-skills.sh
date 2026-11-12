#!/usr/bin/env bash
# 把本仓 tools/skills/ 下的技能安装到用户全局技能目录（~/.pi/agent/skills/）。
# 用法：scripts/install-skills.sh [技能名...]     不带参数 = 全部
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/tools/skills"
DST="${PI_SKILLS_DIR:-$HOME/.pi/agent/skills}"

[[ -d "$SRC" ]] || { echo "没有 $SRC"; exit 1; }
mkdir -p "$DST"

if [[ $# -gt 0 ]]; then
  names=("$@")
else
  names=($(ls -1 "$SRC"))
fi

for n in "${names[@]}"; do
  [[ -d "$SRC/$n" ]] || { echo "跳过（不存在）：$n"; continue; }
  rm -rf "$DST/$n"
  cp -r "$SRC/$n" "$DST/$n"
  echo "✓ $n → $DST/$n"
done

echo
echo "装完在 pi 里执行 /reload 才会生效。"
