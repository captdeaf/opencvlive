// constants.js
//
////////////////////////////////////
//
//  Loaded after util.js, this sets values on the EL function for
//  the most commonly used DOM elements.
//
////////////////////////////////////

function loadConstants() {
  const all = {
    body: 'body',
    floats: '#floats',
    flowchart: '#flowchart',
    drawlines: '#flowlines',

    upload: '#upload-dialog',
    uploadList: '#upload-list',

    library: '#library',
    blockselection: '#block-selection',
  }
  for (const [k, v] of Object.entries(all)) {
    EL[k] = get(v);
  }
}
