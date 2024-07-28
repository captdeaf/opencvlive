// processing.js
//
////////////////////////////////////
//
// Handling of all the block operations.
//
//   Image->Blur->Threshold->Brightness->Whatever.
//   Doing things in order. Updating outputs. etc.
//
////////////////////////////////////
//
//  refreshOutputs: Load or reload every output that we have that isn't
//                  up to date.
//
//  Generate a sorted list of blocks. Sorted such that a given block will come after
//  all blocks that it depends on.
//
//  Blocks: good parameters -> clear to go -> (process)
//
//  A block is 'good' if all of its parameters have either values or sources.
//
//  A 'good' block is 'clear' if its sources all terminate in blocks that have
//  no sources or sources needed. (In other words, blocks with no external
//  inputs required).
//
//  Recursively travel up each block's sources until a block is seen as clear, or
//  a loop is found. If a loop is found, terminate - they're not 'clear' blocks.
//
////////////////////////////////////

function getGoodBlocks(process) {
  // sourceCache: A dictionary of [uuid]: [dependencies]
  for (const [uuid, block] of Object.entries(RAWCHART.blocks)) {
    const sources = [];
    const blockCall = {
      uuid: uuid,
      effect: block.effectName,
      output: ALL_EFFECTS[block.effectName].output,
      args: {},
      dependencies: {},
    };
    // A block is 'good' if all its args have inputs or values.
    // It is not necessarily 'clear'
    let good = true;
    for (const param of Object.values(block.params)) {
      const source = getSource(param);
      if (source) {
        sources.push(source.uuid);
        blockCall.dependencies[param.name] = source;
      } else if (param.value !== undefined) {
        blockCall.args[param.name] = param.value;
      } else {
        good = false;
      }
    }
    if (good) {
      process.sourceCache[uuid] = sources;
      process.calls[uuid] = blockCall;
    }
  }
}

function getClearBlocks(process) {
  // Recursively check up the sources.
  // 'seen' also works as a cache for bad blocks.
  const clear = {};
  const seen = {};
  const ready = [];

  const sourceCache = process.sourceCache;

  function checkClear(uuid) {
    if (clear[uuid]) { return true; }
    if (seen[uuid]) return false;

    seen[uuid] = true;
    if (!(uuid in sourceCache)) return false;

    for (const nextuuid of sourceCache[uuid]) {
      if (!checkClear(nextuuid)) {
        return false;
      }
    }
    seen[uuid] = false;
    clear[uuid] = true;
    ready.push(uuid);
    return true;
  }

  for (const blockuuid of Object.keys(sourceCache)) {
    if (!checkClear(blockuuid)) {
      CHART.blocks[blockuuid].outputs = [];
      const el = get('#block' + blockuuid);
      redrawBlockParams(el);
      get('.block-outputs', el).innerHTML = '';
    }
  }

  process.readyCalls = ready.map((r) => process.calls[r])
}

function refreshOutputs() {
  const process = {
    sourceCache: {},
    calls: {},
    readyCalls: [],
  };

  getGoodBlocks(process);
  getClearBlocks(process);

  // Now we enter async. Fire and forget.
  beginBlockProcessing(process);
};

async function beginBlockProcessing(process) {
  // 'blockCache' is a cache (updated by processBlockUpdate) of hashes and values
  // passed along. As 'ready' is ordered, any dependencies will be in it.
  // It also contains the information of images and complexes.
  const blockCache = {};

  for (const call of process.readyCalls) {
    const result = await processBlockUpdate(call, blockCache);
    blockCache[call.uuid] = result.deps;
  }

  redrawAllLines();
  saveChart();
}

// Process a single block action.
// blockCall has the information needed: uuid, effect, output, params.
// blockcache is to ID earlier hashes for dependencies.
//
// Once hashed, blockCall needs it before being passed as a json
// object btoa'd.
//
// blockCall may have a dependencies: {name: uuids}, which should
// be replaced with hashes from blockCache, to look like
// {name: 'cached/{hash}.png' for image.
// {name: 'cached/{hash}.json' for complex.
async function processBlockUpdate(blockCall, blockCache) {

  const jsparams = {
    effect: blockCall.effect,
    args: blockCall.args,
    dependencies: {},
    outputs: [],
  }

  if (blockCall.dependencies) {
    for (const [k, v] of Object.entries(blockCall.dependencies)) {
      jsparams.dependencies[k] = blockCache[v.uuid][v.idx];
    }
  }

  const result = {
    uuid: blockCall.uuid,
    outputs: [],
    deps: {},
  };

  result.hash = hashObject(jsparams);
  jsparams.hash = result.hash;

  for (const [idx, output] of Object.entries(blockCall.output)) {
    const ret = {
      uuid: blockCall.uuid,
      deps: {},
    };
    if (output.cname === 'image') {
      ret.path = 'cached/' + result.hash + '.' + idx + '.png';
    } else {
      ret.path = 'cached/' + result.hash + '.' + idx + '.json';
    }
    result.deps[idx] = ret.path;
    ret.cname = output.cname;
    ret.idx = idx;
    result.outputs.push(ret);
    jsparams.outputs.push(ret);
  }

  const genpath = "/cv/imagegen?p=";

  const bparams = btoa(JSON.stringify(jsparams));

  const resp = await fetch(genpath + bparams);

  let succeeded = true;

  if (resp.status !== 200) { return; }

  const js = await resp.json();

  if (js.success === 0) {
    succeeded = false;
  }
  updateCacheSize(js.cachesize);

  if (succeeded) {
    updateBlockResult(blockCall, result);
  } else {
    const el = get('#block' + result.uuid);
    redrawBlockParams(el);
    if (blockCall.uuid in CHART.blocks) {
      const block = CHART.blocks[blockCall.uuid];
      showFloater('Block Error for ' + block.name, 'block-error', {
        '.error-message': getErrorMessage(js.message),
      }, el);
    }
    el.classList.add('block-error');
    setTimeout(() => {
      el.classList.remove('block-error');
    }, 3000);
  }

  return result;
}

// Update the UI of block results.
// blockCall: uuid
function updateBlockResult(blockCall, result) {
  const blockElement = get('#block' + result.uuid);

  redrawBlockParams(blockElement);

  blockElement.blockData.outputs = result.outputs;

  renderBlockOutputs(blockElement, result.outputs);

  if (blockElement.dataset.hash === result.hash) return;
  blockElement.dataset.hash = result.hash;

  return;
}

const ERROR_REGEXPS = [
  [/OpenCV.*-209:/, "Array shapes of inputs do not match. (Usually size, or color vs grayscale)"],
];

function getErrorMessage(jsmessage) {
  for (const pat of ERROR_REGEXPS) {
    if (pat[0].test(jsmessage)) return pat[1];
  }
  return jsmessage;
}
