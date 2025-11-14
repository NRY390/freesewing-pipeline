// src/tools/summarizeFeatures.ts
import * as fs from "fs";
import * as path from "path";
import { globSync } from "glob";

type MetaJson = {
  schema_version?: string;
  sample_id: string;
  core?: {
    body_id?: string;
    shape_id?: string | null;
    fs_pattern_id?: string;
    pattern_id?: string;
    fit_label?: string;
    profile_version?: string;
    pipeline_version?: string;
    generated_at?: string;
    freesewing?: {
      module?: string;
      version?: string;
    };
  };
  measurement_profile?: {
    body_id?: string;
    fs_pattern_id?: string;
    fit_label?: string;
    version?: string;
    measurements?: Record<string, number>;
  };
  features?: {
    garment_measures?: Record<string, number | null>;
  };
  features_meta?: {
    mapping?: {
      pattern?: string;
      version?: string;
    };
    extracted_at?: string;
  };
  tags?: string[];
  notes_ja?: string;
};

/**
 * meta.jsonファイルを読み込む
 */
function loadMeta(metaPath: string): MetaJson | null {
  try {
    const content = fs.readFileSync(metaPath, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

/**
 * CSVの1行を生成（エスケープ処理付き）
 */
function csvEscape(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * features_summary.csvを生成
 */
function generateCsv(
  samples: MetaJson[],
  outputPath: string
): void {
  if (samples.length === 0) {
    console.warn("⚠️  No samples found");
    return;
  }

  // すべてのサンプルからカラムを収集
  const columns = new Set<string>([
    "sample_id",
    "body_id",
    "shape_id",
    "fs_pattern_id",
    "fit_label",
    "freesewing_version",
  ]);

  // measurement_profile.measurements のカラム
  samples.forEach((sample) => {
    if (sample.measurement_profile?.measurements) {
      Object.keys(sample.measurement_profile.measurements).forEach((k) =>
        columns.add(`measurement_${k}`)
      );
    }
  });

  // features.garment_measures のカラム
  samples.forEach((sample) => {
    if (sample.features?.garment_measures) {
      Object.keys(sample.features.garment_measures).forEach((k) =>
        columns.add(`feature_${k}`)
      );
    }
  });

  // その他のメタ情報
  columns.add("mapping_version");
  columns.add("extracted_at");
  columns.add("tags");

  const columnArray = Array.from(columns).sort();

  // CSVヘッダー
  const lines: string[] = [columnArray.map(csvEscape).join(",")];

  // データ行
  for (const sample of samples) {
    const row: Record<string, any> = {};

    // 基本情報
    row.sample_id = sample.sample_id || "";
    row.body_id = sample.core?.body_id || sample.measurement_profile?.body_id || "";
    row.shape_id = sample.core?.shape_id || "";
    row.fs_pattern_id = sample.core?.fs_pattern_id || sample.measurement_profile?.fs_pattern_id || "";
    row.fit_label = sample.core?.fit_label || sample.measurement_profile?.fit_label || "";
    row.freesewing_version = sample.core?.freesewing?.version || "";

    // measurement_profile.measurements
    if (sample.measurement_profile?.measurements) {
      for (const [k, v] of Object.entries(
        sample.measurement_profile.measurements
      )) {
        row[`measurement_${k}`] = v;
      }
    }

    // features.garment_measures
    if (sample.features?.garment_measures) {
      for (const [k, v] of Object.entries(
        sample.features.garment_measures
      )) {
        row[`feature_${k}`] = v;
      }
    }

    // その他のメタ情報
    row.mapping_version = sample.features_meta?.mapping?.version || "";
    row.extracted_at = sample.features_meta?.extracted_at || "";
    row.tags = sample.tags?.join(";") || "";

    // CSV行を生成
    const csvRow = columnArray.map((col) => csvEscape(row[col] || ""));
    lines.push(csvRow.join(","));
  }

  fs.writeFileSync(outputPath, lines.join("\n") + "\n");
  console.log(`✅ Generated CSV: ${outputPath} (${samples.length} samples)`);
}

/**
 * samples.jsonlを生成
 */
function generateJsonl(
  samples: MetaJson[],
  outputPath: string
): void {
  const lines: string[] = [];

  for (const sample of samples) {
    // メタ＋featuresを1行のJSONとして出力
    const record = {
      sample_id: sample.sample_id,
      core: sample.core,
      measurement_profile: sample.measurement_profile,
      features: sample.features,
      features_meta: sample.features_meta,
      tags: sample.tags,
      notes_ja: sample.notes_ja,
    };
    lines.push(JSON.stringify(record));
  }

  fs.writeFileSync(outputPath, lines.join("\n") + "\n");
  console.log(`✅ Generated JSONL: ${outputPath} (${samples.length} samples)`);
}

/**
 * outputディレクトリ配下のmeta.jsonファイルを走査
 */
function scanMetaFiles(outputDir: string): MetaJson[] {
  const pattern = path.join(outputDir, "*_v1.meta.json");
  const files = globSync(pattern);

  const samples: MetaJson[] = [];

  for (const file of files) {
    const meta = loadMeta(file);
    if (meta && meta.features?.garment_measures) {
      samples.push(meta);
    }
  }

  // sample_idでソート
  samples.sort((a, b) => (a.sample_id || "").localeCompare(b.sample_id || ""));

  return samples;
}

// CLI実行
if (require.main === module) {
  const args = process.argv.slice(2);
  let outputDir = "output";
  let datasetDir = "dataset.v1";

  // 引数解析
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--output-dir") outputDir = args[++i];
    else if (arg === "--dataset-dir") datasetDir = args[++i];
  }

  console.log(`Scanning meta.json files in: ${outputDir}`);
  const samples = scanMetaFiles(outputDir);

  if (samples.length === 0) {
    console.error("❌ No samples found with features");
    process.exit(1);
  }

  console.log(`Found ${samples.length} sample(s)`);

  // datasetディレクトリを作成
  fs.mkdirSync(datasetDir, { recursive: true });

  // CSV生成
  const csvPath = path.join(datasetDir, "features_summary.csv");
  generateCsv(samples, csvPath);

  // JSONL生成
  const jsonlPath = path.join(datasetDir, "samples.jsonl");
  generateJsonl(samples, jsonlPath);

  console.log(`\n✅ Dataset generation completed: ${datasetDir}`);
}

