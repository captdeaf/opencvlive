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


let CHART = {
  ops: {
    opuuid1: {
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

function renderAllBlocks(chart) {
  const children = [];
  for (const [uuid, opdesc] of Object.entries(chart.ops)) {
    const block = newOpBlock(uuid, opdesc);
    children.push(block);
  }
  appendChildren(get('#flowchart'), children);
}

addInitializer(() => {
  renderAllBlocks(CHART);
});
