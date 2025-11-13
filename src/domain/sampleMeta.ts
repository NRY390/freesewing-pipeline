// src/domain/sampleMeta.ts

import { MeasurementProfile, GarmentMeasures, SampleFeatures } from "./types";

export interface CreateSampleMetaParams {
  sampleId: string;
  profile: MeasurementProfile;
  geometryFile: string;
  freesewingModule: string;
  freesewingVersion: string;
  patternId: string;
  blockIdMain: string;
  pipelineVersion: string;
  notesJa?: string;

  /**
   * 型紙から計算した出来上がり寸法（コア6項目）を
   * すでに持っている場合はここに渡す。
   * まだ未実装段階では省略可（null で初期化される）。
   */
  garmentMeasures?: Partial<GarmentMeasures>;
}

/**
 * SampleMeta の実体。必要なら外部でも型として使えるように export。
 */
export interface SampleMeta {
  schema_version: string;
  sample_id: string;
  core: {
    body_id: string;
    shape_id: string | null;
    fs_pattern_id: string;
    pattern_id: string;
    block_id_main: string;
    fit_label: string;
    profile_version: string;
    pipeline_version: string;
    generated_at: string;
    freesewing: {
      module: string;
      version: string;
    };
  };
  geometry: {
    primary: {
      format: "svg";
      file: string;
      unit: "mm";
      role: "primary";
    };
    derivatives: any[];
    coordinate_system: string;
  };
  measurement_profile: MeasurementProfile;

  /**
   * 今回追加する features ブロック。
   * garment_measures にはコア6項目が必ず揃う。
   */
  features: SampleFeatures;

  tags: string[];
  notes_ja: string;
}

/**
 * GarmentMeasures のデフォルト値。
 * - まだジオメトリ解析が実装されていない段階では、すべて null。
 * - 部分的に値を渡した場合は、その項目だけ上書きされる。
 */
const defaultGarmentMeasures: GarmentMeasures = {
  front_length_mm: null,
  back_length_mm: null,
  shoulder_width_mm: null,
  chest_circumference_mm: null,
  hem_circumference_mm: null,
  sleeve_length_mm: null,
};

/**
 * SampleMeta を構築するユーティリティ関数。
 * - これまでの core / geometry / measurement_profile に加えて
 * - features.garment_measures（コア6項目）を含める。
 */
export function createSampleMeta(params: CreateSampleMetaParams): SampleMeta {
  const {
    sampleId,
    profile,
    geometryFile,
    freesewingModule,
    freesewingVersion,
    patternId,
    blockIdMain,
    pipelineVersion,
    notesJa,
    garmentMeasures,
  } = params;

  const generatedAt = new Date().toISOString();

  const features: SampleFeatures = {
    garment_measures: {
      ...defaultGarmentMeasures,
      ...(garmentMeasures ?? {}),
    },
  };

  return {
    schema_version: "sample-meta.v1",
    sample_id: sampleId,
    core: {
      body_id: profile.body_id,
      shape_id: profile.shape_id ?? null,
      fs_pattern_id: profile.fs_pattern_id,
      pattern_id: patternId,
      block_id_main: blockIdMain,
      fit_label: profile.fit_label,
      profile_version: profile.version,
      pipeline_version: pipelineVersion,
      generated_at: generatedAt,
      freesewing: {
        module: freesewingModule,
        version: freesewingVersion,
      },
    },
    geometry: {
      primary: {
        format: "svg",
        file: geometryFile,
        unit: "mm",
        role: "primary",
      },
      derivatives: [],
      coordinate_system: "pattern-space",
    },
    measurement_profile: profile,
    features,
    tags: [
      profile.fs_pattern_id,
      profile.body_id,
      profile.shape_id ?? "NOSHAPE",
    ],
    notes_ja: notesJa ?? "",
  };
}
