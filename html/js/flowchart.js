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

function updateImageBlock(block, imgjs) {
  populateElement(block, {
    '.block-head': imgjs.name,
    '.block-image-frame': EL('img', {
      class: "block-image",
      src: imgjs.path,
    })
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
  block.type = TYPE.image;
  updateImageBlock(block, imgjs);

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
    '.oplisting': getOpListing(opjs.args),
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
  block.type = TYPE.ops;
  updateOpBlock(block, opjs);

  appendChildren(EL.flowchart, block);
}

// Render all blocks from Chart JS
function renderAllBlocks(chart) {
  for (const [uuid, opjs] of Object.entries(chart.ops)) {
    addOpBlock(opjs);
  }
  for (const [uuid, imgjs] of Object.entries(chart.images)) {
    addImageBlock(imgjs);
  }
}

// Generate new JS block and render it.
addTrigger('addEffectAt', function(effectElement, evt, fixedPos,
                              parentElement, relativePos) {
  const effect = ALL_EFFECTS.effects[effectElement.dataset.effectName];
  const op = newOpJS(effect, relativePos);
  addOpBlock(op);
});

addTrigger('blockDrop', function(el, evt, fixedPos, parentElement, relativePos) {
  if (el && el.type) {
    moveBlockJS(el.type, el.id, relativePos);
  }
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
