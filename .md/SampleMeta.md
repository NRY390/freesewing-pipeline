# SampleMeta v1 導入手順（Cursor 用メモ）

目的：

- FreeSewing から出した 1 サンプル（1 着）の SVG に対して、
  - **誰向け・どの骨格・どのパターン・どの原型か**
  - **どのファイルに座標が入っているか**
  - **どんな measurements で生成したか**
    を JSON メタとして保存する。
- 将来、座標から抽出した **features（パターン寸法などの数値）** を追加できる器を作っておく。

## 全体方針

- 新規ファイルで **SampleMeta の型定義＋ファクトリ関数** を作る
- 既存の `draftSimon.ts` から
  - MeasurementProfile を受け取り
  - SVG と同時に `*.meta.json` を出力する

---

## 1. 新規ファイルの追加

### 1-1. `src/domain/sampleMeta.ts` を新規作成

```ts
// src/domain/sampleMeta.ts

import { MeasurementProfile, FitLabel } from "./types";

export type GeometryFormat = "svg" | "dxf";

export interface GeometryFileInfo {
  format: GeometryFormat; // "svg" / "dxf"
  file: string; // 出力ディレクトリからの相対パス
  unit: "mm" | "cm"; // FreeSewing は基本 mm 想定
  role?: "primary" | "preview" | "print";
}

export interface GeometryBlock {
  primary: GeometryFileInfo;
  derivatives?: GeometryFileInfo[];
  coordinate_system?: "pattern-space" | "paper-space";
}

export interface SampleCoreBlock {
  body_id: string; // BodyMaster.body_id
  shape_id?: string | null; // BodyShapeMaster.shape_id（なければ null）

  fs_pattern_id: string; // 例: "simon"
  pattern_id?: string; // 例: "PATTERN_SIMON_MEN_SHIRT"
  block_id_main?: string; // 例: "BLOCK_SHIRT_MEN_BRIAN_BASE"

  fit_label: FitLabel; // 当面 'REG'

  profile_version: string; // MeasurementProfile.version
  pipeline_version?: string;

  generated_at: string; // ISO8601
  freesewing: {
    module: string; // 例: "@freesewing/simon"
    version: string; // 例: "3.1.0"
  };
}

// 将来の features（座標→数値化したパターン寸法）の器

export interface GarmentMeasures {
  front_length_cm?: number;
  back_length_cm?: number;
  shoulder_length_cm?: number;
  bust_line_garment_cm?: number;
  waist_line_garment_cm?: number;
  hem_line_garment_cm?: number;
  sleeve_length_cm?: number;
  sleeve_biceps_garment_cm?: number;
}

export interface StyleDescriptors {
  ease_chest_cm?: number;
  ease_waist_cm?: number;
  ease_hips_cm?: number;
  silhouette_code?: string; // "SLIM" / "REG" / "RELAXED" など
}

export interface FeaturesBlock {
  garment_measures?: GarmentMeasures;
  style_descriptors?: StyleDescriptors;
  notes_ja?: string;
}

export interface SampleMetaV1 {
  schema_version: "sample-meta.v1";

  // 1サンプルを一意に識別
  sample_id: string; // 例: "simon_BODY_MEN_20_MID_JIS_M_NOSHAPE_v1"

  core: SampleCoreBlock;
  geometry: GeometryBlock;
  measurement_profile: MeasurementProfile;

  // features は後で追加していけばよい
  features?: FeaturesBlock;

  tags?: string[];
  notes_ja?: string;
}

export interface CreateSampleMetaArgs {
  sampleId: string; // fileBase 相当
  profile: MeasurementProfile;
  geometryFile: string; // SVG ファイル名（相対パス）
  freesewingModule: string; // 例: "@freesewing/simon"
  freesewingVersion: string; // 例: "3.1.0"
  patternId?: string;
  blockIdMain?: string;
  pipelineVersion?: string;
  notesJa?: string;
}

/**
 * SampleMetaV1 を組み立てるヘルパー関数。
 * draftスクリプト側から呼び出す。
 */
export function createSampleMeta(args: CreateSampleMetaArgs): SampleMetaV1 {
  const {
    sampleId,
    profile,
    geometryFile,
    freesewingModule,
    freesewingVersion,
    patternId,
    blockIdMain,
    pipelineVersion = "pipeline.v1",
    notesJa,
  } = args;

  const core: SampleCoreBlock = {
    body_id: profile.body_id,
    shape_id: profile.shape_id ?? null,
    fs_pattern_id: profile.fs_pattern_id,
    pattern_id: patternId,
    block_id_main: blockIdMain,
    fit_label: profile.fit_label,
    profile_version: profile.version,
    pipeline_version: pipelineVersion,
    generated_at: new Date().toISOString(),
    freesewing: {
      module: freesewingModule,
      version: freesewingVersion,
    },
  };

  const geometry: GeometryBlock = {
    primary: {
      format: "svg",
      file: geometryFile,
      unit: "mm",
      role: "primary",
    },
    derivatives: [],
    coordinate_system: "pattern-space",
  };

  const meta: SampleMetaV1 = {
    schema_version: "sample-meta.v1",
    sample_id: sampleId,
    core,
    geometry,
    measurement_profile: profile,
    // features は最初は空でOK。後で解析スクリプト側で埋めていく。
    tags: [
      profile.fs_pattern_id,
      profile.body_id,
      profile.shape_id ?? "NOSHAPE",
    ],
    notes_ja: notesJa,
  };

  return meta;
}
```
