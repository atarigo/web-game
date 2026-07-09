# Coco Island 素材委託單（第一批）【已作廢，勿執行】

> 2026-07-02 作廢。本單生成的素材已封存於 `_work/archive/coco-island-tropical-v1/`。
> 現行委託單：[forest-camp-art-order.md](forest-camp-art-order.md)。

這是一份自足的工作文件。執行者（AI 作圖）只需要這份文件即可完成全部工作，不需要其他說明。
目標遊戲的規格見 [../coco-island.md](../coco-island.md)，只作背景參考，本文件的規格為準。

## 0. 全域規則（開工前必讀）

1. **禁止逐幀分次生成。** 每個動作的所有幀必須一次生成在同一張橫條圖上，之後切割。分次生成會造成角色幀間漂移，直接退件。
2. 橫條圖規格：幀由左至右等寬排列，每格畫布固定，格與格之間不留間隙、不畫分隔線、不加編號文字。
3. 所有角色與物件圖為**透明背景**，不烘焙陰影（陰影由遊戲程式繪製）。
4. 風格描述只能用一般詞彙：明亮熱帶、卡通、Q 版、厚輪廓、高飽和、賽璐璐上色。生成指令**禁止**出現任何真實遊戲、作品、公司、藝術家名稱。
5. 檔案路徑規則：

| 編號 | 路徑                               | 用途                           |
| ---- | ---------------------------------- | ------------------------------ |
| 1    | `_work/coco-island-art/`           | 生成的橫條圖原稿與所有中間產物 |
| 2    | `static/demo/sprites/coco-island/` | 切割後的最終交付檔案與清單檔   |

6. 除了上述兩個資料夾，**禁止新增、修改、刪除專案內任何其他檔案**，特別是 `src/` 之下。
7. 切割方式：第 n 幀（從 0 起算）為橫條圖中 x 從 `n × 幀寬` 起、寬為幀寬、高為全高的區塊。可用任何指令工具（例如 ImageMagick 的裁切）。
8. 每完成一個步驟就核對該步驟的交付清單，全部步驟完成後依「7. 完成回報」格式回報。

## 1. 主角待機動作

1. 生成橫條圖：`_work/coco-island-art/hero_right_idle_strip.png`，尺寸 **512 x 256**（2 幀，每幀 256 x 256）。
2. 角色設定（三個主角動作共用，必須同一角色）：
   1. 熱帶度假感的年輕角色，Q 版約 3 頭身，手持小斧頭，赤腳或涼鞋，配色鮮豔。
   2. 身高 150~170 像素，腳底貼齊 y = 220 的基準線，身體中心在 x = 128。
   3. **面向右**（遊戲會用鏡像產生面向左，所以身上不可有文字或明顯不對稱標誌）。
3. 動作內容：站立呼吸，兩幀之間僅輕微上下起伏。
4. 切割後交付：

| 編號 | 檔案                                                      | 尺寸      |
| ---- | --------------------------------------------------------- | --------- |
| 1    | `static/demo/sprites/coco-island/hero_right_idle_000.png` | 256 x 256 |
| 2    | `static/demo/sprites/coco-island/hero_right_idle_001.png` | 256 x 256 |

## 2. 主角走路動作

1. 生成橫條圖：`_work/coco-island-art/hero_right_walk_strip.png`，尺寸 **1024 x 256**（4 幀，每幀 256 x 256）。
2. 角色必須與步驟 1 為同一角色、同一身高、同一基準線。
3. 動作內容：輕快小跑步循環（右腳前、騰空、左腳前、騰空），遊戲中角色大多在移動，這組動作曝光最高。
4. 切割後交付：

| 編號 | 檔案                                                      | 尺寸      |
| ---- | --------------------------------------------------------- | --------- |
| 1    | `static/demo/sprites/coco-island/hero_right_walk_000.png` | 256 x 256 |
| 2    | `static/demo/sprites/coco-island/hero_right_walk_001.png` | 256 x 256 |
| 3    | `static/demo/sprites/coco-island/hero_right_walk_002.png` | 256 x 256 |
| 4    | `static/demo/sprites/coco-island/hero_right_walk_003.png` | 256 x 256 |

## 3. 主角砍擊動作

1. 生成橫條圖：`_work/coco-island-art/hero_right_chop_strip.png`，尺寸 **1024 x 256**（4 幀，每幀 256 x 256）。
2. 角色必須與步驟 1、2 為同一角色。
3. 動作內容（幀從 0 起算）：
   1. 第 0 幀：舉斧過肩。
   2. 第 1 幀：蓄力後仰。
   3. 第 2 幀：**命中幀**，斧刃劈至最低點，姿勢最有力，遊戲在這一幀噴出椰子。
   4. 第 3 幀：收勢回正。
4. 切割後交付：

| 編號 | 檔案                                                      | 尺寸      |
| ---- | --------------------------------------------------------- | --------- |
| 1    | `static/demo/sprites/coco-island/hero_right_chop_000.png` | 256 x 256 |
| 2    | `static/demo/sprites/coco-island/hero_right_chop_001.png` | 256 x 256 |
| 3    | `static/demo/sprites/coco-island/hero_right_chop_002.png` | 256 x 256 |
| 4    | `static/demo/sprites/coco-island/hero_right_chop_003.png` | 256 x 256 |

## 4. 椰子樹三態

1. 生成橫條圖：`_work/coco-island-art/palm_strip.png`，尺寸 **768 x 384**（3 格，每格 256 x 384）。三態一次生成以確保是同一棵樹。
2. 規格：樹根接地點在每格的 [128, 360]，三格的樹幹位置與粗細必須一致，遊戲會原地換圖。
3. 三格內容（由左至右）：
   1. 完整：掛著椰子的健康椰子樹。
   2. 受損：樹幹有明顯砍痕、微傾斜，椰子變少。
   3. 樹樁：只剩矮樹樁，位於畫面下半部。
4. 切割後交付：

| 編號 | 檔案                                               | 尺寸      |
| ---- | -------------------------------------------------- | --------- |
| 1    | `static/demo/sprites/coco-island/palm_full.png`    | 256 x 384 |
| 2    | `static/demo/sprites/coco-island/palm_damaged.png` | 256 x 384 |
| 3    | `static/demo/sprites/coco-island/palm_stump.png`   | 256 x 384 |

## 5. 物品圖示

1. 生成橫條圖：`_work/coco-island-art/item_strip.png`，尺寸 **256 x 128**（2 格，每格 128 x 128）。
2. 兩格內容（由左至右）：椰子（棕色帶三個發芽孔）、金幣（亮黃色帶簡單光澤）。物件置中、佔畫布約八成。
3. 切割後交付：

| 編號 | 檔案                                               | 尺寸      |
| ---- | -------------------------------------------------- | --------- |
| 1    | `static/demo/sprites/coco-island/item_coconut.png` | 128 x 128 |
| 2    | `static/demo/sprites/coco-island/item_coin.png`    | 128 x 128 |

## 6. 島嶼地圖

1. 直接生成單張大圖，原稿放 `_work/coco-island-art/island_map_source.png`，定稿複製為交付檔。
2. 規格：**2048 x 2048**，俯視（微斜俯視可接受），不透明，地面必須整片可自由行走，不能是側視差構圖。
3. 內容要求：
   1. 明亮熱帶小島：中央與下方為沙地與草地，四周淺海環繞。
   2. 左上角保留一塊**空曠平坦草地**（約 600 x 600 像素），椰子樹由遊戲程式擺放，地圖上不要畫樹。
   3. 右上角保留一塊**空曠沙灘**（約 600 x 600 像素），留給第二批的螃蟹。
   4. 中下方保留一塊平坦空地（約 400 x 300 像素），果汁攤由程式擺放。
   5. 裝飾（貝殼、海星、小花、陽傘）只放在保留區之外，密度低。
4. 交付：

| 編號 | 檔案                                             | 尺寸        |
| ---- | ------------------------------------------------ | ----------- |
| 1    | `static/demo/sprites/coco-island/island_map.png` | 2048 x 2048 |

## 7. 清單檔

建立 `static/demo/sprites/coco-island/manifest.json`，內容**一字不差**如下：

```json
{
  "version": 1,
  "pack": "coco-island",
  "updatedAt": "<完成日期 YYYY-MM-DD>",
  "assetRoot": "/demo/sprites/coco-island",
  "frameContracts": {
    "hero": {
      "canvas": [256, 256],
      "anchor": [128, 220],
      "baselineY": 220,
      "visualHeight": [150, 170],
      "directions": ["right"]
    }
  },
  "animations": {
    "hero": {
      "idle": { "frames": 2, "durations": [0.4, 0.4] },
      "walk": { "frames": 4, "durations": [0.12, 0.12, 0.12, 0.12] },
      "chop": {
        "frames": 4,
        "durations": [0.08, 0.06, 0.1, 0.12],
        "hitFrame": 2
      }
    }
  },
  "reviewBatch": [
    {
      "id": "hero_right",
      "label": "Hero (Right)",
      "kind": "hero",
      "basePath": "/demo/sprites/coco-island",
      "actions": ["idle", "walk", "chop"]
    }
  ],
  "statics": [
    {
      "id": "palm_full",
      "file": "palm_full.png",
      "canvas": [256, 384],
      "anchor": [128, 360]
    },
    {
      "id": "palm_damaged",
      "file": "palm_damaged.png",
      "canvas": [256, 384],
      "anchor": [128, 360]
    },
    {
      "id": "palm_stump",
      "file": "palm_stump.png",
      "canvas": [256, 384],
      "anchor": [128, 360]
    },
    {
      "id": "item_coconut",
      "file": "item_coconut.png",
      "canvas": [128, 128],
      "anchor": [64, 64]
    },
    {
      "id": "item_coin",
      "file": "item_coin.png",
      "canvas": [128, 128],
      "anchor": [64, 64]
    },
    {
      "id": "island_map",
      "file": "island_map.png",
      "canvas": [2048, 2048],
      "anchor": [0, 0]
    }
  ]
}
```

其中 `updatedAt` 填實際完成日期，其餘不得改動。單幀檔名規則為 `{id}_{action}_{三位數幀號}.png`。

## 8. 完成回報

全部完成後，回報以下內容：

1. 交付檔案總表：`static/demo/sprites/coco-island/` 下應有 **17 個檔案**（16 張 PNG 加 1 個 JSON），逐一列出檔名與實際尺寸。
2. 自查結果：對照「9. 驗收標準」逐條回報通過與否。
3. 未完成或有疑慮的項目，明確列出原因。

## 9. 驗收標準（審查方逐條檢查，任一不過退回該項重做）

1. 檔案完整：上述 17 個檔案全部存在、路徑與檔名完全一致、尺寸正確。
2. 角色一致：三個動作共 10 幀為同一角色，體型、配色、輪廓一致，連播無漂移。
3. 基準線：每幀腳底貼齊 y = 220，連播不上下滑動（待機的呼吸起伏除外）。
4. 鏡像安全：水平翻轉後無破綻（無文字、無明顯不對稱標誌）。
5. 命中感：砍擊第 2 幀（從 0 起算）斧刃在最低點。
6. 透明品質：角色與物件圖背景乾淨，無白邊、無殘影。
7. 樹三態：接地點一致，原地換圖不位移。
8. 地圖：三塊保留區確實空曠，整體色調與角色協調，非側視差構圖。
9. 清單檔：與第 7 節內容一致（除日期），JSON 格式合法。

## 10. 批次紀律

1. 本批全部通過驗收後，才開第二批（螃蟹、幫手）委託單。
2. 退件只重做該項目，已通過項目不再改動。
3. 通過的素材後續由開發方轉 WebP 圖集接入遊戲，`static/demo/sprites/coco-island/` 內的原稿保留作對照。
