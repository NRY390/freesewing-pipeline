# MeasurementMaster v1

> 目的  
> 人体の採寸項目・ヌード寸法を「ID 付きで一元管理」するためのマスタ。  
> FreeSewing に渡す `measurements` の元データとなる。

- 単位は **基本 mm** 前提（FreeSewing 測定値と揃える想定）。
- `fs_key` は FreeSewing の measurement 名と一致させる。
- 行は必要に応じてどんどん追加していく（v1 はスターターセット）。

---

## カラム定義

| カラム名           | 説明                                                                         |
| ------------------ | ---------------------------------------------------------------------------- |
| `measurement_id`   | 内部用の一意 ID（大文字＋スネークケース推奨：`CHEST`, `WAIST_TO_HIPS` など） |
| `label_ja`         | 日本語ラベル（胸囲、身長、ウエスト～ヒップ など）                            |
| `label_en`         | 英語ラベル（任意。`Chest circumference` など）                               |
| `dimension_type`   | 寸法の種類：`CIRC`(周径) / `LENGTH`(長さ) / `ANGLE`(角度) / `OTHER`          |
| `axis`             | 主な向き：`VERTICAL` / `HORIZONTAL` / `LOOP` / `CURVE` など                  |
| `body_part`        | 部位：`BODY`, `CHEST`, `WAIST`, `HIP`, `LEG`, `ARM`, `NECK`, `SHOULDER`…     |
| `fs_key`           | FreeSewing の measurement キー名（例：`chest`, `waistToHips`）               |
| `used_by_patterns` | 利用している FS パターン（`simon,brian,simone` のようにカンマ区切り）        |
| `status`           | `CORE` / `OPTIONAL` / `LEGACY` など、運用上の重要度フラグ                    |
| `version_added`    | この項目を追加したバージョン（例：`v1`）                                     |
| `note_ja`          | 定義・注意点・採寸方法などのメモ                                             |

---

## スターター行（例）

> ※ ここから自由に行を追加／編集していく想定です。  
> まずは Simon / Brian まわりで確実に使うものを中心に入れています。

| measurement_id       | label_ja             | label_en                | dimension_type | axis       | body_part | fs_key             | used_by_patterns | status   | version_added | note_ja                                    |
| -------------------- | -------------------- | ----------------------- | -------------- | ---------- | --------- | ------------------ | ---------------- | -------- | ------------- | ------------------------------------------ |
| STATURE              | 身長                 | Stature / Height        | LENGTH         | VERTICAL   | BODY      | height             | simon,brian      | CORE     | v1            | 裸足での全身の高さ。mm で管理。            |
| CHEST                | 胸囲                 | Chest circumference     | CIRC           | LOOP       | CHEST     | chest              | simon,brian      | CORE     | v1            | 乳頭を通る水平面の一周。                   |
| HIGH_BUST            | ハイバスト           | High bust circumference | CIRC           | LOOP       | CHEST     | highBust           | simone,bella     | OPTIONAL | v1            | バストトップより上、脇下での胸囲。         |
| HIGH_BUST_FRONT      | ハイバスト前幅       | High bust front         | LENGTH         | HORIZONTAL | CHEST     | highBustFront      | simone,bella     | OPTIONAL | v1            | ハイバストの前半分の水平長。               |
| WAIST                | ウエスト             | Waist circumference     | CIRC           | LOOP       | WAIST     | waist              | simon,brian      | CORE     | v1            | 一番くびれている位置の周囲。               |
| HIPS                 | ヒップ               | Hips circumference      | CIRC           | LOOP       | HIP       | hips               | simon,brian      | CORE     | v1            | 腸骨上端またはヒップボーン周り。           |
| SEAT                 | ヒップ（臀部最大周） | Seat circumference      | CIRC           | LOOP       | HIP       | seat               | brian            | OPTIONAL | v1            | 臀部の一番出ている部分の周囲。             |
| NECK                 | 首囲                 | Neck circumference      | CIRC           | LOOP       | NECK      | neck               | simon,simone     | CORE     | v1            | 襟ぐりに対応する首の周囲。                 |
| BICEPS               | 上腕囲               | Biceps circumference    | CIRC           | LOOP       | ARM       | biceps             | simon,tees       | CORE     | v1            | 力こぶの一番太い位置の周囲。               |
| WRIST                | 手首囲               | Wrist circumference     | CIRC           | LOOP       | ARM       | wrist              | simon,tees       | CORE     | v1            | 手首の細い位置の周囲。                     |
| SHOULDER_TO_SHOULDER | 肩幅                 | Shoulder to shoulder    | LENGTH         | HORIZONTAL | SHOULDER  | shoulderToShoulder | simon,simone     | CORE     | v1            | 左右肩先の距離。出来上がり肩幅のベース。   |
| SHOULDER_SLOPE       | 肩傾斜角             | Shoulder slope          | ANGLE          | -          | SHOULDER  | shoulderSlope      | simon,simone     | CORE     | v1            | 水平に対する肩線の角度（度）。             |
| HPS_TO_BUST          | HPS→ バスト          | HPS to bust             | LENGTH         | VERTICAL   | CHEST     | hpsToBust          | simon,simone     | CORE     | v1            | 肩先最高点（HPS）からバストポイントまで。  |
| HPS_TO_WAIST_FRONT   | HPS→ ウエスト前      | HPS to waist front      | LENGTH         | VERTICAL   | TORSO     | hpsToWaistFront    | simon,simone     | CORE     | v1            | HPS から前ウエスト位置まで。               |
| HPS_TO_WAIST_BACK    | HPS→ ウエスト後      | HPS to waist back       | LENGTH         | VERTICAL   | TORSO     | hpsToWaistBack     | simon,simone     | CORE     | v1            | HPS から後ウエスト位置まで。               |
| WAIST_TO_HIPS        | ウエスト → ヒップ    | Waist to hips           | LENGTH         | VERTICAL   | HIP       | waistToHips        | simon,brian      | CORE     | v1            | ウエスト線からヒップ線までの落差。         |
| WAIST_TO_ARMPIT      | ウエスト → 脇        | Waist to armpit         | LENGTH         | VERTICAL   | TORSO     | waistToArmpit      | simon,simone     | CORE     | v1            | ウエストから脇までの縦距離。               |
| SHOULDER_TO_WRIST    | 肩先 → 手首          | Shoulder to wrist       | LENGTH         | VERTICAL   | ARM       | shoulderToWrist    | simon,simone     | CORE     | v1            | 肩先から手首までの腕の長さ。               |
| INSEAM               | 股下                 | Inseam                  | LENGTH         | VERTICAL   | LEG       | inseam             | brian            | CORE     | v1            | 股（股下）から足首 or 床まで。             |
| CROSS_SEAM           | クロッチシーム       | Cross seam              | LENGTH         | CURVE      | PELVIS    | crossSeam          | brian            | OPTIONAL | v1            | ウエスト前 → 股 → ウエスト後を通る曲線長。 |

---

## 運用メモ

- **拡張するときのルール例**
  - `measurement_id` は原則変更しない（追加のみ）。
  - FreeSewing 側にまだない測定値でも、先にここに定義しておいて OK。
- **BodyMaster / MeasurementProfile との関係**
  - `BodyMaster` の列名は基本的に `fs_key` を使う。
  - `MeasurementProfile.measurements` のキーも `fs_key` と合わせる。
