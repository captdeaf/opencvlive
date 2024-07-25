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

const EMPTY_CHART = {
  blocks: {},
  name: "New Chart",
};

const EMPTY_BLOCK = {
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

const STATE = makeConstants('state', {
  good: 'good',
  bad: 'bad',
});

const CHARTKEY = 'chart';

let CHART = deepCopy(EMPTY_CHART);

function loadChart(chart) {
  CHART = chart;
  saveChart();
}

function saveChart() {
}

// UUID gen, using timestamp in ms and a scrambled string.
function makeUUID() {
  const hashStr = (Math.random() + 1).toString(36).substring(5);
  return SparkMD5.hash(hashStr + new Date().getTime().toFixed());
}

// external: ALL_EFFECTS

// A cache of all block elements.
let ALL_BLOCK_ELEMENTS = {};

function makeBlockElement(blockjs) {
  const bmAttrs = {
    'data-uuid': blockjs.uuid,

    // Related to dragging this block.
    'data-drag': 'move',
    'data-drag-bind': '#flowchart',
    'data-drag-ondrop': 'blockDrop',
    // 'data-drag-move': 'redrawAllLines',

    // What this triggers when dropped.
    'data-drop-ok': '.blockdrop',

    'class': 'block-master',

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

  const paramListing = makeParamElements(blockjs, effectjs);
  console.log("pL", paramListing);

  const outputs = EL('div', {'class': 'outputs'});

  blockMaster.updateResults = (results) => {
    setBlockOutputs(blockMaster, outputs, results);
  }

  const container = (
    EL('div', {'class': 'block-container'}, 
      EL('div', {'class': 'block-contents'},
        EL('div', {'class': 'block-center'},
          blockHead,
          ...paramListing,
        )
      )
    )
  );

  appendChildren(blockMaster, container, outputs);

  ALL_BLOCK_ELEMENTS[blockjs.uuid] = blockMaster;

  return enableTriggers(blockMaster);
}

function newBlock(name, effectName, newBlockjs) {
  const effect = ALL_EFFECTS[effectName];
  newBlockjs = Object.assign({}, EMPTY_BLOCK, newBlockjs);
  newBlockjs.name = name;
  newBlockjs.effectName = effect.name;
  newBlockjs.uuid = makeUUID();
  newBlockjs.params = {};
  for (const v of effect.parameters) {
    newBlockjs.params[v.name] = deepCopy(v);
  }
  const proxyblock = nestedProxy(newBlockjs)
  console.log(newBlockjs);
  const block = makeBlockElement(proxyblock);
  CHART.blocks[newBlockjs.uuid] = newBlockjs;
  appendChildren(get('#flowchart'), block);
}

function loadBlock(blockjs) {
  const proxyblock = nestedProxy(blockjs)
  const block = makeBlockElement(proxyblock);
  appendChildren(get('#flowchart'), block);
}
