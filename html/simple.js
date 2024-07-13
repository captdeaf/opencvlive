// simple.js
//
// Simple UI management: Toggles, basic onclicks, etc.

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
addTrigger('deleteparent', (el, evt) => {
  deleteParent(el);
});

addTrigger('closeme', (el, evt) => {
  el.style.display = 'none';
});

addInitializer(function() {
  const desc = get('#about');
  const toggles = getAll('.toggle-about');

  const descdisplay = desc.style.display;

  const toggleAbout = addToggle(undefined, 'about-shown', false, function(enabled) {
    if (enabled) {
      desc.style.display = 'none';
    } else {
      desc.style.display = descdisplay;
    }
  });

  for (const toggle of toggles) {
    toggle.onclick = toggleAbout;
  }
});
