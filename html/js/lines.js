// lines.js
//
////////////////////////////////////
//
//  Drawing all lines on the flowchart.
//
////////////////////////////////////

// Blocks have 'in' points, outputs have 'out' points. But the saved position
// of each block is its Top-Left corner. So this just gets us the correct point
// for in or out for the given block.
//
// This finds the first item matching a selector and returns an x, y of it.
// xmul=0 ymul=0 returns top-leftmost point, xmul=1 ymul=1 returns
// bottom-right.
function calculateLinePoint(block, sel, xmul, ymul) {
  // Get the element defining the side.
  const el = get(sel, block);
  const elBox = el.getBoundingClientRect();

  // Compare to the flowchart top-left, since that is the only comparison our
  // <line>s in <svg>s use. Doesn't matter where the .block-container or
  // .block-master is
  const chartBox = EL.flowchart.getBoundingClientRect();

  return {
    x: elBox.left - chartBox.left + (elBox.width*xmul),
    y: elBox.top - chartBox.top + (elBox.height*ymul),
  }
}

// A variety of colors for each line to help separate them from each other.
function pickLineColor() {
  const colors = "cyan red green blue orange black brown purple".split(' ');
  return colors[Math.floor(Math.random() * colors.length)];
}

// Draw a node line between a source and a target, using their
// arrow and bullseye locations.
function drawLineSVG(spoint, tpoint, color) {
  EL.flowlines.append(EL('line', {
    x1: spoint.x, y1: spoint.y,
    x2: tpoint.x, y2: tpoint.y,
    stroke: color,
    'stroke-width': 4,
  }));
}

function drawSourceLine(source, tojs, param) {
  // Cheap hack to get around dragndrop's hiding the
  // original element.
  const touuid = tojs.uuid;
  const fromuuid = source.uuid;
  const toBlocks = getAll('#block' + touuid);
  const fromBlocks = getAll('#block' + fromuuid);
  const toBlock = toBlocks[toBlocks.length - 1];
  const fromBlock = fromBlocks[fromBlocks.length - 1];

  let idx = source.idx;
  if (!idx) idx = 0;

  const opProviders = getAll('.blockout-frame', fromBlock);
  if (!opProviders || opProviders.length === 0) return;

  const provider = opProviders[idx];

  // Now to find the actual points.
  const fromPos = calculateLinePoint(provider, 'div', 0.5, 0.5);
  const toPos = calculateLinePoint(toBlock, '[data-name="' + param.name + '"]', 0.1, 0.5);
  let color = pickLineColor();
  if ('color' in source) {
    color = source.color;
  } else {
    source.color = color;
    saveChart();
  }
  drawLineSVG(fromPos, toPos, color);
}

function redrawAllLines() {
  // Clear
  EL.flowlines.innerHTML = '';
  const fcbox = EL.flowchart.getBoundingClientRect();
  EL.flowlines.style.width = fcbox.width;
  EL.flowlines.style.height = fcbox.height;

  // Redraw.
  for (const blockjs of Object.values(CHART.blocks)) {
    if ('params' in blockjs) {
      for (const param of Object.values(blockjs.params)) {
        if ('source' in param && param.source.uuid in CHART.blocks) {
          const from = CHART.blocks[param.source.uuid];
          const to = blockjs;
          drawSourceLine(param.source, blockjs, param);
        }
      }
    }
  }

  // Stupid, stupid svg. It can't accept DOM objects, but it can accept new
  // innerHTML. Since none of the lines we make are interactable with, I'm just
  // gonna use this shortcut.
  EL.flowlines.innerHTML = EL.flowlines.innerHTML;
}

// Add an event for whenever something else needs us to redraw the lines.
// e.g: window resize or drag+drop move.
addTrigger('redrawAllLines', () => {
  redrawAllLines();
});
