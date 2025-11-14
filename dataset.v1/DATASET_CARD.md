# FreeSewing Simon Pattern Dataset v1

## 📋 データセット概要

このデータセットは、FreeSewingのSimonパターン（ボタンダウンシャツ）から抽出した型紙特徴量を含む学習用データセットです。

---

## 🎯 対象

- **パターン**: Simon（ボタンダウンシャツ）
- **対象体型**: メンズ（20代、JIS規格）
- **サイズ**: M, L
- **体型バリエーション**: NOSHAPE（標準体型）、NEKOSE（猫背体型）
- **サンプル数**: 4サンプル

---

## 📊 スキーマ

### features_summary.csv

1行=1サンプルのフラットテーブル形式。

**基本カラム**:
- `sample_id`: サンプルID（例: `simon_BODY_MEN_20_MID_JIS_M_NOSHAPE_v1`）
- `body_id`: 体型ID（例: `BODY_MEN_20_MID_JIS_M`）
- `shape_id`: 体型バリエーションID（`null` または `NEKOSE`）
- `fs_pattern_id`: FreeSewingパターンID（`simon`）
- `fit_label`: フィットラベル（`REG`）
- `freesewing_version`: FreeSewingライブラリバージョン（`3.1.0`）

**測定値カラム** (`measurement_*`):
- `measurement_height`: 身長（mm）
- `measurement_chest`: 胸囲（mm）
- `measurement_waist`: ウエスト（mm）
- `measurement_hips`: ヒップ（mm）
- `measurement_neck`: 首周り（mm）
- `measurement_biceps`: 上腕周り（mm）
- `measurement_wrist`: 手首周り（mm）
- `measurement_shoulderToShoulder`: 肩幅（mm）
- `measurement_shoulderSlope`: 肩の傾き（度）
- `measurement_waistToHips`: ウエストからヒップまでの長さ（mm）
- `measurement_waistToArmpit`: ウエストから脇の下までの長さ（mm）
- `measurement_shoulderToWrist`: 肩から手首までの長さ（mm）
- `measurement_hpsToBust`: 首の付け根からバストまでの長さ（mm）
- `measurement_hpsToWaistFront`: 首の付け根からウエスト前までの長さ（mm）
- `measurement_hpsToWaistBack`: 首の付け根からウエスト後までの長さ（mm）
- `measurement_highBust`: ハイバスト（mm）
- `measurement_highBustFront`: ハイバスト前（mm）

**特徴量カラム** (`feature_*`):
- `feature_front_length_mm`: 前丈（mm）- Y方向の端点測定（y-extentメソッド）
- `feature_back_length_mm`: 後丈（mm）- Y方向の端点測定（y-extentメソッド）
- `feature_sleeve_length_mm`: 袖丈（mm）- 外接矩形の高さ（bbox-heightメソッド）
- `feature_hem_circum_mm`: 裾周り（mm）- パス長の合算（path-sumメソッド）
- `feature_collar_stand_len_mm`: 台衿の輪郭長（mm）- パス長の合算（path-sumメソッド）
- `feature_cuff_len_mm`: カフス輪郭長（mm）- パス長の合算（path-sumメソッド）

**メタ情報カラム**:
- `mapping_version`: マッピングバージョン（`v1.1`）
- `extracted_at`: 抽出日時（ISO 8601形式）
- `tags`: タグ（セミコロン区切り）

### samples.jsonl

行指向JSON形式。各行は1サンプルの完全なメタデータと特徴量を含む。

**構造**:
```json
{
  "sample_id": "...",
  "core": { ... },
  "measurement_profile": { ... },
  "features": {
    "garment_measures": { ... }
  },
  "features_meta": { ... },
  "tags": [ ... ],
  "notes_ja": "..."
}
```

---

## 📏 単位

- **長さ**: ミリメートル（mm）
- **角度**: 度（degree）
- **座標系**: pattern-space（FreeSewingのパターン座標系）

---

## 🔧 生成条件

### 使用ライブラリ
- **FreeSewing**: `@freesewing/simon` v3.1.0
- **Node.js**: >=18
- **npm**: >=9

### マッピング定義
- **マッピングファイル**: `data/mapping.simon.features.v1.1.json`
- **マッピングバージョン**: v1.1
- **抽出メソッド**:
  - `y-extent`: Y方向の端点測定（前丈・後丈）
  - `bbox-height`: 外接矩形の高さ（袖丈）
  - `path-sum`: パス長の合算（裾周り・台衿・カフス）

### 生成パイプライン
1. FreeSewingでSVGパターンを生成
2. SVGから特徴量を抽出（`extractFromSvg.ts`）
3. メタデータと特徴量を統合（`summarizeFeatures.ts`）

---

## ⚠️ 既知の限界

1. **サンプル数の制限**
   - 現在4サンプルのみ（M/L × NOSHAPE/NEKOSE）
   - より多様な体型・サイズへの拡張が必要

2. **特徴量の精度**
   - `hem_circum_mm`, `collar_stand_len_mm`, `cuff_len_mm` は暫定IDを使用
   - ブラウザでの目視確認が必要（マッピングファイル参照）

3. **体型バリエーション**
   - NOSHAPE（標準体型）とNEKOSE（猫背体型）のみ
   - その他の体型バリエーションは未対応

4. **パターン限定**
   - Simonパターンのみ
   - 他のFreeSewingパターンへの展開は未実施

5. **測定値の範囲**
   - JIS規格の20代メンズ体型に限定
   - 他の年齢層・性別・規格への拡張が必要

---

## 💡 推奨用途

### ✅ 推奨される用途
- **型紙特徴量の分析**: 体型パラメータと型紙特徴量の関係性分析
- **回帰モデルの学習**: 体型パラメータから型紙特徴量を予測するモデルの学習
- **パターン生成の検証**: FreeSewingパターン生成の妥当性検証
- **体型バリエーションの影響分析**: NOSHAPE vs NEKOSEの差分分析

### ⚠️ 注意が必要な用途
- **大規模な機械学習**: サンプル数が少ないため、過学習のリスクあり
- **実用的な予測システム**: より多様なデータセットでの検証が必要
- **他のパターンへの一般化**: Simonパターンに特化したデータセット

---

## 📝 データセットバージョン

- **バージョン**: v1
- **作成日**: 2025-11-14
- **マッピングバージョン**: v1.1
- **FreeSewingバージョン**: 3.1.0

---

## 📚 関連ファイル

- **マッピング定義**: `data/mapping.simon.features.v1.1.json`
- **再現手順**: `REPRODUCTION_STEPS.md`
- **ソースコード**: `src/tools/summarizeFeatures.ts`

---

## 🔗 参考資料

- [FreeSewing公式サイト](https://freesewing.org/)
- [FreeSewing Simonパターン](https://freesewing.org/docs/patterns/simon/)
- [FreeSewing GitHub](https://github.com/freesewing/freesewing)

---

**注意**: このデータセットは研究・教育目的で作成されています。商用利用の場合は、FreeSewingのライセンスを確認してください。


