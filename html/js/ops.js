// ops.js
//
////////////////////////////////////
//
// Handling of all the op configuration:
//
//   amount: {cname: 'int', flag: 'odd', min: 1}
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
//   parse: (function),
// }
//
// 'build' function converts an (args) into a renderable html template.
//
// 'parse' receives the input values (as if from a form) from the html portion,
// and should return a JSON object which is passed directly to the arg parser
// on the python side.
//
////////////////////////////////////

const TYPEDEFS = {}

// I'm making them individually instead of one giant object because some will
// just reuse earlier build/parse methods.
TYPEDEFS['int'] = {
  build: (name, args) => {
    return EL('input', {
      type: 'number',
      ...args
    });
  },
  parse: (name, el, args) => {
    return parseInt(el.value);
  },
};

TYPEDEFS['float'] = {
  build: TYPEDEFS.int.build,
  parse: (name, el, args) => {
    return parseFloat(el.value);
  },
};

TYPEDEFS['string'] = {
  build: (name, args) => {
    return EL('input', {
      type: 'string',
      ...args
    });
  },
  parse: (name, el, args) => {
    return el.value;
  },
};

TYPEDEFS['percent'] = {
  build: (name, args) => {
    return EL('input', {
      type: 'range',
      step: 0.01,
      min: 0.0,
      max: 1.0,
      ...args
    });
  },
  parse: (name, el, args) => {
    return parseFloat(el.value);
  },
};

TYPEDEFS['bool'] = {
  build: (name, args) => {
    const cargs = Object.assign({}, args);
    if (args.value === 'true' || args.value === true) {
      cargs.checked = true;
    }
    return EL('input', {
      type: 'checkbox',
      ...cargs
    });
  },
  parse: (name, el, args) => {
    return el.checked;
  },
};

TYPEDEFS['select'] = {
  build: (name, args) => {
    const children = [];
    for (const [k, v] of Object.entries(args.args[0])) {
      children.push(EL('option', {
        value: '' + v,
      }, k));
    }
    const select = EL('select', args, children);
    select.value = args.value;
    return select
  },
  parse: (name, el, args) => {
    return parseInt(el.value);
  },
};

// Whenever a value changes, save and trigger refreshes.
addTrigger('opChange', function(el, evt) {
  const opblock = findParent(el, '.block-master');
  const opjs = opblock.blockData;
  const name = el.dataset.name;
  if (el.dataset.cname in TYPEDEFS && TYPEDEFS[el.dataset.cname].parse) {
    opjs.args[name].value = TYPEDEFS[el.dataset.cname].parse(name, el, opjs.args[name]);
  } else {
    opjs.args[name].value = TYPEDEFS['string'].parse(name, el, opjs.args[name]);
  }
  saveChart();
  refreshOpImages();
});

// A single parameter to render.
function renderOp(name, opargs, argdef) {
  const lattrs = {};
  if (argdef.title) {
    lattrs.title = argdef.title;
  }
  const item = EL('label', lattrs, name);
  const cname = opargs.cname;

  const jsargs = {
    'data-cname': cname,
    'data-name': name,
    'data-onchange': 'opChange',
  };


  const myargs = Object.assign({}, jsargs, argdef, opargs);
  if (cname in TYPEDEFS && TYPEDEFS[cname].build) {
    var input = TYPEDEFS[cname].build(name, myargs);
  } else {
    var input = TYPEDEFS['string'].build(name, myargs);
  }
  appendChildren(item, input);
  return enableTriggers(item);
}

// Given a set of parameters, generate elements to configure them.
function getOpListing(effect, opargs) {
  const children = [];
  if (opargs && Object.keys(opargs).length > 0) {
    for (const [name, oparg] of Object.entries(opargs)) {
      children.push(renderOp(name, oparg, effect.args[name]));
    }
  } else {
    children.push("No parameters");
  }
  return children;
}

////////////////////////////////////
//
//  refreshOpImages: Load or reload every image that we have.
//
//  This one is a little complex:
//    1) Generate a sorted list of nodes. Sorted such that a given node
//       (NOT op - only nodes) will come after all nodes and images that
//       come before it. In other words: I generate a tree branch, working
//       backwards, for every node. Then starting with images, generate the
//       list.
//
////////////////////////////////////
function refreshOpImages() {
  const cache = {};
  for (const op of Object.values(CHART.ops)) {
    if (op.nodes) {
      for (const node of Object.values(op.nodes)) {
        if (node.sources) {
          for (const source of Object.values(node.sources)) {
            if (!cache[source.sourceid]) cache[source.sourceid] = [];
            cache[source.sourceid].push(node);
          }
        }
      }
    }
  }

  const chains = [];

  // All chains start with an image. Load up chains with their dependencies.
  for (const image of Object.values(CHART.images)) {
    if (image.uuid in cache) {
      for (const dependency of Object.values(cache[image.uuid])) {
        chains.push(dependency);
      }
    }
  }

  const fullchain = [];

  while (chains.length > 0) {
    const next = chains.shift();
    fullchain.push(next);
    if (next.uuid in cache) {
      for (const dep of Object.values(cache[next.uuid])) {
        chains.push(dep);
      }
    }
  }

  processNodeImages(CHART.images, fullchain);
}

const IMAGE_CACHE = {};

async function processNode(nodejs, dependencies, torefresh) {
  let queryString = nodejs.uuid + dependencies.join('.');
  const opjs = CHART.ops[nodejs.opid];
  if (opjs.args) {
    for (const k of Object.values(Object.keys(opjs.args).sort())) {
      const v = opjs.args[k];
      queryString += '&';
      queryString += k + '=' + v.value;
    }
  }
  const hash = await sha256(queryString);
  torefresh.push({
    node: nodejs,
    opjs: opjs,
    deps: dependencies,
  });
  nodejs.hash = hash;
  return hash;
}

async function updateImage(nodejs, opjs, deps) {
  const path = "/cached/" + nodejs.hash + ".png"

  try {
    const img = get('#gen' + nodejs.hash);
    if (img !== undefined) return;
  } catch (err) {}

  let genpath = "/cv/imagegen?p="
  const args = {};
  args.effect = opjs.effect;
  args.ops = opjs;
  args.args = {};
  for (const [k, v] of Object.entries(opjs.args)) {
    args.args[k] = v.value;
  }
  args.outhash = nodejs.hash;
  args.dependencies = deps;

  const bargs = btoa(JSON.stringify(args));

  resp = await fetch(genpath + bargs);

  const opElement = get('#' + opjs.uuid);
  const frame = get('#' + nodejs.uuid + ' .block-image-frame', opElement);
  frame.innerHTML = '';
  appendChildren(frame, EL('img', {
    id: 'gen' + nodejs.hash,
    class: 'block-image',
    'data-uuid': nodejs.uuid,
    src: path,
  }));
  for (const large of getAll('.large-image[data-uuid="' + nodejs.uuid + '"]')) {
    console.log("Updating", large, path);
    large.src = path;
  }
  if (resp.status === 200) {
    resp.json().then((js) => {
      get('#cachesize').innerText = js.cachesize;
    });
  }
}

// This handles the image generation for all nodes.
// It is asynchronous: For all images that require updating,
// it waits until earlier ones are complete.
async function processNodeImages(images, sequence) {
  const dependencies = {};
  const torefresh = [];

  for (const image of Object.values(images)) {
    dependencies[image.uuid] = image.path;
  }

  for (const nodejs of Object.values(sequence)) {
    const deps = [];
    for (const source of Object.values(nodejs.sources)) {
      deps.push(dependencies[source.sourceid]);
    }
    const hash = await processNode(nodejs, deps, torefresh);
    dependencies[nodejs.uuid] = hash;
  }

  for (const obj of Object.values(torefresh)) {
    const nodejs = obj.node;
    const opjs = obj.opjs;
    const deps = obj.deps;

    const generated = await updateImage(nodejs, opjs, deps);
  }
}
