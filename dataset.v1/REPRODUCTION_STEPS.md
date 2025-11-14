# データセット再現手順

このドキュメントは、`dataset.v1/` ディレクトリの内容を再生成するための手順を記載しています。

---

## 📋 前提条件

### 必要な環境
- **Node.js**: >=18
- **npm**: >=9
- **OS**: macOS / Linux / Windows（WSL推奨）

### 必要なパッケージ
- `@freesewing/simon`: ^3.0.0（package-lock.jsonで3.1.0に固定）
- `@xmldom/xmldom`: ^0.8.11
- `svg-path-properties`: ^1.3.0
- `xpath`: ^0.0.33
- `glob`: ^11.0.3（devDependencies）

---

## 🔧 セットアップ手順

### 1. リポジトリのクローン（初回のみ）

```bash
git clone <repository-url>
cd freesewing-pipeline
```

### 2. 依存関係のインストール

```bash
npm install
```

**注意**: `package-lock.json` が存在する場合、`npm install` で固定バージョンがインストールされます。

### 3. ビルド

```bash
npm run build
```

---

## 📊 データセット生成手順

### Step 1: SVGパターンの生成

4サンプルのSVGパターンを生成します。

```bash
# M/NOSHAPE
npm run draft:simon

# M/NEKOSE
npm run draft:simon:nekose

# または両方一度に
npm run draft:both
```

**出力先**: `output/simon_*.svg`

### Step 2: 特徴量の抽出

各SVGファイルから特徴量を抽出し、`meta.json` を更新します。

```bash
# M/NOSHAPE
npm run build && node dist/tools/extractFromSvg.js \
  --svg output/simon_BODY_MEN_20_MID_JIS_M_NOSHAPE_v1.svg \
  --map data/mapping.simon.features.v1.1.json \
  --out output/features/simon_BODY_MEN_20_MID_JIS_M_NOSHAPE_v1.features.json \
  --update-meta output/simon_BODY_MEN_20_MID_JIS_M_NOSHAPE_v1.meta.json

# M/NEKOSE
npm run build && node dist/tools/extractFromSvg.js \
  --svg output/simon_BODY_MEN_20_MID_JIS_M_SHAPE_NEKOSE_v1.svg \
  --map data/mapping.simon.features.v1.1.json \
  --out output/features/simon_BODY_MEN_20_MID_JIS_M_SHAPE_NEKOSE_v1.features.json \
  --update-meta output/simon_BODY_MEN_20_MID_JIS_M_SHAPE_NEKOSE_v1.meta.json

# L/NOSHAPE
npm run build && node dist/tools/extractFromSvg.js \
  --svg output/simon_BODY_MEN_20_HIGH_JIS_L_NOSHAPE_v1.svg \
  --map data/mapping.simon.features.v1.1.json \
  --out output/features/simon_BODY_MEN_20_HIGH_JIS_L_NOSHAPE_v1.features.json \
  --update-meta output/simon_BODY_MEN_20_HIGH_JIS_L_NOSHAPE_v1.meta.json

# L/NEKOSE
npm run build && node dist/tools/extractFromSvg.js \
  --svg output/simon_BODY_MEN_20_HIGH_JIS_L_SHAPE_NEKOSE_v1.svg \
  --map data/mapping.simon.features.v1.1.json \
  --out output/features/simon_BODY_MEN_20_HIGH_JIS_L_SHAPE_NEKOSE_v1.features.json \
  --update-meta output/simon_BODY_MEN_20_HIGH_JIS_L_SHAPE_NEKOSE_v1.meta.json
```

**出力先**: 
- `output/features/*.features.json`
- `output/*.meta.json`（更新）

### Step 3: データセットの集計

`output/` 配下の `meta.json` ファイルを走査し、CSV/JSONLを生成します。

```bash
npm run summarize
```

**出力先**: 
- `dataset.v1/features_summary.csv`
- `dataset.v1/samples.jsonl`

---

## 🔍 検証手順

### テストの実行

特徴量の妥当性を検証します。

```bash
npm run test:features:simon
```

**期待結果**: 8つのテストがすべてパスする

### オーバーレイの確認（オプション）

ゴールデンサンプルのオーバーレイを生成し、マッピングが正しいか目視確認します。

```bash
npm run overlay:golden
```

**出力先**: `output/_debug/simon_BODY_MEN_20_MID_JIS_M_NOSHAPE_v1_debug.svg`

ブラウザで開き、各特徴量が正しくハイライトされているか確認してください。

---

## 📁 生成されるファイル

### dataset.v1/ ディレクトリ
- `features_summary.csv`: フラットテーブル形式のCSV
- `samples.jsonl`: 行指向JSON形式のJSONL
- `DATASET_CARD.md`: データセットの説明書
- `REPRODUCTION_STEPS.md`: このファイル

### output/ ディレクトリ（中間ファイル）
- `simon_*.svg`: 生成されたSVGパターン
- `simon_*.meta.json`: メタデータと特徴量を含むJSON
- `features/simon_*.features.json`: 抽出された特徴量（JSON形式）
- `_debug/simon_*_debug.svg`: デバッグ用オーバーレイSVG

---

## 🔄 完全再生成手順

すべてを最初から再生成する場合：

```bash
# 1. クリーンアップ（オプション）
rm -rf output/*.svg output/*.meta.json output/features/*.json output/_debug/*.svg
rm -rf dataset.v1/*.csv dataset.v1/*.jsonl

# 2. SVG生成
npm run draft:both

# 3. 特徴量抽出（4サンプル）
npm run build && node dist/tools/extractFromSvg.js \
  --svg output/simon_BODY_MEN_20_MID_JIS_M_NOSHAPE_v1.svg \
  --map data/mapping.simon.features.v1.1.json \
  --out output/features/simon_BODY_MEN_20_MID_JIS_M_NOSHAPE_v1.features.json \
  --update-meta output/simon_BODY_MEN_20_MID_JIS_M_NOSHAPE_v1.meta.json

npm run build && node dist/tools/extractFromSvg.js \
  --svg output/simon_BODY_MEN_20_MID_JIS_M_SHAPE_NEKOSE_v1.svg \
  --map data/mapping.simon.features.v1.1.json \
  --out output/features/simon_BODY_MEN_20_MID_JIS_M_SHAPE_NEKOSE_v1.features.json \
  --update-meta output/simon_BODY_MEN_20_MID_JIS_M_SHAPE_NEKOSE_v1.meta.json

npm run build && node dist/tools/extractFromSvg.js \
  --svg output/simon_BODY_MEN_20_HIGH_JIS_L_NOSHAPE_v1.svg \
  --map data/mapping.simon.features.v1.1.json \
  --out output/features/simon_BODY_MEN_20_HIGH_JIS_L_NOSHAPE_v1.features.json \
  --update-meta output/simon_BODY_MEN_20_HIGH_JIS_L_NOSHAPE_v1.meta.json

npm run build && node dist/tools/extractFromSvg.js \
  --svg output/simon_BODY_MEN_20_HIGH_JIS_L_SHAPE_NEKOSE_v1.svg \
  --map data/mapping.simon.features.v1.1.json \
  --out output/features/simon_BODY_MEN_20_HIGH_JIS_L_SHAPE_NEKOSE_v1.features.json \
  --update-meta output/simon_BODY_MEN_20_HIGH_JIS_L_SHAPE_NEKOSE_v1.meta.json

# 4. データセット集計
npm run summarize

# 5. 検証
npm run test:features:simon
```

---

## 🐛 トラブルシューティング

### エラー: "Cannot find module '@freesewing/simon'"
```bash
npm install
```

### エラー: "No samples found with features"
- `output/` 配下に `*_v1.meta.json` ファイルが存在するか確認
- 各 `meta.json` に `features.garment_measures` が含まれているか確認

### エラー: "TypeScript compilation failed"
```bash
npm run build
```
エラーメッセージを確認し、型定義の問題を修正してください。

---

## 📝 注意事項

1. **バージョン固定**: `package-lock.json` でバージョンが固定されているため、`npm install` で同じバージョンがインストールされます。

2. **マッピングファイル**: `data/mapping.simon.features.v1.1.json` が存在することを確認してください。

3. **出力ディレクトリ**: `output/` と `dataset.v1/` ディレクトリが存在することを確認してください（自動生成されます）。

4. **再現性**: 同じ環境・同じバージョンで実行すれば、同じ結果が得られます。

---

**最終更新**: 2025-11-14  
**バージョン**: v1


