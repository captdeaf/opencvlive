// actions.js
//
// Helper functions for OpenCVLive that aid actions for various UI elements.

// Current mouse action
let MOUSE = {
  actions: {},
  started: false,
  target: undefined,
  pos: {'x': 0, 'y': 0},
  time: new Date().getTime(),
};

const MOUSE_TIMEOUT = 200;

function isMouseOkay() {
  if (MOUSE.target === undefined) return false;
  return ((new Date().getTime()) - MOUSE.time) > MOUSE_TIMEOUT;
}

function startMouseAction(evt, actions) {
  if (isMouseOkay()) return;
  if (evt.which != 1) return;

  const began = new Date().getTime();
  MOUSE.actions = actions;
  MOUSE.started = false;
  MOUSE.target = evt.target;
  MOUSE.time = began;
  MOUSE.pos = getMousePos(evt);

  if (actions.begin) { actions.begin(); }
  if (actions.start) {
    setTimeout(function() {
      if (MOUSE.time == began) {
        MOUSE.actions.start()
        MOUSE.started = true;
      }
    }, MOUSE_TIMEOUT);
  }
  return pauseEvent(evt);
}

function getMousePos(evt) {
  return {'x': evt.clientX, 'y': evt.clientY};
}

function moveMouseAction(evt) {
  MOUSE.pos = getMousePos(evt);

  if (MOUSE.actions && MOUSE.actions.move && isMouseOkay()) {
    MOUSE.actions.move();
  }

  return pauseEvent(evt);
}

function endMouseAction(evt) {
  if (MOUSE.actions && MOUSE.actions.end && isMouseOkay()) {
    MOUSE.actions.end(evt);
  }
  MOUSE = {};
  if (evt) {
    return pauseEvent(evt);
  }
}

function copyDragStylesTo(from, to) {
  for (const sname of ["display", "position", "top", "left"]) {
    to[sname] = from[sname];
  }
}

function getRelativePosition(par, child) {
  const pr = par.getBoundingClientRect();
  const cr = child.getBoundingClientRect();
  return {
    'x': cr.left - pr.left,
    'y': cr.top - pr.top,
  };
}

function addMouseDrag(element) {
  // We're dealing with two elements here:
  // class=drag-me - the whole thing that's dragged.
  // class=drag-start - The element that's clickable.
  // They may be the same element.
  //
  // addMouseDrag() is called on the dragged element.
  
  const callbacks = {};

  callbacks.start = element.dataset['drag_start'];
  callbacks.move = element.dataset['drag_move'];
  callbacks.end = element.dataset['drag_drop'];

  const actions = {};

  let xStart = 0;
  let yStart = 0;

  let xOffset = 0;
  let yOffset = 0;

  // drag=... - triggers on drop:
  //   "trigger" (drags clone, clears, calls callback)
  //   "point" (draws line, clears, calls callback)
  //   "copy" (drags clone, copies into new parent, and calls callback)
  //   "move"  (hides orig, drags clone, moves original into new parent, and calls callback)
  const method = element.dataset['drag'];

  // The copy being dragged.
  let dragged = null;
  let targetElements = [element.parentElement];

  if (element.dataset['drag_target'] === '!float') {
    targetElements = null;
  } else if (element.dataset['drag_target']) {
    targetElements = getAll(element.dataset['drag_target']);
  }

  function cleanUp() {
    element.style.visibility = 'visible';
    dragged.parentElement.removeChild(dragged);
    dragged = null;
  }

  actions.begin = function() {
    xStart = MOUSE.pos.x;
    yStart = MOUSE.pos.y;

    const cur = element.getBoundingClientRect();

    xOffset = cur.left;
    yOffset = cur.top;
  };

  actions.start = function() {
    if (!isMouseOkay()) {
      return;
    }

    dragged = element.cloneNode(true);
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
      newParent = elementsContain(targetElements, dragged);
    }

    if (!newParent) {
      cleanUp();
      return;
    }

    const newPos = getRelativePosition(newParent, dragged);

    if (method === 'move') {
      if (element.parentElement != newParent) {
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

    trigger(callbacks.end, element, MOUSE.pos, newParent, newPos);

    cleanUp();
  };

  let starters = [];
  if (element.classList.contains('drag-start')) {
    starters = [element];
  } else {
    starters = element.querySelectorAll('.drag-start');
  }

  for (const starter of Object.values(starters)) {
    starter.onmousedown = (evt) => startMouseAction(evt, actions)
  }
}

addInitializer(function() {
  // Override all non-button mouse actions 
  document.onmouseleave  = function() {
    endMouseAction;
  };
  document.onmouseup   = endMouseAction;
  document.onmousemove = moveMouseAction;
});
