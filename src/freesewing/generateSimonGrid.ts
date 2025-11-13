// src/freesewing/generateSimonGrid.ts

import fs from "fs";
import path from "path";
import { Simon } from "@freesewing/simon";

import { buildMeasurementProfile } from "../domain/measurementBuilder";
import { createSampleMeta } from "../domain/sampleMeta";

async function main() {
  const outDir = path.join(__dirname, "../../output");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const fs_pattern_id = "simon";

  // ★ Body と Shape の組み合わせを定義
  const bodies = ["BODY_MEN_20_MID_JIS_M", "BODY_MEN_20_HIGH_JIS_L"];

  const shapes: Array<string | undefined> = [
    undefined, // NOSHAPE
    "SHAPE_NEKOSE", // 猫背
  ];

  const freesewingModule = "@freesewing/simon";
  const freesewingVersion = "3.1.0";

  const patternId = "PATTERN_SIMON_MEN_SHIRT";
  const blockIdMain = "BLOCK_SHIRT_MEN_BRIAN_BASE";

  for (const body_id of bodies) {
    for (const shape_id of shapes) {
      const profile = buildMeasurementProfile({
        body_id,
        fs_pattern_id,
        shape_id,
        fit_label: "REG",
        version: "v1",
      });

      const pattern = new Simon({
        measurements: profile.measurements,
      });

      const svg = pattern.draft().render();

      const shapeLabel = profile.shape_id ?? "NOSHAPE";

      const fileBase = [
        fs_pattern_id,
        body_id,
        shapeLabel,
        profile.version,
      ].join("_");

      const svgPath = path.join(outDir, `${fileBase}.svg`);
      fs.writeFileSync(svgPath, svg, "utf8");
      console.log(`✅ SVG 出力: ${svgPath}`);

      const meta = createSampleMeta({
        sampleId: fileBase,
        profile,
        geometryFile: `${fileBase}.svg`,
        freesewingModule,
        freesewingVersion,
        patternId,
        blockIdMain,
        pipelineVersion: "pipeline.v1",
        notesJa: `Simon × ${body_id} × ${shapeLabel} の自動生成サンプル。`,
      });

      const metaPath = path.join(outDir, `${fileBase}.meta.json`);
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf8");
      console.log(`✅ Meta JSON 出力: ${metaPath}`);
    }
  }

  console.log("🎉 Simon グリッド生成（M/L × NOSHAPE/NEKOSE）完了");
}

main().catch((err) => {
  console.error("❌ generateSimonGrid でエラー:", err);
  process.exit(1);
});
