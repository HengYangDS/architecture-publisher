/** Camera supply owns pan/zoom only. Product selection never changes geometry or source data. */
export const viewerScript = String.raw`
const pages = JSON.parse(document.getElementById('edition-data').textContent);
const sections = [...document.querySelectorAll('.edition-page')];
const tabs = [...document.querySelectorAll('[data-page-index]')];
const graphs = new Map();
const observers = new Map();
function fitGraph(graph) {
  graph.camera.resize();
  graph.camera.fit();
  graph.camera.center();
}
function reflectSelection(index, id) {
  const section = sections[index];
  let control = null;
  section.querySelectorAll('[data-focus-node], [data-focus-relation]').forEach(button => {
    const active = (button.dataset.focusNode || button.dataset.focusRelation) === id;
    button.setAttribute('aria-pressed', String(active));
    if (active) control = button;
  });
  section.querySelectorAll('[data-select-id]').forEach(element => {
    element.classList.toggle('is-selected', element.dataset.selectId === id);
  });
  const selected = pages[index].nodes.find(node => node.id === id);
  section.querySelector('[data-focus-status]').textContent = control
    ? 'Selected in diagram: ' + control.getAttribute('aria-label')
    : id ? 'Selected in diagram: ' + selected.label : 'Diagram selection cleared.';
}
function graphFor(index) {
  if (graphs.has(index)) return graphs.get(index);
  const page = pages[index];
  if (page.form || !page.nodes.length) return null;
  const container = document.getElementById('graph-' + index);
  const svg = container.querySelector('.graph-svg');
  const graph = {
    container, svg, selectedId: null,
    camera: svgPanZoom(svg, {
      viewportSelector: '.graph-viewport', controlIconsEnabled: false,
      minZoom: 0.05, maxZoom: 6, fit: true, center: true,
      preventMouseEventsDefault: false,
    }),
  };
  graphs.set(index, graph);
  container.addEventListener('click', event => {
    const selected = event.target.closest('[data-select-id]');
    const id = selected ? selected.dataset.selectId : null;
    graph.selectedId = graph.selectedId === id ? null : id;
    reflectSelection(index, graph.selectedId);
  });
  const observer = new ResizeObserver(() => {
    if (!sections[index].hidden) fitGraph(graph);
  });
  observer.observe(container);
  observers.set(index, observer);
  container.dataset.rendered = 'true';
  return graph;
}
function focusSubject(index, id) {
  const graph = graphFor(index);
  if (!graph) return;
  graph.selectedId = id;
  reflectSelection(index, id);
  const geometry = pages[index].geometry;
  const node = geometry.nodes.find(node => node.id === id);
  const relation = geometry.relations.find(relation => relation.id === id);
  let center;
  if (node) center = {x: node.x + node.width / 2, y: node.y + node.height / 2};
  else {
    const xs = relation.points.map(point => point.x);
    const ys = relation.points.map(point => point.y);
    center = {x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2};
  }
  graph.camera.zoom(1.35);
  const sizes = graph.camera.getSizes();
  const scale = sizes.realZoom;
  const viewport = sizes.viewBox;
  graph.camera.pan({x: sizes.width / 2 - (center.x - viewport.x) * scale, y: sizes.height / 2 - (center.y - viewport.y) * scale});
}
function show(index) {
  sections.forEach((section, at) => { section.hidden = at !== index; });
  tabs.forEach((tab, at) => {
    if (at === index) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });
  requestAnimationFrame(() => {
    const graph = graphFor(index);
    if (graph) fitGraph(graph);
  });
}
tabs.forEach((tab, index) => tab.addEventListener('click', () => show(index)));
document.querySelectorAll('[data-focus-node], [data-focus-relation]').forEach(button => {
  button.addEventListener('click', () => {
    const section = button.closest('.edition-page');
    focusSubject(Number(section.dataset.page), button.dataset.focusNode || button.dataset.focusRelation);
  });
});
document.querySelectorAll('[data-fit]').forEach(button => {
  button.addEventListener('click', () => {
    const graph = graphFor(Number(button.dataset.fit));
    if (graph) fitGraph(graph);
  });
});
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  observers.forEach(observer => observer.disconnect());
  graphs.forEach(graph => graph.camera.destroy());
  observers.clear(); graphs.clear();
});
document.fonts.ready.then(() => show(0));
`;
