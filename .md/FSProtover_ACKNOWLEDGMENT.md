# FSProtover.md 方針の認識共有

## 確認日時
2025-11-10

## 方針の要点

### 1. 基本方針
**FreeSewing本体のバージョン（v3/v4）と、このプロジェクトの設計を切り分ける**

- 目的: FreeSewingがv4/v5と進化しても、基盤設計（BodyMaster/BodyShapeMaster/PatternMaster/SampleMeta）を変えずに済む
- バージョン差分は`src/freesewing/`以下の「アダプタ層」だけで吸収

### 2. 現状認識
- FreeSewingプロジェクト全体の最新世代は**v4系**
- しかし、npmパッケージ（`@freesewing/simon`）は**v3.x系API**が広く使われている
- **本プロジェクトは「安定して使えるv3.x API」を前提に動かす**ことを優先
- 将来必要になった時点でv4系APIに追随する方針

### 3. ドメイン層はFreeSewing非依存で設計
**ドメイン層（domain layer）**: このプロジェクト独自の"型紙の世界観"を表現

- `BodyMaster`: 標準ヌード寸法の辞書
- `BodyShapeMaster`: 骨格・姿勢補正の辞書
- `PatternMaster`: スタイル辞書
- `BlockMaster`: FreeSewingのblockと内部block_idを結びつける辞書
- `MeasurementProfile`: 最終的なmeasurementsセット
- `SampleMeta`: メタ情報

**方針**:
- ドメイン層の型・データ構造にはFreeSewingのバージョンを直接書き込まない
- 独自のバージョンスキーマで管理（例: `schema_version: "sample-meta.v1"`）
- `fs_version`はメタ情報としてぶら下げるだけ
- **FreeSewingを別のエンジンに差し替えても再利用できる形**を狙う

### 4. FreeSewing依存は「アダプタ層」に閉じ込める
**アダプタ層（adapter layer）**: `src/freesewing/`配下

- `src/freesewing/draftSimon.ts`
- （将来）`src/freesewing/draftTeagan.ts`など

**含まれるもの**:
- `@freesewing/simon`等の実ライブラリimport
- `new Simon({ measurements })`のようなFS固有の呼び出しAPI
- `.draft().render()`でSVGを取得する部分
- 将来、FS v4でAPIが変わった場合に手を入れるべき部分

**方針**:
- FreeSewingのAPI仕様に触れるコードは`src/freesewing/`以下に集約
- `src/domain/`以下は、FreeSewingの存在を知らない設計
- 将来v3→v4に移行するときは、`src/freesewing/`以下だけを修正

### 5. 現時点の利用前提（v3.x API）
```typescript
import { Simon } from "@freesewing/simon";

const pattern = new Simon({
  measurements: profile.measurements,
  // options: { ... },
  // settings: { ... },
});

const svg = pattern.draft().render();
```

---

## 現状のMVP設計との整合性確認

### ✅ 1. ドメイン層の分離
**現状**: ✅ **整合している**

- `src/domain/measurementBuilder.ts`: FreeSewing非依存で実装
- `src/domain/types.ts`: FreeSewing非依存の型定義
- `src/domain/sampleMeta.ts`: FreeSewing非依存のメタデータ構造

**確認ポイント**:
- ✅ `measurementBuilder.ts`はFreeSewingのimportがない
- ✅ `types.ts`はFreeSewingの型を参照していない
- ✅ `SampleMeta`は`schema_version: "sample-meta.v1"`で独自バージョン管理

### ✅ 2. アダプタ層の分離
**現状**: ✅ **整合している**

- `src/freesewing/draftSimon.ts`: FreeSewing依存が集約されている
- `src/types/freesewing.d.ts`: FreeSewingの型定義（アダプタ層用）

**確認ポイント**:
- ✅ `@freesewing/simon`のimportは`draftSimon.ts`のみ
- ✅ `new Simon()`の呼び出しは`draftSimon.ts`のみ
- ✅ `.draft().render()`の処理は`draftSimon.ts`のみ

### ✅ 3. v3.x APIの使用
**現状**: ✅ **整合している**

- `package.json`: `"@freesewing/simon": "^3.0.0"`
- 実際のバージョン: `3.1.0`
- 呼び出し方法: v3世代の典型パターンに準拠

**確認ポイント**:
- ✅ v3.x系のAPIを使用している
- ✅ `new Simon({ measurements })`の形式
- ✅ `.draft().render()`の形式

### ✅ 4. バージョン管理の分離
**現状**: ✅ **整合している**

- `SampleMeta`: `schema_version: "sample-meta.v1"`（独自バージョン）
- FreeSewingバージョン: `core.freesewing.version: "3.1.0"`（メタ情報として記録）

**確認ポイント**:
- ✅ ドメイン層のバージョンは独自スキーマ
- ✅ FreeSewingバージョンはメタ情報として記録
- ✅ 将来v4に移行しても、`schema_version`は変更不要

---

## 設計原則の確認

### ✅ 原則1: 「FreeSewingはあくまで"型紙を描いてくれるエンジン"」
- ✅ 本質的な"サイズ体系・骨格・スタイル・メタデータ"は、このプロジェクトが独自に持つ世界観として分離
- ✅ BodyMaster/BodyShapeMaster/PatternMasterはFreeSewing非依存

### ✅ 原則2: 「バージョン差分の影響範囲を、アダプタ層だけに閉じ込める」
- ✅ `src/freesewing/`以下だけがFreeSewingのAPIに依存
- ✅ `src/domain/`以下はFreeSewingの世代交代から守られている

### ✅ 原則3: 「ドメイン層はFreeSewingを別のエンジンに差し替えても再利用できる形」
- ✅ 型定義・データ構造がFreeSewing非依存
- ✅ MeasurementProfileはFreeSewing固有の形式を含まない

---

## 今後の拡張時の注意点

### Phase 1以降の実装時
1. **新しいパターンを追加する場合**:
   - `src/freesewing/draft{Pattern}.ts`を追加（アダプタ層）
   - `src/domain/measurementBuilder.ts`にマッピングを追加（ドメイン層）
   - **FreeSewingのAPI変更はアダプタ層のみに影響**

2. **FreeSewing v4に移行する場合**:
   - `src/freesewing/`以下のimport/呼び出し方法を修正
   - `src/domain/`以下は原則手を入れずに済む
   - `SampleMeta`の`schema_version`は変更不要

3. **別のCADエンジンに差し替える場合**:
   - 新しいアダプタ層（例: `src/cad/{engine}/`）を作成
   - ドメイン層はそのまま再利用可能

---

## 認識共有の確認

### ✅ 方針の理解
- [x] FreeSewing本体のバージョンとプロジェクト設計を切り分ける
- [x] ドメイン層はFreeSewing非依存で設計する
- [x] FreeSewing依存はアダプタ層に閉じ込める
- [x] 現時点ではv3.x APIを使用する

### ✅ 現状の整合性
- [x] ドメイン層の分離が実現されている
- [x] アダプタ層の分離が実現されている
- [x] v3.x APIを使用している
- [x] バージョン管理が分離されている

### ✅ 設計原則の遵守
- [x] 「FreeSewingはエンジン」という位置づけ
- [x] 「バージョン差分はアダプタ層に閉じ込める」
- [x] 「ドメイン層は再利用可能な形」

---

## 結論

**FSProtover.mdの方針は、現状のMVP設計と完全に整合している。**

現状の実装は、FSProtover.mdで定義された方針に従っており：
1. ✅ ドメイン層とアダプタ層が適切に分離されている
2. ✅ FreeSewing非依存の設計が実現されている
3. ✅ v3.x APIを使用している
4. ✅ バージョン管理が分離されている

**今後の拡張時も、この方針を維持しながら進める。**

---

**認識共有日時**: 2025-11-10  
**確認者**: AI Assistant  
**ステータス**: ✅ 方針理解・整合性確認完了

