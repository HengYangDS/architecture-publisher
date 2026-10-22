import fs from "node:fs/promises";
import path from "node:path";
import { loadFigureIconSupply } from "../../packages/publisher/renderers/icons/index.mjs";
import { selectedNativeEdition } from "./selected-native-edition.mjs";

export const figureIcons = await loadFigureIconSupply();

export const browserExecutable = process.env.ARCHPUB_BROWSER_EXECUTABLE;

export async function responsibilityFixture(t, medium = "interactive") {
  const selected = await selectedNativeEdition(t, { media: [medium], width: 800 });
  const namespace = selected.request.sources.find(({ id }) => id === "model").namespace;
  const members = ["alpha", "beta"].map((id) => ({ namespace, id }));
  const view = selected.project.presentation[medium].views[0];
  view.groups = members.map((member, index) => ({
    id: index === 0 ? "first-role" : "second-role",
    label: index === 0 ? "First responsibility" : "Second responsibility",
    elements: [member],
  }));
  view.form = {
    schema: "architecture.visual-form/v1",
    kind: "responsibility",
    roles: [
      { group: "first-role", basis: "first-basis" },
      { group: "second-role", basis: "second-basis" },
    ],
    handoffs: [{ from: "first-role", to: "second-role", basis: "handoff-basis" }],
  };
  selected.project.editorialAssertions = [
    {
      id: "first-basis",
      statement: "The first component has the first responsibility.",
      proponent: selected.project.editor,
      basis: ["overview"],
      questions: ["shape"],
    },
    {
      id: "second-basis",
      statement: "The second component has the second responsibility.",
      proponent: selected.project.editor,
      basis: ["overview"],
      questions: ["shape"],
    },
    {
      id: "handoff-basis",
      statement: "The first component hands control to the second.",
      proponent: selected.project.editor,
      basis: ["overview"],
      questions: ["shape"],
    },
  ];
  const writeProject = async () => {
    await fs.writeFile(
      path.join(selected.root, "edition/project.json"),
      JSON.stringify(selected.project) + "\n",
    );
  };
  await writeProject();
  return { selected, view, members, writeProject };
}
