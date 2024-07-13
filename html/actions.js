// actions.js
//
// Helper functions for OpenCVLive that aid actions for various UI elements.

const TRIGGERS = {};

function addTrigger(name, func) {
  TRIGGERS[name] = func;
}

function trigger(name, ...args) {
  if (name) {
    if (Object.keys(TRIGGERS).indexOf(name) < 0) {
        alertUser("Unknown Trigger:", name);
    } else {
      TRIGGERS[name](...args);
    }
  }
}

// Basic click functionality
addTrigger('deleteparent', (el, evt) => {
  deleteParent(el);
});

addTrigger('closeme', (el, evt) => {
  el.style.display = 'none';
});

function enableActions(el) {
  // Add onclick events to all elements with data-click.
  const all = el.querySelectorAll('[data-click]');
  for (const clicky of all) {
    if (clicky.dataset.click && clicky.dataset.click !== '') {
      clicky.onclick = function(evt) {
        trigger(clicky.dataset.click, clicky, evt);
      }
    }
  }

  // Draggable divs.
  const draggables = el.querySelectorAll('.drag-me');
  if (draggables) {
    for (const drag of draggables) {
      addMouseDrag(drag);
    }
  }

  return el;
}

addInitializer(function() {
  enableActions(get('body'));
});
