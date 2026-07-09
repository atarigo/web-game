# OOXX Art Animation Plan

This plan is the source of truth for the new mobile 2D fantasy art pipeline. It keeps sprite size, animation timing, anchors, final asset paths, and weapon-swap rules consistent before frame production starts.

## Storage Rules

- Do not modify `src/routes/game/survival-loop` or `src/lib/assets/survival-loop`.
- Animation testing lives in `src/routes/demo/ooxx`.
- Reviewed final runtime assets live under `static/demo/ooxx/final`.
- Temporary generation outputs must stay outside the final folders, for example `_work/ooxx-art/...` or `$CODEX_HOME/generated_images/...`.
- Only approved final PNGs, sprite sheets, atlases, and metadata should be copied into `static/demo/ooxx/final`.
- Source review format is transparent PNG per frame. Final runtime format can later be converted to atlas WebP/PNG plus metadata.

## Client Loading Recommendation

During art review, use separate transparent PNG files because they are easier to inspect, replace, and approve.

For production, pack approved frames into sprite atlases:

- one atlas per character + weapon + direction group, or
- one atlas per character + weapon for all directions, if the atlas remains below the mobile texture budget.

The client should consume atlas metadata instead of hard-coded frame positions. This keeps weapon swaps and future compression changes from affecting gameplay code.

## Character Frame Contract

| Field                   |                              Value |
| ----------------------- | ---------------------------------: |
| Frame canvas            |                     `256 x 256 px` |
| Character visual height |                       `150-170 px` |
| Anchor                  |                       `[128, 220]` |
| Foot baseline           |                       `y = 220 px` |
| Center line             |                       `x = 128 px` |
| Minimum top padding     |                            `16 px` |
| Minimum weapon padding  |                            `12 px` |
| Style scale             |                   `4-5 heads tall` |
| Format                  |                    transparent PNG |
| Review directions       | `down`, then `left`, `right`, `up` |

All frames in a character animation must keep the same canvas size and anchor. Do not crop tightly around individual poses.

## Bear Frame Contract

| Field              |           Value |
| ------------------ | --------------: |
| Frame canvas       |  `320 x 256 px` |
| Bear visual height |    `140-170 px` |
| Anchor             |    `[160, 220]` |
| Foot baseline      |    `y = 220 px` |
| Center line        |    `x = 160 px` |
| Format             | transparent PNG |

## Character Animation Set

First production pass should finish the required actions before optional actions.

| Action       | Priority | Frames | Duration per frame                               | Hit frame |
| ------------ | -------: | -----: | ------------------------------------------------ | --------: |
| `idle`       | required |      4 | `0.18, 0.18, 0.22, 0.18`                         |      none |
| `walk`       | required |      6 | `0.10`                                           |      none |
| `attack_1`   | required |      6 | `0.07, 0.07, 0.06, 0.06, 0.08, 0.12`             |         3 |
| `hit`        | required |      3 | `0.08, 0.08, 0.12`                               |      none |
| `death`      | required |      8 | `0.10, 0.10, 0.10, 0.12, 0.12, 0.15, 0.18, hold` |      none |
| `run`        | optional |      6 | `0.075`                                          |      none |
| `attack_2`   | optional |      8 | `0.06, 0.06, 0.06, 0.05, 0.05, 0.07, 0.08, 0.12` |         4 |
| `skill_cast` | optional |      6 | `0.08`                                           |      none |
| `dodge`      | optional |      4 | `0.06`                                           |      none |
| `victory`    | optional |      6 | `0.12`                                           |      none |

## Bear Animation Set

| Action        | Priority | Frames | Duration per frame                               | Hit frame |
| ------------- | -------: | -----: | ------------------------------------------------ | --------: |
| `idle`        | required |      4 | `0.20`                                           |      none |
| `walk`        | required |      6 | `0.11`                                           |      none |
| `attack_claw` | required |      6 | `0.08, 0.07, 0.06, 0.07, 0.09, 0.14`             |         3 |
| `hit`         | required |      3 | `0.08`                                           |      none |
| `death`       | required |      8 | `0.10, 0.10, 0.10, 0.12, 0.12, 0.15, 0.18, hold` |      none |
| `roar`        | optional |      6 | `0.10`                                           |      none |

## Naming

Use lowercase identifiers and zero-padded frame indices:

```text
static/demo/ooxx/final/characters/male/axe/male_axe_idle_down_000.png
static/demo/ooxx/final/characters/male/axe/male_axe_idle_down_001.png
static/demo/ooxx/final/characters/female/axe/female_axe_attack_1_down_003.png
static/demo/ooxx/final/creatures/bear/bear_attack_claw_down_003.png
```

Final atlas names should include the same identity keys:

```text
male_axe_down.atlas.png
male_axe_down.atlas.json
female_axe_down.atlas.png
female_axe_down.atlas.json
bear_down.atlas.png
bear_down.atlas.json
```

## Weapon Swaps

The first implementation should use full-frame redraws per weapon:

- same frame canvas
- same anchor
- same action names
- same direction names
- same frame counts
- same frame durations
- same hit frames

This is more expensive than layering weapons, but it avoids hand/weapon occlusion problems for large two-handed weapons. A layered weapon system can be revisited after the base animation set is stable.

Example:

```text
male_axe_attack_1_down_003.png
male_sword_attack_1_down_003.png
male_spear_attack_1_down_003.png
```

The game code should switch the asset identity, not the animation contract.

## Background Layer Contract

The first test scene should be `forest-edge`.

| Layer           |          Size | Alpha | Purpose                               |
| --------------- | ------------: | ----- | ------------------------------------- |
| `sky`           | `2048 x 1152` | no    | sky, far color, distant mountains     |
| `far`           | `2048 x 1152` | yes   | distant trees, village hints, ruins   |
| `mid`           | `2048 x 1152` | yes   | mid-ground trees, rocks, large plants |
| `ground_base`   | `2048 x 1152` | no    | playable ground and path              |
| `ground_detail` | `2048 x 1152` | yes   | grass tufts, stones, dirt details     |
| `foreground`    | `2048 x 1152` | yes   | front leaves and occluding grass      |
| `collision`     |      metadata | n/a   | blocked areas                         |
| `spawns`        |      metadata | n/a   | player and enemy spawn points         |

Layer files:

```text
static/demo/ooxx/final/backgrounds/forest-edge/forest_edge_sky.png
static/demo/ooxx/final/backgrounds/forest-edge/forest_edge_far.png
static/demo/ooxx/final/backgrounds/forest-edge/forest_edge_mid.png
static/demo/ooxx/final/backgrounds/forest-edge/forest_edge_ground_base.png
static/demo/ooxx/final/backgrounds/forest-edge/forest_edge_ground_detail.png
static/demo/ooxx/final/backgrounds/forest-edge/forest_edge_foreground.png
static/demo/ooxx/final/backgrounds/forest-edge/forest_edge.scene.json
```

## First Review Batch

To control scope, the first generated animation batch should be down-facing only:

| Asset      | Actions                                      |
| ---------- | -------------------------------------------- |
| male axe   | `idle_down`, `walk_down`, `attack_1_down`    |
| female axe | `idle_down`, `walk_down`, `attack_1_down`    |
| bear       | `idle_down`, `walk_down`, `attack_claw_down` |
| background | `forest-edge` six visual layers              |

After this batch is approved in `/demo/ooxx`, expand to the remaining directions and required actions.
