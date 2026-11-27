// The blocks references.mjs writes from the model's sources: the rules, the top-level fields and the categories of a
// model as its schema states them (src/model/schema.json), the palettes and the lines as the house states them
// (src/house.json), and the schema itself, with the enumerations a table of the source owns filled in from it.
import { code, readJson, stated, table } from "./text.mjs";

/**
 * The model's blocks and its schema as the writer writes it, read from the tree at `root`.
 * @param {string} root
 */
export async function modelBlocks(root) {
  // The rules a model's value is held to, as its schema states them: the patterns and the limits are the schema's
  // own; the words that say what each rule refuses are the writer's.
  const schema = await readJson(root, "src/model/schema.json");
  // The schema's enumerations that a table of the source owns, each filled in from that table: its members in the
  // table's order, and its default where the table states one. The units that draw read these tables and not the
  // model, so a table, not the schema, is their one statement; the schema states the palettes' default itself, which
  // only the model reads.
  const SETS = [
    {
      at: "/properties/kinds/additionalProperties/properties/category",
      from: "src/categories.json",
      members: (/** @type {any} */ table) => Object.keys(table.categories),
      default: (/** @type {any} */ table) => table.kindless,
    },
    {
      at: "/properties/edition/properties/palette/oneOf/0",
      from: "src/house.json",
      members: (/** @type {any} */ table) => Object.keys(table.palettes),
    },
    {
      at: "/properties/locale",
      from: "src/locales.json",
      members: (/** @type {any} */ table) => table.languages,
      default: (/** @type {any} */ table) => table.default,
    },
  ];
  /** Each table of the source the writer reads, parsed once by its path. */
  const tables = new Map();
  const tableOf = async (/** @type {string} */ file) => {
    if (!tables.has(file)) tables.set(file, await readJson(root, file));
    return tables.get(file);
  };
  for (const set of SETS) {
    const node = set.at
      .split("/")
      .slice(1)
      .reduce((/** @type {any} */ value, key) => value?.[key], schema);
    if (!Array.isArray(node?.enum))
      throw new Error(`references_set_missing: the schema states no enumeration at ${set.at}`);
    const owner = await tableOf(set.from);
    node.enum = set.members(owner);
    if (set.default) node.default = set.default(owner);
  }
  const vocabularyTable = () =>
    table(
      ["Value", "Rule"],
      [
        [
          "An id",
          `matches ${code(schema.$defs.id.pattern)}; the model's own id also matches no ${code(schema.properties.id.allOf[1].not.pattern)}, so it names no Windows device and does not end in a dot`,
        ],
        [
          "A text",
          `${schema.$defs.text.minLength} to ${schema.$defs.text.maxLength} characters, not blank, with no NUL character; a character outside the Basic Multilingual Plane, such as most emoji, counts as two`,
        ],
        ["A status", `one of ${schema.$defs.status.enum.map(code).join(", ")}`],
        [
          "A detail's name",
          `matches ${code(schema.$defs.details.propertyNames.pattern)}: no colon or line feed, and not digits alone`,
        ],
        [
          "A path",
          `${schema.$defs.path.minLength} to ${schema.$defs.path.maxLength} characters, counted as in a text, relative, with no backslash, line feed, carriage return or NUL, and no empty, \`.\` or \`..\` segment`,
        ],
      ],
    );

  // The top-level fields of a model, as its schema states them: each field in the schema's order, whether it is
  // required, and its meaning, which is the schema's description (the help an editor shows) with what the schema
  // states of its value: a constant, the values it takes with the default, or the fewest items of a list.
  const topFieldsTable = () =>
    table(
      ["Field", "Required", "Meaning"],
      Object.entries(schema.properties).map(([name, /** @type {any} */ field]) => {
        const required = schema.required.includes(name);
        const list = field.type === "array";
        const values = [
          ...(field.enum ? [`One of ${field.enum.map(code).join(", ")}`] : []),
          ...(field.default === undefined ? [] : [`${code(String(field.default))} by default`]),
        ];
        const meaning = [
          ...(field.const === undefined ? [] : [`Always ${code(String(field.const))}.`]),
          ...(field.description ? [field.description] : []),
          ...(values.length ? [`${values.join("; ")}.`] : []),
          ...(list && field.minItems
            ? [`At least ${field.minItems === 1 ? "one" : field.minItems}.`]
            : []),
          ...(list && !field.minItems && required ? ["May be empty."] : []),
        ].join(" ");
        if (!field.description && field.const === undefined)
          throw new Error(
            `references_description_missing: the schema's field ${name} says nothing of itself`,
          );
        return [code(name), required ? "yes" : "no", meaning];
      }),
    );

  // The categories of a kind, as the schema states them with its default, and how each looks, as the table of looks
  // states it (src/categories.json).
  const looks = await readJson(root, "src/categories.json");
  const category = schema.properties.kinds.additionalProperties.properties.category;
  const categoriesTable = () =>
    table(
      ["Category", "Default icon", "Drawn as"],
      category.enum.map((/** @type {string} */ name) => {
        const look = looks.categories[name];
        const drawn = [
          ...(look.outside ? ["outside the system boundary"] : []),
          `Archify's ${code(look.archify)} type`,
          ...(look.accent ? ["on plates, in the palette's accent"] : []),
          // The tiers figure's band (src/layout/fill.mjs); its rule is the operations reference's to state.
          ...(look.spans
            ? [
                "on plates, a lone card at the top or foot of a figure may be drawn as a [band](operations.md#layout-and-media)",
              ]
            : []),
          ...(name === category.default ? ["the default"] : []),
        ].join("; ");
        return [code(name), code(look.icon), `${drawn[0].toUpperCase()}${drawn.slice(1)}.`];
      }),
    );

  // The built-in palettes, in the house's order, with their names and what their colours are (src/house.json), and
  // the default the schema states.
  const house = await tableOf("src/house.json");
  /** A field of the house the writer prints, refused by name when the house lacks it. */
  const said = (/** @type {any} */ value, /** @type {string} */ where) =>
    stated("src/house.json", value, where);
  const palette = schema.properties.edition.properties.palette;
  const palettesTable = () =>
    table(
      ["`palette`", "Name", "Colours"],
      Object.entries(house.palettes).map(([id, /** @type {any} */ each]) => [
        code(id),
        `${each.name["zh-CN"]} ${each.name.en}`,
        id === palette.default
          ? `${said(each.colours, `colours of the palette ${id}`).replace(/\.$/u, "")}; the default.`
          : said(each.colours, `colours of the palette ${id}`),
      ]),
    );

  // The rows of the table of lines (src/house.json): what each means, how a plate draws it, the question it answers,
  // whether a work has tested it, and what a delivery's page does for it.
  const drawn = (/** @type {any} */ row) => {
    if (row.dash) {
      const pattern = `dashes of ${row.dash[0]} px, gaps of ${row.dash[1]} px`;
      return row.stroke ? `${pattern}; ${row.stroke} px` : pattern;
    }
    if (row.factor)
      return `continuous, ${row.factor} × the relation's weight; arrowhead ${row.arrow} × as large`;
    return "stroke" in row ? `continuous, ${row.stroke} px` : "a number";
  };
  const linesTable = () =>
    table(
      ["Row", "Means", "Drawn on a plate", "Answers", "Tested by a work", "On the page"],
      Object.entries(house.lines.rows).map(([id, /** @type {any} */ row]) => [
        code(id),
        said(row.meaning, `meaning of the line row ${id}`),
        drawn(row),
        said(row.answers, `question of the line row ${id}`),
        row.tested ? "yes" : "not yet tested by a work",
        said(row.page, `page of the line row ${id}`),
      ]),
    );

  return {
    schema,
    blocks: [
      {
        file: "docs/reference/model.md",
        name: "fields",
        source: "src/model/schema.json",
        text: topFieldsTable,
      },
      {
        file: "docs/reference/model.md",
        name: "vocabulary",
        source: "src/model/schema.json",
        text: vocabularyTable,
      },
      {
        file: "docs/reference/model.md",
        name: "categories",
        source: "src/model/schema.json and src/categories.json",
        text: categoriesTable,
      },
      {
        file: "docs/reference/model.md",
        name: "palettes",
        source: "src/house.json and src/model/schema.json",
        text: palettesTable,
      },
      {
        file: "docs/reference/lines.md",
        name: "lines",
        source: "src/house.json",
        text: linesTable,
      },
    ],
  };
}
