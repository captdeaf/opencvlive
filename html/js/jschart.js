// jschart.js
//
// Configuration and block management for client-side effect ops. UI portion is
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

// Our demonstration chart. It ... doesn't do much. It also demonstrates
// the structure of the CHART object.
const DEMO_CHART = {
  ops: {
    opsuuid1: {
      type: 'ops',
      uuid: 'opsuuid1',
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
        x: 100,
        y: 80,
      },
      nodes: [
        {
          type: 'nodes',
          opid: 'opsuuid1',
          uuid: 'nodeuuid1',
          sources: [{sourceid: 'imagesuuid1', opts: {color: 'red'}}],
          name: 'Blurry Sunset',
        },
      ],
    },
    opsuuid2: {
      type: 'ops',
      uuid: 'opsuuid2',
      name: 'Demo Invert',
      effect: 'invert',
      args: {},
      pos: {
        x: 200,
        y: 180,
      },
      nodes: [
        {
          type: 'nodes',
          opid: 'opsuuid2',
          uuid: 'nodeuuid2',
          sources: [{sourceid: 'nodeuuid1', opts: {color: 'green'}}],
          name: "Inverted blurry sunset",
        }
      ],
    },
  },
  images: {
    imagesuuid1: {
      type: 'images',
      uuid: 'imagesuuid1',
      name: 'Sunset',
      path: 'uploads/demo_sunset.png',
      pos: {
        x: 10,
        y: 140,
      },
    },
  },
};

const CHARTKEY = 'chart';

let CHART = DEMO_CHART;
let CCACHE = {};

const TYPE = {
  ops: 'ops',
  node: 'nodes',
  image: 'images',
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
    uuid: uuid,
    name: name,
    path: path,
    pos: pos,
    nodes: []
  };

  // Update our chart
  CHART.images[img.uuid] = img;
  saveChart();

  // And return to let flowchart render it.
  return img;
}

// Create a new opJS
function newOpJS(effect, pos) {
  const uuid = makeUUID(TYPE.ops);
  const op = {
    type: TYPE.ops,
    uuid: uuid,
    name: effect.displayname,
    effect: effect.name,
    pos: pos,
    nodes: []
  };
  op.args = Object.assign({}, effect.args);

  // Update our chart
  CHART.ops[op.uuid] = op;
  saveChart();

  // And return to let flowchart render it.
  return op;
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

// A variety of colors for each line to help separate them from each other.
const COLORS = "cyan red green blue orange black brown purple".split(' ');
let colori = 0;
function pickColor() {
  colori += 1;
  if (colori >= COLORS.length) colori = 0;
  return COLORS[colori];
}

// Bind two JS objects to each other.
// If target is an op: Create a node.
// If target is a node: Reset its source.
// In both cases, its source is set to source.
function bindJS(sourcejs, targetjs) {
  console.log("Attempting to bind", sourcejs, targetjs);
  const source = {
    type: sourcejs.type,
    sourceid: sourcejs.uuid,
    opts: {
      color: pickColor(),
    },
  };

  if (targetjs.type === TYPE.ops) {
    const newNode = {
      type: TYPE.node,
      uuid: makeUUID(TYPE.node),
      sources: [source],
      name: 'Untitled',
    };

    newNode.opid = targetjs.uuid;
    
    if (!targetjs.nodes) targetjs.nodes = [];
    targetjs.nodes.push(newNode);
  } else if (targetjs.type === TYPE.node) {
    targetjs.sources = [source];
  }

  saveChart();
}

////////////////////////////////////
//
//  Removing objects.
//
//  Since nodes are part of ops, and both images and nodes can be sources in
//  other nodes, we need to cleanly remove all sources referring to it in all
//  nodes.
//
////////////////////////////////////

function removeSourcesJS(uuid) {
  for (const op of Object.values(CHART.ops)) {
    for (const node of Object.values(op.nodes)) {
      if (node.sources) {
        node.sources = node.sources.filter((source) => source.sourceid !== uuid)
      }
    }
  }
}

function removeBlockJS(blockjs) {
  if (blockjs.type === TYPE.ops) {
    for (const node of Object.values(blockjs.nodes)) {
      removeSourcesJS(node.uuid);
    }
    delete CHART.ops[blockjs.uuid];
  } else if (blockjs.type === TYPE.image) {
    removeSourcesJS(blockjs.uuid);
    delete CHART.images[blockjs.uuid];
  } else {
    removeSourcesJS(blockjs.uuid);
    const op = CHART.ops[blockjs.opid];
    op.nodes = op.nodes.filter((node) => node.uuid !== blockjs.uuid);
  }
}

addInitializer(() => {
  CHART = getSaved(CHARTKEY, DEMO_CHART);
});
