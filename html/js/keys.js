// keys.js
//
/////////////////////////////////////
//
// Keybindings:
//
//     esc: Close latest floater.
//
/////////////////////////////////////

function bindKeys() {
  window.addEventListener('keydown', (evt) => {
    if (evt.keyCode === 27) {
      if (flushFloater()) {
        return pauseEvent(evt);
      }
    }
  });
}

function flushFloater() {
  const floats = EL.floats;
  const kid = floats.lastChild;
  if (kid && kid.append) {
    removeElement(kid);
    return true;
  }
  return false;
}

addInitializer(bindKeys);
