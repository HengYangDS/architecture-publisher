import { claimModel } from './claim-model.mjs';
import { claimModelDigest } from '../../packages/publisher/src/semantics/document.mjs';

export function editionFixture() {
  const model = claimModel(),
    allClaims = Object.keys(model.claims).sort(),
    overview = {
      label: 'Complete overview',
      questions: ['system'],
      claims: [...allClaims],
      composition: {
        groups: [
          {
            id: 'system',
            label: 'System',
            entities: ['client', 'server', 'other'],
          },
        ],
        relations: [
          {
            id: 'request',
            fromSide: 'right',
            toSide: 'left',
            route: 'orthogonal-h',
          },
        ],
      },
    };
  return {
    model,
    edition: {
      schema: 'architecture.edition/v1',
      id: 'example-system',
      owner: 'example:system',
      class: 'structural',
      product: {
        name: 'Architecture Publisher',
        schema: 'architecture.publisher/v1',
        version: '0.2.0-alpha.0',
      },
      source: {
        manifestSha256: 'f'.repeat(64),
      },
      claimModel: {
        schema: 'architecture.claim-model/v2',
        digest: claimModelDigest(model),
      },
      title: 'Example system',
      audiences: {
        maintainer: { label: 'Maintainers' },
      },
      questions: {
        system: {
          audience: 'maintainer',
          prompt: 'How does the complete system behave?',
          claims: [...allClaims],
          detail: 'overview',
          risk: 'Omission would hide the declared architecture.',
        },
        runtime: {
          audience: 'maintainer',
          prompt: 'How is runtime health observed?',
          claims: ['observed'],
          detail: 'mechanism',
          risk: 'Omission would hide the observation boundary.',
        },
      },
      requiredClaims: [...allClaims],
      omissions: {},
      narrative: ['overview', 'runtime'],
      visualGrammar: {
        entityTypes: { component: 'backend' },
        relationTypes: {
          calls: { label: 'calls', variant: 'emphasis' },
        },
        principles: [
          'One causal spine',
          'Meaning before decoration',
          'Stable geometry during motion',
        ],
      },
      scenes: {
        static: structuredClone(overview),
        interactive: {
          overview: {
            ...structuredClone(overview),
            purpose: 'overview',
          },
          runtime: {
            label: 'Runtime observation',
            purpose: 'mechanism',
            questions: ['runtime'],
            claims: ['observed'],
            composition: {
              groups: [
                {
                  id: 'runtime',
                  label: 'Runtime',
                  entities: ['client'],
                },
              ],
              relations: [],
            },
          },
        },
      },
      qualification: {
        semantic: ['claim-model-valid'],
        coverage: ['required-claims-visible'],
        static: ['painted-geometry'],
        interactive: ['browser-behavior'],
        accessibility: ['keyboard-and-reduced-motion'],
        installed: ['offline-reproduction'],
        recovery: [],
        human: [],
      },
      scope: 'Structural fixture; no aesthetic approval.',
    },
  };
}
