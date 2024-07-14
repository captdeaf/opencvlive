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

function makeHidable(el) {

}

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
  }

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
  let preferred = undefined;
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

// On click, remove either this element, or a parent element
// matching the data-target selector.
addTrigger('hide', (el, evt) => {
  const sel = el.dataset.target;
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
