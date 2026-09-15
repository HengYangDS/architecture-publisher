import { readFileSync } from 'node:fs';
const example = (name) =>
  JSON.parse(
    readFileSync(
      new URL('../../examples/' + name + '.json', import.meta.url),
      'utf8',
    ),
  );
export const serviceTopology = () => example('service-topology');
export const jobLifecycle = () => example('job-lifecycle');

export function otherDiagramTypes() {
  const meta = (title) => ({
    title,
    locale: 'en',
    quality_profile: 'showcase',
  });
  return [
    {
      schema_version: 2,
      diagram_type: 'workflow',
      meta: meta('Support request workflow'),
      lanes: [{ id: 'service', label: 'Support service' }],
      nodes: [
        {
          id: 'receive',
          lane: 'service',
          col: 0,
          type: 'external',
          label: 'Receive',
        },
        {
          id: 'classify',
          lane: 'service',
          col: 1,
          type: 'backend',
          label: 'Classify',
        },
        {
          id: 'resolve',
          lane: 'service',
          col: 2,
          type: 'backend',
          label: 'Resolve',
        },
      ],
      edges: [
        { id: 'intake', from: 'receive', to: 'classify' },
        { id: 'resolve-request', from: 'classify', to: 'resolve' },
      ],
    },
    {
      schema_version: 1,
      diagram_type: 'sequence',
      meta: meta('Inventory reservation'),
      participants: [
        { id: 'orders', type: 'backend', label: 'Orders' },
        { id: 'inventory', type: 'database', label: 'Inventory' },
      ],
      messages: [
        {
          id: 'reserve',
          from: 'orders',
          to: 'inventory',
          y: 200,
          label: 'Reserve quantity',
        },
        {
          id: 'reserved',
          from: 'inventory',
          to: 'orders',
          y: 340,
          label: 'Reservation result',
          variant: 'return',
        },
      ],
    },
    {
      schema_version: 1,
      diagram_type: 'dataflow',
      meta: meta('Daily aggregate pipeline'),
      stages: [
        { label: 'Capture' },
        { label: 'Normalize' },
        { label: 'Aggregate' },
      ],
      nodes: [
        { id: 'events', type: 'messagebus', label: 'Events', stage: 0, row: 0 },
        { id: 'records', type: 'backend', label: 'Records', stage: 1, row: 0 },
        {
          id: 'daily',
          type: 'database',
          label: 'Daily totals',
          stage: 2,
          row: 0,
        },
      ],
      flows: [
        { id: 'normalize', from: 'events', to: 'records', label: 'normalize' },
        { id: 'aggregate', from: 'records', to: 'daily', label: 'aggregate' },
      ],
    },
  ];
}
