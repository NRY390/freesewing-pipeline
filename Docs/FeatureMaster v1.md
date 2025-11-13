# FeatureMaster v1（寸法系 Garment Features）

> 目的  
> 型紙・出来上がり服の「特徴量（features）」を  
> 一元管理するためのマスタ。  
> `SampleMeta.features.garment_measures` などのキー定義元となる。

- 当面は **寸法系（length / circumference / angle / ratio）** に絞る。
- 将来、構造系（ダーツ数・切替線の有無など）を追加する場合も、このファイルに追記していく想定。

---

## カラム定義

| カラム名               | 説明                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `feature_id`           | 内部用の一意 ID（例：`FRONT_LENGTH`, `ARMHOLE_LENGTH`）                                |
| `key`                  | JSON 上で使うキー名（例：`front_length_mm`）                                           |
| `label_ja`             | 日本語ラベル（前丈、後丈、肩幅、裾まわり 等）                                          |
| `label_en`             | 英語ラベル（任意）                                                                     |
| `level`                | 対象レベル：`GARMENT` / `PART_FRONT` / `PART_BACK` / `PART_SLEEVE` / `PART_PANTS` など |
| `category`             | `LENGTH` / `CIRC` / `ANGLE` / `RATIO` / `COUNT` / `OTHER`                              |
| `part_type`            | 主なパーツ種別：`BODICE` / `SLEEVE` / `COLLAR` / `PANTS` / `SKIRT` …                   |
| `unit`                 | 単位（基本 `mm`、角度は `deg`）                                                        |
| `related_measurements` | 関連する Measurement ID（`CHEST; WAIST_TO_HIPS` 等、`;`区切り）                        |
| `status`               | `CORE` / `OPTIONAL` / `EXPERIMENTAL` など                                              |
| `version_added`        | この feature を追加したバージョン（例：`v1`）                                          |
| `note_ja`              | 意味・計算方法・注意点など                                                             |

---

## コアフィーチャー（シャツ共通で使える骨格）

> まずはシャツ（Simon）で使うことを前提にしたコアセットです。  
> 他アイテムにもそのまま流用できるよう、なるべく汎用的な命名にしています。

```markdown
| feature_id             | key                       | label_ja           | label_en               | level       | category | part_type | unit | related_measurements             | status   | version_added | note_ja                                                                                                    |
| ---------------------- | ------------------------- | ------------------ | ---------------------- | ----------- | -------- | --------- | ---- | -------------------------------- | -------- | ------------- | ---------------------------------------------------------------------------------------------------------- |
| FRONT_LENGTH           | front_length_mm           | 前丈               | Front length           | GARMENT     | LENGTH   | BODICE    | mm   | HPS_TO_WAIST_FRONT;WAIST_TO_HIPS | CORE     | v1            | 前身頃の HPS（肩先）から前裾中心までの長さ。FS パターンでは front パーツの hps→ 裾点の距離またはその近似。 |
| BACK_LENGTH            | back_length_mm            | 後丈               | Back length            | GARMENT     | LENGTH   | BODICE    | mm   | HPS_TO_WAIST_BACK;WAIST_TO_HIPS  | CORE     | v1            | 後身頃の HPS から後裾中心までの長さ。猫背などの骨格補正で前後差が出る重要指標。                            |
| SHOULDER_WIDTH         | shoulder_width_mm         | 肩幅（出来上がり） | Shoulder width         | GARMENT     | LENGTH   | BODICE    | mm   | SHOULDER_TO_SHOULDER             | CORE     | v1            | 後身頃の左右肩先間の距離。ヌード肩幅からのゆとりはパターン設計次第。                                       |
| CHEST_GIRTH_FINISHED   | chest_circumference_mm    | 仕上がり胸囲       | Finished chest girth   | GARMENT     | CIRC     | BODICE    | mm   | CHEST                            | CORE     | v1            | バストラインでの出来上がり胸囲（前後身頃の合計）。ヌード胸囲＋ゆとりとして設計される。                     |
| WAIST_GIRTH_FINISHED   | waist_circumference_mm    | 仕上がりウエスト   | Finished waist girth   | GARMENT     | CIRC     | BODICE    | mm   | WAIST                            | OPTIONAL | v1            | ウエストラインでの出来上がり一周。シャツのシェイプ量やダーツ量の把握に使う。                               |
| HIP_GIRTH_FINISHED     | hip_circumference_mm      | 仕上がりヒップ     | Finished hip girth     | GARMENT     | CIRC     | BODICE    | mm   | HIPS;SEAT                        | OPTIONAL | v1            | ヒップラインでの出来上がり一周。ワンピースや長めのシャツで有用。                                           |
| HEM_GIRTH_FINISHED     | hem_circumference_mm      | 裾まわり           | Hem circumference      | GARMENT     | CIRC     | BODICE    | mm   | HIPS;SEAT                        | CORE     | v1            | 裾レベルでの出来上がり一周長。FS パターンでは前後裾パス長の合計から算出可能。                              |
| SIDE_SEAM_LENGTH       | side_seam_length_mm       | 脇丈               | Side seam length       | GARMENT     | LENGTH   | BODICE    | mm   | STATURE;WAIST_TO_HIPS            | OPTIONAL | v1            | 脇線上の上端（袖付け）から裾までの長さ。上衣の丈感を評価する指標。                                         |
| SLEEVE_LENGTH          | sleeve_length_mm          | 袖丈               | Sleeve length          | PART_SLEEVE | LENGTH   | SLEEVE    | mm   | SHOULDER_TO_WRIST                | CORE     | v1            | 肩付け点（袖山）から袖口端までの長さ。半袖・長袖を問わず共通。                                             |
| CUFF_OPENING           | cuff_opening_mm           | 袖口まわり         | Cuff opening           | PART_SLEEVE | CIRC     | SLEEVE    | mm   | WRIST                            | OPTIONAL | v1            | 袖口の出来上がり一周長。カフスの締まり具合や手の抜けやすさに関係。                                         |
| ARMHOLE_LENGTH         | armhole_length_mm         | アームホール長     | Armhole length         | GARMENT     | LENGTH   | BODICE    | mm   | BICEPS;CHEST                     | CORE     | v1            | 前身頃＋後身頃のアームホール曲線長の合計。袖山とのバランス確認に必須。                                     |
| NECK_OPENING           | neck_opening_mm           | 襟ぐりまわり       | Neck opening           | GARMENT     | CIRC     | NECK      | mm   | NECK                             | OPTIONAL | v1            | 襟ぐり（ネックライン）の出来上がり周長。台衿・一枚衿などの設計で使用。                                     |
| FRONT_BACK_LENGTH_DIFF | front_back_length_diff_mm | 前後丈差           | Front-back length diff | GARMENT     | LENGTH   | BODICE    | mm   | FRONT_LENGTH;BACK_LENGTH         | OPTIONAL | v1            | `BACK_LENGTH - FRONT_LENGTH`。前後バランスの指標。猫背・反り腰補正の評価に有用。                           |
| CHEST_EASE             | chest_ease_mm             | 胸囲ゆとり量       | Chest ease             | GARMENT     | LENGTH   | BODICE    | mm   | CHEST;CHEST_GIRTH_FINISHED       | OPTIONAL | v1            | `CHEST_GIRTH_FINISHED - CHEST`。ヌードに対するゆとり量。フィット感ラベルとの紐付けに使う。                 |
| HEM_EASE               | hem_ease_mm               | 裾ゆとり量         | Hem ease               | GARMENT     | LENGTH   | BODICE    | mm   | HIPS;HEM_GIRTH_FINISHED          | OPTIONAL | v1            | `HEM_GIRTH_FINISHED - HIPS` もしくは SEAT との差分。                                                       |
```
