// flowchart.js
//
// UI management for the boxes in the center pane.

function newImageBlock(imageName, imagePath) {
  const container = template('imblock', (tpl) => {
    get('.ophead', tpl).innerText = imageName;
    get('img', tpl).src = imagePath;
    get('img', tpl).name = imageName;
  });

  container.style.top = "10em";
  container.style.left = "20em";

  return container;
}

addTrigger("addImageAt", function(libraryElement, evt, fixedPos,
                                  parentElement, relativePos) {
  const imageName = libraryElement.dataset.name;
  const imagePath = libraryElement.dataset.path;

  const imBlock = newImageBlock(imageName, imagePath);
  imBlock.style.top = relativePos.y + 'px';
  imBlock.style.left = relativePos.x + 'px';
  appendChildren(get('#flowchart'), imBlock);
});

function newOpProcessed(effect, imagePath) {
  const imgresult = template('opprocessedimage', (tpl) => {
    const img = get('img', tpl);
    get('.ophead', tpl).innerText = effect.name;
    img.src = imagePath;
    img.effect = effect.name;
    img.name = effect.name
  });

  return imgresult;
}

const alltests = [
  ["This is a test"],
  ["Emergency, there is an emergency going on.", "Emergency."],
  ["Willy wonka says hello"],
  ["This is big", "Like, really big", "Can you do more?", "Please?", "This is big", "Like, really big", "Can you do more?", "Please?"],
];

function newOpBlock(effect, imagePath) {
  const container = template('opblock', (tpl) => {
    get('.ophead', tpl).innerText = effect.name;
    get('.opslisting', tpl).innerHTML = alltests.pop().join("<br/>");
  });
  let fakeResult = newOpProcessed(effect, imagePath);
  appendChildren(get('.opmaster', container.parentElement), fakeResult);

  container.style.top = "20em";
  container.style.left = "20em";

  return container;
}

addTrigger("createEffectAt", function(effectElement, evt, fixedPos,
                                      parentElement, relativePos) {
  const effect = ALL_EFFECTS.effects[effectElement.dataset.effectName];
  const opsBlock = newOpBlock(effect, effectElement.dataset.imagePath);
  opsBlock.style.top = relativePos.y + 'px';
  opsBlock.style.left = relativePos.x + 'px';
  appendChildren(get('#flowchart'), opsBlock);
});
