// src/domain/measurementBuilder.ts

import bodyMaster from "../../data/bodyMaster.v1.json";
import bodyShapeMaster from "../../data/bodyShapeMaster.v1.json";
import {
  BodyRow,
  BodyShapeRow,
  Measurements,
  MeasurementProfile,
} from "./types";

const bodyTable = bodyMaster as BodyRow[];
const bodyShapeTable = bodyShapeMaster as BodyShapeRow[];

// ユーティリティ: base + delta
const addDelta = (base: number, delta?: number): number => {
  return base + (delta ?? 0);
};

export interface BuildMeasurementsParams {
  body_id: string;
  fs_pattern_id: string; // 例: "simon"
  shape_id?: string; // 例: "SHAPE_NEKOSE"
  fit_label?: "REG";
  version?: string; // 例: "v1"
}

/**
 * BodyMaster / BodyShapeMaster から測定値を構築し、
 * MeasurementProfile（meta + measurements）を返す。
 *
 * ★前提：
 * - BodyMaster / BodyShapeMaster の長さ系はすべて mm 単位
 * - 角度（shoulder_slope_deg / delta_shoulderSlope_deg）は度
 */
export function buildMeasurementProfile(
  params: BuildMeasurementsParams
): MeasurementProfile {
  const {
    body_id,
    fs_pattern_id,
    shape_id,
    fit_label = "REG",
    version = "v1",
  } = params;

  // MVP検証: マスターデータの存在確認
  if (bodyTable.length === 0) {
    throw new Error(
      "BodyMaster が空です。data/bodyMaster.v1.json を確認してください"
    );
  }

  const body = bodyTable.find((b) => b.body_id === body_id);
  if (!body) {
    const availableIds = bodyTable.map((b) => b.body_id).join(", ");
    throw new Error(
      `BodyMaster に body_id="${body_id}" が見つかりません。\n` +
        `利用可能な body_id: ${availableIds}`
    );
  }

  const shape = shape_id
    ? bodyShapeTable.find((s) => s.shape_id === shape_id)
    : undefined;

  if (shape_id && !shape) {
    const availableIds = bodyShapeTable.map((s) => s.shape_id).join(", ");
    throw new Error(
      `BodyShapeMaster に shape_id="${shape_id}" が見つかりません。\n` +
        `利用可能な shape_id: ${availableIds}`
    );
  }

  const measurements = buildMeasurementsForSimon(body, shape);

  const profile: MeasurementProfile = {
    body_id,
    fs_pattern_id,
    shape_id,
    fit_label,
    version,
    measurements,
  };

  return profile;
}

/**
 * 今回は Simon 専用版。
 * 必要になったら pattern ごとに関数を分ける想定。
 *
 * 前提：
 * - body の長さ系は mm
 * - shape の delta_* も mm
 * - FreeSewing に渡す measurements も mm
 */
function buildMeasurementsForSimon(
  body: BodyRow,
  shape?: BodyShapeRow
): Measurements {
  // BodyShape の補正があれば適用
  const shoulderSlope = addDelta(
    body.shoulder_slope_deg,
    shape?.delta_shoulderSlope_deg
  );

  const shoulderToShoulder = addDelta(
    body.shoulder_to_shoulder_mm,
    shape?.delta_shoulderToShoulder_mm
  );
  const hpsToBust = addDelta(body.hps_to_bust_mm, shape?.delta_hpsToBust_mm);
  const hpsToWaistFront = addDelta(
    body.hps_to_waist_front_mm,
    shape?.delta_hpsToWaistFront_mm
  );
  const hpsToWaistBack = addDelta(
    body.hps_to_waist_back_mm,
    shape?.delta_hpsToWaistBack_mm
  );
  const highBust = addDelta(body.high_bust_mm, shape?.delta_highBust_mm);
  const highBustFront = addDelta(
    body.high_bust_front_mm,
    shape?.delta_highBustFront_mm
  );

  // Simon の必須 measurement 一覧（mm 単位）
  // - Biceps circumference
  // - Chest circumference
  // - HPS to bust
  // - HPS to waist back
  // - Neck circumference
  // - Shoulder to shoulder
  // - Shoulder slope (degree)
  // - Waist to armpit
  // - Waist to hips
  // - Waist circumference
  // - Hips circumference
  // - Shoulder to wrist
  // - Wrist circumference

  const measurements: Measurements = {
    // 体格（すべて mm）
    height: body.stature_mm,

    chest: body.chest_mm,
    waist: body.waist_mm,
    hips: body.hips_mm,

    neck: body.neck_mm,
    biceps: body.biceps_mm,
    wrist: body.wrist_mm,

    shoulderToShoulder,
    shoulderSlope,

    waistToHips: body.waist_to_hips_mm,
    waistToArmpit: body.waist_to_armpit_mm,
    shoulderToWrist: body.shoulder_to_wrist_mm,

    hpsToBust,
    hpsToWaistFront,
    hpsToWaistBack,

    highBust,
    highBustFront,
  };

  return measurements;
}
