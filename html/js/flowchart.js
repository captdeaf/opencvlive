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

function newOpNode(opuuid, imagePath) {
  const imgresult = template('opprocessedimage', (tpl) => {
    const img = get('img', tpl);
    get('.ophead', tpl).innerText = effect.name;
    img.src = imagePath;
    img.effect = effect.name;
    img.name = effect.name
  });

  return imgresult;
}

function getOpListing(opargs) {
  if (!opargs || Object.keys(opargs).length == 0) {
    return [EL('p', "No parameters")];
  }
  const children = [];
  for (const [k, v] of Object.entries(opargs)) {
    children.push(EL('p', {}, k));
  }
  return children;
}

function newOpBlock(uuid, opdesc) {
  const effect = ALL_EFFECTS.effects[opdesc.effect];
  const oplisting = getOpListing(opdesc.args);
  const container = template('opblock', {
    '.ophead': opdesc.name,
    '.oplisting': oplisting,
  });

  console.log(opdesc);

  container.style.top = opdesc.position.top + 'px';
  container.style.left = opdesc.position.left + 'px';

  return container;
}

addTrigger("createEffectAt", function(effectElement, evt, fixedPos,
                                      parentElement, relativePos) {
  return;
  // const effect = ALL_EFFECTS.effects[effectElement.dataset.effectName];
  // const opsBlock = newOpBlock(effect, effectElement.dataset.imagePath);
  // opsBlock.style.top = relativePos.y + 'px';
  // opsBlock.style.left = relativePos.x + 'px';
  // appendChildren(get('#flowchart'), opsBlock);
});
