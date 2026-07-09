# Forest Camp 場景補件委託單

這是一份自足的工作文件。執行者（AI 作圖）只需要這份文件即可完成全部工作。
目的：為 `/game/forest-camp` **補齊缺少的場景素材**。角色與熊已存在，**不要重新生成任何角色**。
遊戲玩法完整沿用末日生存（survival-loop），場景需求依其佈局。

## 0. 全域規則（開工前必讀）

1. **風格對齊既有角色。** 生成前先查看以下既有圖，輸出必須與其畫風、上色方式、飽和度一致：
   - `static/assets/forest-camp/male_axe_idle_down_000.png`
   - `static/assets/forest-camp/female_axe_idle_down_000.png`
   - `static/assets/forest-camp/bear_idle_down_000.png`
2. 風格描述只能用一般詞彙，生成指令禁止出現任何真實遊戲、作品、公司、藝術家名稱。
3. 多格素材必須一次生成在同一張橫條圖再切割，格與格之間不留間隙、不畫分隔線。
4. 角色與物件圖為透明背景、不烘焙陰影；地圖為不透明。
5. 檔案路徑規則：

| 編號 | 路徑                               | 用途                             |
| ---- | ---------------------------------- | -------------------------------- |
| 1    | `_work/forest-camp-art/`           | 生成原稿與中間產物               |
| 2    | `static/demo/sprites/forest-camp/` | 切割後交付檔案與清單檔（審查用） |

6. 除上述兩個資料夾外，禁止新增、修改、刪除專案內任何其他檔案。

## 1. 樹三態

1. 生成橫條圖：`_work/forest-camp-art/tree_strip.png`，尺寸 **768 x 384**（3 格，每格 256 x 384），三態一次生成確保是同一棵樹。
2. 規格：溫帶闊葉樹或針葉樹，樹根接地點在每格 [128, 360]，三格樹幹位置與粗細一致。
3. 三格內容（由左至右）：完整、受損（有砍痕、樹葉變稀）、樹樁。
4. 切割後交付：

| 編號 | 檔案                                               | 尺寸      |
| ---- | -------------------------------------------------- | --------- |
| 1    | `static/demo/sprites/forest-camp/tree_full.png`    | 256 x 384 |
| 2    | `static/demo/sprites/forest-camp/tree_damaged.png` | 256 x 384 |
| 3    | `static/demo/sprites/forest-camp/tree_stump.png`   | 256 x 384 |

## 2. 物品圖示

1. 生成橫條圖：`_work/forest-camp-art/item_strip.png`，尺寸 **512 x 128**（4 格，每格 128 x 128）。
2. 四格內容（由左至右）：木頭（一小段原木）、生肉（帶骨肉塊）、便當（木盒餐點）、金幣。物件置中佔約八成。
3. 切割後交付：

| 編號 | 檔案                                             | 尺寸      |
| ---- | ------------------------------------------------ | --------- |
| 1    | `static/demo/sprites/forest-camp/item_wood.png`  | 128 x 128 |
| 2    | `static/demo/sprites/forest-camp/item_meat.png`  | 128 x 128 |
| 3    | `static/demo/sprites/forest-camp/item_bento.png` | 128 x 128 |
| 4    | `static/demo/sprites/forest-camp/item_coin.png`  | 128 x 128 |

## 3. 三棟建築

1. 生成橫條圖：`_work/forest-camp-art/station_strip.png`，尺寸 **768 x 256**（3 格，每格 256 x 256），一次生成確保風格一致。
2. 每格錨點 [128, 230]（建築底部接地），透明背景。
3. 三格內容（由左至右）：
   1. 木材站：木造收集棚，堆著原木。
   2. 肉品站：獵物處理棚，掛著肉或皮毛。
   3. 便當店：小吃攤棚，擺著餐盒，暖色調。
4. 切割後交付：

| 編號 | 檔案                                                | 尺寸      |
| ---- | --------------------------------------------------- | --------- |
| 1    | `static/demo/sprites/forest-camp/station_wood.png`  | 256 x 256 |
| 2    | `static/demo/sprites/forest-camp/station_meat.png`  | 256 x 256 |
| 3    | `static/demo/sprites/forest-camp/station_bento.png` | 256 x 256 |

## 4. 俯視大地圖

1. 直接生成單張大圖，原稿放 `_work/forest-camp-art/map_source.png`，定稿複製為交付檔。
2. 規格：**2048 x 2048**，俯視（微斜俯視可接受），不透明，不能是側視差構圖。
3. 內容要求（佈局沿用末日生存的五區配置）：
   1. 森林營地世界觀：草地為主，四周漸深的林緣（不畫完整大樹，避免與樹素材打架）。
   2. **左上**保留空曠草地（約 600 x 600）：森林區，樹由程式擺放，地圖上不要畫樹。
   3. **右上**保留空曠草地（約 600 x 600）：獵場，熊由程式擺放。
   4. **左中、右中**各保留平坦空地（約 350 x 300）：木材站與肉品站由程式擺放。
   5. **中下**保留平坦空地（約 400 x 300）：便當店由程式擺放。
   6. 可用小徑連接各區，裝飾（石頭、草叢、小花）密度低且避開保留區。
4. 交付：`static/demo/sprites/forest-camp/map_topdown.png`（2048 x 2048）。

## 5. 清單檔

更新（不存在則建立）`static/demo/sprites/forest-camp/manifest.json` 的 `statics` 陣列，
包含以下項目；若檔案已有其他內容（例如角色方向批次），保留並合併，不得刪除既有欄位：

```json
[
  {
    "id": "tree_full",
    "file": "tree_full.png",
    "canvas": [256, 384],
    "anchor": [128, 360]
  },
  {
    "id": "tree_damaged",
    "file": "tree_damaged.png",
    "canvas": [256, 384],
    "anchor": [128, 360]
  },
  {
    "id": "tree_stump",
    "file": "tree_stump.png",
    "canvas": [256, 384],
    "anchor": [128, 360]
  },
  {
    "id": "item_wood",
    "file": "item_wood.png",
    "canvas": [128, 128],
    "anchor": [64, 64]
  },
  {
    "id": "item_meat",
    "file": "item_meat.png",
    "canvas": [128, 128],
    "anchor": [64, 64]
  },
  {
    "id": "item_bento",
    "file": "item_bento.png",
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
    "id": "station_wood",
    "file": "station_wood.png",
    "canvas": [256, 256],
    "anchor": [128, 230]
  },
  {
    "id": "station_meat",
    "file": "station_meat.png",
    "canvas": [256, 256],
    "anchor": [128, 230]
  },
  {
    "id": "station_bento",
    "file": "station_bento.png",
    "canvas": [256, 256],
    "anchor": [128, 230]
  },
  {
    "id": "map_topdown",
    "file": "map_topdown.png",
    "canvas": [2048, 2048],
    "anchor": [0, 0]
  }
]
```

## 6. 完成回報

1. 交付檔案總表：**11 張 PNG** 加清單檔，逐一列出檔名與實際尺寸。
2. 對照第 7 節驗收標準逐條自查回報。

## 7. 驗收標準

1. 檔案完整：路徑檔名尺寸正確、清單檔 JSON 合法（開發方驗收）。
2. 風格與既有角色一致（使用者在審查頁判斷）。
3. 樹三態接地點一致，原地換圖不位移；三棟建築風格成套。
4. 地圖五塊保留區確實空曠、非側視差構圖。
5. 透明素材無白邊殘影。
