// src/domain/types.ts

// ===== BodyMaster =====

export type Gender = "MEN" | "WOM" | "UNI";

export interface BodyRow {
  body_id: string;
  label_ja: string;
  gender: Gender;
  age_band: string; // 例: "20s"
  size_system: string; // 例: "JIS" / "INTERNAL"
  size_code: string; // 例: "M" / "9AR" / "UNIMID"

  // すべて mm 単位
  stature_mm: number; // 身長
  chest_mm: number;
  waist_mm: number;
  hips_mm: number;
  neck_mm: number;
  shoulder_to_shoulder_mm: number;
  shoulder_slope_deg: number;
  biceps_mm: number;
  wrist_mm: number;
  waist_to_hips_mm: number;
  waist_to_armpit_mm: number;
  shoulder_to_wrist_mm: number;
  hps_to_bust_mm: number;
  hps_to_waist_front_mm: number;
  hps_to_waist_back_mm: number;
  high_bust_mm: number;
  high_bust_front_mm: number;
}

// ===== BodyShapeMaster =====

export type PostureType = "NORMAL" | "NEKOSE";
export type ShoulderType = "NORMAL" | "IGARI" | "NADE";
export type ChestType = "NORMAL" | "HATOMUNE";

export interface BodyShapeRow {
  shape_id: string; // SHAPE_NEKOSE など
  label_ja: string;

  posture_type: PostureType;
  shoulder_type: ShoulderType;
  chest_type: ChestType;

  delta_shoulderSlope_deg?: number;

  // すべて mm 単位の補正
  delta_shoulderToShoulder_mm?: number;

  delta_hpsToBust_mm?: number;
  delta_hpsToWaistFront_mm?: number;
  delta_hpsToWaistBack_mm?: number;

  delta_highBust_mm?: number;
  delta_highBustFront_mm?: number;

  note_ja?: string;
}

// ===== BlockMaster =====

export interface BlockRow {
  block_id: string;
  label_ja: string;
  gender: Gender;
  category: string; // "TOP" など
  sub_category: string; // "SHIRT" など
  fs_base_block: string; // "brian" など
  note_ja?: string;
}

// ===== PatternMaster (CORE) =====

export interface PatternCoreRow {
  pattern_id: string;
  label_ja: string;
  fs_pattern_id: string; // "simon"
  body_id_default: string;
  block_id_main: string;
  category: string;
  sub_category: string;
  gender: Gender;
  note_ja?: string;
}

// ===== Measurements / MeasurementProfile =====

export interface Measurements {
  [key: string]: number;
}

export type FitLabel = "REG"; // 当面 REG 固定

export interface MeasurementProfileMeta {
  body_id: string;
  fs_pattern_id: string;
  shape_id?: string; // BodyShape を使う場合にセット
  fit_label: FitLabel;
  version: string; // "v1" など
}

export interface MeasurementProfile extends MeasurementProfileMeta {
  measurements: Measurements;
}

// ===== Features: GarmentMeasures（コア6項目） =====

/**
 * 型紙ジオメトリから抽出する「出来上がり寸法」のコア6項目。
 * - まだ計算していない場合もあるので number | null とする。
 */
export interface GarmentMeasures {
  front_length_mm: number | null; // 前丈
  back_length_mm: number | null; // 後丈
  shoulder_width_mm: number | null; // 肩幅
  chest_circumference_mm: number | null; // 仕上がり胸囲
  hem_circumference_mm: number | null; // 裾まわり
  sleeve_length_mm: number | null; // 袖丈
}

/**
 * SampleMeta 内の features ブロック。
 * 将来、他の feature セット（shape, parts など）もここにぶら下げる想定。
 */
export interface SampleFeatures {
  garment_measures: GarmentMeasures;
}
