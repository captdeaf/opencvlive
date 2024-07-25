// params.js
//
////////////////////////////////////
//
// Handling of all the parameter configuration:
//
//     amount: {cname: 'int', flag: 'odd', min: 1}
//
// This file deals with:
//
//   - Rendering the parameters into <label>...</label> elements.
//   - Parsing them when saved to json for passing to the server.
//
////////////////////////////////////
//
// TYPEDEFS: All the types we know of and how to render and parse them.
//
// Structure:
//
// name: {
//   cname: 'int',
//
//   build: (function),
//   save: (function),
// }
//
// 'build' function converts an (args) into a renderable html template.
//
// 'save' receives the input values (as if from a form) from the html portion,
// and should return a JSON object which is passed directly to the arg parser
// on the python side.
//
////////////////////////////////////

const TYPEDEFS = {}

// I'm making them individually instead of one giant object because some will
// just reuse earlier build/parse methods.
TYPEDEFS['int'] = {
  build: (param) => {
    return EL('input', {
      type: 'number',
      ...param
    });
  },
  save: (el, param) => {
    return parseInt(el.value);
  },
};

TYPEDEFS['float'] = {
  build: TYPEDEFS.int.build,
  save: (el, param) => {
    return parseFloat(el.value);
  },
};

TYPEDEFS['string'] = {
  build: (param) => {
    return EL('input', {
      type: 'string',
      ...param
    });
  },
  save: (el, param) => {
    return el.value;
  },
};

TYPEDEFS['percent'] = {
  build: (param) => {
    return EL('input', {
      type: 'range',
      step: 0.01,
      min: 0.0,
      max: 1.0,
      ...param
    });
  },
  save: (el, param) => {
    return parseFloat(el.value);
  },
};

TYPEDEFS['bool'] = {
  build: (param) => {
    const cparam = Object.assign({}, param);
    if (param.value === 'true' || param.value === true) {
      cparam.checked = true;
    }
    return EL('input', {
      type: 'checkbox',
      ...cparam
    });
  },
  save: (el, param) => {
    return el.checked;
  },
};

TYPEDEFS['select'] = {
  build: (param) => {
    const children = [];
    for (const [k, v] of Object.entries(param.param[0])) {
      children.push(EL('option', {
        value: '' + v,
      }, k));
    }
    const select = EL('select', param, children);
    select.value = param.value;
    return select
  },
  save: (el, param) => {
    return parseInt(el.value);
  },
};

TYPEDEFS['image'] = {
  build: (param) => {
   return EL('div', {}, '&#128444;')
  },
  save: (el, param) => {},
};

TYPEDEFS['complex'] = {
  build: (param) => {
    return EL('div', {}, '[.]')
  },
  save: (el, param) => {
    return el.blockData.json;
  },
};

function makeParamElement(param, effectparam) {
  const classes = ['param-input'];
  const cname = param.cname;
  classes.unshift('accept-' + cname);

  const labelAttrs = {
    'class': classes.join(' '),
  };

  let builtInput;

  if (cname in TYPEDEFS) {
    builtInput = TYPEDEFS[cname].build(param);
  } else {
    builtInput = TYPEDEFS['string'].build(param);
  }

  const label = EL('label', labelAttrs, param.name, builtInput);

  if (title in param) {
    labelAttrs.title = param.title;
  }

  return label;
}

function makeParamElements(blockjs, effectjs) {
  const listing = [];
  for (const param of effectjs.parameters) {
    if (param.name in blockjs.params) {
      listing.push(makeParamElement(blockjs.params[param.name], param))
    }
  }
  return listing
}

// Given a set of parameters, generate elements to configure them.

function getProviderElement(opcall, output) {
  const attrs = {
    class: "block-output block-edge op-provider",
    'data-drag': "point",
    'data-drag-bind': "#flowchart",
    'data-drag-drop': "bindToTarget",
    title: "Drag image output to another's input",
  };

  const spanAttrs = {
    class: 'vcenter',
  };

  const children = [];

  let child = EL('span', {}, '??');
  if (output.type.startsWith('complex')) {
    attrs['data-drag-drop-on'] = ".accept-complex";
    attrs['title'] = "Drag complex output to an input";
    attrs['data-idx'] = output.idx;
    child = EL('span', spanAttrs, '[.]');
  } else if (output.type === TYPE.image) {
    attrs['data-drag-drop-on'] = ".accept-image"
    attrs['title'] = "Drag image output to an input";
    attrs['data-idx'] = output.idx;
    child = EL('span', spanAttrs, '&#128444;')
  }
  const pdiv = EL('div', attrs, child);
  return enableTriggers(pdiv, true);
}

// Depending on what type of output an op generates:
//   'image': image
//   'complex*': complex
function getProviderListing(effect, opjs) {
  const attrs = {
    class: "block-output block-edge op-provider",
    'data-drag': "point",
    'data-drag-bind': "#flowchart",
    'data-drag-drop': "bindToTarget",
  };

  const spanAttrs = {
    class: 'vcenter',
  };

  const children = [];
  for (const [idx, outp] of Object.entries(effect.output)) {
    let child = EL('span', {}, '??');
    if (outp.cname.startsWith('complex')) {
      attrs['data-drag-drop-on'] = ".accept-complex";
      attrs['title'] = "Drag complex output to an input";
      attrs['data-idx'] = idx;
      child = EL('span', spanAttrs, '[.]');
    } else if (outp.cname === 'image') {
      attrs['data-drag-drop-on'] = ".accept-image"
      attrs['title'] = "Drag image output to an input";
      attrs['data-idx'] = idx;
      child = EL('span', spanAttrs, '&#128444;')
    }
    const pdiv = EL('div', attrs, child);
    children.push(enableTriggers(pdiv, true));
  }

  return children;
}

////////////////////////////////////
//
//  refreshOutputs: Load or reload every image that we have, that isn't
//                   up to date.
//
//  Generate a sorted list of Ops. Sorted such that a given op will come after
//  all ops, complexes, and images that it depends on.
//
//  An op is clear if its sources all terminate in images or complexes.
//  Images and Complexes are 'clear'
//
//  Recursively travel down each op's sources until an op is seen as clear, or
//  a loop is found.
//
////////////////////////////////////
function refreshOutputs() {
  // sourceCache: A dictionary of [uuid]: [dependencies]
  const sourceCache = {};
  const opcalls = {};
  for (const [uuid, op] of Object.entries(CHART.ops)) {
    const sources = [];
    const opcall = {
      uuid: uuid,
      effect: op.effect,
      type: TYPE.op,
      output: ALL_EFFECTS.effects[op.effect].output,
      args: {},
      dependencies: {},
    };
    // An op is 'good' if all its args have inputs or values.
    // It is not necessarily 'clean'
    let good = true;
    for (const arg of op.args) {
      if (arg.source && arg.source.sourceid) {
        sources.push(arg.source.sourceid);
        opcall.dependencies[arg.name] = arg.source;
      } else if (arg.value !== undefined) {
        opcall.args[arg.name] = arg.value;
      } else {
        good = false;
      }
    }
    if (good) {
      sourceCache[uuid] = sources;
      opcalls[uuid] = opcall;
    }
  }

  const clear = {};

  for (const image of Object.values(CHART.images)) {
    clear[image.uuid] = true;
  }

  for (const complex of Object.values(CHART.complexes)) {
    clear[complex.uuid] = true;
  }

  // Recursively check up the sources.
  // 'seen' also works as a cache for bad ops.
  const seen = {};
  const ready = [];

  function checkClear(uuid) {
    if (clear[uuid]) { return true; }
    if (seen[uuid]) { return false; }

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

  for (const opuuid of Object.keys(sourceCache)) {
    checkClear(opuuid);
  }

  const readyCalls = ready.map((r) => opcalls[r])

  // Now we enter async. Fire and forget.
  beginOpProcessing(readyCalls);
};

async function beginOpProcessing(readyCalls) {
  // 'opCache' is a cache (updated by processOpUpdate) of hashes and values
  // passed along. As 'ready' is ordered, any dependencies will be in it.
  // It also contains the information of images and complexes.
  const opCache = {};

  for (const image of Object.values(CHART.images)) {
    opCache[image.uuid] = image.path;
  }

  // Save our complexes on server side.
  for (const complex of Object.values(CHART.complexes)) {
    const result = await processOpUpdate({
      uuid: complex.uuid,
      effect: 'saveComplex',
      type: TYPE.complex,
      args: {inp: complex.json},
      output: [{cname: 'complex'}]
    }, opCache);

    result.outputs

    opCache[complex.uuid] = result.hash;
  }

  // 'ready' is now consisting of ops uuids, in order of which they should be
  // performed.
  for (const call of readyCalls) {
    const result = await processOpUpdate(call, opCache);
    opCache[call.uuid] = result.hash;
  }

  redrawAllLines();
}

// Process a single op action.
// opcall has the information needed: uuid, effect, output, args.
// opcache is to ID earlier hashes for dependencies.
//
// Once hashed, opcall needs it before being passed as a json
// object btoa'd.
//
// opcall may have a dependencies: {name: uuids}, which should
// be replaced with hashes from opCache, to look like
// {name: 'cached/{hash}.png' for image.
// {name: 'cached/{hash}.json' for complex.
async function processOpUpdate(opcall, opCache) {

  const jsargs = {
    effect: opcall.effect,
    args: opcall.args,
    dependencies: {},
    outputs: [],
  }

  if (opcall.dependencies) {
    for (const [k, v] of Object.entries(opcall.dependencies)) {
      console.log("DepWhat", v);
      if (v.cname.startsWith('complex')) {
        jsargs.dependencies[k] = 'cached/' + opCache[v.sourceid] + '.' + v.idx + '.json';
      } else {
        if (v.sourceid.startsWith('images')) {
          jsargs.dependencies[k] = opCache[v.sourceid];
        } else {
          jsargs.dependencies[k] = 'cached/' + opCache[v.sourceid] + '.' + v.idx + '.png';
        }
      }
    }
  }

  const result = {
    uuid: opcall.uuid,
    outputs: [],
  };

  result.hash = hashObject(jsargs);
  jsargs.hash = result.hash;

  for (const [idx, output] of Object.entries(opcall.output)) {
    const ret = {
      uuid: opcall.uuid,
    };
    if (output.cname === 'image') {
      ret.path = 'cached/' + result.hash + '.' + idx + '.png';
      ret.type = TYPE.image;
    } else {
      ret.path = 'cached/' + result.hash + '.' + idx + '.json';
      ret.type = TYPE.complex;
    }
    ret.idx = idx;
    result.outputs.push(ret);
    jsargs.outputs.push(ret);
  }

  const genpath = "/cv/imagegen?p=";

  const bargs = btoa(JSON.stringify(jsargs));

  const resp = await fetch(genpath + bargs);

  let good = true;

  if (resp.status !== 200) { return; }

  const js = await resp.json();

  if (js.success === 0) {
    good = false;
  }
  updateCacheSize(js.cachesize);

  if (good) {
    updateOpResult(opcall, result);
  } else {
    console.log("Good is false for", opcall);
    const el = get('#' + result.uuid);
    el.classList.add('block-error');
    setTimeout(() => {
      el.classList.remove('block-error');
    }, 3000);
  }

  return result;
}

// Update the UI of op results.
// opcall: uuid
function updateOpResult(opcall, result) {
  const opElement = get('#' + result.uuid);
  const allOutputs = getAll('.opgenerated', opElement);

  if (!allOutputs || allOutputs.length == 0) return;
  const opOutputs = allOutputs[0];

  if (opElement.dataset.hash === result.hash) return;
  opElement.dataset.hash = result.hash;

  opOutputs.innerHTML = '';

  for (const output of result.outputs) {
    if (output.type === TYPE.image) {
      const imgTpl = template('opout-image', {
        '.opout-image-frame': EL('img', {
          'data-uuid': result.uuid,
          class: 'opout-image',
        }),
        '.block-output.op-edge': getProviderElement(opcall, output),
      });
      appendChildren(opOutputs, imgTpl);
      for (img of getAll('img[data-uuid="' + result.uuid + '"]')) {
        img.src = output.path;
      }
    } else if (output.type === TYPE.complex) {
      easyFetch(output.path, {}, {
        success: (json) => {
          const complexTpl = template('opout-complex', {
            '.opout-text-frame': EL('pre', {
                'data-uuid': result.uuid,
                class: 'opout-text',
              },
              EL('code', {}, JSON.stringify(json)),
            ),
            '.block-output.op-edge': getProviderElement(opcall, output),
          });
          appendChildren(opOutputs, complexTpl);
        },
      });
    }
  }

  return;
}
