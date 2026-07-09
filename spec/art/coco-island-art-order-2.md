# Coco Island 素材委託單（第二批）【已作廢，勿執行】

> 2026-07-02 作廢。現行委託單：[forest-camp-art-order.md](forest-camp-art-order.md)。

**開工條件：第一批（[coco-island-art-order.md](coco-island-art-order.md)）全部通過驗收後才開工。**

本文件格式與規則同第一批：橫條圖一次生成、透明背景、不烘焙陰影、
禁止提及任何真實作品名稱、只能動 `_work/coco-island-art/` 與 `static/demo/sprites/coco-island/`。
遊戲端已用佔位圖形實作螃蟹與果汁攤，本批素材到位後自動替換。

## 1. 螃蟹

1. 每幀畫布 **192 x 160**，錨點 [96, 140]（腳底接地），螃蟹本體寬約 100~130 像素。
2. 造型：亮紅橘色卡通螃蟹，大螯、圓眼，與主角同風格。**面向右**（遊戲鏡像產生面向左）。
3. 動作與橫條圖：

| 編號 | 動作  | 幀數 | 每幀時長（秒） | 橫條圖（放 `_work/coco-island-art/`） | 橫條圖尺寸 |
| ---- | ----- | ---- | -------------- | ------------------------------------- | ---------- |
| 1    | walk  | 4    | 0.12 x 4       | crab_right_walk_strip.png             | 768 x 160  |
| 2    | death | 2    | 0.15, 0.2      | crab_death_strip.png                  | 384 x 160  |

4. death 內容：第 0 幀被打扁、第 1 幀翻肚（最後停格）。
5. 切割後交付：

| 編號 | 檔案                                                                  | 尺寸      |
| ---- | --------------------------------------------------------------------- | --------- |
| 1    | `static/demo/sprites/coco-island/crab_right_walk_000.png` ~ `003.png` | 192 x 160 |
| 2    | `static/demo/sprites/coco-island/crab_death_000.png` ~ `001.png`      | 192 x 160 |

## 2. 果汁攤建築

1. 單張靜態圖，畫布 **256 x 256**，錨點 [128, 230]（建築底部接地）。
2. 造型：熱帶木造果汁攤，紅白條紋遮陽棚、放著果汁杯的櫃檯，與地圖色調協調。
3. 交付：`static/demo/sprites/coco-island/stand_juice.png`。

## 3. 蟹肉圖示

1. 畫布 **128 x 128**，物件置中佔約八成。
2. 造型：卡通蟹螯或蟹肉塊，一眼能和椰子區分。
3. 交付：`static/demo/sprites/coco-island/item_crab.png`。

## 4. 清單檔更新

在 `static/demo/sprites/coco-island/manifest.json` 中：

1. `frameContracts` 增加 `crab`：canvas [192, 160]、anchor [96, 140]、baselineY 140、directions ["right"]。
2. `animations` 增加 `crab`：walk 與 death（時長同上表，death 最後一幀停格）。
3. `reviewBatch` 增加 `crab_right` 項目（actions: ["walk", "death"]）。
4. `statics` 增加 `stand_juice.png`（canvas [256, 256]、anchor [128, 230]）與 `item_crab.png`（canvas [128, 128]、anchor [64, 64]）。

## 5. 完成回報與驗收

1. 交付檔案共 **8 個 PNG** 加更新後的清單檔，逐一列出檔名與實際尺寸。
2. 驗收標準沿用第一批：幀間一致、貼齊基準線、鏡像安全、透明乾淨、清單檔合法。
3. 備註：幫手角色不需要新素材，遊戲內以主角圖換色呈現。
