// scripts.js
//
// UI management and server interaction for OpenCVLive
//
// Using highlight.js for the python code.

function resetMain() {
  templateReplace(get('#main'), 'main');
}

function setupToolbox() {

}

function setupUI() {
  setupAbout();
  setupToolbox();
  setupClicks(get('body'));
  resetMain();

  showFloater("Let's roll");
}
