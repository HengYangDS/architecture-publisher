import http from "node:http";
import { chromium } from "playwright-core";
import { renderInteractiveEditionHtml } from "../../packages/publisher/renderers/interactive/index.mjs";
import { interactiveEditionScene } from "./interactive-edition-scene.mjs";
import { browserLifetime } from "./browser-lifetime.mjs";

export const browserExecutable = process.env.ARCHPUB_BROWSER_EXECUTABLE;

export async function createInteractiveReadingFixture({ t }) {
  const scene = interactiveEditionScene();
  const lifetime = browserLifetime(t);
  const compactCandidate = await renderInteractiveEditionHtml(interactiveEditionScene());
  const dedupScene = interactiveEditionScene();
  Object.assign(dedupScene.visualPolicy.figureTypes, {
    contract: "lucide:scroll-text",
    registry: "lucide:database",
  });
  dedupScene.pages[0].nodes[0].label = "Precontract";
  dedupScene.pages[0].nodes[0].kind = "contract";
  dedupScene.pages[0].nodes[0].figureKind = "contract";
  dedupScene.pages[0].nodes[0].icon = "lucide:scroll-text";
  dedupScene.pages[0].nodes[1].label = "Client registry";
  dedupScene.pages[0].nodes[1].kind = "registry";
  dedupScene.pages[0].nodes[1].figureKind = "registry";
  dedupScene.pages[0].nodes[1].icon = "lucide:database";
  const dedupCandidate = await renderInteractiveEditionHtml(dedupScene);
  const overview = scene.pages[0];
  for (let index = 0; index < 10; index += 1) {
    const id = "client-" + index;
    const relationId = "relation-client-" + index;
    const endpoint = { namespace: overview.nodes[1].namespace, id };
    overview.nodes.push({ ...overview.nodes[1], id, label: "Client " + index });
    overview.relations.push({
      ...overview.relations[0],
      id: relationId,
      from: overview.relations[0].to,
      to: endpoint,
    });
    overview.sourceAssertionCarriers[0].nodeRefs.push(endpoint);
    overview.sourceAssertionCarriers[0].relationRefs.push({
      ...overview.sourceAssertionCarriers[0].relationRefs[0],
      reference: relationId,
    });
  }
  const candidate = await renderInteractiveEditionHtml(scene);
  const hostileScene = interactiveEditionScene();
  hostileScene.pages[0].nodes[0].label = "<img src=x onerror=x>";
  const hostileCandidate = await renderInteractiveEditionHtml(hostileScene);
  const chainScene = interactiveEditionScene();
  const chain = chainScene.pages[0];
  chain.nodes[0].label = "Result[E,T]";
  chain.nodes[1].label = "Effect[R,E,T]";
  chain.relations[0].label = "";
  for (const label of ["Computation[R,E,T]", "Dependency Mgmt", "Injector Orchestration"]) {
    const previous = chain.nodes.at(-1);
    const id = `layer-${chain.nodes.length}`;
    const node = { ...chain.nodes[1], id, label };
    const relation = {
      ...chain.relations[0],
      id: `relation-${id}`,
      from: { namespace: previous.namespace, id: previous.id },
      to: { namespace: node.namespace, id },
    };
    chain.nodes.push(node);
    chain.relations.push(relation);
    chain.sourceAssertionCarriers[0].nodeRefs.push({ namespace: node.namespace, id });
    chain.sourceAssertionCarriers[0].relationRefs.push({
      namespace: relation.origin.namespace,
      reference: relation.id,
      sha256: relation.origin.sha256,
    });
  }
  const chainCandidate = await renderInteractiveEditionHtml(chainScene);
  const groupedScene = structuredClone(chainScene);
  const grouped = groupedScene.pages[0];
  grouped.nodes.pop();
  grouped.relations.pop();
  grouped.sourceAssertionCarriers[0].nodeRefs.pop();
  grouped.sourceAssertionCarriers[0].relationRefs.pop();
  grouped.groups = [
    {
      id: "input",
      label: "Input",
      elements: grouped.nodes.slice(0, 2).map(({ namespace, id }) => ({ namespace, id })),
    },
    {
      id: "effect",
      label: "Effect",
      elements: grouped.nodes.slice(2).map(({ namespace, id }) => ({ namespace, id })),
    },
  ];
  const groupedCandidate = await renderInteractiveEditionHtml(groupedScene);
  const branchingScene = interactiveEditionScene();
  const branching = branchingScene.pages[0];
  const nodeTemplate = branching.nodes[0];
  const relationTemplate = branching.relations[0];
  const labels = [
    "Operator",
    "Controller",
    "Configuration",
    "Admitted adapters",
    "Native projection",
    "Native client",
    "Selected endpoint",
  ];
  branching.nodes = labels.map((label, index) => ({
    ...nodeTemplate,
    id: `branch-node-${index}`,
    label,
  }));
  branching.relations = [
    [0, 1],
    [1, 2],
    [1, 3],
    [3, 4],
    [4, 5],
    [5, 6],
  ].map(([from, to], index) => ({
    ...relationTemplate,
    id: `branch-relation-${index}`,
    from: { namespace: nodeTemplate.namespace, id: branching.nodes[from].id },
    to: { namespace: nodeTemplate.namespace, id: branching.nodes[to].id },
    label: `relation-${index}`,
  }));
  branching.sourceAssertionCarriers[0].nodeRefs = branching.nodes.map(({ namespace, id }) => ({
    namespace,
    id,
  }));
  branching.sourceAssertionCarriers[0].relationRefs = branching.relations.map(({ id, origin }) => ({
    namespace: origin.namespace,
    reference: id,
    sha256: origin.sha256,
  }));
  const branchingCandidate = await renderInteractiveEditionHtml(branchingScene);
  const server = http.createServer((request, response) => {
    if (
      ![
        "/edition.html",
        "/hostile.html",
        "/chain.html",
        "/branching.html",
        "/grouped.html",
        "/compact.html",
        "/dedup.html",
      ].includes(request.url)
    ) {
      response.writeHead(404);
      response.end();
      return;
    }
    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    });
    response.end(
      request.url === "/hostile.html"
        ? hostileCandidate.bytes
        : request.url === "/chain.html"
          ? chainCandidate.bytes
          : request.url === "/branching.html"
            ? branchingCandidate.bytes
            : request.url === "/grouped.html"
              ? groupedCandidate.bytes
              : request.url === "/compact.html"
                ? compactCandidate.bytes
                : request.url === "/dedup.html"
                  ? dedupCandidate.bytes
                  : candidate.bytes,
    );
  });
  lifetime.use(server);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const browser = await lifetime.acquire(() =>
    chromium.launch({
      executablePath: browserExecutable,
      headless: true,
      chromiumSandbox: true,
      timeout: 15_000,
    }),
  );
  const context = await lifetime.acquire(() =>
    browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
      serviceWorkers: "block",
    }),
  );
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return { server, page, errors };
}
