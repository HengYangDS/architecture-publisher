/**
 * The overview a model states: blocks without positions, which the publisher lays out on one page. A course of steps
 * runs across the page; a step may hold stations and carry a note and a text, and a place of the course may be a
 * fork of branches side by side. A stretch of the course, from one station to another across steps, may run on
 * parallel tracks, counted or named. Lines go from one point of the course to others. Further courses each have a
 * title, stations, a labelled step and one outcome that leaves a station. Facts are headed lists of terms and texts,
 * tables, groups of lists and headed texts. A step or a station that is a part of the model names it, and the page
 * prints the model's label. The blocks after the course stand in one list, in the order the page sets them. Nothing
 * here says where anything stands, how large it is or in what type: those are the publisher's.
 */

import { TEXT, TRACKS, fieldsOf, isText, leastOf, sizeOf, variantOf } from "./vocabulary.mjs";

const COURSE = "/$defs/overviewCourse";
const FURTHER = "/$defs/overviewFurtherCourse";
const BLOCKS = "/properties/overview/properties/blocks";
const ITEMS_BLOCK = variantOf(`${BLOCKS}/items`, "items");
const TABLE_BLOCK = variantOf(`${BLOCKS}/items`, "columns");
const LISTS_BLOCK = variantOf(`${BLOCKS}/items`, "lists");
const LIST = `${LISTS_BLOCK}/properties/lists/items`;

/** The fields of the overview's objects, as the schema states them. */
const FIELDS = Object.freeze({
  overview: fieldsOf("/properties/overview"),
  station: fieldsOf("/$defs/overviewStation"),
  step: fieldsOf("/$defs/overviewStep"),
  spur: fieldsOf(`${COURSE}/properties/spurs/items`),
  fork: fieldsOf("/$defs/overviewFork"),
  course: fieldsOf(COURSE),
  line: fieldsOf(`${COURSE}/properties/lines/items`),
  pass: fieldsOf(`${COURSE}/properties/passes/items`),
  stretch: fieldsOf(`${COURSE}/properties/parallel/items`),
  further: fieldsOf(FURTHER),
  furtherPass: fieldsOf(`${FURTHER}/properties/pass`),
  furtherAside: fieldsOf(`${FURTHER}/properties/aside`),
  items: fieldsOf(ITEMS_BLOCK),
  table: fieldsOf(TABLE_BLOCK),
  lists: fieldsOf(LISTS_BLOCK),
  list: fieldsOf(LIST),
  text: fieldsOf(variantOf(`${BLOCKS}/items`, "text")),
});

/** The fewest items of the overview's lists, as the schema states them. */
const LEAST = Object.freeze({
  blocks: leastOf(BLOCKS),
  branches: leastOf("/$defs/overviewFork/properties/branches"),
  steps: leastOf(`${COURSE}/properties/steps`),
  stations: leastOf("/$defs/overviewStep/properties/stations"),
  spurs: leastOf(`${COURSE}/properties/spurs`),
  lines: leastOf(`${COURSE}/properties/lines`),
  to: leastOf(`${COURSE}/properties/lines/items/properties/to`),
  passes: leastOf(`${COURSE}/properties/passes`),
  parallel: leastOf(`${COURSE}/properties/parallel`),
  furtherStations: leastOf(`${FURTHER}/properties/stations`),
  columns: leastOf(`${TABLE_BLOCK}/properties/columns`),
  rows: leastOf(`${TABLE_BLOCK}/properties/rows`),
  lists: leastOf(`${LISTS_BLOCK}/properties/lists`),
});

/** The two parts of a pair of a headed list or of a list in a group, each a text; the schema's length is held to them. */
const PAIR = Object.freeze(["term", "text"]);
/** The term and text pairs of a headed list and of a list in a group: the fewest and a pair's length. */
const PAIRS = Object.freeze({
  items: {
    least: leastOf(`${ITEMS_BLOCK}/properties/items`),
    pair: sizeOf(`${ITEMS_BLOCK}/properties/items/items`),
  },
  list: {
    least: leastOf(`${LIST}/properties/items`),
    pair: sizeOf(`${LIST}/properties/items/items`),
  },
});
for (const [list, { pair }] of Object.entries(PAIRS))
  if (pair !== PAIR.length)
    throw new Error(
      `the model's schema states a pair of the ${list} list otherwise than as ${PAIR.join(" and ")}`,
    );

/**
 * @typedef {{ add: (code: import("../refusal.mjs").Code, path: string, message: string) => void,
 *   fields: (value: unknown, path: string, fields: import("./vocabulary.mjs").Fields) => boolean,
 *   text: (value: unknown, path: string, optional?: boolean) => void,
 *   id: (value: unknown, path: string) => void }} Problems
 */

/**
 * Check a model's `overview` and hand it back as stated, or null when the model states none or states a retired
 * composition.
 * @param {unknown} value
 * @param {Problems} problems
 * @param {Set<string>} componentIds
 * @param {Set<string>} viewIds the ids of the views the model declares
 */
export function readOverview(value, problems, componentIds, viewIds) {
  if (value === undefined) return null;
  if (typeof value === "string") {
    problems.add(
      "model_overview_composition_retired",
      "/overview",
      "a composition placed by coordinates is retired: state the overview as blocks in the model",
    );
    return null;
  }
  if (!problems.fields(value, "/overview", FIELDS.overview)) return null;
  const overview = /** @type {Record<string, any>} */ (value);
  problems.text(overview.claim, "/overview/claim");
  problems.text(overview.lead, "/overview/lead");
  checkCourse(overview.course, "/overview/course", problems, componentIds);
  if (overview.blocks !== undefined)
    eachOf(overview.blocks, "/overview/blocks", problems, LEAST.blocks, (block, path) => {
      if (block && typeof block === "object" && "stations" in block)
        checkFurtherCourse(block, path, problems, componentIds);
      else checkFact(block, path, problems);
    });
  checkViews(overview.course, "/overview/course", problems, viewIds);
  checkViews(overview.blocks, "/overview/blocks", problems, viewIds);
  return overview;
}

/**
 * A step, a station, a branch, a spur or a block may name the view that enlarges it: the page sets that view's plate
 * number after its name, as a link. Every `view` of the statement names a view the model declares.
 */
function checkViews(value, path, problems, viewIds) {
  if (Array.isArray(value))
    value.forEach((item, index) => checkViews(item, `${path}/${index}`, problems, viewIds));
  else if (value && typeof value === "object")
    for (const [key, item] of Object.entries(value)) {
      if (key !== "view") checkViews(item, `${path}/${key}`, problems, viewIds);
      else if (!viewIds.has(item))
        problems.add("model_reference_unknown", `${path}/view`, "names no declared view");
    }
}

/** Check each item of a list of at least `least`, or say the list is not one. */
function eachOf(value, path, problems, least, check) {
  if (!Array.isArray(value) || value.length < least) {
    problems.add("model_list_invalid", path, `must be a list of at least ${least} items`);
    return;
  }
  value.forEach((item, index) => check(item, `${path}/${index}`));
}

/**
 * Check a step or a station: its fields, its name (a label or a part), its part, its id; record the id among the
 * course's.
 */
function checkPoint(point, path, fields, problems, componentIds, ids) {
  if (!problems.fields(point, path, fields)) return false;
  const entry = /** @type {Record<string, any>} */ (point);
  if (entry.label === undefined && entry.part === undefined)
    problems.add("model_overview_invalid", path, "names neither a label nor the part it is");
  problems.text(entry.label, `${path}/label`, true);
  problems.text(entry.note, `${path}/note`, true);
  if (entry.part !== undefined && !componentIds.has(entry.part))
    problems.add("model_reference_unknown", `${path}/part`, "names no declared component");
  if (entry.id !== undefined) {
    problems.id(entry.id, `${path}/id`);
    if (ids.has(entry.id)) problems.add("model_id_duplicate", `${path}/id`, `repeats ${entry.id}`);
    ids.add(entry.id);
  }
  return true;
}

/**
 * Check a station of a course, or a fork: two branches or more, side by side at one place of the course, each a
 * station of its own.
 */
function checkStation(station, at, problems, componentIds, ids) {
  if (station && typeof station === "object" && "branches" in station) {
    if (!problems.fields(station, at, FIELDS.fork)) return;
    eachOf(station.branches, `${at}/branches`, problems, LEAST.branches, (branch, where) =>
      checkPoint(branch, where, FIELDS.station, problems, componentIds, ids),
    );
  } else checkPoint(station, at, FIELDS.station, problems, componentIds, ids);
}

/** Whether a stretch's tracks are a count of two to four, or two to four names. */
const tracksOf = (tracks) =>
  (Number.isInteger(tracks) && tracks >= TRACKS.least && tracks <= TRACKS.most) ||
  (Array.isArray(tracks) &&
    tracks.length >= TRACKS.least &&
    tracks.length <= TRACKS.most &&
    tracks.every(isText));

function checkCourse(course, path, problems, componentIds) {
  if (!problems.fields(course, path, FIELDS.course)) return;
  const { steps, lines, parallel, spurs, passes } = /** @type {Record<string, any>} */ (course);
  problems.text(/** @type {any} */ (course).text, `${path}/text`, true);
  /** @type {Set<string>} */
  const ids = new Set();
  // A step that holds stations is a run of them, not a point a line can start or end at. The points of the
  // course in order: a step without stations, a station, or a fork, whose branches share its place.
  /** @type {Set<string>} */
  const runs = new Set();
  /** @type {Map<string, number>} */
  const order = new Map();
  /** @type {Set<number>} */
  const forks = new Set();
  let place = 0;
  eachOf(steps, `${path}/steps`, problems, LEAST.steps, (step, where) => {
    if (!checkPoint(step, where, FIELDS.step, problems, componentIds, ids)) return;
    if (step.stations !== undefined && step.id !== undefined) runs.add(step.id);
    if (step.stations === undefined && step.id !== undefined) order.set(step.id, place);
    if (step.stations === undefined) place += 1;
    problems.text(step.text, `${where}/text`, true);
    if (step.stations !== undefined)
      eachOf(step.stations, `${where}/stations`, problems, LEAST.stations, (station, at) => {
        checkStation(station, at, problems, componentIds, ids);
        if (station && typeof station === "object" && Array.isArray(station.branches))
          forks.add(place);
        else if (station && typeof station === "object" && station.id !== undefined)
          order.set(station.id, place);
        place += 1;
      });
  });
  // A spur leaves a point of the course (a station or a step without stations) for a station of its own beside the
  // course: an input that joins it or a store it reads. A line may start or end at a spur.
  if (spurs !== undefined)
    eachOf(spurs, `${path}/spurs`, problems, LEAST.spurs, (spur, where) => {
      if (!checkPoint(spur, where, FIELDS.spur, problems, componentIds, ids)) return;
      if (spur.at === undefined) return;
      if (runs.has(spur.at))
        problems.add(
          "model_overview_invalid",
          `${where}/at`,
          "names a step that holds stations: name one of them",
        );
      else if (ids.has(spur.at) && !order.has(spur.at))
        problems.add(
          "model_overview_invalid",
          `${where}/at`,
          "names no point of the course: a spur leaves the course",
        );
      else if (!ids.has(spur.at))
        problems.add("model_reference_unknown", `${where}/at`, "names no step or station");
    });
  if (lines !== undefined)
    eachOf(lines, `${path}/lines`, problems, LEAST.lines, (line, where) => {
      if (!problems.fields(line, where, FIELDS.line)) return;
      problems.text(line.label, `${where}/label`);
      const end = (id, at) => {
        if (runs.has(id))
          problems.add(
            "model_overview_invalid",
            at,
            "names a step that holds stations: name one of them",
          );
        else if (!ids.has(id))
          problems.add("model_reference_unknown", at, "names no step or station");
      };
      end(line.from, `${where}/from`);
      eachOf(line.to, `${where}/to`, problems, LEAST.to, (target, at) => end(target, at));
    });
  if (parallel !== undefined)
    checkParallel(parallel, `${path}/parallel`, problems, { ids, runs, order, forks });
  // A label on the stretch of the course after a point, before the next.
  if (passes !== undefined)
    eachOf(passes, `${path}/passes`, problems, LEAST.passes, (pass, where) => {
      if (!problems.fields(pass, where, FIELDS.pass)) return;
      problems.text(pass.label, `${where}/label`);
      const at = order.get(pass.after);
      if (at !== undefined && at < place - 1) return;
      problems.add(
        ids.has(pass.after) || runs.has(pass.after)
          ? "model_overview_invalid"
          : "model_reference_unknown",
        `${where}/after`,
        "names no station or step without stations that another point follows",
      );
    });
}

/**
 * Check the stretches of a course on parallel tracks: each runs forward from one station (or step without stations)
 * to another on two to four tracks, counted or named, holds no fork and shares no point with another stretch.
 */
function checkParallel(parallel, path, problems, { ids, runs, order, forks }) {
  /** @type {number[][]} */
  const taken = [];
  eachOf(parallel, path, problems, LEAST.parallel, (stretch, where) => {
    if (!problems.fields(stretch, where, FIELDS.stretch)) return;
    const ends = /** @type {const} */ (["from", "to"]).map((key) => {
      const id = stretch[key];
      if (runs.has(id))
        problems.add(
          "model_overview_invalid",
          `${where}/${key}`,
          "names a step that holds stations: name one of them",
        );
      else if (ids.has(id) && !order.has(id))
        problems.add(
          "model_overview_invalid",
          `${where}/${key}`,
          "names no point of the course: a stretch runs on it",
        );
      else if (!ids.has(id))
        problems.add("model_reference_unknown", `${where}/${key}`, "names no step or station");
      return order.get(id);
    });
    if (!tracksOf(stretch.tracks))
      problems.add(
        "model_overview_invalid",
        `${where}/tracks`,
        `runs a stretch on ${TRACKS.least} to ${TRACKS.most} tracks, counted or named, each name a text of at most ${TEXT.most} characters, not blank and without a NUL`,
      );
    const [from, to] = ends;
    if (from === undefined || to === undefined) return;
    if (to < from) {
      problems.add("model_overview_invalid", `${where}/to`, "comes before the stretch's start");
      return;
    }
    const held = Array.from({ length: to - from + 1 }, (_, k) => from + k);
    if (held.some((at) => forks.has(at)))
      problems.add(
        "model_overview_invalid",
        where,
        "holds a fork: a stretch on tracks runs between stations",
      );
    else if (taken.some(([low, high]) => from <= high && low <= to))
      problems.add("model_overview_invalid", where, "shares a point with another stretch");
    taken.push([from, to]);
  });
}

function checkFurtherCourse(course, path, problems, componentIds) {
  if (!problems.fields(course, path, FIELDS.further)) return;
  problems.text(course.title, `${path}/title`);
  problems.text(course.note, `${path}/note`, true);
  problems.text(course.text, `${path}/text`, true);
  /** @type {Set<string>} */
  const ids = new Set();
  eachOf(course.stations, `${path}/stations`, problems, LEAST.furtherStations, (station, at) =>
    checkPoint(station, at, FIELDS.station, problems, componentIds, ids),
  );
  for (const [key, end, fields] of /** @type {const} */ ([
    ["pass", "after", FIELDS.furtherPass],
    ["aside", "from", FIELDS.furtherAside],
  ])) {
    const value = course[key];
    if (value === undefined || !problems.fields(value, `${path}/${key}`, fields)) continue;
    problems.text(value.label, `${path}/${key}/label`);
    if (!ids.has(value[end]))
      problems.add("model_reference_unknown", `${path}/${key}/${end}`, "names no station");
  }
}

/** Check the term and text pairs of a list, of at least `least` pairs of `pair` items. */
function checkItems(items, path, problems, { least, pair: size }) {
  eachOf(items, path, problems, least, (pair, at) => {
    if (!Array.isArray(pair) || pair.length !== size)
      return problems.add("model_overview_invalid", at, "must be a term and its text");
    pair.forEach((part, index) => problems.text(part, `${at}/${index}`));
  });
}

/** Check a fact: a headed list (`items`), a table (`columns` and `rows`) or a group of lists (`lists`). */
function checkFact(fact, path, problems) {
  const entry = /** @type {Record<string, any>} */ (fact);
  if (entry && typeof entry === "object" && "items" in entry) {
    if (!problems.fields(entry, path, FIELDS.items)) return;
    problems.text(entry.title, `${path}/title`);
    problems.text(entry.text, `${path}/text`, true);
    checkItems(entry.items, `${path}/items`, problems, PAIRS.items);
  } else if (entry && typeof entry === "object" && "columns" in entry) {
    if (!problems.fields(entry, path, FIELDS.table)) return;
    problems.text(entry.title, `${path}/title`);
    problems.text(entry.text, `${path}/text`, true);
    eachOf(entry.columns, `${path}/columns`, problems, LEAST.columns, (column, at) =>
      problems.text(column, at),
    );
    const width = Array.isArray(entry.columns) ? entry.columns.length : 0;
    eachOf(entry.rows, `${path}/rows`, problems, LEAST.rows, (row, at) => {
      if (!Array.isArray(row) || row.length !== width)
        return problems.add("model_overview_invalid", at, `must hold ${width} cells`);
      row.forEach((cell, index) => problems.text(cell, `${at}/${index}`));
    });
  } else if (entry && typeof entry === "object" && "lists" in entry) {
    if (!problems.fields(entry, path, FIELDS.lists)) return;
    problems.text(entry.title, `${path}/title`);
    problems.text(entry.text, `${path}/text`, true);
    eachOf(entry.lists, `${path}/lists`, problems, LEAST.lists, (list, at) => {
      if (!problems.fields(list, at, FIELDS.list)) return;
      problems.text(list.title, `${at}/title`);
      checkItems(list.items, `${at}/items`, problems, PAIRS.list);
    });
  } else if (entry && typeof entry === "object" && "text" in entry) {
    if (!problems.fields(entry, path, FIELDS.text)) return;
    problems.text(entry.title, `${path}/title`);
    problems.text(entry.text, `${path}/text`);
  } else
    problems.add(
      "model_overview_invalid",
      path,
      "is a course (stations), a list (items), a table (columns and rows), a group of lists (lists) or a headed text",
    );
}
