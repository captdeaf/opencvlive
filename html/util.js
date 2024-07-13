// util.js
//
// Helper functions for OpenCVLive that don't directly impact
// the UI or functionality.

function getAll(identifier) {
  return document.querySelectorAll(identifier);
}

function get(identifier) {
  return document.querySelector(identifier);
}

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

function EL(name, ...children) {
  const ret = document.createElement(name);
  appendChildren(ret, children)
  return ret;
}

function appendChildren(el, children) {
  // el.append(children) doesn't work if
  // children is an HTMLCollection. This works
  // regardless.
  if (children.append) {
    el.append(children);
  } else if (typeof(children) == 'string') {
    el.innerHTML += children;
  } else {
    for (const child of Object.values(children)) {
      appendChildren(el, child);
    }
  }
  return el;
}

function pauseEvent(e){
    if(e.stopPropagation) e.stopPropagation();
    if(e.preventDefault) e.preventDefault();
    e.cancelBubble=true;
    e.returnValue=false;
    return false;
}

function alertUser(...all) {
  const paras = [];
  const alerter = get('#user-alert');
  alerter.innerHTML = '';
  for (msgs of all) {
    if (msgs.join) {
      for (const msg of msgs) {
        appendChildren(alerter,
          EL('p', msg)
        );
      }
    } else {
      appendChildren(alerter,
        EL('p', msgs)
      );
    }
  }
  alerter.style.display = 'block';
}

function cloneElement(el) {
  // This version is a deep clone that also calls enableActions.
  const ret = el.cloneNode(true);
  enableActions(EL('div', ret));
  return ret;
}

function template(tplname, contents) {
  const origtpl = get('#' + tplname + '-template');
  const tpl = origtpl.cloneNode(true);
  if (contents) {
    for (const [sel, children] of Object.entries(contents)) {
      if (children) {
        const par = tpl.querySelector(sel);
        if (!par) {
          alertUser([
            "Unknown template selector.",
            "Template: " + tplname,
            "Selector: " + sel,
          ]);
        } else {
          appendChildren(par, children);
        }
      }
    }
  }
  enableActions(tpl);
  return tpl.children;
}

function templateReplace(el, tplname, contents) {
  const eltpl = template(tplname, contents);
  el.innerHTML = '';
  appendChildren(el, eltpl);
  return el;
}

function showFloater(title, bodytpl, children) {
  const body = template(bodytpl, children);
  const floater = template('floater', {
    '.name': title,
    '.body': body,
  });

  appendChildren(get('#floats'), floater);
}

function getParentWith(el, sel) {
  while (el) {
    if (el.matches(sel)) return el;
    el = el.parentElement;
  }
  alertUser("Unable to find parent with selector", sel);
  return undefined;
}

function closeFloaterFor(el) {
  el = getParentWith(el, '.floater');
  if (el) el.parentElement.removeChild(el);
}

function deleteParent(el) {
  el = getParentWith(el, '[data-delete]');
  if (el) el.parentElement.removeChild(el);
}

function elementContains(par, child) {
  let pr = par.getBoundingClientRect();
  let cr = child.getBoundingClientRect();

  if ((cr.top < pr.top) || (cr.bottom > pr.bottom) ||
      (cr.left < pr.left) || (cr.right > pr.right)) {
    return null;
  }
  return par;
}

function elementsContain(pars, child) {
  for (const par of pars) {
    const pr = elementContains(par, child);
    if (pr) return pr;
  }
  return null;
}

const INITIALIZERS = [];

function addInitializer(func) {
  INITIALIZERS.push(func);
}

function callInitializers() {
  for (const init of INITIALIZERS) {
    init();
  }
}
