# 01_implementation-plan.md

FreeSewing 型紙生成パイプライン – 実装計画

このドキュメントは、`00_system-design.md` の設計図に基づいて、  
段階的に実装を進めるための計画書です。

---

## 実装フェーズ概要

```
Phase 0: MVP検証（現在）
  ↓
Phase 1: PatternMaster活用とパターン汎用化
  ↓
Phase 2: バッチ処理エンジン実装
  ↓
Phase 3: 複数パターン対応拡張
  ↓
Phase 4: 高度な機能と運用最適化
```

---

## Phase 0: MVP検証（現在の状態）

### 目標
- Simonパターンが正しく生成できることを確認
- 基本的なエラーハンドリングと検証機能の実装

### 実装状況
✅ **完了済み**

- `draftSimon.ts`: Simonパターンの単一生成
- `measurementBuilder.ts`: MeasurementProfile構築（Simon専用）
- マスターデータ検証とエラーハンドリング
- SVG生成の検証機能

### 検証項目
- [x] `npm run draft:simon` で正常にSVG生成されるか ✅
- [x] 出力ファイルが正しい形式か ✅
- [x] エラーメッセージが適切か ✅

### 検証結果（2025-11-10）
✅ **Phase 0 完了**

- SVG生成成功（48,260 bytes）
- 出力ファイル: `output/simon_BODY_MEN_20_MID_JIS_M_NOSHAPE_v1.svg`
- 測定値17項目が正しく構築され、FreeSewingに渡されている
- エラーハンドリングが正常に動作

**解決した問題**:
- TypeScriptの型定義エラー → `src/types/freesewing.d.ts`を作成して解決
- tsconfig.jsonに`moduleResolution: "node"`と`allowSyntheticDefaultImports: true`を追加

### 次のステップ
Phase 0の動作確認完了。Phase 1に進む準備が整いました。

---

## Phase 1: PatternMaster活用とパターン汎用化

### 目標
- `PatternMaster`を活用したパターン管理
- `measurementBuilder.ts`の汎用化（Simon専用から脱却）
- パターンごとの測定値マッピングテーブルの実装

### 実装内容

#### 1.1 PatternMaster読み込みとパターン情報取得
**ファイル**: `src/domain/patternLoader.ts` (新規)

```typescript
// PatternMasterからパターン情報を取得するユーティリティ
export function loadPattern(pattern_id: string): PatternCoreRow
export function getPatternByFsId(fs_pattern_id: string): PatternCoreRow
export function getAllPatterns(): PatternCoreRow[]
```

**責務**:
- `patternMaster.core.v1.json`の読み込み
- パターン情報の検索・取得
- デフォルトbody_idの取得

#### 1.2 パターンごとの測定値マッピングテーブル
**ファイル**: `src/domain/measurementMappings.ts` (新規)

```typescript
// パターンごとに必要な測定値とBodyMasterからのマッピングを定義
export interface MeasurementMapping {
  fsKey: string;        // FreeSewingが期待するキー名
  bodyKey: string;      // BodyMasterのキー名
  shapeDeltaKey?: string; // BodyShapeMasterの差分キー（オプション）
  transform?: (value: number) => number; // 変換関数（オプション）
}

export const PATTERN_MEASUREMENT_MAPPINGS: Record<string, MeasurementMapping[]> = {
  simon: [
    { fsKey: "height", bodyKey: "stature_cm" },
    { fsKey: "chest", bodyKey: "chest_cm" },
    { fsKey: "waist", bodyKey: "waist_cm" },
    { fsKey: "hips", bodyKey: "hips_cm" },
    { fsKey: "neck", bodyKey: "neck_cm" },
    { fsKey: "biceps", bodyKey: "biceps_cm" },
    { fsKey: "wrist", bodyKey: "wrist_cm" },
    { fsKey: "shoulderToShoulder", bodyKey: "shoulder_to_shoulder_cm", shapeDeltaKey: "delta_shoulderToShoulder_cm" },
    { fsKey: "shoulderSlope", bodyKey: "shoulder_slope_deg", shapeDeltaKey: "delta_shoulderSlope_deg" },
    { fsKey: "waistToHips", bodyKey: "waist_to_hips_cm" },
    { fsKey: "waistToArmpit", bodyKey: "waist_to_armpit_cm" },
    { fsKey: "shoulderToWrist", bodyKey: "shoulder_to_wrist_cm" },
    { fsKey: "hpsToBust", bodyKey: "hps_to_bust_cm", shapeDeltaKey: "delta_hpsToBust_cm" },
    { fsKey: "hpsToWaistFront", bodyKey: "hps_to_waist_front_cm", shapeDeltaKey: "delta_hpsToWaistFront_cm" },
    { fsKey: "hpsToWaistBack", bodyKey: "hps_to_waist_back_cm", shapeDeltaKey: "delta_hpsToWaistBack_cm" },
    { fsKey: "highBust", bodyKey: "high_bust_cm", shapeDeltaKey: "delta_highBust_cm" },
    { fsKey: "highBustFront", bodyKey: "high_bust_front_cm", shapeDeltaKey: "delta_highBustFront_cm" },
  ],
  // 将来: brian, bella, charlie などを追加
};
```

**責務**:
- パターンごとの測定値マッピング定義
- BodyMaster → FreeSewing measurements の変換ロジック
- BodyShape補正の適用

#### 1.3 measurementBuilder.tsの汎用化
**ファイル**: `src/domain/measurementBuilder.ts` (改修)

```typescript
// buildMeasurementsForSimon を汎用化
function buildMeasurementsForPattern(
  fs_pattern_id: string,
  body: BodyRow,
  shape?: BodyShapeRow
): Measurements {
  const mappings = PATTERN_MEASUREMENT_MAPPINGS[fs_pattern_id];
  if (!mappings) {
    throw new Error(`パターン "${fs_pattern_id}" の測定値マッピングが定義されていません`);
  }

  const measurements: Measurements = {};
  for (const mapping of mappings) {
    let value = body[mapping.bodyKey];
    
    // BodyShape補正の適用
    if (mapping.shapeDeltaKey && shape) {
      const delta = shape[mapping.shapeDeltaKey];
      if (delta !== undefined) {
        value = addDelta(value, delta);
      }
    }
    
    // 変換関数の適用
    if (mapping.transform) {
      value = mapping.transform(value);
    }
    
    measurements[mapping.fsKey] = value;
  }
  
  return measurements;
}
```

**変更点**:
- `buildMeasurementsForSimon` → `buildMeasurementsForPattern`に汎用化
- `fs_pattern_id`を引数に追加
- マッピングテーブルから動的に測定値を構築

#### 1.4 draftSimon.tsのPatternMaster活用
**ファイル**: `src/freesewing/draftSimon.ts` (改修)

```typescript
import { loadPattern } from "../domain/patternLoader";

async function main() {
  // PatternMasterからパターン情報を取得
  const patternInfo = loadPattern("PATTERN_SIMON_MEN_SHIRT");
  // または: getPatternByFsId("simon")
  
  const body_id = patternInfo.body_id_default; // PatternMasterから取得
  const fs_pattern_id = patternInfo.fs_pattern_id;
  const shape_id: string | undefined = undefined;
  
  // 以降は既存の処理と同じ
}
```

**変更点**:
- ハードコードされた`body_id`と`fs_pattern_id`をPatternMasterから取得
- デフォルト値の一元管理

### 成果物
- ✅ PatternMasterを活用したパターン管理
- ✅ パターン汎用化による拡張性向上
- ✅ 新しいパターン追加が容易に

### 検証項目
- [ ] PatternMasterから正しくパターン情報を取得できるか
- [ ] 汎用化後もSimonパターンが正常に生成されるか
- [ ] エラーメッセージが適切か（未定義パターンの場合など）

---

## Phase 2: バッチ処理エンジン実装

### 目標
- 複数のbody_id × 複数のshape_idの組み合わせで一括生成
- 進捗表示とエラーログ出力
- 統計情報の出力

### 実装内容

#### 2.1 バッチ処理設定
**ファイル**: `src/batch/batchConfig.ts` (新規)

```typescript
export interface BatchConfig {
  pattern_ids?: string[];  // 生成するパターンID（未指定なら全パターン）
  body_ids?: string[];     // 生成するbody_id（未指定なら全body）
  shape_ids?: (string | null)[]; // 生成するshape_id（null=補正なし）
  output_dir?: string;     // 出力ディレクトリ
  continue_on_error?: boolean; // エラー時も続行するか
}

export const DEFAULT_BATCH_CONFIG: BatchConfig = {
  continue_on_error: true,
  output_dir: "output",
};
```

#### 2.2 バッチ処理エンジン
**ファイル**: `src/batch/batchProcessor.ts` (新規)

```typescript
import { BatchConfig } from "./batchConfig";
import { getAllPatterns } from "../domain/patternLoader";
import { getAllBodies } from "../domain/bodyLoader"; // 新規
import { getAllShapes } from "../domain/shapeLoader"; // 新規
import { buildMeasurementProfile } from "../domain/measurementBuilder";
import { generatePattern } from "../freesewing/patternGenerator"; // 新規

export interface BatchResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{
    pattern_id: string;
    body_id: string;
    shape_id: string | null;
    error: string;
  }>;
}

export async function processBatch(config: BatchConfig): Promise<BatchResult> {
  const patterns = config.pattern_ids
    ? config.pattern_ids.map(id => loadPattern(id))
    : getAllPatterns();
  
  const bodies = config.body_ids
    ? config.body_ids.map(id => getBody(id))
    : getAllBodies();
  
  const shapes = config.shape_ids ?? [null, ...getAllShapes().map(s => s.shape_id)];
  
  const result: BatchResult = {
    total: 0,
    success: 0,
    failed: 0,
    errors: [],
  };
  
  for (const pattern of patterns) {
    for (const body of bodies) {
      for (const shapeId of shapes) {
        result.total++;
        
        try {
          const profile = buildMeasurementProfile({
            body_id: body.body_id,
            fs_pattern_id: pattern.fs_pattern_id,
            shape_id: shapeId ?? undefined,
            fit_label: "REG",
            version: "v1",
          });
          
          await generatePattern(pattern, profile, config.output_dir);
          result.success++;
          
          console.log(`✅ [${result.success}/${result.total}] ${pattern.fs_pattern_id}_${body.body_id}_${shapeId ?? "NOSHAPE"}`);
        } catch (err) {
          result.failed++;
          const errorMsg = err instanceof Error ? err.message : String(err);
          result.errors.push({
            pattern_id: pattern.pattern_id,
            body_id: body.body_id,
            shape_id: shapeId,
            error: errorMsg,
          });
          
          console.error(`❌ [${result.failed}/${result.total}] ${pattern.fs_pattern_id}_${body.body_id}_${shapeId ?? "NOSHAPE"}: ${errorMsg}`);
          
          if (!config.continue_on_error) {
            throw err;
          }
        }
      }
    }
  }
  
  return result;
}
```

#### 2.3 パターン生成の共通化
**ファイル**: `src/freesewing/patternGenerator.ts` (新規)

```typescript
import { PatternCoreRow } from "../domain/types";
import { MeasurementProfile } from "../domain/types";
import { Simon } from "@freesewing/simon";
// 将来: import { Brian } from "@freesewing/brian";
// 将来: import { Bella } from "@freesewing/bella";

export async function generatePattern(
  pattern: PatternCoreRow,
  profile: MeasurementProfile,
  outputDir: string
): Promise<string> {
  // パターンクラスの動的インスタンス化
  const PatternClass = getPatternClass(pattern.fs_pattern_id);
  const patternInstance = new PatternClass({
    measurements: profile.measurements,
  });
  
  const svg = patternInstance.draft().render();
  
  // ファイル出力
  const fileName = buildFileName(pattern, profile);
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, svg, "utf8");
  
  return filePath;
}

function getPatternClass(fs_pattern_id: string): any {
  const patternMap: Record<string, any> = {
    simon: Simon,
    // 将来: brian: Brian, bella: Bella, ...
  };
  
  const PatternClass = patternMap[fs_pattern_id];
  if (!PatternClass) {
    throw new Error(`パターン "${fs_pattern_id}" のクラスが定義されていません`);
  }
  
  return PatternClass;
}
```

#### 2.4 バッチ処理CLI
**ファイル**: `src/batch/batchCli.ts` (新規)

```typescript
import { processBatch, BatchConfig } from "./batchProcessor";

async function main() {
  const config: BatchConfig = {
    // コマンドライン引数から取得（将来実装）
    // または設定ファイルから読み込み
  };
  
  console.log("🚀 バッチ処理開始...");
  const result = await processBatch(config);
  
  console.log("\n📊 バッチ処理結果:");
  console.log(`  総数: ${result.total}`);
  console.log(`  成功: ${result.success}`);
  console.log(`  失敗: ${result.failed}`);
  
  if (result.errors.length > 0) {
    console.log("\n❌ エラー詳細:");
    result.errors.forEach(err => {
      console.log(`  - ${err.pattern_id} / ${err.body_id} / ${err.shape_id ?? "NOSHAPE"}: ${err.error}`);
    });
  }
}

main().catch(console.error);
```

**package.jsonに追加**:
```json
{
  "scripts": {
    "batch": "npm run build && node dist/batch/batchCli.js"
  }
}
```

### 成果物
- ✅ 複数組み合わせの一括生成
- ✅ 進捗表示とエラーログ
- ✅ 統計情報の出力

### 検証項目
- [ ] 複数のbody_id × shape_idで正常に生成されるか
- [ ] エラー時も処理が継続するか（continue_on_error=trueの場合）
- [ ] 統計情報が正確か

---

## Phase 3: 複数パターン対応拡張

### 目標
- Brian, Bella, Charlie などの他のパターンに対応
- パターンごとの特性（必要な測定値の違い）に対応

### 実装内容

#### 3.1 新しいパターンの追加手順

1. **FreeSewingパッケージのインストール**
   ```bash
   npm install @freesewing/brian @freesewing/bella
   ```

2. **PatternMasterへの追加**
   `data/patternMaster.core.v1.json`に新しいパターンを追加

3. **測定値マッピングの定義**
   `src/domain/measurementMappings.ts`にマッピングを追加

4. **パターンクラスの登録**
   `src/freesewing/patternGenerator.ts`の`patternMap`に追加

5. **動作確認**
   バッチ処理で新パターンが正常に生成されるか確認

#### 3.2 パターンごとのオプション・設定対応
**ファイル**: `src/domain/patternOptions.ts` (新規)

```typescript
export interface PatternOptions {
  simon?: {
    collarHeight?: number;
    cuffStyle?: "rounded" | "barrel";
  };
  brian?: {
    // Brian固有のオプション
  };
  // ...
}

export function applyPatternOptions(
  fs_pattern_id: string,
  options: PatternOptions
): any {
  // パターンごとのオプションを適用
}
```

### 成果物
- ✅ 複数パターンへの対応
- ✅ パターン追加の標準化された手順

---

## Phase 4: 高度な機能と運用最適化

### 目標
- DXF出力対応
- 設定ファイル（JSON/YAML）による柔軟な設定
- パフォーマンス最適化
- ログ・監視機能

### 実装内容（概要）

#### 4.1 DXF出力対応
- FreeSewingのDXFエクスポート機能を活用
- SVGとDXFの両方を生成するオプション

#### 4.2 設定ファイル対応
- `config/batch-config.json`でバッチ処理の設定を外部化
- 環境変数による設定の上書き

#### 4.3 パフォーマンス最適化
- 並列処理（worker threads）
- キャッシュ機能（同じ組み合わせの再生成をスキップ）

#### 4.4 ログ・監視
- 構造化ログ（JSON形式）
- メトリクス出力（生成時間、成功率など）

---

## 実装の優先順位

### 最優先（MVP検証後すぐ）
1. **Phase 1**: PatternMaster活用とパターン汎用化
   - 拡張性の基盤を確立
   - 新しいパターン追加が容易に

### 高優先度
2. **Phase 2**: バッチ処理エンジン実装
   - 大量生成の実現
   - 運用効率の向上

### 中優先度
3. **Phase 3**: 複数パターン対応拡張
   - 実際のニーズに応じて段階的に追加

### 低優先度（将来）
4. **Phase 4**: 高度な機能と運用最適化
   - 必要に応じて実装

---

## 実装時の注意事項

### 1. 既存機能の保護
- 各フェーズで既存の機能が正常に動作することを確認
- 段階的な移行を心がける

### 2. エラーハンドリング
- マスターデータの不整合を検出
- FreeSewingのエラーを適切に処理
- ユーザーフレンドリーなエラーメッセージ

### 3. テスト
- 各フェーズで動作確認
- エッジケースのテスト（存在しないID、空のデータなど）

### 4. ドキュメント
- コードコメントの充実
- 設計図の更新
- 実装計画の進捗管理

---

## 次のアクション

1. **Phase 0の動作確認**
   - `npm run draft:simon`を実行
   - 出力ファイルを確認
   - エラーがないか確認

2. **Phase 1の実装開始**
   - `patternLoader.ts`の実装
   - `measurementMappings.ts`の実装
   - `measurementBuilder.ts`の汎用化

3. **進捗管理**
   - このドキュメントを更新して進捗を記録
   - 各フェーズ完了時にチェックリストを更新

---

**最終更新**: 2025-11-10  
**ステータス**: Phase 0完了 ✅、Phase 1準備中

