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
//
////////////////////////////////////

const x = {};

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

addTrigger('opChange', function(el, evt) {
  const opblock = findParent(el, '.block-master');
  const label = findParent(el, 'label');
  const opjs = findJSBlock(opblock.id);
  const name = el.dataset.name;
  opjs.args[name].value = TYPEDEFS[el.dataset.cname].parse(name, el, opjs.args[name]);
  saveChart();
});

function renderOp(name, oparg, argdef) {
  const lattrs = {};
  if (argdef.title) {
    lattrs.title = argdef.title;
  }
  const item = EL('label', lattrs, name);
  const cname = oparg.cname;
  oparg = Object.assign(oparg, argdef);
  appendChildren(item, TYPEDEFS[cname].build(name, oparg));
  return enableTriggers(item);
}

function getOpListing(effect, opargs) {
  const ret = EL('div', {});
  if (opargs && Object.keys(opargs).length > 0) {
    for (const [name, oparg] of Object.entries(opargs)) {
      appendChildren(ret, renderOp(name, oparg, effect.args[name]));
    }
  } else {
    appendChildren(ret, "No parameters");
  }
  return ret;
}
