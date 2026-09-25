import { loadCytoscapeSupply } from '../../packages/publisher/renderers/cytoscape/supply.mjs';

if (process.argv.length !== 3 || process.argv[2] !== '--check')
  throw new Error('cytoscape_supply_check_required');

const selected = await loadCytoscapeSupply();
process.stdout.write(`Cytoscape ${selected.version} supply verified\n`);
