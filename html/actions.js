// actions.js
//
// Helper functions for OpenCVLive that aid actions for various UI elements.

function pauseEvent(e){
    if(e.stopPropagation) e.stopPropagation();
    if(e.preventDefault) e.preventDefault();
    e.cancelBubble=true;
    e.returnValue=false;
    return false;
}

// Current mouse action
let MOUSE = {
  actions: {},
  target: null,
  pos: {'x': 0, 'y': 0},
  time: new Date().getTime(),
};

const MOUSE_TIMEOUT = 200;

function isMouseOkay() {
  return ((new Date().getTime()) - MOUSE.time) > MOUSE_TIMEOUT;
}

function startMouseAction(evt, actions) {
  if (evt.which != 1) return;
  MOUSE.actions = actions;
  MOUSE.target = evt.target;
  MOUSE.time = new Date().getTime();
  MOUSE.pos = getMousePos(evt);
  if (actions.begin) {
    actions.begin();
  }
  if (actions.start) {
    setTimeout(actions.start, MOUSE_TIMEOUT);
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
    MOUSE.actions.end();
  }
  MOUSE = {};
  if (evt) {
    return pauseEvent(evt);
  }
}

function addMouseDrag(element) {
  // We're dealing with two elements here:
  // class=drag-me - the whole thing that's dragged.
  // class=drag-start - The element that's clickable.
  // They may be the same.
  //
  // addMouseDrag() is called on the dragged element.
  
  const callbacks = {};

  callbacks.start = element.dataset['drag-start'];
  callbacks.move = element.dataset['drag-move'];
  callbacks.end = element.dataset['drag-drop'];

  const origStyle = Object.assign({}, element.style);

  const actions = {};

  let xStart = 0;
  let yStart = 0;

  let xOffset = 0;
  let yOffset = 0;
  let dragged = null;

  let isClone = true;

  if (element.dataset.drag === 'move') {
    isClone = false;
    dragged = element;
  }

  actions.begin = function() {
    xStart = MOUSE.pos.x;
    yStart = MOUSE.pos.y;

    const cur = element.getBoundingClientRect();

    xOffset = cur.left;
    yOffset = cur.top;
  };

  actions.start = function() {
    if (isClone) {
      dragged = element.cloneNode(true);
      appendChildren(get('#floats'), dragged);
    } else {
      dragged = element;
    }

    dragged.style.display = 'block';
    dragged.style.position = 'fixed';

    trigger(callbacks.start, element, MOUSE.pos);
  };

  actions.move = function(evt) {

    let xTarget = (MOUSE.pos.x - xStart) + xOffset;
    let yTarget = (MOUSE.pos.y - yStart) + yOffset;
    dragged.style['left'] = xTarget + "px";
    dragged.style['top'] = yTarget + "px";

    trigger(callbacks.move, element, MOUSE.pos);
  };

  actions.end = function(evt) {
    if (isClone) {
      dragged.parentElement.removeChild(dragged);
    }

    trigger(callbacks.end, element, MOUSE.pos);
  };

  let starters = [];
  if (element.classList.contains('drag-start')) {
    starters = [element];
  } else {
    starters = element.querySelectorAll('.drag-start');
  }

  for (starter of Object.values(starters)) {
    starter.onmousedown = (evt) => startMouseAction(evt, actions)
  }
}

function setupActions(el) {
  // Add onclick events to all elements with data-click.
  const all = el.querySelectorAll('[data-click]');
  for (const clicky of all) {
    if (clicky.dataset.click && clicky.dataset.click !== '') {
      clicky.onclick = function(evt) {
        trigger(clicky.dataset.click, clicky, evt);
      }
    }
  }

  // mouse-move actions.
  document.onmouseleave  = function() {
    endMouseAction();
  };
  document.onmouseup   = endMouseAction;
  document.onmousemove = moveMouseAction;

  // Draggable divs.
  const draggables = el.querySelectorAll('.drag-me');
  if (draggables) {
    for (const drag of draggables) {
      addMouseDrag(drag);
    }
  }

  return el;
}
