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
// name: name of arg.
// opargs: existing json from previous changes or reloads.
// argdef: the canonical definition from ALL_EFFECTS.effects
function renderOp(name, opargs, argdef) {
  // cname: Which builder+parser do we use?
  const cname = opargs.cname;

  // Creating myargs: the label input's unique
  // copy of args. If the args change from the server,
  // this will probably need to be recreated.
  const jsargs = {
    'data-cname': cname,
    'data-name': name,
    'data-onchange': 'opChange',
  };
  const myargs = deepCopy(jsargs, argdef, opargs);

  let accepts = 'noaccept';
  if (cname.startsWith('complex')) {
    accepts = 'accept-complex';
  } else if (cname === 'image') {
    accepts = 'accept-image';
  }

  const labelAttrs = {
    'class': [accepts, 'block-accept'].join(' '),
    'data-arg': name,
  };

  if (argdef.title) {
    labelAttrs.title = argdef.title;
  }

  // If the arg is a complex, it is a target
  // only.
  let prefix = '&bull; ';
  let input = '';
  if (cname.startsWith('complex')) {
    prefix = EL('span', {}, '[x]')
  } else if (cname === 'image') {
    prefix = EL('span', {}, '&#128444;')
  } else {
    // Build it, and they will come.
    let type = cname;
    if (!(type in TYPEDEFS)) {
      type = 'string';
    }
    input = TYPEDEFS[type].build(name, myargs);
  }

  // Build the actual label.
  const item = EL('label', labelAttrs, prefix, name, input);

  appendChildren(item, input);
  return enableTriggers(item, true);
}

// Given a set of parameters, generate elements to configure them.
function getOpListing(effect, opargs) {
  const required = [];
  const children = [];
  if (opargs && opargs.length > 0) {
    for (const oparg of opargs) {
      const argdef = effect.args.filter((x) => x.name === oparg.name)[0];
      const arginput = renderOp(oparg.name, oparg, argdef);
      if (oparg.required) {
        required.push(arginput);
      } else {
        children.push(arginput);
      }
    }
  } else {
    children.push("No parameters");
  }
  return [required, children];
}

// Depending on what type of output an op generates:
//   'image': image
//   'complex*': complex
function getProviderListing(effect, opjs) {
  const attrs = {
    class: "block-output block-edge block-provider",
    'data-drag': "point",
    'data-drag-bind': "#flowchart",
    'data-drag-drop': "debugTrigger",
  };

  const spanAttrs = {
    class: 'vcenter',
  };

  const children = [];
  for (const outp of effect.output) {
    let child = EL('span', {}, '??');
    if (outp.cname.startsWith('complex')) {
      attrs['data-drag-drop-on'] = ".accept-complex";
      attrs['title'] = "Drag complex output to an input";
      child = EL('span', spanAttrs, '[x]');
    } else if (outp.cname === 'image') {
      attrs['data-drag-drop-on'] = ".accept-image"
      attrs['title'] = "Drag image output to an input";
      child = EL('span', spanAttrs, '&#128444;')
    }
    children.push(child);
  }

  const parentDiv = EL('div', attrs);
  appendChildren(parentDiv, children);
  return enableTriggers(parentDiv, true);
}

////////////////////////////////////
//
//  refreshOpImages: Load or reload every image that we have.
//
//  This one is a little complex:
//    1) Generate a sorted list of Ops. Sorted such that a given op will come
//       after all ops, complexes, and images that come before it.
//    2) This uses a cache to make loops no-ops.
//
////////////////////////////////////
function refreshOpImages() {
  return
  // TODO: Node Rewrite
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

  return;
  // TODO: Node rewrite.

  for (const obj of Object.values(torefresh)) {
    const nodejs = obj.node;
    const opjs = obj.opjs;
    const deps = obj.deps;

    const generated = await updateImage(nodejs, opjs, deps);
  }
}
