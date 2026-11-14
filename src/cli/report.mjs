import path from "node:path";
import { Writable } from "node:stream";
import { styleText } from "node:util";
import { cancel, intro, log, outro, taskLog } from "@clack/prompts";
import stringWidth from "fast-string-width";
import { wrapAnsi } from "fast-wrap-ansi";

/**
 * The report contract of the command line: what a command found or did, for a reader at a terminal. A report has
 * a title with the command and its subject, groups of facts under a heading, each fact one line with a mark for
 * its state, a label and a value, and a closing line with the command to run next. The frame and the marks are
 * clack's. Every state has a mark of its own; colour repeats it and carries nothing else.
 */

/** The line clack draws for each state of a fact. */
const LINE = Object.freeze({
  passed: log.success,
  attention: log.warn,
  refused: log.error,
  noted: log.info,
});

/**
 * @typedef {{ state: keyof typeof LINE, label: string, value: string }} Fact
 * @typedef {{ heading: string, facts: Fact[] }} Group
 */

/**
 * The stream a report is written to, as far as its width goes.
 * @typedef {{ isTTY?: boolean, columns?: number }} Terminal
 */

/** The columns a value keeps, however wide its group's labels are. */
const NARROWEST = 20;

/** What a closing line opens with when it names the command to run next. */
const NEXT = "Next: ";

/**
 * A path a command wrote or read, as a reader in the working directory would type it: relative when it lies inside
 * that directory, and as it is otherwise. A result keeps the whole path; a report prints the one that fits a line.
 * @param {string} file
 */
function near(file) {
  const relative = path.relative(process.cwd(), file);
  return relative && !relative.startsWith("..") ? relative : file;
}

/**
 * A message that names paths, with each path inside the working directory printed relative to it, as `near` does
 * for a path of a result. The message of a `--json` result is untouched.
 * @param {string} message
 */
const nearby = (message) => message.replaceAll(`${process.cwd()}${path.sep}`, "");

/**
 * What a model writes in its `guide` to name a scaffolded draft: the draft's path from the model's own directory.
 * @param {string} model the model, as it was typed
 * @param {{ out: string, draft: string }} scaffold
 */
const guideField = (model, { out, draft }) =>
  path
    .relative(path.dirname(path.resolve(model)), path.join(out, draft))
    .split(path.sep)
    .join("/");

/** A path as an argument of the command to run next: quoted when it holds a space, as a shell needs it. */
const argument = (file) => (/\s/u.test(file) ? `"${file}"` : file);

/** A title that names a command's subject: the command and, when it was given one, its first argument as typed. */
const titled = (command, subject) =>
  subject ? `archpub ${command} · ${subject}` : `archpub ${command}`;

/** @param {keyof typeof LINE} state */
const fact =
  (state) =>
  /** @returns {Fact} */
  (/** @type {string} */ label, /** @type {string | number} */ value) => ({
    state,
    label,
    value: String(value),
  });
const passed = fact("passed");
const attention = fact("attention");
const refused = fact("refused");
const noted = fact("noted");

/** "1 view", "2 views". */
const count = (number, noun) => `${number} ${noun}${number === 1 ? "" : "s"}`;

/** "a", "a and b", "a, b and c". */
const series = (items) =>
  items.length === 1 ? items[0] : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;

/** A cited range as ` 10:12`, or nothing for a whole file. */
const range = (lines) => (lines ? ` ${lines[0]}:${lines[1]}` : "");

/**
 * A report, to be drawn with clack for the stream it is written to: a terminal's own columns, and 80 for a pipe
 * or a file. A group without a fact is left out. A group's labels are padded to its widest as the terminal
 * shows them, and a value longer than the columns left of it continues below, under its own column, so the
 * guide stands on every line. A long title continues beside the guide. The closing line is one line however
 * long: it stands after the frame's end, where no guide is lost, and the command it names is copied whole.
 * @param {{ title: string, groups: Group[], closing: string, failed?: boolean }} report
 * @returns {(stream: Terminal) => string}
 */
const draw = (report) => (stream) =>
  drawn(report, stream.isTTY && stream.columns ? stream.columns : 80);

/**
 * @param {{ title: string, groups: Group[], closing: string, failed?: boolean }} report
 * @param {number} columns
 */
function drawn({ title, groups, closing, failed = false }, columns) {
  /** @type {Buffer[]} */
  const chunks = [];
  const output = new Writable({
    write(chunk, _encoding, written) {
      chunks.push(chunk);
      written();
    },
  });
  // The frame's corner and its gap take three columns, and so do the guide and its gap before a further line.
  const [head, ...further] = wrapAnsi(title, columns - 3, { hard: true }).split("\n");
  intro(head, { output });
  if (further.length) log.message(further.join("\n"), { output, spacing: 0 });
  for (const { heading, facts } of groups.filter((group) => group.facts.length)) {
    log.message(styleText("bold", heading), { output });
    const width = Math.max(...facts.map(({ label }) => stringWidth(label)));
    // The mark and its gap take three columns and two more part the label from its value.
    const room = Math.max(columns - width - 5, NARROWEST);
    for (const { state, label, value } of facts) {
      const [first, ...rest] = wrapAnsi(value, room, { hard: true }).split("\n");
      // Clack sets the mark before the first line and the guide before each line after it.
      LINE[state](
        [
          `${label}${" ".repeat(width - stringWidth(label))}  ${first}`,
          ...rest.map((line) => `${" ".repeat(width)}  ${line}`),
        ].join("\n"),
        { output, spacing: 0 },
      );
    }
  }
  if (failed) {
    log.message([], { output });
    cancel(closing, { output });
  } else outro(closing, { output });
  return Buffer.concat(chunks).toString("utf8");
}

/**
 * The steps of a long command, drawn with clack's task log on a terminal: each step as the command reaches it,
 * then one line when it ends, and the steps it reached when it stopped short.
 * @param {string} title
 * @param {import("node:stream").Writable} output
 */
export function reportProgress(title, output) {
  const task = taskLog({ title, output });
  let steps = 0;
  return {
    step(/** @type {string} */ name) {
      steps += 1;
      task.message(name);
    },
    done: () => task.success(`${title}: ${count(steps, "step")} done`),
    stopped: () => task.error(`${title}: stopped`),
  };
}

/** The warnings a result carries, each under the place it concerns, or under its code when it names none. */
const warningGroup = (warnings) => ({
  heading: "Warnings",
  facts: warnings.map((warning) => attention(warning.path ?? warning.code, warning.message)),
});

/** How a plate sets its reading, as the words after its figure's share. */
const READING = Object.freeze({
  set: ", beside its reading",
  above: ", its reading above the figure",
  omitted: ", its reading left out",
  none: "",
});

/**
 * A plate's line: its views and its figure's share of the body, needing attention when it misses a balance gate,
 * each named as the result spells it, with what was measured and the limit it passed.
 */
function plateFact(plate) {
  const page = String(plate.page).padStart(2, "0");
  const misses = plate.misses ?? [];
  const drawn =
    `${plate.views.join(", ")} · figure ${Math.round(plate.share * 100)}% of the body` +
    READING[plate.reading];
  return misses.length
    ? attention(
        page,
        `${drawn} · misses ${series(
          misses.map(
            ({ measure, value, limit }) =>
              `${measure} ${value} (limit ${limit}${value === limit ? ", reached" : ""})`,
          ),
        )}`,
      )
    : passed(page, drawn);
}

/**
 * The re-pin worklist: each component with what changed in its files, the relations whose files changed, what a
 * build at the named commit refuses, the newly uncovered files and every guide citation that is not the same.
 */
function worklistFacts(worklist, commit) {
  const facts = worklist.components.map(({ id, label, modified, moved, deleted, taken }) =>
    attention(
      `${label} (${id})`,
      [
        ...(modified.length ? [`${count(modified.length, "file")} modified`] : []),
        ...moved.map(
          ({ path: file, to, owner }) =>
            `${file} moved to ${to}, ${owner ? `owned by ${owner}` : "under no claim"}`,
        ),
        ...deleted.map((file) => `${file} deleted`),
        ...(taken.length ? [`now owns ${series(taken)}`] : []),
      ].join("; "),
    ),
  );
  if (worklist.relations.length)
    facts.push(
      attention(
        "Relations",
        `files changed in ${series(
          worklist.relations.map(({ id, files }) => `${id} (${count(files.length, "file")})`),
        )}`,
      ),
    );
  if (worklist.refused.length)
    facts.push(
      refused(
        `Refused at ${commit.slice(0, 7)}`,
        worklist.refused
          .map((entry) =>
            entry.code === "claim_unmatched"
              ? `${entry.claim} of ${entry.component} owns no file`
              : `${entry.file} of ${entry.relation} is gone${entry.to ? `, moved to ${entry.to}` : ""}`,
          )
          .join("; "),
      ),
    );
  if (worklist.uncovered.length)
    facts.push(attention("Newly uncovered", series(worklist.uncovered)));
  return facts.length ? facts : [passed("Model", "nothing changes")];
}

/**
 * The guide's citations at the later revision: how many met each fate, then every citation that is not the same,
 * under its fate. They stand apart from the worklist, whose labels are long, so that a cited path keeps its line.
 */
function citationFacts(citations) {
  if (!citations.length) return [];
  const fates = ["same", "shifted", "moved", "touched", "gone"]
    .map((fate) => [fate, citations.filter((citation) => citation.fate === fate).length])
    .filter(([, held]) => held)
    .map(([fate, held]) => `${held} ${fate}`);
  const changed = citations.filter(({ fate }) => fate !== "same");
  return [
    (changed.length ? attention : passed)(
      "Guide",
      `${count(citations.length, "citation")}: ${series(fates)}`,
    ),
    ...changed.map(({ fate, where, path: file, lines, to, at }) =>
      attention(
        fate,
        `${where} ${file}${range(lines)}${at || to ? ` to${to ? ` ${to}` : ""}${range(at)}` : ""}`,
      ),
    ),
  ];
}

/** The model's currency against a later revision, and the worklist of re-pinning it there. */
function currencyGroups(currency) {
  const states = ["unchanged", "modified", "moved", "deleted"].map((state, index) => {
    const held = currency.files.filter((file) => file.state === state).length;
    return index ? `${held} ${state}` : `${count(held, "file")} ${state}`;
  });
  const { revision, commit } = currency.against;
  return [
    {
      heading: `Currency against ${revision} at ${commit.slice(0, 7)}`,
      facts: [
        (currency.commits || !currency.ancestor ? attention : passed)(
          "Commits",
          `${count(currency.commits, "commit")} since the pin` +
            (currency.ancestor ? "" : ", which is not its ancestor"),
        ),
        (currency.files.every(({ state }) => state === "unchanged") ? passed : attention)(
          "Files",
          series(states),
        ),
      ],
    },
    { heading: "Re-pin worklist", facts: worklistFacts(currency.worklist, commit) },
    { heading: "Citations", facts: citationFacts(currency.worklist.citations) },
  ];
}

/** The model's coverage of its checkout and, against a later revision, its currency. */
function coverageGroups(coverage) {
  const { files, largestUncovered, unmatched, citedOutsideScope, currency } = coverage;
  return [
    {
      heading: `Coverage at ${coverage.revision.slice(0, 7)}`,
      facts: [
        (files.uncovered ? attention : passed)(
          "Files",
          `${files.owned} of ${files.scope} owned, ${files.uncovered} uncovered, ${files.excluded} excluded`,
        ),
        ...(largestUncovered.length
          ? [
              attention(
                "Largest uncovered",
                largestUncovered
                  .map(
                    ({ path: directory, files: held }) => `${directory} (${count(held, "file")})`,
                  )
                  .join(", "),
              ),
            ]
          : []),
        ...(unmatched.length ? [attention("Matching no file", unmatched.join(", "))] : []),
        ...(citedOutsideScope.length
          ? [attention("Cited outside the scope", count(citedOutsideScope.length, "file"))]
          : []),
      ],
    },
    ...(currency ? currencyGroups(currency) : []),
  ];
}

/** "2 components (a, b)": how many of a kind, and which. */
const named = (ids, noun) => `${count(ids.length, noun)} (${ids.join(", ")})`;

/**
 * What a check found: admission, statements, plates, coverage, currency and warnings. The command to run next
 * names the checkout the check read, as it was typed.
 */
function checkReport(result, model, typed) {
  const { sources } = result;
  const files = {
    verified: () => passed("Files", `${count(sources.count, "file")} verified`),
    unverified: () =>
      attention("Files", `${count(sources.count, "file")} unverified without --repo`),
    none: () => noted("Files", "none claimed or cited"),
  }[sources.state];
  const statements = Object.entries(result.statements)
    .filter(([, found]) => found.components.length || found.relations.length)
    .map(([name, found]) =>
      attention(
        `${name[0].toUpperCase()}${name.slice(1)}`,
        series(
          [
            [found.components, "component"],
            [found.relations, "relation"],
          ]
            .filter(([ids]) => ids.length)
            .map(([ids, noun]) => named(ids, noun)),
        ),
      ),
    );
  return draw({
    title: `archpub check · ${result.model.id}`,
    groups: [
      {
        heading: "Model",
        facts: [
          passed("Views", `${count(result.views.length, "view")} admitted`),
          files(),
          ...statements,
        ],
      },
      { heading: "Plates", facts: result.plates.map(plateFact) },
      ...(result.coverage ? coverageGroups(result.coverage) : []),
      warningGroup(result.warnings),
    ],
    closing: `${NEXT}archpub build ${argument(model)}${
      typed.repo ? ` --repo ${argument(typed.repo)}` : ""
    } --out <directory>`,
  });
}

/** How verify found an acceptance signed. */
const SIGNATURE = Object.freeze({
  verified: (signer) =>
    passed("Signature", `signed by ${signer} and checked against the allowed signers`),
  unchecked: (signer) =>
    attention("Signature", `signed by ${signer}, unchecked without --allowed-signers`),
  unsigned: () => noted("Signature", "unsigned"),
});

/**
 * Each command's result as its report, given the argument and the options the command was given.
 * @type {Readonly<Record<string, (result: any, subject: string | undefined, typed: { repo?: string }) => (stream: Terminal) => string>>}
 */
const RESULT = Object.freeze({
  check: checkReport,
  build: (result) =>
    draw({
      title: `archpub build · ${result.model.id}`,
      groups: [
        {
          heading: "Delivery",
          facts: [
            passed("Views", count(result.views.length, "view")),
            ...(result.media.includes("edition")
              ? [passed("Edition", `${count(result.plates, "plate")} in ${result.model.id}.pdf`)]
              : []),
            ...(result.media.includes("page") ? [passed("Page", `${result.model.id}.html`)] : []),
            passed("Files", count(result.artifacts, "file")),
            passed("Directory", near(result.out)),
          ],
        },
        warningGroup(result.warnings),
      ],
      closing: `${NEXT}archpub accept ${argument(near(result.out))} --reviewer <name>`,
    }),
  "scaffold guide": (result, subject) =>
    draw({
      title: titled("scaffold guide", subject),
      groups: [
        {
          heading: "Guide",
          facts: [
            passed("Draft", result.draft),
            passed("Diagrams", count(result.files.length, "diagram")),
            passed("Directory", near(result.out)),
            // A model names its guide relative to itself, with forward slashes; the draft is no guide until then.
            noted(
              "Model",
              `name ${guideField(/** @type {string} */ (subject), result)} as its guide, then rewrite the draft`,
            ),
          ],
        },
      ],
      closing: `${NEXT}archpub check ${argument(subject)}`,
    }),
  "import likec4": (result, subject) =>
    draw({
      title: titled("import likec4", subject),
      groups: [
        {
          heading: "Model",
          facts: [
            passed("Components", result.components),
            passed("Relations", result.relations),
            passed("File", near(result.out)),
          ],
        },
        warningGroup(result.warnings),
      ],
      closing: `${NEXT}archpub check ${argument(near(result.out))}`,
    }),
  migrate: (result, subject) =>
    draw({
      title: titled("migrate", subject),
      groups: [
        {
          heading: "Model",
          facts: [
            passed("Claims", `components claim ${count(result.claims, "file")}`),
            passed("Citations", `relations cite ${count(result.cited, "file")}`),
            passed("File", near(result.out)),
            ...result.moved.map((entry) =>
              noted(
                `Kept with ${entry.owner}`,
                `${entry.path}, no longer cited by ${series(entry.components)}`,
              ),
            ),
          ],
        },
      ],
      closing: `${NEXT}archpub check ${argument(near(result.out))}`,
    }),
  accept: (result) =>
    draw({
      title: `archpub accept · ${near(result.directory)}`,
      groups: [
        {
          heading: "Acceptance",
          facts: [
            passed("Reviewer", result.reviewer),
            result.signer
              ? passed("Signature", `signed by ${result.signer} in ${result.signature}`)
              : noted("Signature", "unsigned"),
            passed("Colophon", near(result.colophon)),
          ],
        },
      ],
      closing: `${NEXT}archpub verify ${argument(near(result.directory))}`,
    }),
  verify: (result) =>
    draw({
      title: `archpub verify · ${near(result.directory)}`,
      groups: [
        {
          heading: "Acceptance",
          facts: [
            // What verify compared before it returned: every file with the manifest's digests, the manifest's
            // digest with the acceptance record's, and the colophon page's digest with the record's.
            passed(
              "Delivery",
              "its files match the manifest, the acceptance record names this manifest, and the colophon page is the one the record names",
            ),
            passed("Reviewer", `${result.reviewer} at ${result.acceptedAt}`),
            SIGNATURE[result.signature](result.signer),
          ],
        },
      ],
      closing: `${NEXT}archpub publish ${argument(near(result.directory))} --to <root>`,
    }),
  publish: (result, subject) =>
    draw({
      title: titled("publish", subject),
      groups: [
        {
          heading: "Publication",
          facts: [
            result.copied
              ? passed("Published", near(result.target))
              : noted("Already published", near(result.target)),
          ],
        },
      ],
      closing: "Done.",
    }),
  // The Skill is the agent's entry: it is printed as it is written.
  skill: (result) => () => result.skill,
});

/**
 * A command's result for a reader at a terminal.
 * @param {string} command the command's name, as `check` or `scaffold guide`
 * @param {any} result what the command returned
 * @param {string} [subject] the argument the command was given, a model or a delivery
 * @param {Terminal} [stream] the stream the report is written to
 * @param {{ repo?: string }} [typed] the options the command was given, as they were typed
 * @returns {string}
 */
export function reportResult(command, result, subject, stream = process.stdout, typed = {}) {
  return RESULT[command](result, subject, typed)(stream);
}

/**
 * A refusal: its code and message, then each problem on a line with its path, or with its code when it names none.
 * @param {string} command
 * @param {import("../refusal.mjs").Refusal} refusal
 * @param {Terminal} [stream] the stream the report is written to
 * @param {string} [subject] the command's first argument, as it was typed
 */
export function reportRefusal(command, refusal, stream = process.stdout, subject) {
  return draw({
    title: titled(command, subject),
    groups: [
      { heading: "Refused", facts: [refused(refusal.code, nearby(refusal.message))] },
      {
        heading: "Problems",
        facts: refusal.problems.map((problem) =>
          refused(problem.path ?? problem.code, nearby(problem.message)),
        ),
      },
    ],
    closing: "Exit status 1: refused",
    failed: true,
  })(stream);
}

/**
 * A failure that is no refusal, such as a file the command cannot read or write.
 * @param {string} command
 * @param {string} message
 * @param {Terminal} [stream] the stream the report is written to
 * @param {string} [subject] the command's first argument, as it was typed
 */
export function reportFailure(command, message, stream = process.stdout, subject) {
  return draw({
    title: titled(command, subject),
    groups: [{ heading: "Internal error", facts: [refused("Error", nearby(message))] }],
    closing: "Exit status 3: internal error",
    failed: true,
  })(stream);
}
