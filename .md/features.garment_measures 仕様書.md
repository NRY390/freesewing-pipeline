# features.garment_measures 仕様書（v1 ドラフト）

このドキュメントは、`SampleMeta` に含まれる  
**`features.garment_measures`（コア 6 項目）** の仕様と初期ルール（v1）を定義する。

---

## 1. 目的

`features.garment_measures` は、FreeSewing 等の型紙生成パイプラインにおいて、

- **Body / BodyShape（ヌード寸法＋骨格）**
- **Pattern Geometry（SVG/DXF の線データ）**

の間をつなぐ **「出来上がり寸法の要約」** を数値として持つための領域である。

主な目的は：

- パターンを「前丈／後丈／肩幅／胸囲／裾まわり／袖丈」といった  
  **服としての言葉で数値化**すること
- 将来的に「体型 → 仕上がり寸法」の関係を  
  機械学習や分析で扱えるようにすること
- NEKOSE 等の骨格補正が、**実際の丈やバランスにどう効いているか**を  
  数値で検証できるようにすること

---

## 2. 対象と前提

- 当面の対象：  
  FreeSewing **Simon（メンズシャツ）** を対象とする。
- 将来拡張：
  - ジャケット、コート、パンツ、ワンピース等にも  
    同じ `features.garment_measures` スキーマを共有する前提で設計する。
- 単位：
  - すべて **mm（ミリメートル）** で管理する。
  - `MeasurementProfile.measurements` も mm 前提。

---

## 3. データ構造（TypeScript イメージ）

### 3.1 GarmentMeasures 型

```ts
export interface GarmentMeasures {
  front_length_mm: number | null; // 前丈
  back_length_mm: number | null; // 後丈
  shoulder_width_mm: number | null; // 肩幅
  chest_circumference_mm: number | null; // 仕上がり胸囲
  hem_circumference_mm: number | null; // 裾まわり
  sleeve_length_mm: number | null; // 袖丈
}
```
