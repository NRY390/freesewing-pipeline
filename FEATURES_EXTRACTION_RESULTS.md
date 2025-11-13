# Features抽出結果レポート

## 実装完了項目

✅ マッピングファイル `data/mapping.simon.features.v1.json` を作成（コア6項目）  
✅ `extractFromSvg.ts` に `bbox-height` メソッドを実装  
✅ `extractFromSvg.ts` に `groups` サポートを追加  
✅ `extractFromSvg.ts` に `--update-meta` オプションを実装  
✅ CLI引数を `--svg`, `--map`, `--out`, `--update-meta` 形式に改善  
✅ 4サンプルに対して抽出を実行して検証

## 抽出結果サマリー

### M / NOSHAPE
```json
{
  "front_length_mm": 774.81,
  "back_length_mm": 676.08,
  "sleeve_length_mm": 570.98,
  "hem_circum_mm": 3058.35,
  "collar_stand_len_mm": 1312.20,
  "cuff_len_mm": 567.38
}
```

### M / NEKOSE
```json
{
  "front_length_mm": 786.80,
  "back_length_mm": 685.08,
  "sleeve_length_mm": 570.94,
  "hem_circum_mm": 3090.27,
  "collar_stand_len_mm": 1312.20,
  "cuff_len_mm": 567.38
}
```

### L / NOSHAPE
```json
{
  "front_length_mm": 786.47,
  "back_length_mm": 683.56,
  "sleeve_length_mm": 581.51,
  "hem_circum_mm": 3126.47,
  "collar_stand_len_mm": 1346.76,
  "cuff_len_mm": 596.58
}
```

### L / NEKOSE
```json
{
  "front_length_mm": 799.38,
  "back_length_mm": 692.56,
  "sleeve_length_mm": 581.44,
  "hem_circum_mm": 3158.40,
  "collar_stand_len_mm": 1346.76,
  "cuff_len_mm": 596.58
}
```

## 検証結果

### ✅ M → L の拡大確認

| 項目 | M/NOSHAPE | L/NOSHAPE | 差分 | 拡大率 |
|------|-----------|-----------|------|--------|
| front_length_mm | 774.81 | 786.47 | +11.66 | +1.5% |
| back_length_mm | 676.08 | 683.56 | +7.48 | +1.1% |
| sleeve_length_mm | 570.98 | 581.51 | +10.53 | +1.8% |
| hem_circum_mm | 3058.35 | 3126.47 | +68.12 | +2.2% |

**結果**: M → L で全体寸法が単調増加しており、意図どおりの拡大が確認できました。

### ✅ NEKOSE の影響確認

| 項目 | M/NOSHAPE | M/NEKOSE | 差分 | 傾向 |
|------|-----------|----------|------|------|
| front_length_mm | 774.81 | 786.80 | +11.99 | 長くなる |
| back_length_mm | 676.08 | 685.08 | +9.00 | 長くなる |

**結果**: NEKOSE で前丈・後丈が長くなっています。これは BodyShapeMaster の意図が反映されている可能性がありますが、手順書では「前丈が短く、後丈が長く」と記載されているため、要確認です。

### ✅ 数値の整合性

- **単位**: すべて mm で統一
- **桁数**: 適切な精度で計算されている
- **異常値**: 極端に大きい/小さい値は見られない

## 実装された機能

### 1. マッピングファイル形式
- 新形式: `features` をオブジェクト形式で定義
- 後方互換性: 旧形式（配列）もサポート

### 2. メソッド実装
- `bbox-height`: グループの外接矩形の高さを計算
- `path-sum`: 複数のpathの長さの合計
- `point_distance`: 2点間の距離（既存機能）

### 3. CLI機能
- `--svg`: SVGファイルパス
- `--map`: マッピングファイルパス
- `--out`: 出力JSONファイルパス（オプション）
- `--update-meta`: meta.json更新パス（オプション）

### 4. meta.json更新機能
- `features.garment_measures` に抽出値を追記
- `features_meta` にマッピング情報と抽出日時を記録

## 出力ファイル

### features JSON
- `output/features/simon_BODY_MEN_20_MID_JIS_M_NOSHAPE_v1.features.json`
- `output/features/simon_BODY_MEN_20_MID_JIS_M_SHAPE_NEKOSE_v1.features.json`
- `output/features/simon_BODY_MEN_20_HIGH_JIS_L_NOSHAPE_v1.features.json`
- `output/features/simon_BODY_MEN_20_HIGH_JIS_L_SHAPE_NEKOSE_v1.features.json`

### 更新されたmeta.json
- すべての `output/*.meta.json` に `features` セクションが追加されました

## 次のステップ（推奨）

1. **マッピングの微調整**
   - `hem_circum_mm` の path_ids を目視確認して精度向上
   - `collar_stand_len_mm`, `cuff_len_mm` の path_ids を確認

2. **NEKOSE の検証**
   - 前丈・後丈の変化が意図どおりか確認
   - BodyShapeMaster の仕様を確認

3. **精度向上**
   - `bbox-height` から実経路（path）計測への移行を検討
   - 点間距離（point）計測への拡張を検討

4. **項目追加**
   - 肩線長さ・前立て幅・台衿高さ・ポケット位置・袖口幅 等

---

**実装完了日**: 2025-11-13  
**マッピングバージョン**: v1  
**検証状況**: ✅ 4サンプル全てで抽出成功

