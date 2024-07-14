// dragndrop.js
//
/////////////////////////////////////
//
// This implements a mouse click+drag feature. It is right now only used for
// Drag & Drop, but would support other purposes.
//
// Drag & Drop in JS.
//
// Different types of "drag"s:
//     "trigger" (drags clone, clears, calls callback)
//     "point" (draws line, clears, calls callback)
//     "copy" (drags clone, copies into new parent, and calls callback)
//     "move"  (hides orig, drags clone, moves original, and calls callback)
//     "reposition" (drags orig, and calls callback)
//
//  This converts all elements with "[data-drag]": <div data-drag="copy">.
//
//  If there are any sub-elements with "drag-start" class, they will be the
//  mousedown start for DnD. (e.g: title bars of windows). If not, the main
//  [data-drag] element is considered the mousedown start.
//
/////////////////////////////////////

// Current mouse action. Yes, it's a global, because window events are
// overridden.
let MOUSE = {
  actions: {},
  started: false,
  target: undefined,
  pos: {'x': 0, 'y': 0},
  time: new Date().getTime(),
};

// This is for any non-drag events that want mouse. I'll probably use it
// for some interesting features.
let MOUSE_POS = { 'x': 0, 'y': 0 };

// startMouseAction is triggered by onmousedown on an element.  It
// re-instantiates MOUSE with its information, so it can check again once the
// dragging actually starts. In case of click-click-drag.
//
// It actually isn't tied to DnD. actions can be anything related to mouse
// down+move+release, not just DnD.
function startMouseAction(evt, actions) {
  if (evt.which != 1) return;

  MOUSE = {
    "actions": actions,
    "started": false,
    "target": evt.target,
    "time": new Date().getTime(),
    "pos": getMousePos(evt),
  };

  if (actions.start) { actions.start(); }

  return pauseEvent(evt);
}

// Given an event, where is the mouse?
function getMousePos(evt) {
  return {'x': evt.clientX, 'y': evt.clientY};
}

// This is actually an override to document.onmousemove.  We always track the
// position in MOUSE_POS. But also update MOUSE.pos (current mouse event)
//
// If there is an active MOUSE action, then trigger its update.
function moveMouseAction(evt) {
  MOUSE.pos = getMousePos(evt);

  if (MOUSE.actions && MOUSE.actions.move) {
    MOUSE.actions.move();
  }

  return pauseEvent(evt);
}

// End the mouse action. Either mouse up, or mouse left the document.
// This is also an override of document.onleave and document.onmouseup
function endMouseAction(evt) {
  if (MOUSE.actions && MOUSE.actions.end) {
    MOUSE.actions.end(evt);
  }
  MOUSE = {};
  if (evt) {
    return pauseEvent(evt);
  }
}

// When you drag an element around, and release, if we want it inside and
// relative top+left to a parent element, this calculates the offset location
// from parent position.
function getRelativePosition(par, child) {
  const pr = par.getBoundingClientRect();
  const cr = child.getBoundingClientRect();
  return {
    'x': cr.left - pr.left,
    'y': cr.top - pr.top,
  };
}

// This is called with an element that wants to be DnD-able. Most likely using
// the triggers from addTriggerFunction('[data-drag]', addMouseDrag);
function addMouseDrag(element) {
  // We're dealing with two elements here:
  // class=drag-start - The element that's clickable. If no subelement with this,
  // elment is considered to have it.
  //
  // addMouseDrag() is called on the dragged element.
  
  const callbacks = {};

  callbacks.start = element.dataset.dragStart;
  callbacks.move = element.dataset.dragMove;
  callbacks.end = element.dataset.dragDrop;

  const actions = {};

  let xStart = 0;
  let yStart = 0;

  let xOffset = 0;
  let yOffset = 0;

  // drag=... - triggers on drop:
  const method = element.dataset.drag;

  // The copy being dragged.
  let dragged = null;
  let targetElements = [element.parentElement];

  if (element.dataset.dragTarget === '!float') {
    targetElements = null;
  } else if (element.dataset.dragTarget) {
    targetElements = getAll(element.dataset.dragTarget);
  }

  function cleanUp() {
    if (method === 'reposition') return;
    element.style.visibility = 'visible';
    dragged.parentElement.removeChild(dragged);
    dragged = null;
  }

  actions.start = function() {
    xStart = MOUSE.pos.x;
    yStart = MOUSE.pos.y;

    const cur = element.getBoundingClientRect();

    xOffset = cur.left;
    yOffset = cur.top;

    if (method !== 'reposition') {
      dragged = element.cloneNode(true);
    } else {
      dragged = element;
    }
    appendChildren(get('#floats'), dragged);

    if (method === 'move') {
      element.style.visibility = 'hidden';
    }

    dragged.style.display = 'block';
    dragged.style.position = 'fixed';

    trigger(callbacks.start, element, MOUSE.pos);
  };

  actions.move = function(evt) {
    if (!dragged) return;

    let xTarget = (MOUSE.pos.x - xStart) + xOffset;
    let yTarget = (MOUSE.pos.y - yStart) + yOffset;

    dragged.style['left'] = xTarget + "px";
    dragged.style['top'] = yTarget + "px";

    trigger(callbacks.move, element, MOUSE.pos);
  };

  actions.end = function(evt) {
    if (!dragged) return;
    let newParent = element.parentElement;

    // Case: can only drag to specific targets.
    if (targetElements !== null) {
      newParent = containingElement(targetElements, dragged);
    }

    if (!newParent) {
      cleanUp();
      return;
    }

    const newPos = getRelativePosition(newParent, dragged);

    trigger(callbacks.end, element, MOUSE.pos, newParent, newPos);

    if (method === 'move') {
      if (newParent && element.parentElement != newParent) {
        element.parentElement.removeChild(element);
        newParent.appendChild(element);
      }
      element.style.left = newPos.x;
      element.style.top = newPos.y;
    } else if (method === 'copy') {
      const clone = cloneElement(element);
      clone.style.left = newPos.x;
      clone.style.top = newPos.y;
      newParent.appendChild(clone);
    }

    cleanUp();
  };

  let starters = getAll('.drag-start', element);

  if (!starters || starters.length == 0) {
    starters = [element];
  }

  for (const starter of Object.values(starters)) {
    starter.onmousedown = (evt) => startMouseAction(evt, actions)
  }
}

// On launch for all elements, and on creating new elements, add DnD to any
// <element data-drag="..."> elements.
addTriggerFunction('[data-drag]', addMouseDrag);

// We depend on overriding onmouseup, onmouseleave, onmousemove, so do that on
// startup.
addInitializer(function() {
  // Override all non-button mouse actions 
  document.onmouseleave = endMouseAction;
  document.onmouseup   = endMouseAction;
  document.onmousemove = moveMouseAction;
});
