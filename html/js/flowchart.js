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
//  Op Block flow:
//
//  1) We need a new opjs, they call createOp
//      - on renderAll: (fetches from passed chart)
//      - addEffectAt: (newOpJS(effect, pos) to generate new opjs
//  2) addOpBlock(opjs): Creates DOM block and configures it.
//  3) updateOpBlock(block, opjs), called when:
//      - addOpBlock() first populates block.
//      - chart needs to update block from its side.
//
////////////////////////////////////

// Populate or change a block w/ new chart js.
function updateOpBlock(block, opjs) {
  populateElement(block, {
    '.block-head': opjs.name,
    '.oplisting': getOpListing(opjs.args),
  });

  block.style.top = opjs.pos.top + 'px';
  block.style.left = opjs.pos.left + 'px';
  return block;
}

// Add a single op JS object from the chart.
function addOpBlock(opjs) {
  const effect = ALL_EFFECTS.effects[opjs.effect];

  const oplisting = getOpListing(opjs.args);

  const block = template('block-op');
  block.id = opjs.uuid;
  block.type = TYPE.ops;
  updateOpBlock(block, opjs);

  appendChildren(EL.flowchart, block);
}

// Render all blocks from Chart JS
function renderAllBlocks(chart) {
  const children = [];
  for (const [uuid, opjs] of Object.entries(chart.ops)) {
    addOpBlock(opjs);
  }
}

// Generate new JS block and render it.
addTrigger('addEffectAt', function(effectElement, evt, fixedPos,
                              parentElement, relativePos) {
  const effect = ALL_EFFECTS.effects[effectElement.dataset.effectName];
  const op = newOpJS(effect, relativePos);
  addOpBlock(op);
});

// Remove an element from both Chart JS and HTML
// el can be: an op, a node, an image.
addTrigger('removeElement', (el, evt) => {
  removeBlockJS(el.type, el.id);
  removeElement(el);
});

addInitializer(() => {
  renderAllBlocks(CHART);
});
