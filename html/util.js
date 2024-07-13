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
  setupClicks(tpl);
  return tpl.children;
}

function templateReplace(el, tplname, contents) {
  const eltpl = template(tplname, contents);
  el.innerHTML = '';
  appendChildren(el, eltpl);
  return el;
}

function showFloater(name, body, foot) {
  const floater = template('floater', {
    '.name': name,
    '.body': body,
    '.foot': foot,
  });

  appendChildren(get('#floats'), floater);
}

const ON_CLICKS = {};

function addOnClick(name, func) {
  ON_CLICKS[name] = func;
}

function setupClicks(el) {
  // Add onclick events to all elements with data-click.
  const all = el.querySelectorAll('[data-click]');
  for (const clicky of all) {
    if (clicky.dataset.click && clicky.dataset.click !== '') {
      clicky.onclick = function(evt) {
        ON_CLICKS[clicky.dataset.click](clicky, evt);
      }
    }
  }
  return el;
}

// Basic click functionality
addOnClick('deleteparent', (el, evt) => {
  while (el && el.dataset.delete !== 'true') {
    el = el.parentElement;
  }
  if (el) {
    el.parentElement.removeChild(el);
  }
});

addOnClick('closeparent', (el, evt) => {
  while (el && el.dataset.close !== 'true') {
    el = el.parentElement;
  }
  if (el) {
    el.style.display = 'none';
  }
});

addOnClick('closeme', (el, evt) => {
  el.style.display = 'none';
});

addOnClick('uploadImage', (el, evt) => {
  alertUser(
    "Okay let's talk about uploading images.",
    "Whaddaya wanna do?",
    "Multiline?"
  );
});
