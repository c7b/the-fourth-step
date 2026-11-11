#!/usr/bin/env bash
# Render every 3D shot the film and the Shorts use into renders/<shot>/, then rebuild renders-index.js.
#   bash blender/render-all.sh [shot-id-part ...]       e.g.  bash blender/render-all.sh L01 L19b
# Env: BLENDER=/path/to/blender (Blender 5.2), FOURTH_STEP_GPU=OPTIX|CUDA|METAL|HIP|CPU, EXTRA="--preview 1" for
# half-size drafts (renders/<shot>@960/). Frames that already exist are skipped, so a stopped run resumes.
# Cycles on a GPU: plan on hours for the whole list (L14b_tower_orbit alone is ~2,000 frames).
set -euo pipefail
cd "$(dirname "$0")/.."
BL="${BLENDER:-blender}"
export RENDERS_DIR=renders
jobs=(
  "shots_cube.py --shot L01_cube_jump"
  "shots_cube.py --shot L02_cube_idle_ink"
  "shots_cube.py --shot L03_cube_idle_white"
  "shots_cube.py --shot L12_cube_to_monero"
  "shots_cube.py --shot L17_monero_block_idle"
  "shots_ring.py --shot L11a_ring_form"
  "shots_ring.py --shot L11b_ring_loop"
  "shots_ring.py --shot L11b_ring_loop_alpha"
  "shots_ring.py --shot L11b_ring_loop_alpha --refl 1"
  "shots_ring.py --shot S01_ring_v_form"
  "shots_ring.py --shot S01_ring_v_loop"
  "shots_dark.py --shot L14a_tower_build"
  "shots_dark.py --shot L14b_tower_orbit"
  "shots_dark.py --shot L16_template_idle"
  "shots_dark.py --shot L13_glass_note"
  "shots_dark.py --shot L13_glass_note_hold"
  "shots_dark.py --shot L18_view_key"
  "shots_white.py --shot L04_coin_roll"
  "shots_white.py --shot L05_bank_in"
  "shots_white.py --shot L05_bank_out"
  "shots_white.py --shot L06_steel_cube_white"
  "shots_white.py --shot L09_module_idle"
  "shots_white.py --shot L10_module_coin"
  "shots_white.py --shot L08_app_exchange"
  "shots_white.py --shot L08_app_loan"
  "shots_white.py --shot L08_app_game"
  "shots_white.py --shot L08_app_savings"
  "shots_plate.py --shot L19a_plate_wall"
  "shots_plate.py --shot L20_ledger_wall_engraved"
  "shots_plate.py --shot L19b_plate_dark --tex plate-blank"
  "shots_plate.py --shot L19b_plate_dark --tex plate-statement"
  "shots_plate.py --shot L19b_plate_dark --tex plate-values-hidden"
  "shots_plate.py --shot L19b_plate_dark --tex plate-all-hidden"
  "shots_validators.py --shot L21_validator_teams"
  "shots_stage.py --shot L22a_stage_lime_idle"
  "shots_stage.py --shot L22b_stage_steel_idle"
  "shots_stage.py --shot L22c_stage_bank_in"
  "shots_stage.py --shot L22c_stage_bank_out"
  "shots_stage.py --shot L22d_stage_coin"
)
for job in "${jobs[@]}"; do
  if [ $# -gt 0 ]; then
    hit=0; for want in "$@"; do [[ "$job" == *"$want"* ]] && hit=1; done
    [ "$hit" = 1 ] || continue
  fi
  read -r -a a <<< "$job"
  echo "== $job"
  # shellcheck disable=SC2086
  "$BL" -b -P "blender/${a[0]}" -- "${a[@]:1}" ${EXTRA:-}
done
node tools/renders-index.mjs
