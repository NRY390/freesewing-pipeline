// src/tools/extractFromSvg.ts
import { DOMParser } from "@xmldom/xmldom";
import * as xpath from "xpath";
import { svgPathProperties } from "svg-path-properties";
import * as fs from "fs";
import * as path from "path";

type Pt = { x: number; y: number };
type BBox = { x: number; y: number; width: number; height: number };

// 旧形式（後方互換性のため）
type LegacyFeatureDef =
  | { key: string; method: "point_distance"; from_id: string; to_id: string }
  | { key: string; method: "path_length_sum"; path_ids: string[] };

// 新形式（手順書準拠）
type FeatureDef =
  | { method: "bbox-height"; groups: string[]; notes_ja?: string }
  | { method: "y-extent"; groups: string[]; notes_ja?: string } // Y方向の端点測定（精度向上）
  | { method: "path-sum"; path_ids: string[]; notes_ja?: string }
  | {
      method: "point_distance";
      from_id: string;
      to_id: string;
      notes_ja?: string;
    };

interface Mapping {
  features?: Record<string, FeatureDef>; // 新形式（オブジェクト）
  features_legacy?: LegacyFeatureDef[]; // 旧形式（配列）- 後方互換性
}

function getPoint(doc: Document, id: string): Pt | null {
  const node = xpath.select1(`//*[@id="${id}"]`, doc) as Element | undefined;
  if (!node) return null;

  // 代表例：circleで座標を持つ場合
  const cx = Number(node.getAttribute("cx"));
  const cy = Number(node.getAttribute("cy"));
  if (Number.isFinite(cx) && Number.isFinite(cy)) return { x: cx, y: cy };

  // 他の表現（<use>や<text>等）の場合は必要に応じて拡張
  return null;
}

function getPathLength(doc: Document, id: string): number | null {
  // local-name() で名前空間を回避
  const node = xpath.select1(
    `//*[local-name()='path' and @id="${id}"]`,
    doc
  ) as any;
  if (!node) return null;

  const d = node.getAttribute?.("d");
  if (!d) return null;

  const props = new svgPathProperties(d);
  return props.getTotalLength();
}

/**
 * 要素またはグループの外接矩形（Bounding Box）を計算
 */
function getBBox(doc: Document, groupId: string): BBox | null {
  // local-name() で名前空間を回避して、グループ内のすべての要素を取得
  const groupNode = xpath.select1(`//*[@id="${groupId}"]`, doc) as any;
  if (!groupNode) return null;

  // グループ内のすべての path, circle, rect, line などの描画要素を取得
  const elements = xpath.select(
    `.//*[local-name()='path' or local-name()='circle' or local-name()='rect' or local-name()='line' or local-name()='polyline' or local-name()='polygon']`,
    groupNode
  ) as any[];

  if (elements.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    const tagName = String(el.nodeName || "").toLowerCase();
    const localName = String(el.localName || tagName).toLowerCase();

    if (localName === "path") {
      const d = el.getAttribute?.("d");
      if (d) {
        try {
          const props = new svgPathProperties(d);
          const length = props.getTotalLength();
          // パスの各点をサンプリングしてbboxを計算
          const samples = 20;
          for (let i = 0; i <= samples; i++) {
            const point = props.getPointAtLength((length * i) / samples);
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
          }
        } catch (e) {
          // エラー時はスキップ
        }
      }
    } else if (localName === "circle") {
      const cx = Number(el.getAttribute?.("cx") || 0);
      const cy = Number(el.getAttribute?.("cy") || 0);
      const r = Number(el.getAttribute?.("r") || 0);
      minX = Math.min(minX, cx - r);
      minY = Math.min(minY, cy - r);
      maxX = Math.max(maxX, cx + r);
      maxY = Math.max(maxY, cy + r);
    } else if (localName === "rect") {
      const x = Number(el.getAttribute?.("x") || 0);
      const y = Number(el.getAttribute?.("y") || 0);
      const width = Number(el.getAttribute?.("width") || 0);
      const height = Number(el.getAttribute?.("height") || 0);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    }
    // line, polyline, polygon などは必要に応じて拡張
  }

  if (
    !isFinite(minX) ||
    !isFinite(minY) ||
    !isFinite(maxX) ||
    !isFinite(maxY)
  ) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * 複数のグループから結合された外接矩形の高さを計算
 */
function getBBoxHeightFromGroups(
  doc: Document,
  groupIds: string[]
): number | null {
  let combinedMinY = Infinity;
  let combinedMaxY = -Infinity;
  let foundAny = false;

  for (const groupId of groupIds) {
    const bbox = getBBox(doc, groupId);
    if (bbox) {
      combinedMinY = Math.min(combinedMinY, bbox.y);
      combinedMaxY = Math.max(combinedMaxY, bbox.y + bbox.height);
      foundAny = true;
    }
  }

  if (!foundAny || !isFinite(combinedMinY) || !isFinite(combinedMaxY)) {
    return null;
  }

  return combinedMaxY - combinedMinY;
}

/**
 * Y方向の端点（上端〜裾端）を測定（精度向上版）
 * 前中心/後中心の上端〜裾端を正確に測定するため、グループ内のすべてのpath要素から
 * Y方向の最小値と最大値を取得し、その差分を返す
 */
function getYExtentFromGroups(
  doc: Document,
  groupIds: string[]
): number | null {
  let combinedMinY = Infinity;
  let combinedMaxY = -Infinity;
  let foundAny = false;

  for (const groupId of groupIds) {
    const groupNode = xpath.select1(`//*[@id="${groupId}"]`, doc) as any;
    if (!groupNode) continue;

    // グループ内のすべてのpath要素を取得
    const paths = xpath.select(`.//*[local-name()='path']`, groupNode) as any[];

    for (const pathEl of paths) {
      const d = pathEl.getAttribute?.("d");
      if (!d) continue;

      try {
        const props = new svgPathProperties(d);
        const length = props.getTotalLength();

        // より多くのサンプルポイントで精度を向上（100サンプル）
        const samples = 100;
        for (let i = 0; i <= samples; i++) {
          const point = props.getPointAtLength((length * i) / samples);
          combinedMinY = Math.min(combinedMinY, point.y);
          combinedMaxY = Math.max(combinedMaxY, point.y);
          foundAny = true;
        }
      } catch (e) {
        // エラー時はスキップ
      }
    }
  }

  if (!foundAny || !isFinite(combinedMinY) || !isFinite(combinedMaxY)) {
    return null;
  }

  return combinedMaxY - combinedMinY;
}

function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * SVG文字列とマッピング定義JSONから、garment_measures を算出
 */
export function extractGarmentMeasuresFromSvg(svg: string, mapping: Mapping) {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  const result: Record<string, number | null> = {};

  // 新形式（オブジェクト）の処理
  if (mapping.features) {
    for (const [key, feature] of Object.entries(mapping.features)) {
      if (feature.method === "bbox-height") {
        result[key] = getBBoxHeightFromGroups(doc, feature.groups);
      } else if (feature.method === "y-extent") {
        result[key] = getYExtentFromGroups(doc, feature.groups);
      } else if (feature.method === "path-sum") {
        let sum = 0;
        let ok = true;
        for (const pid of feature.path_ids) {
          const len = getPathLength(doc, pid);
          if (len == null) {
            ok = false;
            break;
          }
          sum += len;
        }
        result[key] = ok ? sum : null;
      } else if (feature.method === "point_distance") {
        const p1 = getPoint(doc, feature.from_id);
        const p2 = getPoint(doc, feature.to_id);
        result[key] = p1 && p2 ? dist(p1, p2) : null;
      }
    }
  }

  // 旧形式（配列）の処理（後方互換性）
  if (mapping.features_legacy) {
    for (const f of mapping.features_legacy) {
      if (f.method === "point_distance") {
        const p1 = getPoint(doc, f.from_id);
        const p2 = getPoint(doc, f.to_id);
        result[f.key] = p1 && p2 ? dist(p1, p2) : null;
      } else if (f.method === "path_length_sum") {
        let sum = 0;
        let ok = true;
        for (const pid of f.path_ids) {
          const len = getPathLength(doc, pid);
          if (len == null) {
            ok = false;
            break;
          }
          sum += len;
        }
        result[f.key] = ok ? sum : null;
      }
    }
  }

  return result;
}

/**
 * meta.json ファイルに features を追記・更新
 */
function updateMetaJson(
  metaPath: string,
  garmentMeasures: Record<string, number | null>,
  mappingMeta?: { pattern?: string; version?: string }
): void {
  let meta: any = {};
  if (fs.existsSync(metaPath)) {
    meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  }

  // features セクションを追加・更新
  if (!meta.features) {
    meta.features = {};
  }
  meta.features.garment_measures = garmentMeasures;

  // features_meta を追加（追跡用）
  if (mappingMeta) {
    meta.features_meta = {
      mapping: {
        pattern: mappingMeta.pattern || "unknown",
        version: mappingMeta.version || "unknown",
      },
      extracted_at: new Date().toISOString(),
    };
  }

  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  console.log(`✅ Updated ${metaPath}`);
}

// CLI実行
if (require.main === module) {
  const args = process.argv.slice(2);
  let svgPath: string | undefined;
  let mapPath: string | undefined;
  let outPath: string | undefined;
  let updateMetaPath: string | undefined;

  // 引数解析
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--svg") svgPath = args[++i];
    else if (arg === "--map") mapPath = args[++i];
    else if (arg === "--out") outPath = args[++i];
    else if (arg === "--update-meta") updateMetaPath = args[++i];
  }

  // 旧形式の引数もサポート（後方互換性）
  if (!svgPath && args[0] && !args[0].startsWith("--")) {
    svgPath = args[0];
  }
  if (!mapPath && args[1] && !args[1].startsWith("--")) {
    mapPath = args[1];
  }

  if (!svgPath || !mapPath) {
    console.error(
      "USAGE: node dist/tools/extractFromSvg.js --svg <svgFile> --map <mappingJson> [--out <outputJson>] [--update-meta <metaJson>]"
    );
    console.error(
      "  or (legacy): node dist/tools/extractFromSvg.js <svgFile> <mappingJson>"
    );
    process.exit(1);
  }

  const svg = fs.readFileSync(svgPath, "utf-8");
  const mapping = JSON.parse(fs.readFileSync(mapPath, "utf-8"));
  const garmentMeasures = extractGarmentMeasuresFromSvg(svg, mapping);

  // 出力ファイルに書き込み
  if (outPath) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(garmentMeasures, null, 2));
    console.log(`✅ Wrote ${outPath}`);
  } else {
    console.log(JSON.stringify(garmentMeasures, null, 2));
  }

  // meta.json を更新
  if (updateMetaPath) {
    const mappingMeta = {
      pattern: mapping.pattern,
      version: mapping.version,
    };
    updateMetaJson(updateMetaPath, garmentMeasures, mappingMeta);
  }
}
