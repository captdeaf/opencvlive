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

// A toggleable item to hide and unhide, saving state in the key
// described in data-hide. It is toggled by 'toggle' events
// targeting this element.
addTriggerFunction('[data-hide]', (el) => {
  const saveKey = el.dataset.hide;
  const display = el.style.display;
  const defaultState = el.dataset.hideDefault;

  let isHidden = getSaved(saveKey, '' + defaultState) === 'true';

  function updateState() {
    if (isHidden) {
      el.style.display = 'none';
    } else {
      el.style.display = display;
    }
  }

  el.toggle = (preferred) => {
    isHidden = !isHidden;
    if (preferred === true || preferred === false) {
      isHidden = preferred;
    }
    setSaved(saveKey, '' + isHidden);
    updateState();
  };

  updateState();
});

// On click, access all objects matching the data-target selector, and call
// .toggle() on their elements. If data-toggle is set, it passes a preferred
// value. Otherwise it doesn't, and toggle switches. (preferred is good for, e.g:
// "hide all");
addTrigger('toggle', (el, evt) => {
  const sel = el.dataset.target;
  const targets = getAll(sel);

  // Preferred
  let preferred;
  const val = el.dataset.toggle;
  if (val === "true") {
    preferred = true;
  } else if (val === "false") {
    preferred = false;
  }
  for (const target of targets) {
    if (target.toggle) {
      target.toggle();
    }
  }
});

// On click, hide either this element, or a parent element
// matching the data-target selector.
addTrigger('hide', (el, evt) => {
  let sel = el.dataset.target;
  if (!sel || sel == '') {
    sel = '.dialog';
  }
  const par = findParent(el, sel);
  par.style.display = 'none';
});

// On click, remove either this element, or a parent element
// matching the data-target selector.
addTrigger('remove', (el, evt) => {
  const sel = el.dataset.target;
  const par = findParent(el, sel);
  removeElement(par);
});

// Raise the Z-index of target item.
let currentZeds = {
  floater: 10001,
  block: 800,
};
addTrigger('raiseZIndex', (el, evt) => {
  const target = el.dataset.zindex;
  el.style['z-index'] = currentZeds[target];
  currentZeds[target] += 1;
});
