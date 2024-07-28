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
//     "trigger" (drags clone or image, clears, calls callback)
//     "point" (drags clone or image, draws line, clears, calls callback)
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
    'centerX': cr.left - pr.left + cr.width/2,
    'centerY': cr.top - pr.top + cr.height/2,
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
  callbacks.move = dragMe.dataset.dragOnmove;
  callbacks.click = dragMe.dataset.dragOnclick;
  callbacks.end = dragMe.dataset.dragOndrop;

  let inside = false;

  let mouseOff = {left: 0, top: 0, right: 0, bottom: 0};

  let dragged = null;
  let boundTo = EL.body;

  const svgLines = EL.drawlines;

  if (dragMe.dataset.dragBind) {
    boundTo = get(dragMe.dataset.dragBind);
  }
  let bounds = EL.body.getBoundingClientRect();

  function moveIt(el, boundary) {
    newX = (MOUSE.pos.x - mouseOff.left);
    newY = (MOUSE.pos.y - mouseOff.top);

    if ((newX >= boundary.left) &&
        (newY >= boundary.top) &&
        (newX <= boundary.right) &&
        (newY <= boundary.bottom)) {
      inside = true;
    }

    if (inside) {
      if (newX < boundary.left) newX = boundary.left;
      if (newY < boundary.top) newY = boundary.top;
      if (newX > boundary.right) newX = boundary.right;
      if (newY > boundary.bottom) newY = boundary.bottom;
    }

    el.style.top = newY + 'px';
    el.style.left = newX + 'px';

    return {x: newX, y: newY};
  }

  if (dragMe.dataset.dragTarget === '!float') {
    targetElements = null;
  } else if (dragMe.dataset.dragTarget) {
    targetElements = getAll(dragMe.dataset.dragTarget);
  }

  function cleanUp() {
    dragMe.style.visibility = 'inherit';
    EL.drawlines.innerHTML = '';
    removeElement(dragged);
    dragged = null;
  }

  const actions = {};

  let lineStart;

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

    if (method === 'point') {
      dragged = EL('div', {class: 'drag-pointer'}, "( )");
      dragged.innerHTML = "&bull;";
      appendChildren(EL.floats, dragged);
      const pointerRect = dragged.getBoundingClientRect();
      mouseOff = {
        left: pointerRect.width/2,
        top: pointerRect.height/2,
        right: -pointerRect.width/2,
        bottom: -pointerRect.height/2,
      };
      lineStart = getRelativePosition(dragMe, svgLines);
    } else if (method === 'trigger-image') {
      dragged = safeCloneNode(get('img', dragMe));
      dragged.classList.add('drag-image');
      appendChildren(EL.floats, dragged);
      const pointerRect = dragged.getBoundingClientRect();
      mouseOff = {
        left: pointerRect.width/2,
        top: pointerRect.height/2,
        right: -pointerRect.width/2,
        bottom: -pointerRect.height/2,
      };
      lineStart = getRelativePosition(dragMe, svgLines);
    } else {
      dragged = safeCloneNode(dragMe);
      appendChildren(EL.floats, dragged);
    }

    // Tweak bounds for mouse offset relative to parent. Optimizing for
    // boundary checks.
    bounds.left = bounds.left + mouseOff.left;
    bounds.top = bounds.top + mouseOff.top;
    bounds.bottom = bounds.bottom - mouseOff.bottom;
    bounds.right = bounds.right - mouseOff.right;

    if (method === 'move' || method === 'reposition') {
      dragMe.style.visibility = 'hidden';
    }

    dragged.style.visibility = 'visible';
    dragged.style.display = 'block';
    dragged.style.position = 'absolute';

    moveIt(dragged, bounds);

    trigger(callbacks.start, dragMe, MOUSE.pos);
  };

  actions.move = function(evt) {
    if (!dragged) return;

    moveIt(dragged, bounds);

    if (method === 'point' || method === 'trigger-image') {
      const flowchart = EL.flowchart;
      const flowchartBox = flowchart.getBoundingClientRect();

      lineStart = getRelativePosition(flowchart, dragMe);
      const objPos = getRelativePosition(flowchart, dragged);

      svgLines.style.width = flowchartBox.width;
      svgLines.style.height = flowchartBox.height;

      svgLines.innerHTML = '';
      const line = EL('line', {
        x1: lineStart.centerX,
        y1: lineStart.centerY,
        x2: objPos.centerX,
        y2: objPos.centerY,
        stroke: 'black',
      });
      svgLines.append(line);
      // This works to switch the namespaces of the element ... *facepalm*
      svgLines.innerHTML = svgLines.innerHTML;
    }

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

    if (!inside) {
      cleanUp();
      return;
    }

    let fixedPos;
    fixedPos = moveIt(dragged, bounds);

    if (method === 'move') {
      const parentBounds = dragMe.parentElement.getBoundingClientRect();
      dragMe.style.left = (fixedPos.x - parentBounds.left) + 'px';
      dragMe.style.top = (fixedPos.y - parentBounds.top) + 'px';
    } else if (method === 'reposition') {
      moveIt(dragMe, bounds);
    }

    bounds = boundTo.getBoundingClientRect();

    const relativePos = {
      x: fixedPos.x - bounds.left,
      y: fixedPos.y - bounds.top,
    };

    let droppedOn = document.elementsFromPoint(MOUSE.pos.x, MOUSE.pos.y);
    if (dragMe.dataset.dragDropOn) {
      droppedOn = listElementsMatching(droppedOn, dragMe.dataset.dragDropOn);
    }

    if (dragMe.dataset.dropOk) {
      const sel = dragMe.dataset.dropOk + '[data-drop]';
      let dropElements = listElementsMatching(droppedOn, sel);
      for (const element of dropElements) {
        trigger(element.dataset.drop, dragMe, evt, fixedPos, droppedOn, relativePos);
      }
    }

    if (droppedOn && droppedOn.length > 0) {
      trigger(callbacks.end, dragMe, evt, MOUSE.pos, droppedOn, relativePos);
    }
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
addInitializer('dragndrop', function() {
  // Override all non-button mouse actions 
  document.onmouseleave = endMouseAction;
  document.onmouseup   = endMouseAction;
  document.onmousemove = moveMouseAction;
});
