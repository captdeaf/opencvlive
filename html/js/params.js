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
    for (const [k, v] of Object.entries(param.args[0])) {
      children.push(EL('option', {
        value: '' + v,
      }, k));
    }
    console.log('buildsel', param, children);
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

  builtInput.dataset.onchange = 'updateParameter';
  builtInput.param = param;

  if (title in param) { labelAttrs.title = param.title; }

  const label = EL('label', labelAttrs,
    EL('span', param.name),
    builtInput
  );

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

addTrigger('updateParameter', (el, evt) => {
  el.param.value = el.value;
  saveChart();
});
