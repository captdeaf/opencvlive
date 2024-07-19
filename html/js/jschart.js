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
          uuid: 'nodeuuid1',
          sources: [{image: 'imguuid1', opts: {color: 'red'}}],
          name: 'Blurry Sunset',
        },
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
      nodes: [
        {
          uuid: 'nodeuuid2',
          sources: [{op: 'opuuid1', node: 'nodeuuid1', opts: {color: 'green'}}],
          name: "Inverted blurry sunset",
        }
      ],
    },
  },
  images: {
    imguuid1: {
      uuid: 'imguuid1',
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
  node: 'nodes',
  image: 'images',
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

function newImageJS(name, path, pos) {
  const uuid = TYPE.image + (new Date().getTime()).toFixed();
  const img = {
    uuid: uuid,
    name: name,
    path: path,
    pos: {
      left: pos.x,
      top: pos.y,
    },
    nodes: []
  };

  // Update our chart
  CHART.images[img.uuid] = img;
  saveChart();
  return img;
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

function moveBlockJS(eltype, elid, pos) {
  console.log("moving: '" + eltype + "." + elid);
  if (!CHART[eltype][elid]) {
    // Probably deleted by removeElement on trash can.
    return;
  }

  CHART[eltype][elid].pos = {
    left: pos.x,
    top: pos.y,
  };
  
  saveChart();
}

function getJSBlock(type, uuid) {
  return CHART[type][uuid];
}

function removeBlockJS(eltype, elid) {
  if (eltype === TYPE.ops || eltype === TYPE.image) {
    delete CHART[eltype][elid];
  } else {
    alertUser("Unknown removed block", eltype);
  }
  saveChart();
}

function bindJSToOp(source, target) {
}

addInitializer(() => {
  CHART = getSaved(CHARTKEY, DEMO_CHART);
});
