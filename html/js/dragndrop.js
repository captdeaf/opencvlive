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
  let pause = false;
  if (MOUSE.actions && MOUSE.actions.end) {
    pause = MOUSE.actions.end(evt);
  }
  MOUSE = {};
  if (evt && pause) {
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

// Method of drag+drop: trigger, move, reposition, copy:
//
// trigger: drag a clone, drop it, vanishes but triggers events.
// move: hide dragMe, drag a clone, drop it, if okay, dragMe teleports there.
//       still triggers events.

function addMouseDrag(dragMe) {
  const callbacks = {};
  let clickStart = new Date().getTime();

  const method = dragMe.dataset.drag;

  callbacks.start = dragMe.dataset.dragStart;
  callbacks.move = dragMe.dataset.dragMove;
  callbacks.click = dragMe.dataset.dragClick;
  callbacks.end = dragMe.dataset.dragDrop;

  let mouseOff = {left: 0, top: 0, right: 0, bottom: 0};

  let dragged = null;
  let boundTo = get('body');
  let bounds = get('body').getBoundingClientRect();

  if (dragMe.dataset.dragBind) {
    boundTo = get(dragMe.dataset.dragBind);
  }

  function moveIt() {
    newX = (MOUSE.pos.x - mouseOff.left);
    newY = (MOUSE.pos.y - mouseOff.top);

    if (newX < bounds.left) newX = bounds.left;
    if (newY < bounds.top) newY = bounds.top;
    if (newX > bounds.right) newX = bounds.right;
    if (newY > bounds.bottom) newX = bounds.bottom;

    dragged.style.top = newY + 'px';
    dragged.style.left = newX + 'px';
  }

  if (dragMe.dataset.dragTarget === '!float') {
    targetElements = null;
  } else if (dragMe.dataset.dragTarget) {
    targetElements = getAll(dragMe.dataset.dragTarget);
  }

  function cleanUp() {
    dragMe.style.visibility = 'visible';
    removeElement(dragged);
    dragged = null;
  }

  const actions = {};

  actions.start = function() {
    // Track time, if this is < 200ms, we consider it a click.
    clickStart = new Date().getTime();

    // Track mouse differences. For dragging around.
    const curRect = dragMe.getBoundingClientRect();

    mouseOff = {
      left: MOUSE.pos.x - curRect.left,
      top: MOUSE.pos.y - curRect.top,
      right: curRect.right - MOUSE.pos.x,
      bottom: curRect.bottom - MOUSE.pos.y,
    };

    // Where can our dragging go?
    bounds = boundTo.getBoundingClientRect();

    // Tweak bounds for mouse offset relative to parent. Optimizing for
    // boundary checks.
    bounds.left = bounds.left + mouseOff.left;
    bounds.top = bounds.top + mouseOff.top;
    bounds.bottom = bounds.bottom - mouseOff.bottom;
    bounds.right = bounds.right - mouseOff.right;

    dragged = dragMe.cloneNode(true);
    appendChildren(get('#floats'), dragged);

    if (method === 'move') {
      dragMe.style.visibility = 'hidden';
    }

    dragged.style.visibility = 'visible';
    dragged.style.display = 'block';
    dragged.style.position = 'absolute';

    moveIt(dragged);

    trigger(callbacks.start, dragMe, MOUSE.pos);
  };

  actions.move = function(evt) {
    if (!dragged) return;

    moveIt(dragged);

    trigger(callbacks.move, dragMe, MOUSE.pos);
  };

  // actions.end determines if the triggering event is paused.
  // return True to stop
  actions.end = function(evt) {
    // Check for pseudo-click
    if ((new Date().getTime() - clickStart) < 200) {
      trigger(callbacks.click, dragMe, evt, MOUSE.pos);
      cleanUp();
      return false;
    }

    if (!dragged) return false;

    bounds = boundTo.getBoundingClientRect();

    const relativePos = {
      x: MOUSE.pos.x - bounds.left,
      y: MOUSE.pos.y - bounds.top,
    };

    if (method === 'move') {
      dragMe.style.left = (relativePos.x - mouseOff.left) + 'px';
      dragMe.style.top = (relativePos.y - mouseOff.top) + 'px';
    }

    let droppedOn = document.elementsFromPoint(MOUSE.pos.x, MOUSE.pos.y);
    if (dragMe.dataset.dragDropon) {
      droppedOn = listElementsMatching(droppedOn, dragMe.dataset.dragDropon);
    }

    if (dragMe.dataset.dropOk) {
      const sel = dragMe.dataset.dropOk + '[data-drop]';
      let dropElements = listElementsMatching(droppedOn, sel);
      for (const element of dropElements) {
        trigger(element.dataset.drop, dragMe, evt, MOUSE.pos, droppedOn, relativePos);
      }
    }

    trigger(callbacks.end, dragMe, evt, MOUSE.pos, droppedOn, relativePos);
    cleanUp();
    return true;
  };

  let starters = getAll('.drag-start', dragMe);

  if (!starters || starters.length == 0) {
    starters = [dragMe];
  }

  const lcb = (evt) => startMouseAction(evt, actions);
  for (const starter of Object.values(starters)) {
    starter.onmousedown = lcb;
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

/////////////////////////////////////
//
// data-hover: mouse handling.
//
/////////////////////////////////////

// Added data-onhover, which triggers whenever a mouse enters, or stays in
// for longer than 100 millis. Try and do it smoothly.
function addHoverTracker(el) {
  const timeout = 100;
  const triggerName = el.dataset.hover;
  const target = get(el.dataset.target);
  const scrollDiff = 15;

  let count = 5;
  let mouseon = false;
  let lastScroll = 0;

  function doHoverOver(evt) {
    let now = new Date().getTime();
    if (mouseon && lastScroll < (now - (timeout - 20))) {
      trigger(triggerName, target, evt, scrollDiff * (count/5));
      lastScroll = now;
      setTimeout(doHoverOver, timeout);
      count = count + 1;
    }
  }

  el.onmouseenter = (evt) => {
    mouseon = true;
    doHoverOver(evt);
  };

  el.onmouseleave = (evt) => {
    mouseon = false;
    count = 5;
  };
}

addTrigger('scrollup', (el, evt, amt) => {
  el.scrollTop = el.scrollTop - amt;
});

addTrigger('scrolldown', (el, evt, amt) => {
  el.scrollTop = el.scrollTop + amt;
});

addTriggerFunction('[data-hover]', addHoverTracker);
