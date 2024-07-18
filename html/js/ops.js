// ops.js
//
// Configuration and ops management for client-side effect ops.
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
//    - Position
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
      position: {
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
      position: {
        left: 200,
        top: 180,
      },
    },
  },
  images: {
    imguuid1: {
      name: 'Sunset',
      path: 'uploads/demo_sunset.png',
      position: {
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

function updateOpBlock(block, opdesc) {
  populateElement(block, {
    '.ophead': opdesc.name,
    '.oplisting': getOpListing(opdesc.args),
  });

  block.style.top = opdesc.position.top + 'px';
  block.style.left = opdesc.position.left + 'px';
  return block;
}

function newOpBlock(opdesc) {
  const effect = ALL_EFFECTS.effects[opdesc.effect];
  const oplisting = getOpListing(opdesc.args);
  const block = template('opblock');
  block.id = opdesc.uuid;
  updateOpBlock(block, opdesc);

  return block;
}

function createOp(opdesc) {
  const block = newOpBlock(opdesc);
  block.id = opdesc.uuid
  block.type = TYPE.ops;
  appendChildren(EL.flowchart, block);
}

function renderAllBlocks(chart) {
  const children = [];
  for (const [uuid, opdesc] of Object.entries(chart.ops)) {
    createOp(opdesc);
  }
}

function newEffectAt(effect, pos) {
  const uuid = TYPE.ops + (new Date().getTime()).toFixed();
  const op = {
    uuid: uuid,
    name: effect.displayname,
    effect: effect.name,
    position: {
      left: pos.x,
      top: pos.y,
    },
    nodes: []
  };
  op.args = Object.assign({}, effect.args);

  // Update our chart
  CHART.ops[op.uuid] = op;
  saveChart();
  createOp(op);
}

addTrigger('addEffectAt', function(effectElement, evt, fixedPos,
                              parentElement, relativePos) {
  const effect = ALL_EFFECTS.effects[effectElement.dataset.effectName];
  newEffectAt(effect, relativePos);
});



addTrigger('removeElement', (el, evt) => {
  // el can be: an op, a node, an image.
  if (el.type === TYPE.ops) {
    delete CHART.ops[el.id];
    console.log("Removing: " + el.type);
    saveChart();
  }
  removeElement(el);
});

addInitializer(() => {
  CHART = getSaved(CHARTKEY, DEMO_CHART);
  console.log("Saved:");
  console.log(CHART);
  renderAllBlocks(CHART);
});
