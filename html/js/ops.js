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

TYPEDEFS['int'] = {
  build: (name, arg) => {
    return EL('input', {
      type: 'number',
      'data-onchange': 'opChange',
      'data-cname': arg.cname,
      'data-name': name,
      ...arg
    });
  },
  parse: (name, el, arg) => {
    return parseInt(el.value);
  },
};

TYPEDEFS['string'] = {
  build: (name, arg) => {
    return EL('input', {
      type: 'string',
      'data-onchange': 'opChange',
      'data-cname': 'string',
      'data-name': name,
      ...arg
    });
  },
  parse: (name, el, arg) => {
    return el.value;
  },
};

TYPEDEFS['percent'] = {
  build: (name, arg) => {
    return EL('input', {
      type: 'range',
      'data-name': name,
      'data-cname': 'percent',
      'data-onchange': 'opChange',
      step: 0.01,
      min: 0.0,
      max: 1.0,
      ...arg
    });
  },
  parse: (name, el, arg) => {
    return parseFloat(el.value);
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
function renderOp(name, oparg, argdef) {
  const lattrs = {};
  if (argdef.title) {
    lattrs.title = argdef.title;
  }
  const item = EL('label', lattrs, name);
  const cname = oparg.cname;
  oparg = Object.assign({}, argdef, oparg);
  if (cname in TYPEDEFS && TYPEDEFS[cname].build) {
    appendChildren(item, TYPEDEFS[cname].build(name, oparg));
  } else {
    appendChildren(item, TYPEDEFS['string'].build(name, oparg));
  }
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
  if (nodejs.hash !== hash) {
    torefresh.push({
      node: nodejs,
      opjs: opjs,
      deps: dependencies,
    });
    nodejs.hash = hash;
  } else {
    const path = "/cached/" + nodejs.hash + ".png"
    const frame = get('#' + nodejs.uuid + ' .block-image-frame', get('#' + nodejs.opid));
    appendChildren(frame, EL('img', {
      class: 'block-image',
      src: path,
    }));
  }
  return hash;
}

async function updateImage(nodejs, opjs, deps) {
  const path = "/cached/" + nodejs.hash + ".png"

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

  const jsargs = btoa(JSON.stringify(args));

  await fetch(genpath + jsargs);

  const frame = get('#' + nodejs.uuid + ' .block-image-frame', get('#' + opjs.uuid));
  frame.innerHTML = '';
  appendChildren(frame, EL('img', {
    class: 'block-image',
    src: path,
  }));
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
    const frame = get('#' + obj.node.uuid + ' .block-image-frame', get('#' + obj.opjs.uuid));
    frame.innerHTML = '';
  }

  for (const obj of Object.values(torefresh)) {
    const nodejs = obj.node;
    const opjs = obj.opjs;
    const deps = obj.deps;

    const generated = await updateImage(nodejs, opjs, deps);
  }
}
