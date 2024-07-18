// ops.js
//
// Configuration and ops management for client-side effect ops. UI portion is
// handled in flowchart.js
//
////////////////////////////////////
//
//  Three types of blocks:
//
//    - Ops block: a single operation and its settings. No i/o,
//                 though it displays an input, inputs generate
//                 new nodes.
//
//    - Node block: Below ops blocks. An instance of an operation, with an
//                  image input and output.
//
//    - Picture (an output-only 'node')
//
//  Image block needs:
//    - image path
//
//  Ops block and Image block need:
//    - pos
//    - Nonstandard styles, if any?
//
//  Ops block needs:
//
//    - Configurable name
//    - Effect name
//    - Args available and values.
//    - Input type (BGR/GRAYSCALE)
//
//  Node blocks need:
//
//    - input node id (Primary / initial)
//        + cosmetic: color of line
//    - input node ids (secondary image inputs)
//        + cosmetic: color of lines
//
//  Node and Image blocks need:
//
//    - display name (original image's)
//    - output image path
//
////////////////////////////////////

const DEMO_CHART = {
  ops: {
    opuuid1: {
      uuid: 'opuuid1',
      name: 'Demo Blur',
      effect: 'blur',
      args: {
        amount: {
          cname: 'int',
          flag: 'odd',
          min: 1,
          value: 5,
        }
      },
      pos: {
        left: 100,
        top: 80,
      },
      nodes: [
        {
          nodeuuid1: {
            name: 'Blurry Sunset',
          },
        }
      ],
    },
    opuuid2: {
      uuid: 'opuuid2',
      name: 'Demo Invert',
      effect: 'invert',
      args: {},
      pos: {
        left: 200,
        top: 180,
      },
    },
  },
  images: {
    imguuid1: {
      name: 'Sunset',
      path: 'uploads/demo_sunset.png',
      pos: {
        left: 10,
        top: 140,
      },
    },
  },
};

const CHARTKEY = 'chart';
let CHART = DEMO_CHART;

const TYPE = {
  ops: 'ops',
  node: 'node',
  imag: 'image',
}

function saveChart() {
  setSaved(CHARTKEY, CHART);
}

function getOpListing(opargs) {
  if (!opargs || Object.keys(opargs).length == 0) {
    return [EL('label', "No parameters"),
            EL('label', "No parameters"),
            EL('label', "No parameters"),
            EL('label', "No parameters"),
            EL('label', "No parameters"),
            EL('label', "No parameters"),
            EL('label', "No parameters"),
            EL('label', "No parameters"),
            EL('label', "No parameters"),
            EL('label', "No parameters"),
            EL('label', "No parameters"),
           ];
  }
  const children = [];
  for (const k of Object.keys(opargs).sort()) {
    children.push(EL('label', {}, k));
  }
  return children;
}

function newOpJS(effect, pos) {
  const uuid = TYPE.ops + (new Date().getTime()).toFixed();
  const op = {
    uuid: uuid,
    name: effect.displayname,
    effect: effect.name,
    pos: {
      left: pos.x,
      top: pos.y,
    },
    nodes: []
  };
  op.args = Object.assign({}, effect.args);

  // Update our chart
  CHART.ops[op.uuid] = op;
  saveChart();
  return op;
}

addTrigger('opdrop', function(el, evt, fixedPos, parentElement, relativePos) {
  if (!CHART.ops[el.id]) {
    alertUser("opsdrop on nonexistant uuid?", el.id);
    return;
  }

  CHART.ops[el.id].pos = {
    left: relativePos.x,
    top: relativePos.y,
  };
  
  saveChart();
});

function removeBlockJS(eltype, elid) {
  if (eltype == TYPE.ops) {
    delete CHART.ops[el.id];
  } else {
    alertUser("Unknown removed block", eltype);
  }
  saveChart();
}

addInitializer(() => {
  CHART = getSaved(CHARTKEY, DEMO_CHART);
});
