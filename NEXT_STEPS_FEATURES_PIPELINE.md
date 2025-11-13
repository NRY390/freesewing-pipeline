# NEXT_STEPS_FEATURES_PIPELINE.md  
（Cursor 用・次にやること手順書）

このドキュメントは、**features（衣服寸法の自動抽出）を最小構成で動かす**ための、実行順の手順書です。  
対象は **Simon（シャツ）**、サンプルは **4点（M/L × NOSHAPE/NEKOSE）**。

---

## 0. 現在地の確認（OKなら次へ）

- `npm run introspect:simon` が成功し、出力に  
  - `counts.paths > 0`（例：38）  
  - `paths_by_part.front/back/sleeve/...` に `fs-XX` が並ぶ  
  を確認できている ✔︎

> ここまで出ているなら、**マッピング → 抽出**へ進めます。

---

## 1. マッピングファイル（暫定 v1）を作る

**目的**：SVG 内の **どの path が「どの寸法」か**を教える辞書（マッピング）を作る。  
ファイル：`data/mapping.simon.features.v1.json`

> 最初は **コア6項目**のみに絞る（後で増やす）。  
> `fs-XX` は目視で確認しやすい**輪郭**から採用し、正しさ優先で徐々に精度を上げる。

### 1-1. 暫定テンプレ（貼り付け→編集）

```json
{
  "$schema": "internal",
  "pattern": "simon",
  "version": "v1",
  "notes_ja": "最小の features 抽出マッピング。まずはコア6項目から開始。",
  "features": {
    "front_length_mm": {
      "method": "bbox-height",
      "groups": [
        "fs-stack-simon.frontRight-part-simon.frontRight",
        "fs-stack-simon.frontLeft-part-simon.frontLeft"
      ],
      "notes_ja": "前身頃の上下外接差。まずは近似でOK。必要なら後で経路指定に切替。"
    },
    "back_length_mm": {
      "method": "bbox-height",
      "groups": [
        "fs-stack-simon.back-part-simon.back"
      ],
      "notes_ja": "後身頃の上下外接差。ヨーク分含まれる想定。"
    },
    "sleeve_length_mm": {
      "method": "bbox-height",
      "groups": [
        "fs-stack-simon.sleeve-part-simon.sleeve"
      ]
    },
    "hem_circum_mm": {
      "method": "path-sum",
      "path_ids": [
        "fs-19", "fs-24", "fs-4", "fs-35"
      ],
      "notes_ja": "裾線の合算（暫定）。ブラウザで各IDを目視確認のうえ差し替え・追加・削除を行う。"
    },
    "collar_stand_len_mm": {
      "method": "path-sum",
      "path_ids": ["fs-10", "fs-11", "fs-12"],
      "notes_ja": "台衿の輪郭（暫定）。要目視確認。"
    },
    "cuff_len_mm": {
      "method": "path-sum",
      "path_ids": ["fs-13"],
      "notes_ja": "カフス輪郭（暫定）。要目視確認。"
    }
  }
}
```

> **重要**：上記の `fs-XX` は **暫定の例**。  
> **ブラウザで SVG を開き、検索（Cmd/Ctrl+F）で該当IDを探して強調表示**→**線の意味が合っているか**を必ず目視で確認し、**必要に応じて置換**してください。

---

## 2. 抽出スクリプトで数値を出す

### 2-1. コマンド（1枚の SVG を解析）

```bash
npm run build
node dist/tools/extractFromSvg.js   --svg output/simon_BODY_MEN_20_MID_JIS_M_NOSHAPE_v1.svg   --map data/mapping.simon.features.v1.json   --out output/features/simon_BODY_MEN_20_MID_JIS_M_NOSHAPE_v1.features.json   --update-meta output/simon_BODY_MEN_20_MID_JIS_M_NOSHAPE_v1.meta.json
```

- `--map`: マッピング辞書ファイル（手順1で作成したもの）
- `--out`: 抽出した features 単体のJSON（ログ用）
- `--update-meta`: 既存の meta.json に `features.garment_measures` を **追記・更新**  
  （実装済みでなければ、追記処理を追加してください）

### 2-2. 4サンプル連続の例（任意）

```bash
# 例: M / NOSHAPE
node dist/tools/extractFromSvg.js   --svg output/simon_BODY_MEN_20_MID_JIS_M_NOSHAPE_v1.svg   --map data/mapping.simon.features.v1.json   --out output/features/simon_BODY_MEN_20_MID_JIS_M_NOSHAPE_v1.features.json   --update-meta output/simon_BODY_MEN_20_MID_JIS_M_NOSHAPE_v1.meta.json

# 例: M / NEKOSE
node dist/tools/extractFromSvg.js   --svg output/simon_BODY_MEN_20_MID_JIS_M_SHAPE_NEKOSE_v1.svg   --map data/mapping.simon.features.v1.json   --out output/features/simon_BODY_MEN_20_MID_JIS_M_SHAPE_NEKOSE_v1.features.json   --update-meta output/simon_BODY_MEN_20_MID_JIS_M_SHAPE_NEKOSE_v1.meta.json

# 例: L / NOSHAPE
node dist/tools/extractFromSvg.js   --svg output/simon_BODY_MEN_20_HIGH_JIS_L_NOSHAPE_v1.svg   --map data/mapping.simon.features.v1.json   --out output/features/simon_BODY_MEN_20_HIGH_JIS_L_NOSHAPE_v1.features.json   --update-meta output/simon_BODY_MEN_20_HIGH_JIS_L_NOSHAPE_v1.meta.json

# 例: L / NEKOSE
node dist/tools/extractFromSvg.js   --svg output/simon_BODY_MEN_20_HIGH_JIS_L_SHAPE_NEKOSE_v1.svg   --map data/mapping.simon.features.v1.json   --out output/features/simon_BODY_MEN_20_HIGH_JIS_L_SHAPE_NEKOSE_v1.features.json   --update-meta output/simon_BODY_MEN_20_HIGH_JIS_L_SHAPE_NEKOSE_v1.meta.json
```

---

## 3. 検証（見た目と数値の「整合」）

**メタJSON**（`...meta.json`）に次のように追記されているか：

```json
"features": {
  "garment_measures": {
    "front_length_mm":  XXX,
    "back_length_mm":   YYY,
    "sleeve_length_mm": ZZZ,
    "hem_circum_mm":    AAA,
    "collar_stand_len_mm": BBB,
    "cuff_len_mm":      CCC
  }
}
```

**チェック観点：**

- **M → L** で全体寸法が素直に拡大している（単調増加／許容ブレ内）  
- **NEKOSE** で  
  - `front_length_mm` が **わずかに短く**  
  - `back_length_mm` が **わずかに長く**  
  → **BodyShapeMaster の意図が反映**されている  
- **数値の桁 & 単位**：mm で整合している  
- **hem_circum_mm**：裾線の合算に違和感がない（大きすぎ／小さすぎの異常値が出ていない）

---

## 4. マッピングの微調整

- おかしい項目があれば：
  - **対象の `fs-XX` を差し替え**  
  - `method` を `bbox-height` ⇄ `path-sum` で切り替え  
  - `groups`（部位グループ）を見直し  
- 目視確認のときは、**SVGをブラウザで開いて ID 検索**→ 該当線がどこかを実際にチェック

---

## 5. 固定（FIX）と管理

- 現状のマッピングが妥当になったら、`data/mapping.simon.features.v1.json` を **FIX**  
- 変更が必要になったら **`v1.1` などマイナー番号を上げる**  
- 出力の `meta.json` には **マッピングの version** を `features_meta` などで残すと追跡に便利

例（追記推奨）：

```json
"features_meta": {
  "mapping": {
    "pattern": "simon",
    "version": "v1"
  },
  "extracted_at": "2025-11-13T10:15:00Z"
}
```

---

## 6. 期待する最終状態（今回のゴール）

- 4サンプルの **meta.json** に、**コア6項目の features** が入っている  
- **M vs L**, **NOSHAPE vs NEKOSE** の相対関係が、**意図どおり**に出ている  
- マッピングファイル `mapping.simon.features.v1.json` が **一旦の完成形**（v1）として保存

---

## 7. よくある落とし穴（対策つき）

- **path/circle が 0 件になる**  
  - XPath の **名前空間問題**。`local-name()` を使う（すでに対応済み）  
- **裾周りが異常に大きい／小さい**  
  - 裾線でない線を足している可能性。**目視確認 → 差し替え**  
- **前丈・後丈が極端**  
  - `bbox-height` は**近似**。必要に応じて **肩点→裾点** の **point-to-point** 計測ロジックへ拡張  
  - その場合は **FreeSewingの point 名** を別途拾ってマッピング化（後工程）

---

## 8. 次の拡張（今回の後）

- **精度向上**：`bbox` 近似 → **実経路**（path）/ **点間距離**（point）に段階的に移行  
- **項目追加**：  
  - 肩線長さ・前立て幅・台衿高さ・ポケット位置・袖口幅 等  
- **他パターン横展開**：Carlton / Brian系 などに同じ形式で `mapping.{pattern}.features.v1.json` を増やす  
- **自動可視化**：抽出値をテーブル表示・比較グラフ化（学習データの健全性監視）

---

## 9. 実行メモ（Cursor 用）

- **編集する主なファイル**
  - `data/mapping.simon.features.v1.json`（新規 or 更新）
  - 必要に応じて `src/tools/extractFromSvg.ts`（`--update-meta` の実装確認）
- **実行コマンド**
  - `npm run build`
  - `node dist/tools/extractFromSvg.js --svg ... --map ... --out ... --update-meta ...`
- **検証対象**
  - `output/*.meta.json` に `features.garment_measures` が追加されていること
  - 数値の相対関係が意図どおりであること

---

### チェックリスト（Cursor 実行用）

- [ ] `data/mapping.simon.features.v1.json` を作成／更新  
- [ ] 4サンプルに対して `extractFromSvg` を実行  
- [ ] `features.garment_measures` が 6項目とも入っている  
- [ ] **M < L** の関係、**NEKOSE の前短・後長** が出ている  
- [ ] マッピング v1 を FIX（次回変更は v1.1 で）

---

**以上。**  
この手順に沿って、まずは“動く最小ライン”で features を **meta に流し込む**ところまでお願いします。
