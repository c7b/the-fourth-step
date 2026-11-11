#!/usr/bin/env bash
# Review a rendered shot: composite the PNG sequence over its field colour into an mp4 and a contact strip.
#   review.sh <shot-dir-name> [bg hex, default 040723] [every Nth frame for the strip, default 8]
set -euo pipefail
R="$(cd "$(dirname "$0")/../renders" && pwd)"
S="$1"; BG="${2:-040723}"; EVERY="${3:-8}"
D="$R/$S"; O="$R/_review"; mkdir -p "$O"
size=$(python3 -c "import json,glob; d=json.load(open(glob.glob('$D/*.json')[0])); print('%dx%d' % (d['width'], d['height']))")
ffmpeg -loglevel error -y -f lavfi -i "color=c=0x$BG:s=$size:r=30" -framerate 30 -i "$D/%04d.png" \
  -filter_complex "[0][1]overlay=shortest=1,format=yuv420p" -c:v libx264 -crf 18 "$O/$S.mp4"
n=$(ls "$D"/*.png | wc -l); cols=8; rows=$(( (n / EVERY + cols - 1) / cols ))
ffmpeg -loglevel error -y -f lavfi -i "color=c=0x$BG:s=$size:r=30" -framerate 30 -i "$D/%04d.png" \
  -filter_complex "[0][1]overlay=shortest=1,select='not(mod(n\,$EVERY))',scale=320:-1,tile=${cols}x${rows}" \
  -frames:v 1 -update 1 "$O/$S-strip.jpg"
echo "$O/$S.mp4"; echo "$O/$S-strip.jpg"
