# 00_system-design.md

FreeSewing 型紙生成パイプライン – 設計図（Cursor 向け）

このドキュメントは、  
**「FreeSewing を使って型紙 SVG を生成する最小ライン」** を  
拡張しやすい形で実装するための設計図です。

Cursor がこの内容を理解していれば：

- 既存ファイルの役割
- 各ファイル間のつながり
- 今後どこをどう拡張すべきか

を把握しやすくなります。

---

## 1. システムの目的

### 1.1 何をしたいシステムか

- FreeSewing をパターンエンジンとして使い、
  - **体型（Body）**
  - **骨格・姿勢（BodyShape, オプション）**
  - **スタイル（Pattern）**
    を指定して、

→ **型紙 SVG（将来は DXF も）を安定して生成できるパイプライン**を作る。

### 1.2 なぜここまで細かく分けているか

将来的に：

- 採寸＋体型ラベル＋骨格ラベル → 型紙
- 着用結果・修正ログ → 数値として蓄積
- 機械学習で「AI パタンナー」「フィット診断」へ拡張

といった発展を見据えて、

> **「型紙を数値で語れる共通言語」**

になるように、  
Body / Block / Pattern / Measurement / BodyShape を分離した設計にしている。

---

## 2. ドメイン概念の整理

このプロジェクトで扱う主要な概念は次の通り。

### 2.1 BodyMaster（体型マスタ）

- ファイル：`data/bodyMaster.v1.json`
- 型：`BodyRow`
- 内容：**標準的なヌード寸法**のセット（MEN/WOM/UNI）
- 例：`BODY_MEN_20_MID_JIS_M`（メンズ JIS M 相当）

持っている情報（抜粋）:

- 身長：`stature_cm`
- 胸囲：`chest_cm`
- ウエスト：`waist_cm`
- ヒップ：`hips_cm`
- 肩幅：`shoulder_to_shoulder_cm`
- 肩傾斜：`shoulder_slope_deg`
- 腕回り・手首：`biceps_cm`, `wrist_cm`
- 前後丈情報：`hps_to_bust_cm`, `hps_to_waist_front_cm`, `hps_to_waist_back_cm` など

> BodyMaster は **「標準体型」** の定義であり、  
> ゆとり（Fit）は含まず、あくまでヌード寸法。

---

### 2.2 BodyShapeMaster（骨格・姿勢マスタ / オプション）

- ファイル：`data/bodyShapeMaster.v1.json`
- 型：`BodyShapeRow`
- 役割：BodyMaster の値に対して、**骨格による補正値（差分）**を与えるオプション。

v1 では次の 4 種類を定義：

- `SHAPE_NEKOSE`（猫背）
- `SHAPE_HATOMUNE`（ハトムネ）
- `SHAPE_IGARI`（怒肩）
- `SHAPE_NADE`（なで肩）

補正の対象例：

- 肩傾斜：`delta_shoulderSlope_deg`
- 肩幅：`delta_shoulderToShoulder_cm`
- 前後丈：`delta_hpsToWaistFront_cm`, `delta_hpsToWaistBack_cm`
- バスト周り：`delta_highBust_cm`, `delta_highBustFront_cm`

> BodyShapeMaster は **完全にオプション扱い**。  
> 指定しなければ補正なしで BodyMaster だけから measurements を作る。

---

### 2.3 BlockMaster（原型・ブロックマスタ）

※ 最小ラインでは簡易版を使用。

- ファイル：`data/blockMaster.v1.json`
- 型：`BlockRow`
- 役割：FreeSewing の block（brian / bella / titan など）と、
  - 「これはシャツ用ブロックか？」
  - 「パンツ用か？」
  - 「どの基礎 block ベースか？」
    を整理する辞書。

サンプル（v1）:

- `BLOCK_SHIRT_MEN_BRIAN_BASE`
  - label_ja: メンズシャツ原型（Brian ベース）
  - gender: MEN
  - category: TOP
  - sub_category: SHIRT
  - fs_base_block: "brian"

> 今回の最小ラインでは Simon のためのブロック 1 つだけ。
> 将来、ジャケット・パンツなどを追加するときはここを拡張する。

---

### 2.4 PatternMaster_CORE（一軍パターンマスタ）

- ファイル：`data/patternMaster.core.v1.json`
- 型：`PatternCoreRow`
- 役割：学習・実運用の「一軍」パターン（Simon, Charlie, Carlton …）を、
  - どの Body をデフォルトとするか（`body_id_default`）
  - どの Block を使うか（`block_id_main`）
    と紐付けて管理する。

最小ラインでは：

- `PATTERN_SIMON_MEN_SHIRT`
  - fs_pattern_id: `"simon"`
  - body_id_default: `"BODY_MEN_20_MID_JIS_M"`
  - block_id_main: `"BLOCK_SHIRT_MEN_BRIAN_BASE"`
  - category: `"TOP"`
  - sub_category: `"SHIRT"`

> 今回は Simon シャツだけだが、  
> 将来この表に Charlie / Carlton / Carlita / Teagan などを追加していく。

---

### 2.5 MeasurementProfile（測定プロファイル）

- 型：`MeasurementProfile`
- 役割：**FreeSewing に渡す measurements（数値セット）の完成形**を表現する。

構造：

- meta:
  - `body_id`（どの体型か）
  - `fs_pattern_id`（どの FS パターンか）
  - `shape_id`（どの骨格補正か、オプション）
  - `fit_label`（当面 `'REG'` 固定）
  - `version`（例：`"v1"`）
- measurements:
  - `height`, `chest`, `waist`, `hips`, `neck`,
  - `biceps`, `wrist`, `shoulderToShoulder`, `shoulderSlope`,
  - `waistToHips`, `waistToArmpit`, `shoulderToWrist`,
  - `hpsToBust`, `hpsToWaistFront`, `hpsToWaistBack`,
  - `highBust`, `highBustFront` など

MeasurementProfile は **実際の FreeSewing 呼び出し直前の数値状態**であり、  
BodyMaster / BodyShapeMaster / PatternMaster から合成して作る。

---

### 2.6 FreeSewing Pattern（今回は Simon）

- パターンモジュール：`@freesewing/simon`
- 型紙エンジンとして利用：

```ts
const pattern = new Simon({
  measurements: profile.measurements,
  // options, settings を将来追加する余地あり
});

const svg = pattern.draft().render();
```
