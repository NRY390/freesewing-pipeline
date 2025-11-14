// src/tools/overlaySvg.ts
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import * as xpath from "xpath";
import * as fs from "fs";
import * as path from "path";
import { glob as globSync } from "glob";

// extractFromSvg.ts と同じ型定義を再利用
type FeatureDef =
  | { method: "bbox-height"; groups: string[]; notes_ja?: string }
  | { method: "path-sum"; path_ids: string[]; notes_ja?: string }
  | {
      method: "point_distance";
      from_id: string;
      to_id: string;
      notes_ja?: string;
    };

interface Mapping {
  features?: Record<string, FeatureDef>;
}

/**
 * 各featureに割り当てる色（視認性の高い色）
 */
const FEATURE_COLORS: Record<string, string> = {
  front_length_mm: "#FF6B6B", // 赤
  back_length_mm: "#4ECDC4", // 青緑
  sleeve_length_mm: "#FFE66D", // 黄色
  hem_circum_mm: "#95E1D3", // 水色
  collar_stand_len_mm: "#F38181", // ピンク
  cuff_len_mm: "#AA96DA", // 紫
  default: "#FFA07A", // ライトサーモン
};

/**
 * SVG要素にスタイルを追加
 */
function addStyle(element: any, style: Record<string, string>): void {
  const styleStr = Object.entries(style)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  const existingStyle = element.getAttribute("style") || "";
  element.setAttribute("style", `${existingStyle};${styleStr}`);
}

/**
 * path要素をハイライト（色付きで上書き）
 */
function highlightPath(
  doc: Document,
  pathId: string,
  color: string,
  overlayGroup: any
): void {
  const node = xpath.select1(
    `//*[local-name()='path' and @id="${pathId}"]`,
    doc
  ) as any;
  if (!node) {
    console.warn(`⚠️  Path not found: ${pathId}`);
    return;
  }

  // path要素をクローンしてオーバーレイグループに追加
  const cloned = node.cloneNode(true);
  addStyle(cloned, {
    stroke: color,
    "stroke-width": "3",
    fill: "none",
    opacity: "0.8",
  });
  overlayGroup.appendChild(cloned);
}

/**
 * group要素内のすべての描画要素をハイライト
 */
function highlightGroup(
  doc: Document,
  groupId: string,
  color: string,
  overlayGroup: any
): void {
  const groupNode = xpath.select1(`//*[@id="${groupId}"]`, doc) as any;
  if (!groupNode) {
    console.warn(`⚠️  Group not found: ${groupId}`);
    return;
  }

  // グループ内のすべての描画要素を取得
  const elements = xpath.select(
    `.//*[local-name()='path' or local-name()='circle' or local-name()='rect' or local-name()='line' or local-name()='polyline' or local-name()='polygon']`,
    groupNode
  ) as any[];

  for (const el of elements) {
    const cloned = el.cloneNode(true);
    const localName = String(el.localName || el.nodeName || "").toLowerCase();

    if (localName === "path") {
      addStyle(cloned, {
        stroke: color,
        "stroke-width": "3",
        fill: "none",
        opacity: "0.8",
      });
    } else if (localName === "circle") {
      addStyle(cloned, {
        stroke: color,
        "stroke-width": "3",
        fill: "none",
        opacity: "0.8",
      });
    } else {
      addStyle(cloned, {
        stroke: color,
        "stroke-width": "2",
        fill: "none",
        opacity: "0.6",
      });
    }
    overlayGroup.appendChild(cloned);
  }
}

/**
 * SVGにオーバーレイを追加
 */
export function overlaySvg(svgContent: string, mapping: Mapping): string {
  const doc = new DOMParser().parseFromString(svgContent, "image/svg+xml");
  const svgRoot = xpath.select1("//*[local-name()='svg']", doc) as any;
  if (!svgRoot) {
    throw new Error("SVG root element not found");
  }

  // オーバーレイ用のグループを作成
  const overlayGroup = doc.createElementNS(
    svgRoot.namespaceURI || "http://www.w3.org/2000/svg",
    "g"
  );
  overlayGroup.setAttribute("id", "feature-overlay");
  overlayGroup.setAttribute("style", "pointer-events: none;");

  // 各featureを処理
  if (mapping.features) {
    for (const [featureName, feature] of Object.entries(mapping.features)) {
      const color =
        FEATURE_COLORS[featureName] || FEATURE_COLORS.default;

      if (feature.method === "bbox-height") {
        // グループをハイライト
        for (const groupId of feature.groups) {
          highlightGroup(doc, groupId, color, overlayGroup);
        }
      } else if (feature.method === "path-sum") {
        // pathをハイライト
        for (const pathId of feature.path_ids) {
          highlightPath(doc, pathId, color, overlayGroup);
        }
      } else if (feature.method === "point_distance") {
        // 点をハイライト（circleで表示）
        const fromNode = xpath.select1(
          `//*[@id="${feature.from_id}"]`,
          doc
        ) as any;
        const toNode = xpath.select1(
          `//*[@id="${feature.to_id}"]`,
          doc
        ) as any;

        if (fromNode) {
          const circle = doc.createElementNS(
            svgRoot.namespaceURI || "http://www.w3.org/2000/svg",
            "circle"
          );
          const cx = Number(fromNode.getAttribute?.("cx") || 0);
          const cy = Number(fromNode.getAttribute?.("cy") || 0);
          circle.setAttribute("cx", String(cx));
          circle.setAttribute("cy", String(cy));
          circle.setAttribute("r", "5");
          addStyle(circle, {
            fill: color,
            stroke: color,
            "stroke-width": "2",
            opacity: "0.9",
          });
          overlayGroup.appendChild(circle);
        }

        if (toNode) {
          const circle = doc.createElementNS(
            svgRoot.namespaceURI || "http://www.w3.org/2000/svg",
            "circle"
          );
          const cx = Number(toNode.getAttribute?.("cx") || 0);
          const cy = Number(toNode.getAttribute?.("cy") || 0);
          circle.setAttribute("cx", String(cx));
          circle.setAttribute("cy", String(cy));
          circle.setAttribute("r", "5");
          addStyle(circle, {
            fill: color,
            stroke: color,
            "stroke-width": "2",
            opacity: "0.9",
          });
          overlayGroup.appendChild(circle);
        }
      }
    }
  }

  // オーバーレイグループをSVGに追加
  svgRoot.appendChild(overlayGroup);

  // 凡例を追加（オプション）
  const legendGroup = doc.createElementNS(
    svgRoot.namespaceURI || "http://www.w3.org/2000/svg",
    "g"
  );
  legendGroup.setAttribute("id", "feature-legend");
  legendGroup.setAttribute(
    "transform",
    "translate(20, 20)"
  );

  if (mapping.features) {
    let yOffset = 0;
    for (const [featureName, feature] of Object.entries(mapping.features)) {
      const color =
        FEATURE_COLORS[featureName] || FEATURE_COLORS.default;

      // 凡例の線
      const line = doc.createElementNS(
        svgRoot.namespaceURI || "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("x1", "0");
      line.setAttribute("y1", String(yOffset));
      line.setAttribute("x2", "20");
      line.setAttribute("y2", String(yOffset));
      addStyle(line, {
        stroke: color,
        "stroke-width": "3",
      });
      legendGroup.appendChild(line);

      // 凡例のテキスト
      const text = doc.createElementNS(
        svgRoot.namespaceURI || "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", "25");
      text.setAttribute("y", String(yOffset + 4));
      text.setAttribute("font-size", "12");
      text.setAttribute("fill", "#333");
      text.textContent = featureName;
      legendGroup.appendChild(text);

      yOffset += 18;
    }
  }

  svgRoot.appendChild(legendGroup);

  // SVGを文字列に変換
  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}

// CLI実行
if (require.main === module) {
  const args = process.argv.slice(2);
  let inputPattern: string | undefined;
  let mapPath: string | undefined;
  let outDir: string | undefined;

  // 引数解析
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--in") inputPattern = args[++i];
    else if (arg === "--map") mapPath = args[++i];
    else if (arg === "--out") outDir = args[++i];
  }

  if (!inputPattern || !mapPath || !outDir) {
    console.error(
      "USAGE: node dist/tools/overlaySvg.js --in <svgPattern> --map <mappingJson> --out <outputDir>"
    );
    console.error(
      "  Example: --in 'output/simon_*.svg' --map data/mapping.simon.features.v1.json --out output/_debug"
    );
    process.exit(1);
  }

  // マッピングファイルを読み込む
  const mapping: Mapping = JSON.parse(
    fs.readFileSync(mapPath, "utf-8")
  );

  // 出力ディレクトリを作成
  fs.mkdirSync(outDir, { recursive: true });

  // globパターンでSVGファイルを検索（同期版）
  (async () => {
    try {
      const files = await globSync(inputPattern);

      if (files.length === 0) {
        console.warn(`⚠️  No files found matching pattern: ${inputPattern}`);
        process.exit(0);
      }

      console.log(`Found ${files.length} SVG file(s)`);

      // 各SVGファイルを処理
      for (const svgPath of files) {
        try {
          const svgContent = fs.readFileSync(svgPath, "utf-8");
          const overlaySvgContent = overlaySvg(svgContent, mapping);

          // 出力ファイル名を生成（*_debug.svg）
          const basename = path.basename(svgPath, ".svg");
          const outputPath = path.join(outDir, `${basename}_debug.svg`);

          fs.writeFileSync(outputPath, overlaySvgContent);
          console.log(`✅ Generated: ${outputPath}`);
        } catch (e: any) {
          console.error(`❌ Error processing ${svgPath}: ${e.message}`);
        }
      }
    } catch (err: any) {
      console.error(`Error finding files: ${err.message}`);
      process.exit(1);
    }
  })();
}

