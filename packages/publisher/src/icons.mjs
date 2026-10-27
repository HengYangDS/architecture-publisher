import fs from "node:fs/promises";
import path from "node:path";
import { verifySupply } from "./supply.mjs";

/** Each category's default Lucide icon. */
export const CATEGORY_ICONS = Object.freeze({
  person: "user",
  external: "box",
  frontend: "app-window",
  backend: "server",
  database: "database",
  cloud: "cloud",
  messagebus: "waypoints",
  security: "shield-check",
});

/** The icon of an overview node that stands for a group. */
export const GROUP_ICON = "layers";

let loaded;

/** Load the bundled Lucide artwork once. Icons are drawn as inline strokes, never fetched. */
export async function loadIcons() {
  if (loaded) return loaded;
  const supply = await verifySupply("icons");
  const data = JSON.parse(await fs.readFile(path.join(supply.root, "artwork.json"), "utf8"));
  const artwork = new Map(
    Object.entries(data.icons).map(([id, glyph]) => [id.slice("lucide:".length), glyph.artwork]),
  );
  loaded = Object.freeze({
    has: (name) => artwork.has(name),
    /** @param {string} name */
    artwork: (name) => /** @type {string} */ (artwork.get(name)),
    supplySha256: supply.sha256,
  });
  return loaded;
}
