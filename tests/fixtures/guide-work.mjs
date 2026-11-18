import fs from "node:fs/promises";
import path from "node:path";
import { minimalModel, temporaryDirectory } from "./models.mjs";
import { repository } from "./repository.mjs";

/** A work with a guide beside its model, pinned to a fixture repository: for the tests of guides and of builds. */

export const URL = "https://github.com/example/shop.git";

/** A guide that draws the shop's parts from a local file, a request as a sequence, and cites a line. */
export function draft(revision, { sentence = "The service is one module." } = {}) {
  return `# How does the shop answer a request? {#shop}

The front end calls the service, and the service answers from its own code.[](source:main)

- ${sentence}[](source:main)

@answer scope="A fixture for the guide tests."
@meta locale=en repo_url="${URL}" repo_revision=${revision}
@source main title="The service" path="src/main.mjs" lines=1:1

## Which parts are there? {#parts}

@diagram architecture id=parts-map source=parts.architecture.json title="The shop"

## Who talks to whom? {#talk}

@sequence id=talk-flow title="A request"
| actor web | Front end | frontend |
| actor api | Service | backend | source:main |
| web | api | request |
| api | web | answer | return |

@steps id=talk-steps
| step-ask | Front end | Sends one request. | talk-flow | web |
| step-answer | Service | Answers it.[](source:main) | talk-flow | api |

@code id=main-code source=main language=js
`;
}

export const PARTS = `${JSON.stringify(
  {
    schema_version: 1,
    diagram_type: "architecture",
    meta: { title: "The shop", output: "parts.html", quality_profile: "showcase", locale: "en" },
    components: [
      { id: "web", type: "frontend", label: "Front end", pos: [40, 40], size: [180, 68] },
      { id: "api", type: "backend", label: "Service", pos: [340, 40], size: [180, 68] },
    ],
    connections: [{ id: "calls", from: "web", to: "api", label: "calls" }],
  },
  null,
  2,
)}\n`;

/** A model beside its guide, pinned to a fixture repository; returns the model's path and the checkout. */
export async function guideWork(t, options = {}) {
  const source = await repository(t);
  const root = await temporaryDirectory(t, "archpub-guide-work-");
  await fs.mkdir(path.join(root, "guide"));
  const text = options.draft ?? draft(source.revision, options);
  await fs.writeFile(path.join(root, "guide/guide.archify.md"), text);
  await fs.writeFile(path.join(root, "guide/parts.architecture.json"), PARTS);
  await fs.writeFile(path.join(root, "guide/notes.txt"), "Not referenced.\n");
  const model = minimalModel({
    repository: { name: "shop", url: URL, revision: source.revision },
    guide: "guide/guide.archify.md",
  });
  const file = path.join(root, "model.json");
  await fs.writeFile(file, JSON.stringify(model));
  return { model: file, root, source, draft: text };
}
