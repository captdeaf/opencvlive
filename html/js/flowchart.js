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
//    - Image (an output-only 'node')
//
////////////////////////////////////
//
//  Image Block flow:
//
//  1) We need a new imgjs, they call chart's newImageJS() with ...
//      - on renderAll: (fetches from passed chart)
//      - addEffectAt: newImageJS(name, path, pos) to generate new opjs
//  2) addImageBlock(imgjs): Creates DOM block and configures it.
//  3) updateImageBlock(block, imgjs)
//
////////////////////////////////////

const RENDERED_BLOCKS = {};

function updateImageBlock(block, imgjs) {
  populateElement(block, {
    '.block-head': imgjs.name,
    '.block-image-frame': EL('img', {
      class: "block-image",
      src: imgjs.path,
      'data-name': imgjs.name,
    }),
  });

  block.style.top = imgjs.pos.top + 'px';
  block.style.left = imgjs.pos.left + 'px';
  return block;
}

// Add a single Image JS object from the chart.
function addImageBlock(imgjs) {
  const effect = ALL_EFFECTS.effects[imgjs.effect];

  const block = template('block-image');
  block.id = imgjs.uuid;
  block.dataset.type = TYPE.image;
  updateImageBlock(block, imgjs);

  RENDERED_BLOCKS[imgjs.uuid] = block;

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
//  1) We need a new opjs, they call chart's createOpJS with ...
//      - on renderAll: (fetches from passed chart)
//      - addEffectAt: newOpJS(effect, pos) to generate new opjs
//  2) addOpBlock(opjs): Creates DOM block and configures it.
//  3) updateOpBlock(block, opjs)
//
////////////////////////////////////

// Populate or change a block w/ new chart js.
function updateOpBlock(block, opjs) {
  populateElement(block, {
    '.block-head': opjs.name,
    '.oplisting': getOpListing(block.effect, opjs.args),
  });

  block.style.top = opjs.pos.top + 'px';
  block.style.left = opjs.pos.left + 'px';
  return block;
}

// Add a single op JS object from the chart.
function addOpBlock(opjs) {
  const effect = ALL_EFFECTS.effects[opjs.effect];
  const block = template('block-op');
  block.id = opjs.uuid;
  block.dataset.effect = effect.name;
  block.dataset.type = TYPE.ops;
  block.effect = effect;
  updateOpBlock(block, opjs);

  appendChildren(EL.flowchart, block);
  RENDERED_BLOCKS[opjs.uuid] = block;
  return block;
}

function clearNodeLines() {
  EL.flowlines.innerHTML = '';
  const fcbox = EL.flowchart.getBoundingClientRect();
  EL.flowlines.style.width = fcbox.width;
  EL.flowlines.style.height = fcbox.height;
}

function calculateLinePoint(block, loc) {
  let sel;
  if (loc === 'in') {
    sel = ".block-arr.block-input";
  } else if (loc === 'out') {
    sel = ".block-arr.block-output";
  }

  const el = get(sel, block);

  // Differences between middle of el and top-left of block
  const elBox = el.getBoundingClientRect();
  const chartBox = EL.flowchart.getBoundingClientRect();


  return {
    x: elBox.left - chartBox.left + (elBox.width/2),
    y: elBox.top - chartBox.top + (elBox.height/2),
  }
}

function drawNodeLineSVG(source, target, opts) {
  const spoint = calculateLinePoint(source, 'out');
  const tpoint = calculateLinePoint(target, 'in');
  EL.flowlines.append(EL('line', {
    x1: spoint.x,
    y1: spoint.y,
    x2: tpoint.x,
    y2: tpoint.y,
    stroke: opts.color,
  }));
  EL.flowlines.innerHTML = EL.flowlines.innerHTML;
}

function drawNodeLineJS(fromuuid, touuid, opts) {
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
  clearNodeLines();
  for (const opjs of Object.values(CHART.ops)) {
    if (opjs.nodes) {
      for (const nodejs of Object.values(opjs.nodes)) {
        if (nodejs.sources) {
          for (const sourcejs of Object.values(nodejs.sources)) {
            drawNodeLineJS(sourcejs.sourceid, nodejs.uuid, sourcejs.opts);
          }
        }
      }
    }
  }
}

addTrigger('redrawAllNodeLines', () => {
  redrawAllNodeLines();
});

function updateNodeItem(tpl, opjs, nodejs) {
}

function addNodeItem(opBlock, opjs, nodejs) {
  const effect = opBlock.effect;
  const nodeBlock = template('opnode', {});
  nodeBlock.id = nodejs.uuid;
  updateNodeItem(nodeBlock, opjs, nodejs)
  opBlock.appendChild(nodeBlock);
}

// Render all blocks from Chart JS
function renderAllBlocks(chart) {
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

// Generate new JS block and render it.
addTrigger('addEffectAt', function(effectElement, evt, fixedPos,
                              parentElement, relativePos) {
  const effect = ALL_EFFECTS.effects[effectElement.dataset.effectName];
  const op = newOpJS(effect, relativePos);
  addOpBlock(op);
});

addTrigger('blockDrop', function(el, evt, fixedPos, parentElement, relativePos) {
  if (el && el.dataset.type) {
    moveBlockJS(el.dataset.type, el.id, relativePos);
  }
  redrawAllNodeLines();
});

addTrigger('bindToOperation', function(el, evt, fixedPos, matchedElements, relativePos) {
  el = findParent(el, '[data-type]');
  const opBlock = findParent(matchedElements[0], '[data-type]');

  bindJSToOp(el.id, opBlock.id);
});

// Remove an element from both Chart JS and HTML
// el can be: an op, a node, an image.
addTrigger('removeElement', (el, evt) => {
  removeBlockJS(el.dataset.type, el.id);
  removeElement(el);
});

addInitializer(() => {
  renderAllBlocks(CHART);
});
