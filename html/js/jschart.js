// jschart.js
//
// Configuration and block management for client-side effect ops. UI portion is
// handled in flowchart.js
//
////////////////////////////////////
//
//  Three types of blocks:
//
//    - Ops block: a single operation and its settings.
//
//    - JSON/Complex block. Output-only. For user-entered numpy arrays.
//
//    - Picture (an output-only 'node')
//
//  All three need:
//    - configurable name (?)
//    - pos
//
//  Image block needs:
//    - image path
//
//  Complex block needs:
//    - JSON of arrays/matrices
//
//  Ops block needs:
//
//    - Effect name
//    - Input args (images, complex, and other)
//    - Output values (images, complex, and other)
//
//  Inputs:
//    - Image   (drag to target)
//    - Complex (drag to target)
//    - Simple  (Optional drag?)
//
//  Outputs per ops (one or more)
//    - Image
//    - Complex
//    - Simple
//
////////////////////////////////////

// Our demonstration chart. It ... doesn't do much. It also demonstrates
// the structure of the CHART object.
const DEMO_CHART = {
  "ops": {
    "ops1721586817693": {
      "type": "ops",
      "uuid": "ops1721586817693",
      "name": "Blur",
      "effect": "blur",
      "pos": {
        "x": 311.40000915527344,
        "y": 301.316650390625
      },
      "args": [
        {
          "cname": "image",
          "name": "image",
          "required": true,
          "type": "ANY"
        },
        {
          "cname": "int",
          "max": 255,
          "min": 1,
          "name": "amount",
          "step": 2,
          "title": "Pixel range to blur (odd number)",
          "value": 5
        }
      ]
    },
    "ops1721586820964": {
      "type": "ops",
      "uuid": "ops1721586820964",
      "name": "Adaptive Threshold",
      "effect": "adaptiveThreshold",
      "pos": {
        "x": 298.40000915527344,
        "y": 132.95001220703125
      },
      "args": [
        {
          "cname": "image",
          "name": "image",
          "required": true,
          "type": "ANY"
        },
        {
          "cname": "int",
          "max": 255,
          "min": 0,
          "name": "cmax",
          "value": 255
        },
        {
          "args": [
            {
              "Gaussian": 1,
              "Mean": 1
            }
          ],
          "cname": "select",
          "name": "method",
          "value": 1
        },
        {
          "args": [
            {
              "BINARY": 0,
              "INVERTED": 1
            }
          ],
          "cname": "select",
          "name": "target",
          "value": 0
        },
        {
          "cname": "int",
          "min": 1,
          "name": "blockSize",
          "step": 2,
          "title": "Must be odd",
          "value": 27
        },
        {
          "cname": "int",
          "name": "weight",
          "value": 2
        }
      ]
    }
  },
  "complexes": {},
  "images": {
    "images1721586619249": {
      "type": "images",
      "uuid": "images1721586619249",
      "name": "demo_landscape",
      "path": "uploads/demo_landscape.png",
      "pos": {
        "x": 85.83334350585938,
        "y": 185.78334045410156
      },
    }
  }
};

const CHARTKEY = 'chart';

let CHART = DEMO_CHART;
let CCACHE = {};

const TYPE = {
  op: 'ops',
  ops: 'ops',
  image: 'images',
  images: 'images',
  complex: 'complex',
  complexes: 'complex',
}

////////////////////////////////////
//
//  Save and load charts, add and remove items.
//
////////////////////////////////////

function saveChart() {
  setSaved(CHARTKEY, CHART);
}

// Not wildly useful now, but it helps create separation between the JS blocks
// and the DOM blocks.
function updateChart(func) {
  func();
  saveChart();
}

function loadChart(chart) {
  CHART = chart;
  saveChart();
}

// UUID gen, using timestamp in ms.
// e.g: ops123124, nodes12314124, images123214124
function makeUUID(type) {
  return type + (new Date().getTime()).toFixed();
}

////////////////////////////////////
//
//  Manipulating CHART. We use JS at the end of each function
//  to separate it from any DOM-manipulating functions.
//
//  e.g: moveBlock calls moveBlockJS. addImage calls newImageJS.
//
////////////////////////////////////

// Create a new imageJS
function newImageJS(name, path, pos) {
  const uuid = makeUUID(TYPE.image);
  const img = {
    type: TYPE.image,
    uuid: uuid,
    name: name,
    path: path,
    pos: pos,
  };

  // Update our chart
  CHART.images[img.uuid] = img;
  saveChart();

  // And return to let flowchart render it.
  return img;
}

// New Complex JS for json data
function newComplexJS(name, pos) {
  const uuid = makeUUID(TYPE.complex);
  const complex = {
    type: TYPE.complex,
    uuid: uuid,
    name: name,
    pos: pos,
    json: [],
  };

  // Update our chart
  if (!('complexes' in CHART)) {
    CHART.complexes = {};
  }
  CHART.complexes[complex.uuid] = complex;
  saveChart();

  // And return to let flowchart render it.
  return complex;
}

// Create a new opJS
function newOpJS(effect, pos) {
  const opjs = {
    type: TYPE.op,
    uuid: makeUUID(TYPE.op),
    name: effect.displayname,
    effect: effect.name,
    pos: pos,
  };
  opjs.args = effect.args.map((a) => deepCopy(a));

  // Update our chart
  CHART.ops[opjs.uuid] = opjs;
  saveChart();

  // And return to let flowchart render it.
  return opjs;
}

// Move either an image or an op.
function moveBlockJS(blockjs, pos) {
  blockjs.pos = pos;
  saveChart();
}

////////////////////////////////////
//
//  Forming new links.
//
//  We can have:
//  
//    - image->node
//    - node->node
//
//  Binding an image to an op is acceptable, but creates a new node.
//
//  Binding a node or image to an existing node will currently reset its source.
//  This may change as support is added for multi-image inputs.
//
////////////////////////////////////

// Bind an output to an input. (Actually we do the reverse:
// Ops have "sources", rather than outputs having "Destinations".
function bindJS(sourcejs, targetjs, argname, idx) {
  console.log("bJS", sourcejs, targetjs, argname, idx);
  const arg = targetjs.args.find((a) => a.name === argname);
  console.log("bind", sourcejs, targetjs, argname, idx);
  arg.source = {
    type: sourcejs.type,
    sourceid: sourcejs.uuid,
    idx: idx,
  };

  saveChart();
}

////////////////////////////////////
//
//  Removing objects.
//
////////////////////////////////////

function removeSourcesJS(uuid) {
  for (const op of Object.values(CHART.ops)) {
    for (const arg of op.args) {
      if (arg.source && arg.source.sourceid === uuid) {
        delete arg['source'];
      }
    }
  }
  saveChart();
}

function removeBlockJS(blockjs) {
  removeSourcesJS(blockjs.uuid);

  delete CHART[blockjs.type][blockjs.uuid];
}

addInitializer(() => {
  CHART = getSaved(CHARTKEY, DEMO_CHART);
});
