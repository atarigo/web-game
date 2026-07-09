# Forest Camp 角色方向補圖委託單

這是一份自足的工作文件。執行者（AI 作圖）只需要這份文件即可完成全部工作。
目的：主角（男、女）目前只有朝下（down）方向的精靈圖，本單補齊 **left、right、up 三個方向**。

規格的最終依據是 [ooxx-animation-plan.md](ooxx-animation-plan.md)（原始設計規範），本文件與其一致。

## 0. 全域規則（開工前必讀）

1. **先看既有的 down 方向圖再開工。** 以下檔案是唯一的造型依據，新圖的角色必須與它們是同一個人：
   - `static/assets/forest-camp/male_axe_idle_down_000.png`（男主角全部 down 幀在同資料夾）
   - `static/assets/forest-camp/female_axe_idle_down_000.png`（女主角同上）
2. **跨方向一致性是本單的驗收核心**：
   1. 每一幀腳底貼齊基準線 y = 220，角色身高 150~170 像素，且與 down 方向的身高差不得超過 5 像素。**背面不能比正面高或矮、胖或瘦。**
   2. 頭身比、髮型、服裝、配色、斧頭樣式與 down 方向完全一致。
   3. up 方向畫背面（後腦勺、背部、背對鏡頭持斧），left / right 畫側面。
3. **一個動作的三個方向一次生成在同一張格狀圖**：3 列（由上到下依序 left、right、up）× N 欄（幀 0 到 N-1），每格 256 x 256，格間不留間隙、不畫分隔線、不加文字。同一張圖內模型才能保持三個方向體型一致。
4. 透明背景、不烘焙陰影。生成指令禁止出現任何真實遊戲、作品、公司、藝術家名稱。
5. 檔案路徑規則：

| 編號 | 路徑                               | 用途                   |
| ---- | ---------------------------------- | ---------------------- |
| 1    | `_work/forest-camp-art/`           | 格狀圖原稿與中間產物   |
| 2    | `static/demo/sprites/forest-camp/` | 切割後交付檔案與清單檔 |

6. 除上述兩個資料夾外，禁止新增、修改、刪除專案內任何其他檔案。**尤其不得改動任何既有的 down 方向檔案。**

## 1. 動作規格（兩位主角相同）

依 ooxx 規範，每個方向都要下列三個動作：

| 編號 | 動作     | 幀數 | 每幀時長（秒）                     | 命中幀             | 格狀圖尺寸（3 列） |
| ---- | -------- | ---- | ---------------------------------- | ------------------ | ------------------ |
| 1    | idle     | 4    | 0.18, 0.18, 0.22, 0.18             | 無                 | 1024 x 768         |
| 2    | walk     | 6    | 0.10 x 6                           | 無                 | 1536 x 768         |
| 3    | attack_1 | 6    | 0.07, 0.07, 0.06, 0.06, 0.08, 0.12 | 第 4 格（index 3） | 1536 x 768         |

attack_1 的命中幀：斧刃揮到該方向的最低（或最前）點，方向感要正確（up 是朝畫面上方劈、側面是朝側前方劈）。

## 2. 工作清單

每位主角 3 個動作，各生成一張格狀圖後切割。原稿命名：

```
_work/forest-camp-art/male_axe_idle_dirs_grid.png
_work/forest-camp-art/male_axe_walk_dirs_grid.png
_work/forest-camp-art/male_axe_attack_1_dirs_grid.png
_work/forest-camp-art/female_axe_idle_dirs_grid.png
_work/forest-camp-art/female_axe_walk_dirs_grid.png
_work/forest-camp-art/female_axe_attack_1_dirs_grid.png
```

切割規則：第 r 列（0 起算，0=left、1=right、2=up）第 c 欄 = 該方向第 c 幀，
輸出 `{id}_{action}_{direction}_{三位數幀號}.png` 到交付資料夾。

交付總表（共 **96 張**，每張 256 x 256）：

| 編號 | 檔名模式                                          | 數量 |
| ---- | ------------------------------------------------- | ---- |
| 1    | `male_axe_idle_{left,right,up}_000~003.png`       | 12   |
| 2    | `male_axe_walk_{left,right,up}_000~005.png`       | 18   |
| 3    | `male_axe_attack_1_{left,right,up}_000~005.png`   | 18   |
| 4    | `female_axe_idle_{left,right,up}_000~003.png`     | 12   |
| 5    | `female_axe_walk_{left,right,up}_000~005.png`     | 18   |
| 6    | `female_axe_attack_1_{left,right,up}_000~005.png` | 18   |

## 3. 清單檔

更新（不存在則建立）`static/demo/sprites/forest-camp/manifest.json`：

1. `frameContracts.hero`：canvas [256, 256]、anchor [128, 220]、baselineY 220、visualHeight [150, 170]、directions ["down", "left", "right", "up"]。
2. `animations.hero`：idle、walk、attack_1（幀數與時長依第 1 節，attack_1 帶 hitFrame 3）。
3. `reviewBatch` 加入兩筆：
   - id `male_axe`、kind `hero`、basePath `/demo/sprites/forest-camp`、actions ["idle_left", "idle_right", "idle_up", "walk_left", "walk_right", "walk_up", "attack_1_left", "attack_1_right", "attack_1_up"]
   - id `female_axe`，同上。
4. 若檔案已有其他內容（例如場景批次），保留並合併，不得刪除既有欄位。

## 4. 完成回報

1. 交付檔案總表：96 張 PNG 逐一列出檔名與實際尺寸，加清單檔共 97 個檔案。
2. 對照第 5 節驗收標準逐條自查回報。

## 5. 驗收標準

1. 檔案完整：97 個檔案存在、路徑檔名尺寸正確、清單檔 JSON 合法（開發方驗收）。
2. 跨方向一致：同一主角四個方向（含既有 down）並排時身高、體型、配色一致（使用者在審查頁判斷）。
3. 每幀腳底貼齊 y = 220，連播不上下滑動。
4. up 方向確實是背面，攻擊方向感正確。
5. 透明背景乾淨、無白邊殘影。
