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
  if (!par) {
    par = document;
  } else if (identifier === 'document') {
    return document;
  } else {
    if (par.matches(identifier)) return par;
  }
  const result = par.querySelector(identifier);
  if (!result) {
    throw(identifier);
  }
  return result;
}

// QoL: getAll(selector, parent=document)
function getAll(identifier, par) {
  if (!par) par = document;
  return [...par.querySelectorAll(identifier)];
}

// Storage: getSaved and setSaved: For local storage. Good for remembering UI
//          toggles and the like.
function getSaved(name, otherwise) {
  const val = localStorage.getItem(name);
  if (val === null) {
    localStorage.setItem(name, JSON.stringify(otherwise));
    return otherwise;
  }
  return JSON.parse(val);
}

function setSaved(name, val) {
  localStorage.setItem(name, JSON.stringify(val));
  return val;
}

// DOM/QoL: Add attributes quickly.
function addAttrs(el, attrs) {
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

// DOM: Make elements. EL('div', EL('span', "Text here"));
function EL(name, attrs, ...children) {
  const ret = document.createElement(name);
  if (attrs) {
    if (typeof(attrs) === 'string' || attrs.append) {
      children.unshift(attrs);
    } else {
      addAttrs(ret, attrs);
    }
  }
  if (children && children.length > 0) {
    appendChildren(ret, children);
  }
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

  if (obj instanceof HTMLElement) return false;

  return typeof(obj[Symbol.iterator]) === 'function';
}

// DOM: Populate an element w/ children, but accepting more types of 'children'
function appendChildren(el, children) {
  if (!children) return;
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
  appendChildren(p, children);
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

// Given a list of elements (e.g: from elementsFromPoint), return those
// of a given selector.
function listElementsMatching(elements, selector) {
  elements = [...elements];
  const ret = [];

  for (const element of elements) {
    if (element.matches(selector)) {
      ret.push(element);
    }
  }
  return ret;
}

// DOM/QoL: Mostly for templates, but has other uses: Modifies a passed Element
//          to populate items matching a selector with new contents.
function populateElement(tpl, contents) {
  for (const [sel, children] of Object.entries(contents)) {
    if (children) {
      const pars = getAll(sel, tpl);
      if (!pars || pars.length === 0) {
        alertUser("populateElement: Selector not found", sel);
      } else {
        for (const par of pars) {
          appendChildren(par, children);
        }
      }
    }
  }
  return tpl;
}


// DOM/QoL: Templates embedded in the HTML, most likely beneath an invisible
//          <div>. Clones the elements of <div id="template-(name)">.
//          contents is an object of "selector": children. to add.
TEMPLATE_CACHE = {};
function template(tplname, contents) {
  if (!TEMPLATE_CACHE[tplname]) {
    TEMPLATE_CACHE[tplname] = get('#template-' + tplname);
  }
  const tpl = TEMPLATE_CACHE[tplname].cloneNode(true);
  if (contents) {
    if (typeof(contents) !== 'function') {
      populateElement(tpl, contents);
    } else {
      contents(tpl);
    }
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

let FETCH_COUNT = 0;
// A fetcher with callback style I prefer.
async function easyFetch(path, opts, cbs) {
  if (cbs === undefined) cbs = {};
  // Request
  FETCH_COUNT += 1;
  let request = fetch(path, opts);
  if (cbs.request) cbs.request(request);

  // Response
  let resp = await(request);
  if (cbs.response) cbs.response(resp);

  // Status-based
  if (resp.status === 200) {
    let js = await resp.json();
    if (cbs.success) cbs.success(js);
  } else {
    let text = await resp.text();
    if (cbs.fail) cbs.fail(resp, text);
  }

  FETCH_COUNT -= 1;

  // Complete
  if (cbs.complete) { cbs.complete(resp); }
}

function deepCopy(obj) {
  return structuredClone(obj);
}

async function sha256(source) {
  // From Yoz on stackoverflow
  const sourceBytes = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest("SHA-256", sourceBytes);
  const resultBytes = [...new Uint8Array(digest)];
  return resultBytes.map(x => x.toString(16).padStart(2, '0')).join("");
}
