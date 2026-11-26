import { minimalModel } from "./models.mjs";

/**
 * Models each wrong in one way or a few, from the minimal valid model: the cases the loader's problems are held to
 * (tests/model-problems.test.mjs). Each is named for what it breaks; the problems' codes, paths, messages and order
 * stand in model-problems.json beside it, written once from the loader as it was before it read its vocabulary from
 * the schema, but for a spur without `at`, which reads its fields from the schema and reports `at` first.
 */
const long = "x".repeat(2001);
const component = (extra) => ({ id: "c", label: "Gamma", ...extra });
const withComponent = (extra) =>
  minimalModel({ components: [...minimalModel().components, component(extra)] });
const course = (extra) => ({
  steps: [
    { id: "s", part: "a" },
    { id: "t", part: "b" },
  ],
  ...extra,
});
const withOverview = (extra = {}, courseExtra = {}) =>
  minimalModel({ overview: { claim: "x", lead: "y", course: course(courseExtra), ...extra } });
const further = (extra) => ({
  title: "F",
  stations: [
    { id: "p", part: "a" },
    { id: "q", part: "b" },
  ],
  ...extra,
});
const withBlock = (block) => withOverview({ blocks: [block] });
const pairs = [["term", "text"]];
const withView = (view) => minimalModel({ views: [{ id: "v", ...view }] });
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
  "top field near $schema": minimalModel({ $schem: "x" }),
  "editor unknown field": minimalModel({ editors: [{ name: "N", ulr: "x" }] }),
  "repository unknown field": minimalModel({
    repository: { name: "shop", revision: "a".repeat(40), brwose: "x" },
  }),
  "kind unknown field": minimalModel({ kinds: { web: { lable: "x" } } }),
  "relation unknown field": withRelation({ stauts: "x" }),
  "group unknown field": minimalModel({
    groups: [{ id: "g", label: "G", members: ["a"], lable: "x" }],
  }),
  "views empty": minimalModel({ views: [] }),
  "view unknown field": withView({ members: ["a"], titel: "x" }),
  "view members empty": withView({ members: [] }),
  "view tiers empty": withView({ tiers: [] }),
  "tier unknown field": withView({ tiers: [{ id: "t", label: "T", members: ["a"], lable: "x" }] }),
  "tier without members": withView({ tiers: [{ id: "t", label: "T" }] }),
  "coverage unknown field": minimalModel({ coverage: { include: ["src/"], exlude: [] } }),
  "coverage exclusion without reason": minimalModel({ coverage: { exclude: [{ path: "src/" }] } }),
  "edition unknown field": minimalModel({ edition: { palete: "soot" } }),
  "edition palette unknown field": minimalModel({
    edition: {
      palette: {
        ground: "#f6f5f1",
        ink: "#25282c",
        dye: ["#b7d8db", "#7099ae", "#334965"],
        accnet: "#ff0000",
      },
    },
  }),
  "overview unknown field": withOverview({ blokcs: [] }),
  "overview blocks empty": withOverview({ blocks: [] }),
  "overview course unknown field": withOverview({}, { lnies: [] }),
  "overview steps one": minimalModel({
    overview: { claim: "x", lead: "y", course: { steps: [{ id: "s", part: "a" }] } },
  }),
  "overview step unknown field": minimalModel({
    overview: {
      claim: "x",
      lead: "y",
      course: {
        steps: [
          { id: "s", part: "a", txet: "x" },
          { id: "t", part: "b" },
        ],
      },
    },
  }),
  "overview step stations empty": minimalModel({
    overview: {
      claim: "x",
      lead: "y",
      course: {
        steps: [
          { id: "s", label: "S", stations: [] },
          { id: "t", part: "b" },
        ],
      },
    },
  }),
  "overview station unknown field": minimalModel({
    overview: {
      claim: "x",
      lead: "y",
      course: {
        steps: [
          { id: "s", label: "S", stations: [{ id: "u", part: "a", nott: "x" }] },
          { id: "t", part: "b" },
        ],
      },
    },
  }),
  "overview fork unknown field": minimalModel({
    overview: {
      claim: "x",
      lead: "y",
      course: {
        steps: [
          {
            id: "s",
            label: "S",
            stations: [{ branches: [{ part: "a" }, { part: "b" }], brnaches: [] }],
          },
          { id: "t", part: "b" },
        ],
      },
    },
  }),
  "overview fork of one branch": minimalModel({
    overview: {
      claim: "x",
      lead: "y",
      course: {
        steps: [
          { id: "s", label: "S", stations: [{ branches: [{ part: "a" }] }] },
          { id: "t", part: "b" },
        ],
      },
    },
  }),
  "overview spurs empty": withOverview({}, { spurs: [] }),
  "overview spur unknown field": withOverview({}, { spurs: [{ at: "s", part: "a", viwe: "v" }] }),
  "overview spur without at": withOverview({}, { spurs: [{ part: "a", lable: "x" }] }),
  "overview lines empty": withOverview({}, { lines: [] }),
  "overview line unknown field": withOverview(
    {},
    { lines: [{ from: "s", to: ["t"], label: "goes", lable: "x" }] },
  ),
  "overview line to empty": withOverview({}, { lines: [{ from: "s", to: [], label: "goes" }] }),
  "overview passes empty": withOverview({}, { passes: [] }),
  "overview pass unknown field": withOverview(
    {},
    { passes: [{ after: "s", label: "x", aftr: "s" }] },
  ),
  "overview parallel empty": withOverview({}, { parallel: [] }),
  "overview stretch unknown field": withOverview(
    {},
    { parallel: [{ from: "s", to: "t", tracks: 2, trakcs: 2 }] },
  ),
  "overview further course unknown field": withBlock(further({ ntoe: "x" })),
  "overview further course of one station": withBlock(
    further({ stations: [{ id: "p", part: "a" }] }),
  ),
  "overview further pass without label": withBlock(further({ pass: { after: "p" } })),
  "overview further aside unknown field": withBlock(
    further({ aside: { from: "p", label: "x", form: "p" } }),
  ),
  "overview items block unknown field": withBlock({ title: "I", items: pairs, txet: "x" }),
  "overview items pair of three": withBlock({ title: "I", items: [["a", "b", "c"]] }),
  "overview items empty": withBlock({ title: "I", items: [] }),
  "overview table unknown field": withBlock({
    title: "T",
    columns: ["c"],
    rows: [["x"]],
    rwos: [],
  }),
  "overview table without columns": withBlock({ title: "T", columns: [], rows: [["x"]] }),
  "overview table without rows": withBlock({ title: "T", columns: ["c"], rows: [] }),
  "overview lists block unknown field": withBlock({
    title: "L",
    lists: [
      { title: "A", items: pairs },
      { title: "B", items: pairs },
    ],
    lsits: [],
  }),
  "overview lists of one": withBlock({ title: "L", lists: [{ title: "A", items: pairs }] }),
  "overview list unknown field": withBlock({
    title: "L",
    lists: [
      { title: "A", items: pairs, itmes: [] },
      { title: "B", items: [] },
    ],
  }),
  "overview list pair of three": withBlock({
    title: "L",
    lists: [
      { title: "A", items: [["a", "b", "c"]] },
      { title: "B", items: pairs },
    ],
  }),
  "overview text block unknown field": withBlock({ title: "X", text: "y", veiw: "v" }),
});
