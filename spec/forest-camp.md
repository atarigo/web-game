# 森林營地 (Forest Camp)

## 路由

`/game/forest-camp`

## 定位

**末日生存（survival-loop）的完整複製**，換用 ooxx 精靈圖與新場景素材。
末日生存的所有機制都經過大量時間調校，本作原封沿用，不重新設計：
玩法規格以 [survival-loop.md](survival-loop.md) 為準，本文件只記錄差異。

## 與末日生存的差異

1. 美術：主角（男、女）與熊用 ooxx 精靈圖；樹、物品、建築、地圖用同風格補件素材（到位前為程式佔位圖形）。
2. 獵物：舊版的山豬與熊合併為熊（ooxx 只有熊），數值沿用原本的獵物與熊設定。
3. 主角動畫：依 ooxx 合約（待機 4 幀、走路 6 幀、攻擊 6 幀，四方向）。方向補圖到位前，缺的方向暫以 down 方向（左右鏡像）頂替。
4. 砍樹與打獵共用攻擊動作（武器都是斧頭）。
5. 成績紀錄鍵值用 forest-camp，與末日生存分開。

## 沿用清單（不得簡化）

1. 操作：點擊移動加虛擬搖桿（觸控拖曳）、鍵盤快捷鍵。
2. 五層經濟循環：砍樹/打獵 → 撿掉落物 → 搬到木材站/肉品站 → 站點工人產金幣 → 買便當 → 雇工人 → 升級站點。
3. 攜帶上限、掉落物弧線飛行、庫存堆疊視覺、HP 條、產線節奏等所有調校過的數值（constants 原封複製）。
4. 四種工人：砍柴工、獵人、木材站工人、肉品站工人。
5. 站點升級 Lv1~10，費用公式不變；兩站滿級為勝利條件。
6. 一般模式（3 分鐘計時、記分）與無限模式。
7. 選角：男或女主角。

## 素材來源與分工

1. 主角與熊：昨晚 ooxx 產出，遊戲用複本在 `static/assets/forest-camp/`，原稿在 `static/demo/ooxx/final/`，備份在 `_work/archive/ooxx-final-backup/`。
2. 角色動作合約：[art/ooxx-animation-plan.md](art/ooxx-animation-plan.md)。
3. 方向補圖（left/right/up）：[art/forest-camp-art-order-directions.md](art/forest-camp-art-order-directions.md)。
4. 場景補件（樹、物品、三棟建築、地圖）：[art/forest-camp-art-order.md](art/forest-camp-art-order.md)。
5. 工人暫以主角圖換色呈現，未來視需求再開工人造型委託單。
6. 素材載入採漸進式：正式圖載得到就用，缺檔退回佔位圖形，補一項自動換一項。

## 歷史備註

1. 本遊戲取代「椰島大亨」(coco-island) 方案，該方案因誤用全新美術風格作廢，程式與素材封存於 `_work/archive/`。
2. 第一版森林營地（簡化循環版）的程式亦封存於 `_work/archive/forest-camp-v1-simplified/`，其轉生與離線收益設計留作未來參考。
