import JSON5 from "json5";
import fs from "node:fs";
import type { Plugin } from "vite";

export function json5Plugin(): Plugin {
  return {
    name: "json5",
    enforce: "pre",
    load(id) {
      if (!id.endsWith(".json5")) return;
      const src = fs.readFileSync(id, "utf-8");
      const parsed = JSON5.parse(src);
      return `export default ${JSON.stringify(parsed)}`;
    },
  };
}
