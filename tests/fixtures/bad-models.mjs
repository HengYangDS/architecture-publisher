import { minimalModel } from "./models.mjs";

/**
 * Models each wrong in one way or a few, from the minimal valid model: the cases the loader's problems are held to
 * (tests/model-problems.test.mjs). Each is named for what it breaks; the problems' codes, paths, messages and order
 * stand in model-problems.json beside it, written once from the loader as it was before it read its vocabulary from
 * the schema.
 */
const long = "x".repeat(2001);
const component = (extra) => ({ id: "c", label: "Gamma", ...extra });
const withComponent = (extra) =>
  minimalModel({ components: [...minimalModel().components, component(extra)] });
const withRelation = (extra) =>
  minimalModel({
    relations: [
      ...minimalModel().relations,
      { id: "r", from: "a", to: "b", label: "reads", ...extra },
    ],
  });

export const BAD_MODELS = Object.freeze({
  "not an object": "model",
  "an array": [],
  format: minimalModel({ format: "other.model" }),
  "version 2": minimalModel({ version: 2 }),
  "version 9": minimalModel({ version: 9 }),
  "required fields missing": { format: "architecture-publisher.model", version: 3 },
  "unknown top field": minimalModel({ colour: "red" }),
  "id pattern": minimalModel({ id: "Not An Id" }),
  "id a device": minimalModel({ id: "con" }),
  "id ends with a dot": minimalModel({ id: "shop." }),
  "title blank": minimalModel({ title: " " }),
  "title too long": minimalModel({ title: long }),
  "title with NUL": minimalModel({ title: "a\u0000b" }),
  "title not text": minimalModel({ title: 7 }),
  locale: minimalModel({ locale: "fr" }),
  "editors empty": minimalModel({ editors: [] }),
  "editor without name": minimalModel({ editors: [{ url: "https://example.com" }] }),
  license: minimalModel({ license: "MIT and" }),
  "limits not a list": minimalModel({ limits: "none" }),
  "limit blank": minimalModel({ limits: [""] }),
  "repository revision": minimalModel({ repository: { name: "shop", revision: "abc" } }),
  "repository browse": minimalModel({
    repository: { name: "shop", revision: "a".repeat(40), browse: "https://example.com/{path}" },
  }),
  "kind category": minimalModel({ kinds: { web: { category: "website" } } }),
  "kind icon": minimalModel({ kinds: { web: { icon: "Bad Icon" } } }),
  "kind key": minimalModel({ kinds: { "Bad Key": { label: "x" } } }),
  "components empty": minimalModel({ components: [] }),
  "component without label": minimalModel({
    components: [...minimalModel().components, { id: "c" }],
  }),
  "component unknown field": withComponent({ colour: "red" }),
  "component id duplicate": withComponent({ id: "a" }),
  "component status": withComponent({ status: "gone" }),
  "details not an object": withComponent({ details: ["x"] }),
  "detail name digits": withComponent({ details: { 123: "x" } }),
  "detail name colon": withComponent({ details: { "a:b": "x" } }),
  "detail empty list": withComponent({ details: { uses: [] } }),
  "files not a list": withComponent({ files: "src" }),
  "file glob": withComponent({ files: ["src/*.mjs"] }),
  "file absolute": withComponent({ files: ["/src/a.mjs"] }),
  "file empty segment": withComponent({ files: ["src//a.mjs"] }),
  "file empty segment after a line separator": withComponent({ files: ["src\u2028//a.mjs"] }),
  "file parent": withComponent({ files: ["../a.mjs"] }),
  "file too long": withComponent({ files: [`${"d/".repeat(600)}a.mjs`] }),
  "file duplicate": withComponent({ files: ["src/a.mjs", "src/a.mjs"] }),
  "file claimed twice": minimalModel({
    components: [
      { id: "a", label: "Alpha", files: ["src/a.mjs"] },
      { id: "b", label: "Beta", files: ["src/a.mjs"] },
    ],
  }),
  "relation endpoint": withRelation({ from: "nowhere" }),
  "relation to itself": withRelation({ to: "a" }),
  "relation file directory": withRelation({ files: ["src/"] }),
  "relation without label": minimalModel({
    relations: [...minimalModel().relations, { id: "r", from: "a", to: "b" }],
  }),
  "group id is a component's": minimalModel({ groups: [{ id: "a", label: "A", members: ["b"] }] }),
  "group members empty": minimalModel({ groups: [{ id: "g", label: "G", members: [] }] }),
  "group member unknown": minimalModel({ groups: [{ id: "g", label: "G", members: ["z"] }] }),
  "groups overlap": minimalModel({
    groups: [
      { id: "g", label: "G", members: ["a"] },
      { id: "h", label: "H", members: ["a"] },
    ],
  }),
  "view both shapes": minimalModel({
    views: [
      { id: "v", title: "V", members: ["a"], tiers: [{ id: "t", label: "T", members: ["b"] }] },
    ],
  }),
  "view tiers overlap": minimalModel({
    views: [
      {
        id: "v",
        title: "V",
        tiers: [
          { id: "t", label: "T", members: ["a"] },
          { id: "u", label: "U", members: ["a", "b"] },
        ],
      },
    ],
  }),
  "view member unknown": minimalModel({ views: [{ id: "v", title: "V", members: ["z"] }] }),
  "coverage include empty": minimalModel({ coverage: { include: [] } }),
  "coverage path": minimalModel({ coverage: { include: ["/src"] } }),
  "coverage path duplicate": minimalModel({ coverage: { include: ["src/", "src/"] } }),
  guide: minimalModel({ guide: "guide.md" }),
  "edition field retired": minimalModel({ edition: { marks: true } }),
  "edition palette name": minimalModel({ edition: { palette: "red" } }),
  "edition palette colour": minimalModel({
    edition: {
      palette: { ground: "white", ink: "#111111", dye: ["#222222", "#333333", "#444444"] },
    },
  }),
  "edition palette dyes": minimalModel({
    edition: { palette: { ground: "#ffffff", ink: "#111111", dye: ["#222222"] } },
  }),
  "group member twice": minimalModel({ groups: [{ id: "g", label: "G", members: ["a", "a"] }] }),
  "overview a string": minimalModel({ overview: "tiers" }),
  "overview step unnamed": minimalModel({
    overview: { claim: "x", lead: "y", course: { steps: [{ id: "s" }, { id: "t", part: "a" }] } },
  }),
  "overview line from a run": minimalModel({
    overview: {
      claim: "x",
      lead: "y",
      course: {
        steps: [
          { id: "run", label: "Run", stations: [{ id: "s", part: "a" }] },
          { id: "t", part: "b" },
        ],
        lines: [{ from: "run", to: ["t"], label: "goes" }],
      },
    },
  }),
  "overview tracks five": minimalModel({
    overview: {
      claim: "x",
      lead: "y",
      course: {
        steps: [
          { id: "s", part: "a" },
          { id: "t", part: "b" },
        ],
        parallel: [{ from: "s", to: "t", tracks: 5 }],
      },
    },
  }),
  "overview without claim": minimalModel({ overview: { lead: "x", course: [] } }),
});
