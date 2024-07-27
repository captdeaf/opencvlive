// newblock.js
//
// Block and Element management. Sort of a mini-framework.
//
////////////////////////////////////
//
//  One type of block. Read BLOCK.md
//
//  This file
//
////////////////////////////////////

const BLOCK_EMPTY = {
  uuid: '',
  effectName: '',
  params: {},
  outputs: [],
  layout: {
    pos: {x: 40, y: 40},
  },
  status: {
    state: 'unknown',
    hash: '',
  }
};

const STATE = ENUM('state', {
  good: 'good',
  bad: 'bad',
});

// UUID gen, using timestamp in ms and a scrambled string.
function makeUUID() {
  const hashStr = (Math.random() + 1).toString(36).substring(5);
  return SparkMD5.hash(hashStr + new Date().getTime().toFixed());
}

// external: ALL_EFFECTS

// A cache of all block elements.
let ALL_BLOCK_ELEMENTS = {};

addTrigger('moveChartBlock', (el, evt, fixedPos, parentElement, relativePos) => {
  el.blockData.layout.pos = relativePos;
  saveChart();
});

function renderOutput(output, idx) {
  const attrs = {
    'class': 'drag-start',
    'data-name': basename(output.path),
    'data-idx': idx,
    'data-drag': 'trigger-image',
    'data-drag-bind': '#flowchart',
    'data-drag-ondrop': 'bindToInput',
    'data-drag-drop-on': '.accept-image',
    'data-drag-onclick': 'showLargeChildImage',
  };
  let outputElement;
  if (output.cname === 'image') {
    attrs.src = output.path;
    outputElement = EL('img', attrs);
  } else if (output.cname === 'complex') {
    outputElement = EL('p', attrs, "TBD");
  } else {
    outputElement = EL('p', attrs, "What");
  }

  outputElement.output = output;
  return EL('div', {
      'class': 'blockout-frame',
      'data-onclick': 'showLargeChildImage',
    },
    outputElement,
  );
}

function renderBlockOutputs(blockmaster, outputs) {
  const outputEl = blockmaster.outputEl;
  outputEl.innerHTML = '';
  const children = [];
  let idx = 0;
  for (const output of outputs) {
    children.push(renderOutput(output, idx));
    idx++;
  }
  appendChildren(outputEl, children);
}

////////////////////////////////////
//
//  Redraw the parameters section of a block.
//
//  (Copied from params.js)
//
//    - If no value or source, a default input or image.
//    - If a source, either the image or an icon.
//    - Rendered input from TYPEDEFs.
//
////////////////////////////////////
function redrawBlockParams(block) {
  const blockjs = block.blockData;
  const effectjs = block.effectjs;

  const paramListing = makeParamElements(blockjs, effectjs);

  block.paramsEl.innerHTML = '';
  appendChildren(block.paramsEl, paramListing);
}

function makeBlockElement(blockjs) {
  const bmAttrs = {
    'class': 'block-master',
    'style': 'z-index: 800;',
    'id': 'block' + blockjs.uuid,

    'data-uuid': blockjs.uuid,

    // Related to dragging this block.
    'data-drag': 'move',
    'data-drag-bind': '#flowchart',
    'data-drag-ondrop': 'moveChartBlock',
    // 'data-drag-move': 'redrawAllLines',

    // What this triggers when dropped.
    'data-drop-ok': '.blockdrop',

    // Bring to foreground.
    'data-onmouseover': 'raiseZIndex',
    'data-zindex': 'block',
  };

  const blockMaster = EL('div', bmAttrs);

  const effectjs = ALL_EFFECTS[blockjs.effectName];

  blockMaster.blockData = blockjs;
  blockMaster.effectjs = effectjs;

  // Head and title
  const blockHead = EL('span', {'class': 'drag-start block-head'});
  blockMaster.setTitle = (text) => { blockHead.innerText = text; };
  blockMaster.setTitle(blockjs.name);

  const outputEl = EL('div', {'class': 'outputs'});
  const paramsEl = EL('div', {'class': 'block-params'});

  const container = (
    EL('div', {'class': 'block-container'}, 
      EL('div', {'class': 'block-center'},
        blockHead,
        paramsEl,
        EL('div', {'class': 'block-output'}),
      ),
      outputEl,
    )
  );

  appendChildren(blockMaster, container);

  blockMaster.outputEl = outputEl;
  blockMaster.paramsEl = paramsEl;

  redrawBlockParams(blockMaster)

  if (blockjs.outputs && blockjs.outputs.length > 0) {
    renderBlockOutputs(blockMaster, blockjs.outputs);
  }

  ALL_BLOCK_ELEMENTS[blockjs.uuid] = blockMaster;

  const pos = blockjs.layout.pos;
  blockMaster.style.left = pos.x + 'px';
  blockMaster.style.top = pos.y + 'px';

  return enableTriggers(blockMaster);
}

function newBlock(name, effectName, newBlockjs) {
  const effect = ALL_EFFECTS[effectName];
  newBlockjs = Object.assign({}, BLOCK_EMPTY, newBlockjs);
  newBlockjs.name = name;
  newBlockjs.effectName = effect.name;
  newBlockjs.uuid = makeUUID();
  newBlockjs.params = {};
  for (const v of effect.parameters) {
    newBlockjs.params[v.name] = deepCopy(v);
  }
  const block = makeBlockElement(newBlockjs);
  CHART.blocks[newBlockjs.uuid] = newBlockjs;
  appendChildren(get('#flowchart'), block);
  saveChart();
  return block;
}

function loadBlock(blockjs) {
  const block = makeBlockElement(blockjs);
  appendChildren(get('#flowchart'), block);
}

////////////////////////////////////
//
//  Bind an output of one block to the input of another. Outputs are in order:
//
//  Structure within CHART:
//    blockto.params[name].source = {uuid: uuid, output: idx}
//
//  Redraw tojs afterwards.
//
////////////////////////////////////
function bindOutputToParameter(blockfrom, output, blockto, paramto) {
  paramto.source = {uuid: blockfrom.dataset.uuid, idx: output.idx, path: output.path};
  saveChart();

  redrawBlockParams(get('#block' + blockto.dataset.uuid));
  // TODO: redraw lines
}

addTrigger('bindToInput', (sourceEl, evt, fixedPos, targetEls, relativePos) => {
  const blockfrom = getParent(sourceEl, '.block-master');
  const output = sourceEl.output;

  const blockto = getParent(targetEls[0], '.block-master');
  const param = targetEls[0].param;
  bindOutputToParameter(blockfrom, output, blockto, param);
});

addTrigger('addImageAt', (libraryElement, evt, fixedPos, parentElement, relativePos) => {
  const imagejs = {
    outputs: [{
      idx: 0,
      cname: 'image',
      path: libraryElement.dataset.path,
    }],
    layout: {pos: relativePos},
  };
  newBlock(libraryElement.dataset.name, 'useImage', imagejs);
});


