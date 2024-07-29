// newblock.js
//
// Block and Element management.
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

function updateOtherOutputs(sel, uuid, idx, fn) {
  const others = findAll(sel + '[data-uuid="' + uuid + '"][data-idx="' + idx + '"]');
  if (others && others.length > 0) {
    for (const other of others) {
      fn(other);
    }
  }
}

function renderOutput(output, uuid, idx) {
  let name = basename(output.path);
  if (uuid in CHART.blocks) {
    name = CHART.blocks[uuid].name;
  }
  const classes = ['drag-start', 'blockout-frame'];
  const attrs = {
    'data-name': name,
    'data-idx': idx,
    'data-uuid': uuid,
    'data-drag': 'trigger-image',
    'data-drag-bind': '#flowchart',
    'data-drag-ondrop': 'bindToInput',
  };
  let outputElement;
  if (output.cname === 'image') {
    attrs['data-drag-drop-on'] = '.accept-image';
    attrs['data-drag-onclick'] = 'showLargeChildImage';
    outputElement = EL('img', {src: output.path});
    updateOtherOutputs('img', uuid, idx, (img) => {
      img.src = output.path;
    });
  } else if (output.cname === 'complex') {
    attrs['data-drag-drop-on'] = '.accept-complex';
    attrs['data-drag-onclick'] = 'showLargeJSON';
    classes.push(' complex-output');
    outputElement = EL('img', {
      src: 'images/clip_complex.png',
    });
  } else {
    outputElement = EL('p', {}, "What");
  }

  attrs.class = classes.join(' ');
  const outframe = enableTriggers(EL('div', attrs, outputElement));
  outframe.output = output;
  return outframe;
}

function renderBlockOutputs(blockmaster, outputs) {
  const outputEl = blockmaster.outputEl;
  outputEl.innerHTML = '';
  const children = [];
  let idx = 0;
  for (const output of outputs) {
    children.push(renderOutput(output, blockmaster.blockData.uuid, idx));
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

    // Rename it when our draggable (head) is double clicked.
    'data-drag-onclick': 'tryRenameThis',

    // Related to dragging this block.
    'data-drag': 'move',
    'data-drag-bind': '#flowchart',
    'data-drag-ondrop': 'moveChartBlock',
    'data-drag-onmove': 'redrawAllLines',

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
  blockMaster.changeTitle = (text) => {
    blockjs.name = text;
    saveChart();
    renderBlockOutputs(blockMaster, blockjs.outputs);
    blockHead.innerText = text;
  };
  blockMaster.setTitle(blockjs.name);

  const outputEl = EL('div', {'class': 'block-outputs'});
  const paramsEl = EL('div', {'class': 'block-params'});

  const container = (
    EL('div', {'class': 'block-container'}, 
      EL('div', {'class': 'block-center'},
        blockHead,
        paramsEl,
      ),
      outputEl,
    )
  );

  appendChildren(blockMaster, container);

  blockMaster.outputEl = outputEl;
  blockMaster.paramsEl = paramsEl;

  enableTriggers(blockMaster);

  redrawBlockParams(blockMaster)

  if (blockjs.outputs && blockjs.outputs.length > 0) {
    renderBlockOutputs(blockMaster, blockjs.outputs);
  }

  ALL_BLOCK_ELEMENTS[blockjs.uuid] = blockMaster;

  const pos = blockjs.layout.pos;
  blockMaster.style.left = pos.x + 'px';
  blockMaster.style.top = pos.y + 'px';

  return blockMaster;
}

// tryRenameThis needs to fake its own double click.
const RENAMER = {
  uuid: null,
  time: 0,
};
addTrigger('tryRenameThis', (el) => {
  const uuid = el.blockData.uuid;
  const now = new Date().getTime();
  if (uuid !== RENAMER.uuid) {
    RENAMER.uuid = uuid;
    RENAMER.time = now;
    return;
  }

  if ((now - RENAMER.now) < 700) {
    const newname = prompt("New name", el.blockData.name);
    if (newname !== null && newname.length > 0) {
      el.changeTitle(newname);
    }
    RENAMER.now = 0;
    return;
  }

  RENAMER.now = now;
});

function newBlock(name, effectName, newBlockjs) {
  const effect = ALL_EFFECTS[effectName];
  newBlockjs = deepCopy(BLOCK_EMPTY, newBlockjs);
  newBlockjs.name = name;
  newBlockjs.effectName = effect.name;
  newBlockjs.uuid = makeUUID();
  if (!('params' in newBlockjs)) {
    newBlockjs.params = {};
  }
  for (const v of effect.parameters) {
    if (!(v.name in newBlockjs.params)) {
      newBlockjs.params[v.name] = deepCopy(v);
    }
  }
  CHART.blocks[newBlockjs.uuid] = newBlockjs;
  const block = makeBlockElement(nestedProxy(newBlockjs));
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
  if ('source' in paramto && 'uuid' in paramto.source
      && paramto.source.uuid === blockfrom.dataset.uuid
      && paramto.source.idx === output.idx) {
    delete paramto['source'];
  } else {
    paramto.source = {
      uuid: blockfrom.dataset.uuid,
      idx: output.idx,
      path: output.path,
      color: pickLineColor(),
    };
  }
  saveChart();

  refreshOutputs(true);
}

////////////////////////////////////
//
//  A wrapper around bindOutputToParameter
//
////////////////////////////////////
addTrigger('bindToInput', (sourceEl, evt, fixedPos, targetEls, relativePos) => {
  const blockfrom = getParent(sourceEl, '.block-master');
  const output = sourceEl.output;

  const blockto = getParent(targetEls[0], '.block-master');
  const param = targetEls[0].param;
  bindOutputToParameter(blockfrom, output, blockto, param);
});

////////////////////////////////////
//
//  Clean up sources: If we remove or replace the chart via json editor,
//  some sources might be stale.
//
////////////////////////////////////
function cleanupSources(chart) {
  if ('blocks' in chart) {
    for (const block of Object.values(chart.blocks)) {
      let cleanup = false;
      if ('params' in block) {
        for (const param of Object.values(block.params)) {
          if ('source' in param) {
            if (!(param.source.uuid in chart.blocks)) {
              cleanup = true;
              delete param.source;
            }
          }
        }
      }
      if (cleanup) {
        block.outputs = [];
      }
    }
  }
  return chart;
}

////////////////////////////////////
//
//  Remove block. Straightforward, since sources are invalidated and ignored.
//
////////////////////////////////////
addTrigger('removeBlock', (el) => {
  delete RAWCHART.blocks[el.blockData.uuid];
  cleanupSources(RAWCHART);
  saveChart();
  loadChart();
  refreshOutputs(true);
  removeElement(el);
});

////////////////////////////////////
//
//  Drop an image from toolbox library onto the flowchart.
//
////////////////////////////////////
addTrigger('addImageAt', (libraryElement, evt, fixedPos, parentElement, relativePos) => {
  const imagejs = {
    params: {
      imgPath: {
        cname: 'imagepath',
        name: 'imgPath',
        value: libraryElement.dataset.path,
        test: 'hi',
      },
    },
    layout: {pos: relativePos},
  };
  const block = newBlock(libraryElement.dataset.name, 'useImage', imagejs);
  refreshOutputs(true);
});


////////////////////////////////////
//
//  Drop an effect from toolbox library onto the flowchart.
//
////////////////////////////////////
addTrigger('addEffectAt', (libraryElement, evt, fixedPos, parentElement, relativePos) => {
  const effectjs = deepCopy({
    layout: {pos: relativePos},
  });
  newBlock(libraryElement.dataset.name, libraryElement.dataset.effectName, effectjs);
  refreshOutputs(true);
});
