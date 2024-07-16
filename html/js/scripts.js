// scripts.js
//
// UI management and server interaction for OpenCVLive
//
// Using highlight.js for the python code.

async function easyFetch(path, opts, cbs) {
  // Request
  let request = fetch(path, opts);
  if (cbs.request) cbs.request(request);

  // Response
  let resp = await(request);
  if (cbs.response) cbs.response(response);

  // Status-based
  if (resp.status === 200) {
    let js = await resp.json();
    if (cbs.success) cbs.success(js);
  } else {
    let text = await resp.text();
    if (cbs.fail) cbs.fail(resp, text);
  }

  // Complete
  if (cbs.complete) { cbs.complete(resp); }
}

function rebuildLibrary(paths) {
  const library = get('#library');
  library.innerHTML = '';

  function paneLoop(path) {
    const name = basename(path);
    const pane = template('library-image', (tpl) => {
      const img = get('img', tpl);
      const span = get('span', tpl);

      img.src = path;
      img.dataset.name = name;
      span.innerText = name;
    });
    pane.dataset.name = name;
    pane.dataset.path = path;
    appendChildren(library, pane);
  }
  for (const path of paths) {
    paneLoop(path);
  }
}

function refreshLibrary() {
  easyFetch("/uploads", {}, {
    success: (resp) => {
      rebuildLibrary(resp);
    },
  });
}

// Show the upload dialog, and reset it as a form (clear inputs)
// Also clear its file state listing.
addTrigger('showUploadDialog', (el, evt) => {
  const uploadDiv = get('#upload-dialog');

  const allInputs = uploadDiv.querySelectorAll('input');
  allInputs[0].form.reset();

  for (const input of allInputs) {
    input.disabled = false;
  }

  uploadDiv.style.display = 'block';

  get('#upload-list', uploadDiv).innerHTML = '';
});

addTrigger('fileDialogChange', (el, evt) => {
  const uploadDiv = findParent(el, '[data-upload]');
  if (!uploadDiv) return;

  const fileList = get('#upload-list', uploadDiv);
  const allFiles = [];

  const formData = new FormData();
  const allInputs = uploadDiv.querySelectorAll('input');

  for (const input of allInputs) {
    if (input.type == 'file') {
      const files = input.files;
      const fileCount = files.length;
      for (let i = 0; i < fileCount; i++) {
        allFiles.push(EL('li', files[i].name));
        formData.append("file", files[i]);
      }
    } else {
      formData.append(input.name, input.value);
    }
    input.disabled = true;
  }

  appendChildren(fileList, allFiles);

  easyFetch(uploadDiv.dataset.upload,
      {method: "POST", body: formData},
      {
        fail: (resp) => {
          alertUserBriefly(1300, "Upload failed...");
        },
        success: (resp) => {
          refreshLibrary();
        },
        complete: (resp) => {
          setTimeout(() => trigger('hide', uploadDiv), 500);
        }
      }
  );
});

addTrigger('showLargeChildImage', function(child) {
  const img = get('img', child);
  let name = child.dataset.name;
  if (!name) { name = img.dataset.name; }
  showFloater(name, 'large-image', (el) => {
    get('img', el).src = img.src;
  });
});

addTrigger('showLargeImage', function(img) {
  showFloater(img.dataset.name, 'large-image', (el) => {
    get('img', el).src = img.src;
  });
});

function buildEffectBlock(effect) {
  // TODO: Use a default if not found.
  const imagePath = 'samples/' + effect.name + '.png';

  const block = template('block-effect', (block) => {
    const img = get('img', block);
    img.src = imagePath;
    img.name = effect.name;
    get('span', block).innerText = effect.name;
  });

  block.dataset.name = effect.name;
  block.dataset.imagePath = imagePath;
  block.dataset.effectName = effect.name;
  block.effect = effect;

  return block;
}

var ALL_EFFECTS = null;

function refreshEffectBlocks() {
  easyFetch("/cv/effects.json",
    {method: "GET"},
    {
      success: (resp) => {
        ALL_EFFECTS = resp;
        const parentElement = get('#block-selection');
        parentElement.innerHTML = '';
        for (const effect of Object.values(resp.effects)) {
          appendChildren(parentElement, buildEffectBlock(effect));
        }
        // TODO: This is for DEBUG only.
        const blend = get('.item[data-name="blend"]')
        trigger("createEffectAt", blend, 1, 1, 1, {x: 30, y: 30});
      },
    }
  );
}

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
    img.src = imagePath;
    img.effect = effect.name;
    img.name = effect.name
  });

  return imgresult;
}

function newOpBlock(effect, imagePath) {
  const container = template('opblock', (tpl) => {
    get('.ophead', tpl).innerText = effect.name;
  });
  let fakeResult = newOpProcessed(effect, imagePath);
  appendChildren(get('.opmaster', container.parentElement), fakeResult);

  container.style.top = "20em";
  container.style.left = "20em";

  return container;
}

addTrigger("removeElement", (el) => {
  removeElement(el);
});

addTrigger("createEffectAt", function(effectElement, evt, fixedPos,
                                      parentElement, relativePos) {
  const effect = ALL_EFFECTS.effects[effectElement.dataset.effectName];
  const opsBlock = newOpBlock(effect, effectElement.dataset.imagePath);
  opsBlock.style.top = relativePos.y + 'px';
  opsBlock.style.left = relativePos.x + 'px';
  appendChildren(get('#flowchart'), opsBlock);
});

addInitializer(() => {
  refreshLibrary();
  refreshEffectBlocks();
});
