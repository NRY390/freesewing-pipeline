# 学習用データ形式の定義

## 現在のデータ形式

### 1. 生成されるデータの種類

現在の実装では、以下のデータが生成されています：

#### 1.1 SVGファイル（出力）
- **形式**: SVG（XML形式）
- **場所**: `output/simon_BODY_MEN_20_MID_JIS_M_NOSHAPE_v1.svg`
- **内容**: FreeSewingが生成した型紙のSVG表現
- **サイズ**: 約48KB

#### 1.2 MeasurementProfile（入力）
- **形式**: TypeScriptオブジェクト（実行時のみ存在）
- **構造**:
  ```typescript
  {
    // メタデータ
    body_id: "BODY_MEN_20_MID_JIS_M",
    fs_pattern_id: "simon",
    shape_id: undefined | "SHAPE_NEKOSE"など,
    fit_label: "REG",
    version: "v1",
    
    // 測定値（FreeSewingに渡される数値）
    measurements: {
      height: 170,
      chest: 92,
      waist: 80,
      hips: 94,
      neck: 38,
      biceps: 30,
      wrist: 17,
      shoulderToShoulder: 44,
      shoulderSlope: 16,
      waistToHips: 20,
      waistToArmpit: 22,
      shoulderToWrist: 61,
      hpsToBust: 27,
      hpsToWaistFront: 41,
      hpsToWaistBack: 42,
      highBust: 90,
      highBustFront: 48
    }
  }
  ```

#### 1.3 マスターデータ（参照用）
- **BodyMaster**: `data/bodyMaster.v1.json`
- **BodyShapeMaster**: `data/bodyShapeMaster.v1.json`
- **PatternMaster**: `data/patternMaster.core.v1.json`

---

## 学習用データとして必要な形式

### 推奨形式: JSON形式のデータレコード

学習用データとして蓄積する場合、以下の形式を推奨します：

```json
{
  "record_id": "simon_BODY_MEN_20_MID_JIS_M_NOSHAPE_v1_20251110_221000",
  "timestamp": "2025-11-10T22:10:00Z",
  "version": "v1",
  
  "input": {
    "body_id": "BODY_MEN_20_MID_JIS_M",
    "shape_id": null,
    "fs_pattern_id": "simon",
    "fit_label": "REG",
    
    "measurements": {
      "height": 170,
      "chest": 92,
      "waist": 80,
      "hips": 94,
      "neck": 38,
      "biceps": 30,
      "wrist": 17,
      "shoulderToShoulder": 44,
      "shoulderSlope": 16,
      "waistToHips": 20,
      "waistToArmpit": 22,
      "shoulderToWrist": 61,
      "hpsToBust": 27,
      "hpsToWaistFront": 41,
      "hpsToWaistBack": 42,
      "highBust": 90,
      "highBustFront": 48
    },
    
    "body_metadata": {
      "gender": "MEN",
      "age_band": "20s",
      "size_system": "JIS",
      "size_code": "M",
      "label_ja": "メンズ 20代 中肉中背 JIS M相当"
    },
    
    "shape_metadata": null
  },
  
  "output": {
    "svg_file_path": "output/simon_BODY_MEN_20_MID_JIS_M_NOSHAPE_v1.svg",
    "svg_size_bytes": 48260,
    "svg_hash": "sha256:...", // オプション: ファイルの整合性チェック用
    
    "pattern_info": {
      "pattern_id": "PATTERN_SIMON_MEN_SHIRT",
      "category": "TOP",
      "sub_category": "SHIRT",
      "gender": "MEN"
    },
    
    "parts_count": 11,
    "parts_list": [
      "back",
      "frontLeft",
      "frontRight",
      "sleeve",
      "collar",
      "collarStand",
      "cuff",
      "yoke",
      "buttonPlacket",
      "buttonholePlacket",
      "sleevePlacketOverlap",
      "sleevePlacketUnderlap"
    ]
  },
  
  "metadata": {
    "freesewing_version": "3.1.0",
    "generation_method": "freesewing_pipeline_v1",
    "generation_time_ms": 1234, // オプション: 生成にかかった時間
    "success": true
  }
}
```

---

## データ形式の選択肢

### オプション1: 完全なJSON形式（推奨）
- **メリット**: 
  - 構造化されており、検索・フィルタリングが容易
  - メタデータとSVGパスを分離
  - データベースに格納しやすい
- **デメリット**: 
  - SVGファイルは別途保存が必要
  - ファイルサイズが大きくなる可能性

### オプション2: JSON + SVGファイル分離
- **JSONファイル**: メタデータと入力データのみ
- **SVGファイル**: 出力データ（既存の形式を維持）
- **メリット**: 
  - 既存のSVGファイルをそのまま活用
  - JSONファイルが軽量
- **デメリット**: 
  - 2つのファイルを管理する必要がある

### オプション3: JSON Lines形式（.jsonl）
- 1レコード1行のJSON形式
- **メリット**: 
  - ストリーミング処理に適している
  - 大規模データセットに適している
- **デメリット**: 
  - 人間が読むには不便

---

## 実装提案

### 学習用データエクスポート機能の追加

以下の機能を追加することを提案します：

1. **データレコード生成機能**
   - MeasurementProfileからJSONレコードを生成
   - SVGファイルのメタデータを抽出
   - タイムスタンプとレコードIDを付与

2. **データエクスポート機能**
   - 単一レコードのエクスポート
   - バッチ処理時の一括エクスポート
   - JSON Lines形式での出力

3. **データ検証機能**
   - レコードの整合性チェック
   - SVGファイルの存在確認
   - メタデータの検証

---

## 次のステップ

1. **学習用データ形式の確定**
   - 上記の形式で問題ないか確認
   - 追加したいメタデータがあれば指定

2. **エクスポート機能の実装**
   - Phase 1またはPhase 2で実装を検討

3. **データ蓄積の仕組み**
   - データベースへの格納方法
   - ファイルシステムでの管理方法

---

**質問**: どの形式が学習用データとして最適でしょうか？また、追加したいメタデータはありますか？

