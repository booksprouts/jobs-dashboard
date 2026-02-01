/* global d3 */

const svg = d3.select('#graph');

const toggleOperational = document.getElementById('toggleOperational');
const toggleDecision = document.getElementById('toggleDecision');
const resetBtn = document.getElementById('reset');

const COLORS = {
  data: '#3b82f6',
  entity: '#22c55e',
  policy: '#a855f7',
  decision: '#f97316',
  action: '#111210',
};

// Small, illustrative graph.
// Layering idea:
// - operational context: entities, systems, data, policies
// - decision context: decision trace nodes + edges
const baseNodes = [
  { id: 'AI Agent', group: 'action', layer: 'operational' },
  { id: 'CRM Account', group: 'entity', layer: 'operational' },
  { id: 'Support Tickets', group: 'data', layer: 'operational' },
  { id: 'Incident History', group: 'data', layer: 'operational' },
  { id: 'Contract', group: 'data', layer: 'operational' },
  { id: 'Policy: Discount Cap', group: 'policy', layer: 'operational' },
  { id: 'Finance Approver', group: 'entity', layer: 'operational' },
  { id: 'Sales Owner', group: 'entity', layer: 'operational' },
  { id: 'Workflow: Renewal', group: 'action', layer: 'operational' },
];

const decisionNodes = [
  { id: 'Decision Trace', group: 'decision', layer: 'decision' },
  { id: 'Policy v3.2 Evaluated', group: 'decision', layer: 'decision' },
  { id: 'Exception: Prior Precedent', group: 'decision', layer: 'decision' },
  { id: 'Approval Recorded', group: 'decision', layer: 'decision' },
  { id: 'Outcome: 20% Discount', group: 'decision', layer: 'decision' },
];

const baseLinks = [
  { source: 'AI Agent', target: 'CRM Account', type: 'reads' },
  { source: 'AI Agent', target: 'Support Tickets', type: 'reads' },
  { source: 'AI Agent', target: 'Incident History', type: 'reads' },
  { source: 'AI Agent', target: 'Contract', type: 'reads' },
  { source: 'AI Agent', target: 'Policy: Discount Cap', type: 'checks' },
  { source: 'Workflow: Renewal', target: 'CRM Account', type: 'updates' },
  { source: 'Sales Owner', target: 'CRM Account', type: 'owns' },
  { source: 'Finance Approver', target: 'Policy: Discount Cap', type: 'governs' },
  { source: 'AI Agent', target: 'Workflow: Renewal', type: 'executes' },
];

const decisionLinks = [
  { source: 'AI Agent', target: 'Decision Trace', type: 'writes trace' },
  { source: 'Decision Trace', target: 'Policy v3.2 Evaluated', type: 'includes' },
  { source: 'Decision Trace', target: 'Exception: Prior Precedent', type: 'references' },
  { source: 'Decision Trace', target: 'Approval Recorded', type: 'records' },
  { source: 'Approval Recorded', target: 'Finance Approver', type: 'by' },
  { source: 'Policy v3.2 Evaluated', target: 'Policy: Discount Cap', type: 'versioned' },
  { source: 'Decision Trace', target: 'Outcome: 20% Discount', type: 'results in' },
  { source: 'Outcome: 20% Discount', target: 'Workflow: Renewal', type: 'applied to' },
];

let width = 800;
let height = 560;

function resize() {
  const rect = svg.node().getBoundingClientRect();
  width = Math.max(320, rect.width || 800);
  height = Math.max(420, rect.height || 560);
  svg.attr('viewBox', `0 0 ${width} ${height}`);
}

window.addEventListener('resize', () => {
  resize();
  render();
});

function activeData() {
  const nodes = [...baseNodes];
  const links = [...baseLinks];
  if (toggleDecision.checked) {
    nodes.push(...decisionNodes);
    links.push(...decisionLinks);
  }

  if (!toggleOperational.checked) {
    // keep agent and decision nodes if decision layer is on
    const keep = new Set(['AI Agent']);
    decisionNodes.forEach((n) => keep.add(n.id));
    const filteredNodes = nodes.filter((n) => keep.has(n.id));
    const allowed = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = links.filter(
      (l) => allowed.has(l.source.id || l.source) && allowed.has(l.target.id || l.target)
    );
    return { nodes: filteredNodes, links: filteredLinks };
  }

  return { nodes, links };
}

function render() {
  resize();

  const { nodes, links } = activeData();

  svg.selectAll('*').remove();

  const g = svg.append('g');

  const zoom = d3
    .zoom()
    .scaleExtent([0.6, 2.5])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

  svg.call(zoom);

  const link = g
    .append('g')
    .attr('stroke', '#bfb6a4')
    .attr('stroke-opacity', 0.85)
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke-width', (d) => (d.type.includes('writes') ? 2.4 : 1.5));

  const linkLabel = g
    .append('g')
    .selectAll('text')
    .data(links)
    .join('text')
    .attr('font-size', 11)
    .attr('fill', '#5a5a4e')
    .attr('opacity', 0)
    .text((d) => d.type);

  const node = g
    .append('g')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .attr('tabindex', 0)
    .style('cursor', 'pointer');

  node
    .append('circle')
    .attr('r', (d) => (d.id === 'AI Agent' ? 18 : d.group === 'decision' ? 14 : 12))
    .attr('fill', (d) => COLORS[d.group] || '#999')
    .attr('stroke', '#ffffff')
    .attr('stroke-width', 2);

  node
    .append('text')
    .attr('x', 16)
    .attr('y', 4)
    .attr('font-size', 12)
    .attr('fill', '#111210')
    .text((d) => d.id);

  const sim = d3
    .forceSimulation(nodes)
    .force(
      'link',
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance((d) => (d.type.includes('includes') ? 90 : 120))
        .strength(0.9)
    )
    .force('charge', d3.forceManyBody().strength(-420))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide().radius(26));

  function focusOn(d) {
    const neighbors = new Set([d.id]);
    links.forEach((l) => {
      const s = l.source.id || l.source;
      const t = l.target.id || l.target;
      if (s === d.id) neighbors.add(t);
      if (t === d.id) neighbors.add(s);
    });

    node.attr('opacity', (n) => (neighbors.has(n.id) ? 1 : 0.15));
    link.attr('opacity', (l) => {
      const s = l.source.id || l.source;
      const t = l.target.id || l.target;
      return s === d.id || t === d.id ? 1 : 0.15;
    });
  }

  function clearFocus() {
    node.attr('opacity', 1);
    link.attr('opacity', 0.85);
    linkLabel.attr('opacity', 0);
  }

  node.on('click', (event, d) => {
    event.stopPropagation();
    focusOn(d);
  });

  svg.on('click', () => {
    clearFocus();
  });

  link
    .on('mouseover', (event, d) => {
      linkLabel.attr('opacity', (l) => (l === d ? 1 : 0));
    })
    .on('mouseout', () => {
      linkLabel.attr('opacity', 0);
    });

  sim.on('tick', () => {
    link
      .attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y);

    node.attr('transform', (d) => `translate(${d.x},${d.y})`);

    linkLabel
      .attr('x', (d) => (d.source.x + d.target.x) / 2)
      .attr('y', (d) => (d.source.y + d.target.y) / 2);
  });
}

toggleOperational.addEventListener('change', render);
toggleDecision.addEventListener('change', render);
resetBtn.addEventListener('click', () => {
  toggleOperational.checked = true;
  toggleDecision.checked = true;
  render();
});

render();
