import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

export async function selectedNativeEdition(t, options = {}) {
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-selected-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'sources'));
  await fs.mkdir(path.join(root, 'edition'));
  const model = Buffer.from(
    "specification { element component }\nmodel { alpha = component 'Alpha'\n beta = component 'Beta'\n alpha -> beta }\n",
  );
  const views = Buffer.from('views { view overview { include * } }\n');
  const namespaces = ['fixture/model', 'fixture/views'];
  const project = {
    schema: 'architecture.edition-project/v1',
    id: 'selected-atlas',
    editor: 'fixture-editor',
    title: options.title ?? 'Selected architecture',
    audiences: [{ id: 'maintainer', label: 'Maintainers' }],
    questions: [{ id: 'shape', audience: 'maintainer', text: 'What is connected?' }],
    scope: {
      sourceNamespaces: namespaces,
      selections: [
        { id: 'overview', namespace: namespaces[1], kind: 'reference', reference: 'view:overview' },
      ],
      limits: [],
    },
    requiredAssertions: [
      { id: 'shape', kind: 'source', selection: 'overview', questions: ['shape'] },
    ],
    omissions: [],
    transformations: [],
    narrative: { summary: 'One selected structural view.', readingOrder: ['shape'] },
    presentation: {
      static: {
        views: [{ id: 'overview', questions: ['shape'] }],
        intent: 'Show the selected source structure.',
        width: options.width ?? 6000,
      },
      interactive: {
        views: [{ id: 'overview', questions: ['shape'] }],
        intent: 'Explore the selected source structure.',
      },
    },
    visualPolicy: { profile: 'neutral' },
  };
  const request = {
    schema: 'architecture.build-request/v1',
    edition: { kind: 'direct', root: 'edition', manifest: 'project.json' },
    sources: [
      { id: 'model', namespace: namespaces[0], path: 'sources/model.c4', bytes: model },
      { id: 'views', namespace: namespaces[1], path: 'sources/views.c4', bytes: views },
    ].map(({ id, namespace, path: locator, bytes }) => ({
      id,
      namespace,
      format: { id: 'likec4/dsl', version: 'unversioned' },
      claimant: 'fixture-maintainer',
      revision: { kind: 'content', algorithm: 'sha256' },
      input: { kind: 'pin', path: locator, sha256: sha(bytes) },
    })),
    providers: [],
    media: options.media ?? ['static', 'interactive'],
    toolchain: { profile: options.profile ?? 'portable' },
  };
  await fs.writeFile(path.join(root, 'sources/model.c4'), model);
  await fs.writeFile(path.join(root, 'sources/views.c4'), views);
  await fs.writeFile(path.join(root, 'edition/project.json'), JSON.stringify(project) + '\n');
  const file = path.join(root, 'build-request.json');
  const bytes = Buffer.from(JSON.stringify(request) + '\n');
  await fs.writeFile(file, bytes);
  return { root, file, digest: sha(bytes), request, project, model, views };
}
