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
// cname: {
//   // An image to render when this parameter has a source.
//   build: (param),
//   save: (element, param),
// }
//
// 'build' function converts an (args) into a renderable html template.
//
// 'save' receives the input values (as if from a form) from the html portion,
// and should return a JSON object which is passed directly to the arg parser
// on the python side.
//
////////////////////////////////////

const TYPEDEFS = nestedProxy({});

TYPEDEFAULT = {
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
    const sattrs = deepCopy(param);
    for (const [k, v] of Object.entries(param.args[0])) {
      const oattrs = { value: '' + v };
      children.push(EL('option', oattrs, k));
    }
    delete sattrs['args'];
    const select = EL('select', sattrs, ...children);
    select.value = param.value;
    return select
  },
  save: (el, param) => {
    return parseInt(el.value);
  },
};

TYPEDEFS['image'] = {
  build: (param) => {
    let src = 'images/clip_image.png';
    const source = getSource(param);
    if (source) src = source.path;
    return EL('img', {src: src});
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

////////////////////////////////////
//
//  Safely get a source. The source block may have been removed,
//  or there is no source.
//
////////////////////////////////////
function getSource(param) {
  if ('source' in param && 'uuid' in param.source) {
    const blockfrom = CHART.blocks[param.source.uuid];
    if (blockfrom && 'outputs' in blockfrom) {
      const output = blockfrom.outputs[param.source.idx];
      if (output) {
        return output;
      }
    }
  }
  return undefined;
}

////////////////////////////////////
//
//  Render a single parameter
//
//    - If no value or source, a default input or image.
//    - If a source, either the image or an icon.
//    - Rendered input from TYPEDEFs.
//
////////////////////////////////////
function makeParamElement(param, effectparam) {
  const classes = ['param-input'];
  const cname = param.cname;
  classes.unshift('accept-' + cname);

  const labelAttrs = {
    'class': classes.join(' '),
  };

  const typedef = TYPEDEFS[cname];

  const builtInput = TYPEDEFS[cname].build(param);

  builtInput.dataset.onchange = 'updateParameter';
  builtInput.param = param;

  if (title in param) { labelAttrs.title = param.title; }

  const label = EL('label', labelAttrs,
    EL('span', param.name),
    builtInput
  );

  label.param = param;
  label.effectparam = effectparam;

  return label;
}

////////////////////////////////////
//
//  Render all the parameters section of a block.
//
////////////////////////////////////
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
  let typedef = TYPEDEFS[el.param.cname];
  if ('save' in typedef) {
    el.param.value = typedef.save(el, el.param);
  } else {
    el.param.value = TYPEDEFAULT.save(el.value);
  }
  saveChart();
});
