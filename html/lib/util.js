// util.js
//
/////////////////////////////////////
//
// Utility functions
//
// Limited to DOM manipulation, QoL, Storage, Templates, etc.
//
// Ideally this should be transferrable between projects without a change.
// If a function doesn't, it'll be tagged NOCOMPAT
//
/////////////////////////////////////

// QoL: get(selector, parent=document)
function get(identifier, par) {
  if (!par) par = document
  return par.querySelector(identifier);
}

// QoL: getAll(selector, parent=document)
function getAll(identifier, par) {
  if (!par) par = document
  return [...par.querySelectorAll(identifier)];
}

// Storage: getSaved and setSaved: For local storage. Good for remembering UI
//          toggles and the like.
function getSaved(name, otherwise) {
  const val = localStorage.getItem(name);
  if (val === null) {
    localStorage.setItem(name, otherwise);
    return otherwise;
  }
  return val;
}

function setSaved(name, val) {
  localStorage.setItem(name, val);
  return val;
}

// DOM: Make elements. EL('div', EL('span', "Text here"));
function EL(name, ...children) {
  const ret = document.createElement(name);
  appendChildren(ret, children)
  return ret;
}

// QoL: is an object iterable? (for all the different collection types.)
function isSafeIterable(obj) {
  if ((obj == undefined) ||
      (obj == null)) {
    return false;
  }

  // Strings shouldn't be for us.
  if (['string'].includes(typeof(obj))) {
    return false;
  }

  return typeof(obj[Symbol.iterator]) === 'function';
}

// DOM: Populate an element w/ children, but accepting more types of 'children'
function appendChildren(el, children) {
  if (!isSafeIterable(children)) {
    children = [children];
  }
  let allChildren = [...children].flat();
  for (const child of Object.values(allChildren)) {
    if (child !== null) {
      el.append(child);
    }
  }
  return el;
}

// DOM/QoL: cloneElement is a deep clone that also calls enableTriggers.
function cloneElement(el) {
  const ret = el.cloneNode(true);
  // NOCOMPAT: Enable trigger actions on children of this element.
  enableTriggers(EL('div', ret));
  return ret;
}

// DOM/QoL: Remove an element from its parent.
function removeElement(el) {
  if (el.parentElement) {
    el.parentElement.removeChild(el);
  }
}

// DOM/QoL: Replace an element within its parent. Order not kept.
//          Uses appendChildren for flexibility.
function replaceElement(el, children) {
  const p = el.parentElement;
  p.remove(el);
  appendChildren(p, children)
}

// DOM: traverse upwards the parent tree from an element until you get an element
//      matching a selector. If element matches it, it will be returned.
function findParent(el, sel) {
  while (el) {
    if (el.matches(sel)) return el;
    el = el.parentElement;
  }
  alertUser("Unable to find parent with selector", sel);
  return undefined;
}

// DOM/QoL: Templates embedded in the HTML, most likely beneath an invisible
//          <div>. Clones the elements of <div id="template-(name)">.
//          contents is an object of "selector": children. to add.
function template(tplname, contents) {
  const origtpl = get('#template-' + tplname);
  const tpl = origtpl.cloneNode(true);
  if (typeof(contents) === 'object') {
    for (const [sel, children] of Object.entries(contents)) {
      if (children) {
        const pars = getAll(sel, tpl);
        for (const par of pars) {
          appendChildren(par, children);
        }
      }
    }
  } else if (typeof(contents) === 'function') {
    contents(tpl);
  }

  // NOCOMPAT: Enable trigger actions on children of this element.
  enableTriggers(tpl);
  if (tpl.children.length === 1) {
    return tpl.firstElementChild;
  } else {
    return tpl.children;
  }
}

// DOM/QoL: Shortcut: Like template(), but replace el's contents with it.
function templateReplace(el, tplname, contents) {
  const eltpl = template(tplname, contents);
  el.innerHTML = '';
  appendChildren(el, eltpl);
  return el;
}

// QoL: basename("path/to/foo.img") -> "foo"
function basename(path) {
  const m = path.match(/([^\./]+)\.(\w+)?/);
  if (m) return m[1];
  return path;
}

// QoL: Cross-browser 'break out of this event stack'
function pauseEvent(e){
    if(e.stopPropagation) e.stopPropagation();
    if(e.preventDefault) e.preventDefault();
    e.cancelBubble=true;
    e.returnValue=false;
    return false;
}

// QoL: Used for callbacks. maybeCall(callbacks.foo, args)
function maybeCall(func, ...args) {
  if (func) {
    func(...args);
  }
}
