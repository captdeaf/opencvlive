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
  appendChildren(EL.flowchart, imBlock);
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
