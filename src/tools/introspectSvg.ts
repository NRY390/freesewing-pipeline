// src/tools/introspectSvg.ts
import { Simon } from "@freesewing/simon";
import { DOMParser } from "@xmldom/xmldom";
import * as xpath from "xpath";
import * as fs from "fs";
import * as path from "path";

type Buckets = Record<string, string[]>;
type ByTag = {
  path: string[];
  circle: string[];
  g: string[];
  text: string[];
  other: string[];
};

const DEFAULT_MEASUREMENTS_MM: Record<string, number> = {
  height: 1700,
  chest: 920,
  waist: 800,
  hips: 940,
  neck: 380,
  biceps: 300,
  wrist: 170,
  shoulderToShoulder: 440,
  shoulderSlope: 16,
  waistToHips: 200,
  waistToArmpit: 220,
  shoulderToWrist: 610,
  hpsToBust: 270,
  hpsToWaistFront: 410,
  hpsToWaistBack: 420,
  highBust: 900,
  highBustFront: 480,
};

// ---- utils ----
function draftSimonSvg(measurements: Record<string, number>) {
  const simon = new Simon({ measurements });
  return simon.draft().render();
}
function readSvgFromArg(svgPath?: string): string {
  if (svgPath) return fs.readFileSync(svgPath, "utf-8");
  return draftSimonSvg(DEFAULT_MEASUREMENTS_MM);
}
function classify(id: string): string {
  const low = id.toLowerCase();
  if (low.includes("front")) return "front";
  if (low.includes("back")) return "back";
  if (low.includes("sleeve")) return "sleeve";
  if (low.includes("collar")) return "collar";
  if (low.includes("cuff")) return "cuff";
  if (low.includes("yoke")) return "yoke";
  if (low.includes("placket")) return "placket";
  return "other";
}
function getAttr(el: any, name: string): string {
  return (el?.getAttribute?.(name) || "").trim();
}

// ---- main ----
export function introspectSvg(svg: string) {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");

  // 1) すべての id 付き要素（これは名前空間に影響されない）
  const allWithId = xpath.select("//*[@id]", doc) as any[];
  const allIds = allWithId
    .map((n) => getAttr(n, "id"))
    .filter(Boolean)
    .sort();

  // 2) タグ別分類（参考用）
  const byTag: ByTag = { path: [], circle: [], g: [], text: [], other: [] };
  for (const node of allWithId) {
    const id = getAttr(node, "id");
    const tag = String(node.nodeName || "").toLowerCase();
    if ((byTag as any)[tag]) (byTag as any)[tag].push(id);
    else byTag.other.push(id);
  }
  Object.keys(byTag).forEach((k) => (byTag as any)[k].sort());

  // 3) ざっくり部位別（id 文字列で分類）
  const buckets: Buckets = {};
  for (const id of allIds) {
    const key = classify(id);
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(id);
  }

  // 4) “先祖に最も近い id 付き要素” で部位推定 → path/circle をバケット化
  const parts = [
    "front",
    "back",
    "sleeve",
    "collar",
    "cuff",
    "yoke",
    "placket",
    "other",
  ];
  const paths_by_part: Record<string, string[]> = Object.fromEntries(
    parts.map((p) => [p, []])
  ) as Record<string, string[]>;
  const circles_by_part: Record<string, string[]> = Object.fromEntries(
    parts.map((p) => [p, []])
  ) as Record<string, string[]>;

  function nearestAncestorId(el: any): string {
    // 直近の id 付き先祖（名前空間関係なし）
    const anc = xpath.select1("ancestor::*[@id][1]", el) as any;
    return getAttr(anc, "id");
  }

  // ★ ここがポイント：local-name() で名前空間を回避
  const allPaths = xpath.select(
    "//*[local-name()='path' and @id]",
    doc
  ) as any[];
  const allCircles = xpath.select(
    "//*[local-name()='circle' and @id]",
    doc
  ) as any[];

  const path_parent: Record<string, string> = {};
  for (const p of allPaths) {
    const pid = getAttr(p, "id");
    const ancId = nearestAncestorId(p);
    const bucket = classify(ancId || pid);
    paths_by_part[bucket].push(pid);
    path_parent[pid] = ancId || "";
  }

  const circle_parent: Record<string, string> = {};
  for (const c of allCircles) {
    const cid = getAttr(c, "id");
    const ancId = nearestAncestorId(c);
    const bucket = classify(ancId || cid);
    circles_by_part[bucket].push(cid);
    circle_parent[cid] = ancId || "";
  }

  // ソート
  for (const k of Object.keys(paths_by_part)) paths_by_part[k].sort();
  for (const k of Object.keys(circles_by_part)) circles_by_part[k].sort();

  return {
    counts: {
      total_with_id: allIds.length,
      by_part: Object.fromEntries(
        Object.entries(buckets).map(([k, v]) => [k, v.length])
      ),
      by_tag: Object.fromEntries(
        Object.entries(byTag).map(([k, v]) => [k, v.length])
      ),
      paths: allPaths.length,
      circles: allCircles.length,
    },
    buckets,
    by_tag: byTag,
    all_ids: allIds,
    paths_by_part, // ✅ ここに fs-XX などの path id が埋まるはず
    circles_by_part,
    parent_map: {
      path_parent,
      circle_parent,
    },
  };
}

// ---- CLI ----
if (require.main === module) {
  const args = process.argv.slice(2);
  let svgPath: string | undefined;
  let outPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--svg") svgPath = args[++i];
    else if (a === "--out") outPath = args[++i];
  }

  const svg = readSvgFromArg(svgPath);
  const report = introspectSvg(svg);
  const json = JSON.stringify(report, null, 2);

  if (outPath) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, json);
    console.log(`✅ wrote ${outPath}`);
  } else {
    console.log(json);
  }
}
