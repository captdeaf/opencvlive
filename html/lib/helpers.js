// helpers.js
//
/////////////////////////////////////
//
// Simplest helpers, not tied to any specific feature. Alert dialog, floating
// windows, container checks, etc.
//
/////////////////////////////////////

// A bit better or worse than vanilla alert() ... Multiple args get their own
// lines.
function alertUser(...all) {
  const paras = [];
  const alertDialog = showFloater('Alert', 'user-alert', function(alerter) {
    for (msgs of Object.values(all)) {
      appendChildren(alerter,
        EL('p', msgs)
      );
    }
  });
  return alertDialog;
}

function alertUserBriefly(time, ...all) {
  const alerter = alertUser(...all);

  setTimeout(() => alerter.style.display = 'none', time);
}

/////////////////////////////////////
//
// Floaters: dialog windows, closable.
//
/////////////////////////////////////

// Pop one up with a standard template.
function showFloater(title, bodytpl, contents) {
  const body = template(bodytpl, contents);
  const floater = template('floater', {
    '.name': title,
    '.body': body,
  });

  appendChildren(get('#floats'), floater);
  return floater;
}

/////////////////////////////////////
//
// Helper functions.
//
/////////////////////////////////////

// Given a list of 'box' elements, if the child element is entirely contained
// within any of them, return that containing element.
function containingElement(boxes, child) {
  let cr = child.getBoundingClientRect();
  for (const box of Object.values(boxes)) {
    const br = box.getBoundingClientRect();

    if ((cr.top < br.top) || (cr.bottom > br.bottom) ||
        (cr.left < br.left) || (cr.right > br.right)) {
      continue;
    }
    return box;
  }
  return null;
}
