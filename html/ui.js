// ui.js
//
/////////////////////////////////////
//
// Simplest UI triggers: "Close this dialog", etc.
//
// This also introduces Storage-based triggers. A checkbox that is checked and
// named can be saved and its state correct the next time.
//
/////////////////////////////////////

// 
function addToggle(attr, stateKey, defaultState, callback) {
  // checkbox.onchange = addToggle('checked',
  //                               'advancedSearch', 
  //                               false,
  //                               function(enabled) {
  //                                 if (enabled) {
  //                                   ...
  //                                 }
  //                               });
  //  if attr is a function, it's called instead of element[attr] boolean.
  //  if attr is undefined, it's a toggle.
  let state = getSaved(stateKey, '' + defaultState) === 'true';

  let checkElement = function(target) {
    return target[attr];
  };
  if (attr === undefined) {
    checkElement = function() {
      return !state;
    };
  } else if (typeof(attr) === typeof(checkElement)) {
    checkElement = attr;
  }

  if (callback) callback(state);

  return function(evt) {
    state = checkElement(evt.target);
    setSaved(stateKey, "" + state);
    if (callback) callback(state);
  }
}

// Basic click functionality
addTrigger('remove', (el, evt) => {
  const sel = el.dataset.target;
  const par = findParent(el, sel);
  removeElement(par);
});

addTrigger('hide', (el, evt) => {
  const sel = el.dataset.target;
  const par = findParent(el, sel);
  par.style.display = 'none';
});
