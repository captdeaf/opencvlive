// flowchart.js
//
// UI management for the boxes in the center pane.
////////////////////////////////////
//
//  Three types of blocks:
//
//    - Ops block: a single operation and its settings. No i/o,
//                 though it displays an input, inputs generate
//                 new nodes.
//
//    - Complex block: (an output-only block for json)
//
//    - Image (an output-only block)
//
////////////////////////////////////

// Utility functions. Block titles should eventually be editable
// so this is the plan.
function setBlockName(block, title) {

  // Update in the chart.
  updateChart(() => block.blockData.name = title)

  const head = get('.block-head', block);
  head.innerText = title;
}

function moveBlock(block, blockjs) {
  block.style.left = blockjs.pos.x + 'px';
  block.style.top = blockjs.pos.y + 'px';
}

////////////////////////////////////
//
//  Image Block flow:
//
//  Events here:
//    1) On load, render all Image Blocks.
//    2) On creating a new Image block.
//    3) Deleting an Image block.
//
////////////////////////////////////

// Add a single Image JS object from the chart.
function addImageBlock(imgjs) {
  const block = template('block-image');

  populateElement(block, {
    '.block-image-frame': EL('img', {
      class: "block-image",
      src: imgjs.path,
      'data-name': imgjs.name,
      'data-uuid': imgjs.uuid,
      'data-idx': 0,
    }),
  });

  block.blockData = imgjs;
  block.id = imgjs.uuid;
  block.dataset.type = imgjs.type;
  moveBlock(block, imgjs);
  setBlockName(block, imgjs.name);

  appendChildren(EL.flowchart, block);
}

// Generate new Image block and render it.
addTrigger('addImageAt', function(libraryElement, evt, fixedPos,
                              parentElement, relativePos) {
  const imgName = libraryElement.dataset.name;
  const imgPath = libraryElement.dataset.path;

  const imgjs = newImageJS(imgName, imgPath, relativePos);
  addImageBlock(imgjs);
});

////////////////////////////////////
//
//  Complex: complex JSON data to feed to zero or more ops.
//
//  Events here:
//    1) On load, render all Complex Blocks.
//    2) On creating a new Complex block.
//    3) Deleting a Complex block.
//
////////////////////////////////////

function addComplexBlock(cxjs) {
  const block = template('block-complex');

  block.blockData = cxjs;
  block.id = cxjs.uuid;
  block.dataset.type = cxjs.type;
  moveBlock(block, cxjs);
  setBlockName(block, cxjs.name);

  appendChildren(EL.flowchart, block);
}

// Generate a new Complex block and render it.
addTrigger('addComplexAt', function(libraryElement, evt, fixedPos,
                              parentElement, relativePos) {
  const cxName = "Complex JSON";

  const cxjs = newComplexJS(cxName, relativePos);
  addComplexBlock(cxjs);
});

////////////////////////////////////
//
//  Op Blocks: Calls out to OpenCV (Or rather, Python).
//
////////////////////////////////////

// Add a single op JS object from the chart.
function addOpBlock(opjs) {
  if (opjs.effect in ALL_EFFECTS.effects) {
    const effect = ALL_EFFECTS.effects[opjs.effect];
    const block = template('block-op');

    block.effect = effect;
    block.id = opjs.uuid;
    block.dataset.type = opjs.type;

    populateElement(block, {
      '.oplisting': getOpListing(effect, opjs.args),
      // '.block-out': getProviderListing(effect, opjs),
    });

    block.blockData = opjs;
    setBlockName(block, opjs.name);
    moveBlock(block, opjs);

    appendChildren(EL.flowchart, block);
    return block;
  } else {
    const block = template('block-op');
    block.blockData = {};
    setBlockName(block, "Unknown op");
    return block;
  }
}

// Generate new JS block and render it.
addTrigger('addOpAt', function(effectElement, evt, fixedPos,
                              parentElement, relativePos) {
  const effect = ALL_EFFECTS.effects[effectElement.dataset.effectName];
  const opjs = newOpJS(effect, relativePos);
  addOpBlock(opjs);
});

// Render all blocks from Chart JS
function renderAllBlocks(chart) {
  EL.flowchart.innerHTML = '';
  for (const [uuid, opjs] of Object.entries(chart.ops)) {
    addOpBlock(opjs);
  }
  for (const [uuid, imgjs] of Object.entries(chart.images)) {
    addImageBlock(imgjs);
  }

  for (const [uuid, cxjs] of Object.entries(chart.complexes)) {
    addComplexBlock(cxjs);
  }

  redrawAllLines();
  refreshOutputs();
}

////////////////////////////////////
//
//  Lines: drawing between:
//
//    - image->ops
//    - complex->ops
//    - ops->ops
//
//  This section is only for drawing nodes for existing connections.
//
//  Fortunately, all 'sources' are op args.
//
////////////////////////////////////


// Our blocks have 'in' points and 'out' points. But the
// saved position of each block is its Top-Left corner. So
// this just gets us the correct point for in or out for
// the given block.
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
const COLORS = "cyan red green blue orange black brown purple".split(' ');
let colori = 0;
function pickColor() {
  colori += 1;
  if (colori >= COLORS.length) colori = 0;
  return COLORS[colori];
}

function resetColors() {
  colori = 0;
}

// Draw a node line between a source and a target, using their
// arrow and bullseye locations.
function drawLineSVG(spoint, tpoint) {
  EL.flowlines.append(EL('line', {
    x1: spoint.x, y1: spoint.y,
    x2: tpoint.x, y2: tpoint.y,
    stroke: pickColor(),
  }));
  // Stupid, stupid svg. It can't accept DOM objects, but it can accept new
  // innerHTML. Since none of the lines we make are interactable with, I'm just
  // gonna use this shortcut.
  EL.flowlines.innerHTML = EL.flowlines.innerHTML;
}

function drawSourceLine(source, opjs, arg) {
  // Cheap hack to get around dragndrop's hiding the
  // original element.
  const touuid = opjs.uuid;
  const fromuuid = source.sourceid;
  const toBlocks = getAll('#' + touuid);
  const fromBlocks = getAll('#' + fromuuid);
  const toBlock = toBlocks[toBlocks.length - 1];
  const fromBlock = fromBlocks[fromBlocks.length - 1];

  let idx = source.idx;
  if (!idx) idx = 0;

  const opProviders = getAll('.op-provider', fromBlock);
  if (!opProviders || opProviders.length === 0) return;

  const provider = opProviders[idx];

  // Now to find the actual points.
  const fromPos = calculateLinePoint(provider, '.op-provider', 0.5, 0.5);
  const toPos = calculateLinePoint(toBlock, '[data-arg="' + arg.name + '"] .point', 0.5, 0.5);
  drawLineSVG(fromPos, toPos);
}

function redrawAllLines() {
  // Clear
  EL.flowlines.innerHTML = '';
  const fcbox = EL.flowchart.getBoundingClientRect();
  EL.flowlines.style.width = fcbox.width;
  EL.flowlines.style.height = fcbox.height;

  resetColors();

  // Redraw.
  for (const opjs of Object.values(CHART.ops)) {
    for (const arg of opjs.args) {
      if (arg.source) {
        const from = CHART[arg.source.type][arg.source.sourceid];
        const to = opjs;
        drawSourceLine(arg.source, opjs, arg);
      }
    }
  }
}

// Add an event for whenever something else needs us to redraw the lines.
// e.g: window resize or drag+drop move.
addTrigger('redrawAllLines', () => {
  redrawAllLines();
});

addTrigger('blockDrop', function(el, evt, fixedPos, parentElement, relativePos) {
  if (el && el.dataset.type) {
    moveBlockJS(el.blockData, relativePos);
  }
  redrawAllLines();
});

// Bind a source item (image or complex output) to an input item on an op.
addTrigger('bindToTarget', function(el, evt, fixedPos, matchedElements, relativePos) {
  const sourceBlock = findParent(el, '[data-type]');
  // matchedElements is from drag. We'll just care about the first one.
  const targetInput = findParent(matchedElements[0], '[data-arg]');
  const targetBlock = findParent(targetInput, '[data-type]');

  bindJS(sourceBlock.blockData, targetBlock.blockData, targetInput.dataset.arg, el.dataset.idx);
  renderAllBlocks(CHART);
});

// Remove an element from both Chart JS and HTML
// el can be: an op, a node, an image.
addTrigger('removeElement', (el, evt) => {
  removeBlockJS(el.blockData);
  removeElement(el);
  renderAllBlocks(CHART);
});

addInitializer(() => {
  renderAllBlocks(CHART);
});
