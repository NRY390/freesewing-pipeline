## FreeSewing のバージョン方針（詳細）

このプロジェクトでは、FreeSewing を「型紙エンジン」として利用しますが、  
**FreeSewing 本体のバージョン（v3 / v4 など）と、このプロジェクトの設計をきちんと切り分ける** 方針を取ります。

目的は：

- 将来 FreeSewing 側が v4 / v5… と進化しても、
- **BodyMaster / BodyShapeMaster / PatternMaster / SampleMeta といった“基盤設計”は変えずに済む** ようにすること
- バージョン差分は、`src/freesewing/` 以下の「アダプタ層」だけで吸収できるようにすること

---

### 0. 現状認識

- FreeSewing プロジェクト全体としての「最新世代」は **v4 系** とされている。
- しかし、Node から実際に利用する npm パッケージ（例：`@freesewing/simon`）は、
  - まだ **v3.x 系 API** が広く使われており、
  - 公式・コミュニティのサンプルコードも v3 API を前提にしているものが多い。

本プロジェクトは、まず **「安定して使える v3.x API」** を前提に動かすことを優先し、  
将来必要になった時点で v4 系 API に追随する方針とする。

---

### 1. ドメイン層は FreeSewing 非依存で設計する

**ドメイン層（domain layer）** とは、このプロジェクト独自の“型紙の世界観”を表現する層であり、  
以下のようなものを含みます：

- `BodyMaster`  
  → 年齢・性別・サイズ体系ごとの **標準ヌード寸法** の辞書
- `BodyShapeMaster`  
  → 猫背 / ハトムネ / 怒肩 / なで肩 などの **骨格・姿勢補正** の辞書
- `PatternMaster`（CORE / AUX）  
  → 「シャツ / パンツ / ジャケット …」「どの原型（brian / titan / bella…）か」などの **スタイル辞書**
- `BlockMaster`  
  → FreeSewing の block（brian / bella / noble / titan…）と、  
   このプロジェクト内の block_id（原型分類）を結びつける辞書
- `MeasurementProfile`  
  → 体型・骨格・パターンから計算された **最終的な measurements セット**
- `SampleMeta`（今回設計した meta.json）  
  → 「誰向け・どのパターン・どの原型・いつ・どの FS で生成したか」を記録するメタ情報

方針：

- これら **ドメイン層の型・データ構造には、FreeSewing のバージョンを直接書き込まない**。
  - 例：`schema_version: "sample-meta.v1"` のように、  
    このプロジェクト独自のバージョンスキーマで管理する。
  - 「fs_version」は `core.freesewing.version` のように **メタ情報としてぶら下げるだけ** に留める。
- ドメインの設計（Body / Shape / Pattern / Block / Measurement / SampleMeta）は、  
  **FreeSewing を別のエンジン（将来別の CAD エンジンなど）に差し替えても再利用できる形**を狙う。

つまり：

> 「FreeSewing はあくまで“型紙を描いてくれるエンジン”。  
>  本質的な“サイズ体系・骨格・スタイル・メタデータ”は、  
>  このプロジェクトが独自に持つ世界観として分離する。」

という考え方です。

---

### 2. FreeSewing 依存は「アダプタ層」に閉じ込める

**アダプタ層（adapter layer）** として `src/freesewing/` 配下を専用ディレクトリにしています。

例：

- `src/freesewing/draftSimon.ts`
- （将来）`src/freesewing/draftTeagan.ts`
- （将来）`src/freesewing/draftCharlie.ts` など

ここに書くのは：

- `@freesewing/simon` 等の **実ライブラリ import**
- `new Simon({ measurements })` のような **FS 固有の呼び出し API**
- `.draft().render()` で SVG を取得する部分
- 将来、FS v4 で API が変わった場合に手を入れるべき部分

方針：

- **FreeSewing の API 仕様に触れるコードは `src/freesewing/` 以下に集約する。**
- `src/domain/` 以下は、**FreeSewing の存在を知らない設計** にする。
  - `buildMeasurementProfile` などは、FS に measurements を渡すための「数値セット」を作るだけ
  - FS が v3 だろうが v4 だろうが、`MeasurementProfile` の構造は変えない想定
- 将来 v3 → v4 に移行するときは：
  - `src/freesewing/` 以下の import / 呼び出し方法 / オプション名などを修正
  - `src/domain/` 以下は原則手を入れずに済むようにしておく

つまり：

> 「バージョン差分の影響範囲を、アダプタ層だけに閉じ込める」  
> ＝ 「ドメイン層は FreeSewing の世代交代から守る」

という設計です。

---

### 3. 現時点の利用前提（v3.x API）

当面、このプロジェクトでは以下を前提とします：

- npm パッケージとしては **`@freesewing/simon` の v3.x 系** を使用
- 呼び出し方は **v3 世代の典型パターン** に合わせる：

  ```ts
  import { Simon } from "@freesewing/simon";

  const pattern = new Simon({
    measurements: profile.measurements,
    // options: { ... },
    // settings: { ... },
  });

  const svg = pattern.draft().render();
  ```
