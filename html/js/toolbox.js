// toolbox.js
//
// UI management for left-side toolbox.

function rebuildLibrary(paths) {
  const library = EL.library;
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
  const allInputs = EL.upload.querySelectorAll('input');
  allInputs[0].form.reset();

  for (const input of allInputs) {
    input.disabled = false;
  }

  uploadDiv.style.display = 'block';

  get('#upload-list', EL.upload).innerHTML = '';
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

addTrigger('showLargeChildImage', function(el) {
  const img = get('img', el);
  let name = el.dataset.name;
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
  const imagePath = 'samples/' + effect.name + '.png';

  const block = template('block-effect', (block) => {
    const img = get('img', block);
    img.src = imagePath;
    img.name = effect.name;
    get('span', block).innerText = effect.displayname;
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
        const parentElement = EL.blockselection;
        parentElement.innerHTML = '';
        let sorted = Object.values(resp.effects);
        sorted = sorted.sort(function(a, b) {
          return a.displayname.toLowerCase().localeCompare(b.displayname.toLowerCase());
        });
        const custom = [];
        const normal = [];
        for (const effect of sorted) {
          if (effect.sort === 'custom') {
            custom.push(buildEffectBlock(effect));
          } else {
            normal.push(buildEffectBlock(effect));
          }
        }
        appendChildren(parentElement, custom);
        appendChildren(parentElement, normal);
      },
    }
  );
}

addBoot(() => {
  refreshLibrary();
  refreshEffectBlocks();
});
