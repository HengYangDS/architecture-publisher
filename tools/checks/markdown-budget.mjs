import fs from "node:fs";
import { parse } from "smol-toml";

const budget = parse(
  fs.readFileSync(new URL("../../.config/checks/file-budget/policy.toml", import.meta.url), "utf8"),
);

export default {
  names: ["markdown-file-budget"],
  description: "Limit maintained Markdown to the shared nonempty physical-line budget",
  tags: ["file_size"],
  function: (params, onError) => {
    let counted = params.frontMatterLines.filter((line) => line.trim()).length;
    for (const [index, line] of params.lines.entries()) {
      if (line.trim()) counted++;
      if (counted > budget.maximum) {
        onError({
          lineNumber: index + 1,
          detail: `At most ${budget.maximum} nonempty physical lines are allowed`,
        });
        return;
      }
    }
  },
};
