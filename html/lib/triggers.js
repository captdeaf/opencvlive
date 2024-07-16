// triggers.js
//
/////////////////////////////////////
//
// We use a 'trigger' system. <el data-onclick="triggercmd"> will have its
// onclick bound when enableTriggers(toplevel) is called.
//
// On page load: enableTriggers(document);
// New Div created: enableTriggers(EL('div', ...));
// Templates from utils.py automatically have enableTriggers() called.
//
// enableTriggers(element) returns the element, for convenience.
//
//     Default bindings will be data- based, such as data-onclick,
//     data-onchange, data-onblur, etc. If I'm missing any, add it to
//     the 'ALL_EVENTS' list below. Read comments below this section
//     for more info.
//
// To create triggers:
//
//     addTrigger(name, (el, evt, ...) => {...})
//
// To call triggers:
//
//     Directly: trigger(name, ...args)
//
//     Create a callback:
//         lazyTrigger(name, ...lazyargs)
//
// Try and maintain a consistent trigger call syntax. First argument being the
// element triggering it. 2nd is usually the event (evt) from the browser. The
// rest are trigger dependent. This is the case with automatic data-on* binds.
//
// Triggers may receive specific arguments, trigger('name', ...)
//
// lazyTrigger('name', ...) returns a function that will itself call
// trigger when called. Intended for use as a callback generator, it will
// combine both its arguments (el) and the callback's.
//
// Other JS files may call:
//
//     addTriggerFunction(selector, (el) => { ... });
//
//         For more complex binds, this calls a function on every element that
//         matches the given selector.
//
//         e.g: addTriggerFunction('[data-drag]', addMouseDrag)
//
// triggers.js also offers initializing. Instead of every file adding its own
//     wait for page load:
//
//         addInitializer(() => { ... });
//
//     index.html's last <script> or an onload event should call:
//
//         runInitializers();
//
/////////////////////////////////////

const ALL_EVENTS = [
  "onclick",       // When the element is clicked
  "ondblclick",    // When the element is double-clicked
  "onmousedown",   // When the mouse button is pressed down on the element
  "onmouseup",     // When the mouse button is released over the element
  "onmouseover",   // When the mouse pointer is moved onto the element
  "onmousemove",   // When the mouse pointer is moved within the element
  "onmouseout",    // When the mouse pointer is moved out of the element
  "onmouseenter",  // When the mouse pointer enters the element
  "onmouseleave",  // When the mouse pointer leaves the element
  "onkeydown",     // When a key is pressed down
  "onkeypress",    // When a key is pressed and released (deprecated)
  "onkeyup",       // When a key is released
  "onblur",        // When the element loses focus
  "onfocus",       // When the element gains focus
  "onchange",      // When the value of an input element changes
  "oninput",       // When the value of an input element is inputted
  "onsubmit",      // When a form is submitted
  "onreset",       // When a form is reset
  "onselect",      // When text within an input or textarea is selected
  "oncontextmenu", // When the context menu is opened (usually right-click)
  "onload",        // When the element (e.g., an image) has finished loading
  // "onunload",      // When the page is unloaded
  "onresize",      // When the window or element is resized
  "onscroll"       // When the element is scrolled
];

/////////////////////////////////////
//

const TRIGGERS = {};

function addTrigger(name, func) {
  TRIGGERS[name] = func;
}

function trigger(name, ...args) {
  if (name) {
    if (name in TRIGGERS) {
      TRIGGERS[name](...args);
    } else {
      alertUser("Unknown Trigger:", name);
    }
  }
}

function lazyTrigger(name, ...lazyargs) {
  return (...args) => {
    return trigger(name, ...lazyargs, ...args);
  }
}

const MORE_ACTIONS = [];

function addTriggerFunction(selector, func) {
  MORE_ACTIONS.push({'selector': selector, 'func': func});
}

function enableTriggers(parentElement) {
  // Add onclick events to all elements with data-click.
  for (const evt of ALL_EVENTS) {
    for (const el of getAll('[data-' + evt + ']', parentElement)) {
      el[evt] = lazyTrigger(el.dataset[evt], el);
    }
  }

  for (const act of MORE_ACTIONS) {
    for (const el of getAll(act.selector, parentElement)) {
      act.func(el);
    }
  }

  return parentElement;
}

/////////////////////////////////////
//
// Straightforward: Initializers to call when everything is loaded.
//
/////////////////////////////////////

const INITIALIZERS = [];

function addInitializer(func) {
  INITIALIZERS.push(func);
}

function runInitializers() {
  for (const init of INITIALIZERS) {
    init();
  }
}
