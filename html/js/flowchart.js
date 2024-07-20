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
//    - Node block: Below ops blocks. An instance of an operation, with an
//                  image input and output.
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
//  Op Block flow:
//
//  Events here:
//    1) On load, render all Op Blocks.
//    2) On creating a new Op block.
//    3) Deleting an Op block.
//
////////////////////////////////////

// Add a single op JS object from the chart.
function addOpBlock(opjs) {
  const effect = ALL_EFFECTS.effects[opjs.effect];
  const block = template('block-op');

  block.effect = effect;
  block.id = opjs.uuid;
  block.dataset.type = opjs.type;

  populateElement(block, {
    '.oplisting': getOpListing(effect, opjs.args),
  });

  block.blockData = opjs;
  setBlockName(block, opjs.name);
  moveBlock(block, opjs);

  appendChildren(EL.flowchart, block);
  return block;
}

// Generate new JS block and render it.
addTrigger('addOpAt', function(effectElement, evt, fixedPos,
                              parentElement, relativePos) {
  const effect = ALL_EFFECTS.effects[effectElement.dataset.effectName];
  const opjs = newOpJS(effect, relativePos);
  addOpBlock(opjs);
});

////////////////////////////////////
//
//  Nodes: These are subordinate to ops blocks. They are contained inside the
//  .op-master of the 'parent' ops block, and get much of their data from the
//  ops block. While they are draggable to trash, they are not actually movable.
//
////////////////////////////////////

// Adds a single node item.
function addNodeItem(opBlock, opjs, nodejs) {
  const effect = opBlock.blockData.effect;
  const nodeBlock = template('opnode', {});
  nodeBlock.id = nodejs.uuid;

  nodeBlock.opdata = opjs;
  nodeBlock.blockData = nodejs;
  nodeBlock.dataset.type = nodejs.type;

  nodeBlock.dataset.type = TYPE.node;
  nodeBlock.dataset.opid = opjs.uuid;
  opBlock.appendChild(nodeBlock);
}

// Render all blocks from Chart JS
function renderAllBlocks(chart) {
  EL.flowchart.innerHTML = '';
  for (const [uuid, opjs] of Object.entries(chart.ops)) {
    const block = addOpBlock(opjs);
    // Their child nodes.
    if (opjs.nodes) {
      for (const nodejs of Object.values(opjs.nodes)) {
        addNodeItem(block, opjs, nodejs)
      }
    }
  }
  for (const [uuid, imgjs] of Object.entries(chart.images)) {
    addImageBlock(imgjs);
  }

  redrawAllNodeLines();
  refreshOpImages();
}

////////////////////////////////////
//
//  Nodelines: drawing between:
//
//    - image->node
//    - node->node
//
//  This section is only for drawing nodes for existing connections.
//
//  Fortunately, all drawing sources are nodes.
//
//  A connection is defined as a node.sources[id].
//
//  At time of writing, only one source is supported in the js operations, but
//  I expect that to change as a number of opencv calls require more than a
//  single image to be passed.
//
//  As such, all sources are arrays. (in case order matters)
//
////////////////////////////////////


// Our blocks have 'in' points and 'out' points. But the
// saved position of each block is its Top-Left corner. So
// this just gets us the correct point for in or out for
// the given block.
function calculateLinePoint(block, loc) {
  // Get the element defining the side.
  if (loc === 'in') {
    var sel = ".block-arr.block-input";
  } else if (loc === 'out') {
    var sel = ".block-arr.block-output";
  }
  const el = get(sel, block);
  const elBox = el.getBoundingClientRect();

  // Compare to the flowchart top-left, since that is the only comparison our
  // <line>s in <svg>s use. Doesn't matter where the .block-container or
  // .block-master is
  const chartBox = EL.flowchart.getBoundingClientRect();

  return {
    x: elBox.left - chartBox.left + (elBox.width/2),
    y: elBox.top - chartBox.top + (elBox.height/2),
  }
}

// Draw a node line between a source and a target, using their
// arrow and bullseye locations.
function drawNodeLineSVG(source, target, opts) {
  const spoint = calculateLinePoint(source, 'out');
  const tpoint = calculateLinePoint(target, 'in');
  EL.flowlines.append(EL('line', {
    x1: spoint.x, y1: spoint.y,
    x2: tpoint.x, y2: tpoint.y,
    stroke: opts.color,
  }));
  // Stupid, stupid svg. It can't accept DOM objects, but it can accept new
  // innerHTML. Since none of the lines we make are interactable with, I'm just
  // gonna use this shortcut.
  EL.flowlines.innerHTML = EL.flowlines.innerHTML;
}

// BLAH TODO: REPLACE
function drawNodeLine(fromuuid, touuid, opts) {
  let fromjs;
  // Cheap hack to get around dragndrop's hiding the
  // original element.
  const toBlocks = getAll('#' + touuid);
  const fromBlocks = getAll('#' + fromuuid);
  const toBlock = toBlocks[toBlocks.length - 1];
  const fromBlock = fromBlocks[fromBlocks.length - 1];

  drawNodeLineSVG(fromBlock, toBlock, opts);
}

function redrawAllNodeLines() {
  // Clear
  EL.flowlines.innerHTML = '';
  const fcbox = EL.flowchart.getBoundingClientRect();
  EL.flowlines.style.width = fcbox.width;
  EL.flowlines.style.height = fcbox.height;

  // Redraw.
  for (const opjs of Object.values(CHART.ops)) {
    if (opjs.nodes) {
      for (const nodejs of Object.values(opjs.nodes)) {
        if (nodejs.sources) {
          for (const sourcejs of Object.values(nodejs.sources)) {
            drawNodeLine(sourcejs.sourceid, nodejs.uuid, sourcejs.opts);
          }
        }
      }
    }
  }
}

// Add an event for whenever something else needs us to redraw the lines.
// e.g: window resize or drag+drop move.
addTrigger('redrawAllNodeLines', () => {
  redrawAllNodeLines();
});

addTrigger('blockDrop', function(el, evt, fixedPos, parentElement, relativePos) {
  if (el && el.dataset.type) {
    moveBlockJS(el.blockData, relativePos);
  }
  redrawAllNodeLines();
});

addTrigger('bindToTarget', function(el, evt, fixedPos, matchedElements, relativePos) {
  const sourceBlock = findParent(el, '[data-type]');
  const targetBlock = findParent(matchedElements[0], '[data-type]');

  bindJS(sourceBlock.blockData, targetBlock.blockData);
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
