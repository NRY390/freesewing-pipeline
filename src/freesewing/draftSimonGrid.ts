// src/freesewing/draftSimonGrid.ts
import { Simon } from "@freesewing/simon";
import * as fs from "fs";
import * as path from "path";
import { buildMeasurementProfile } from "../domain/measurementBuilder";
import { extractGarmentMeasuresFromSvg } from "../tools/extractFromSvg";

// 出力先
const OUTDIR = path.resolve("./output");

// v1: 4サンプル（M/L × NOSHAPE/NEKOSE）
const CASES = [
  { body_id: "BODY_MEN_20_MID_JIS_M", shape_id: undefined },
  { body_id: "BODY_MEN_20_MID_JIS_M", shape_id: "SHAPE_NEKOSE" },
  { body_id: "BODY_MEN_20_HIGH_JIS_L", shape_id: undefined },
  { body_id: "BODY_MEN_20_HIGH_JIS_L", shape_id: "SHAPE_NEKOSE" },
];

function ensureOutdir() {
  if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });
}

function sampleId(body_id: string, shape_id?: string) {
  const shape = shape_id ?? "NOSHAPE";
  return `simon_${body_id}_${shape}_v1`;
}

function writeFileSafe(p: string, data: string) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, data);
}

async function main() {
  ensureOutdir();

  // マッピング定義（先に data/mapping.simon.v1.json を実IDで更新しておく）
  const mapping = JSON.parse(
    fs.readFileSync("data/mapping.simon.features.v1.json", "utf-8")
  );

  for (const c of CASES) {
    const profile = buildMeasurementProfile({
      body_id: c.body_id,
      fs_pattern_id: "simon",
      shape_id: c.shape_id,
      version: "v1",
      fit_label: "REG",
    });

    const simon = new Simon({ measurements: profile.measurements });
    const draft = simon.draft();
    const svg = draft.render();

    // features 抽出
    const garment_measures = extractGarmentMeasuresFromSvg(svg, mapping);

    // 生成ファイル名
    const id = sampleId(c.body_id, c.shape_id);
    const svgPath = path.join(OUTDIR, `${id}.svg`);
    const metaPath = path.join(OUTDIR, `${id}.meta.json`);

    // SVG 保存
    writeFileSafe(svgPath, svg);

    // meta 組み立て（既存の構造に合わせて作成）
    const meta = {
      schema_version: "sample-meta.v1",
      sample_id: id,
      core: {
        body_id: c.body_id,
        shape_id: c.shape_id ?? null,
        fs_pattern_id: "simon",
        pattern_id: "PATTERN_SIMON_MEN_SHIRT",
        block_id_main: "BLOCK_SHIRT_MEN_BRIAN_BASE",
        fit_label: "REG",
        profile_version: "v1",
        pipeline_version: "pipeline.v1",
        generated_at: new Date().toISOString(),
        freesewing: {
          module: "@freesewing/simon",
          version: "3.1.0",
        },
      },
      geometry: {
        primary: {
          format: "svg",
          file: `${id}.svg`,
          unit: "mm",
          role: "primary",
        },
        derivatives: [],
        coordinate_system: "pattern-space",
      },
      measurement_profile: profile,
      features: {
        garment_measures,
      },
      tags: ["simon", c.body_id, c.shape_id ?? "NOSHAPE"],
      notes_ja: "自動生成（features埋め込み版）",
    };

    writeFileSafe(metaPath, JSON.stringify(meta, null, 2));
    console.log(`✅ Wrote: ${svgPath} / ${metaPath}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
