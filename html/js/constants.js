// constants.js
//
////////////////////////////////////
//
//  Loaded after util.js, this sets values on the EL function for
//  the most commonly used DOM elements.
//
////////////////////////////////////

addInitializer('constants', () => {
  const allobjects = {
    body: 'body',
    floats: '#floats',
    flowchart: '#flowchart',
    flowlines: '#flowlines',
    drawlines: '#templines',

    chartEditor: '#jsonchart',
    chartDialog: '#jsonchart-dialog',
    editor: '#jsoneditor',
    editDialog: '#jsonedit-dialog',

    upload: '#upload-dialog',
    uploadList: '#upload-list',

    library: '#library',
    blockselection: '#block-selection',

    cacheCount: '#cachesize',
  }
  for (const [k, v] of Object.entries(allobjects)) {
    EL[k] = get(v);
  }
}, 50);
