// src/freesewing/draftSimonNekose.ts

import fs from "fs";
import path from "path";
import { Simon } from "@freesewing/simon";

import { buildMeasurementProfile } from "../domain/measurementBuilder";
import { createSampleMeta } from "../domain/sampleMeta";

async function main() {
  const body_id = "BODY_MEN_20_MID_JIS_M";
  const fs_pattern_id = "simon";

  // ★ここだけ変更：猫背補正をON
  const shape_id: string | undefined = "SHAPE_NEKOSE";

  const profile = buildMeasurementProfile({
    body_id,
    fs_pattern_id,
    shape_id,
    fit_label: "REG",
    version: "v1",
  });

  console.log("MeasurementProfile meta (NEKOSE):", {
    body_id: profile.body_id,
    fs_pattern_id: profile.fs_pattern_id,
    shape_id: profile.shape_id,
    version: profile.version,
  });

  const pattern = new Simon({
    measurements: profile.measurements,
  });

  const svg = pattern.draft().render();

  const outDir = path.join(__dirname, "../../output");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const fileBase = [
    fs_pattern_id,
    body_id,
    profile.shape_id ?? "NOSHAPE",
    profile.version,
  ].join("_");

  const svgPath = path.join(outDir, `${fileBase}.svg`);
  fs.writeFileSync(svgPath, svg, "utf8");
  console.log(`✅ SVG 出力完了 (NEKOSE): ${svgPath}`);

  const freesewingModule = "@freesewing/simon";
  const freesewingVersion = "3.1.0";

  const patternId = "PATTERN_SIMON_MEN_SHIRT";
  const blockIdMain = "BLOCK_SHIRT_MEN_BRIAN_BASE";

  const meta = createSampleMeta({
    sampleId: fileBase,
    profile,
    geometryFile: `${fileBase}.svg`,
    freesewingModule,
    freesewingVersion,
    patternId,
    blockIdMain,
    pipelineVersion: "pipeline.v1",
    notesJa: "Simon × MEN標準体型。猫背補正 SHAPE_NEKOSE。",
  });

  const metaPath = path.join(outDir, `${fileBase}.meta.json`);
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf8");
  console.log(`✅ Meta JSON 出力完了 (NEKOSE): ${metaPath}`);
}

main().catch((err) => {
  console.error("❌ draftSimonNekose でエラー:", err);
  process.exit(1);
});
