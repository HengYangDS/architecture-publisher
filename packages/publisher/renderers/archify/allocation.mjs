import { placeMeasuredLabel } from "../elk/text.mjs";

export const emptyLabel = (minimum) => ({
  lines: [""],
  width: 0,
  height: 0,
  fontSize: minimum,
  weight: "400",
  baselines: [],
});

/** One measured slot retains each independently identified text occurrence. */
export function allocateLabelOccurrences(occurrences, minimum) {
  const width = Math.max(...occurrences.map(({ plan }) => plan.width));
  const gap = Math.max(8, Math.ceil(minimum * 0.6));
  let height = 0;
  const allocations = occurrences.map(({ id, plan }) => {
    const allocation = { id, plan, x: (width - plan.width) / 2, y: height };
    height += plan.height + gap;
    return allocation;
  });
  const placed = allocations.map(({ plan, x, y }) => placeMeasuredLabel(plan, x, y));
  return {
    allocations,
    plan: {
      lines: placed.flatMap(({ lines }) => lines),
      width,
      height: height - gap,
      fontSize: minimum,
      weight: "400",
      baselines: placed.flatMap(({ baselines }) => baselines),
    },
  };
}
