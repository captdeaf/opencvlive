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

function newImageBlock(imageName, imagePath) {
  const container = template('imblock', (tpl) => {
    get('.block-head', tpl).innerText = imageName;
    get('img', tpl).src = imagePath;
    get('img', tpl).name = imageName;
  });

  container.style.top = "10em";
  container.style.left = "20em";

  return container;
}

addTrigger("addImageAt", function(libraryElement, evt, fixedPos,
                                  parentElement, relativePos) {
  const imageName = libraryElement.dataset.name;
  const imagePath = libraryElement.dataset.path;

  const imBlock = newImageBlock(imageName, imagePath);
  imBlock.style.top = relativePos.y + 'px';
  imBlock.style.left = relativePos.x + 'px';
  appendChildren(EL.flowchart, imBlock);
});

function updateOpBlock(block, opdesc) {
  populateElement(block, {
    '.block-head': opdesc.name,
    '.oplisting': getOpListing(opdesc.args),
  });

  block.style.top = opdesc.position.top + 'px';
  block.style.left = opdesc.position.left + 'px';
  return block;
}

function newOpBlock(opdesc) {
  const effect = ALL_EFFECTS.effects[opdesc.effect];
  const oplisting = getOpListing(opdesc.args);
  const block = template('block-op');
  block.id = opdesc.uuid;
  updateOpBlock(block, opdesc);

  return block;
}

function createOp(opdesc) {
  const block = newOpBlock(opdesc);
  block.id = opdesc.uuid
  block.type = TYPE.ops;
  appendChildren(EL.flowchart, block);
}

function renderAllBlocks(chart) {
  const children = [];
  for (const [uuid, opdesc] of Object.entries(chart.ops)) {
    createOp(opdesc);
  }
}

function newEffectAt(effect, pos) {
  const op = newOpAt(effect, pos);
  createOp(op);
}

addTrigger('addEffectAt', function(effectElement, evt, fixedPos,
                              parentElement, relativePos) {
  const effect = ALL_EFFECTS.effects[effectElement.dataset.effectName];
  newEffectAt(effect, relativePos);
});

addTrigger('removeElement', (el, evt) => {
  // el can be: an op, a node, an image.
  removeBlock(el.type, el.id);
  removeElement(el);
});

addInitializer(() => {
  renderAllBlocks(CHART);
});
