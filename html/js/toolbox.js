// toolbox.js
//
// UI management for left-side toolbox.

function rebuildLibrary(paths) {
  const library = EL.library;
  library.innerHTML = '';

  const children = [];
  const paneComplex = template('library-complex');
  children.push(paneComplex);

  for (const path of paths) {
    const name = basename(path);

    const img = EL('img', {src: path, 'data-name': name});

    const pane = EL('div',
      {
        'class': 'item drag-start',
        'title': path,
        'data-name': name,
        'data-path': path,
        'data-drag': 'trigger-image',
        'data-drag-bind': '#flowchart',
        'data-drag-ondrop': 'addImageAt',
        'data-drag-onclick': 'showLargeChildImage',
      },
      EL('span', {}, name),
      img,
    );
    children.push(pane);
  }

  appendChildren(library, children);
  enableTriggers(library);
}

function refreshLibrary() {
  easyFetch("/uploads", {}, {
    json: true,
    success: (resp) => {
      rebuildLibrary(resp);
    },
  });
}

// Show the upload dialog, and reset it as a form (clear inputs)
// Also clear its file state listing.
addTrigger('showUploadDialog', (el, evt) => {
  const allInputs = getAll('input', EL.upload);
  allInputs[0].form.reset();

  for (const input of allInputs) {
    input.disabled = false;
  }

  EL.upload.style.display = 'block';

  get('#upload-list', EL.upload).innerHTML = '';
});

addTrigger('fileDialogChange', (el, evt) => {
  const uploadDiv = getParent(el, '[data-upload]');
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

addTrigger('showLargeJSON', function(el) {
  const json = get('code', el).innerText;
  showJSONFloater("Raw Complex JSON", json);
});

addTrigger('showLargeChildImage', function(el) {
  const img = get('img', el);
  let name = el.dataset.name;
  if (!name) { name = img.dataset.name; }
  showFloater(name, 'large-image', (el) => {
    const large = get('img', el);
    large.src = img.src;
    large.dataset.uuid = img.dataset.uuid;
    large.dataset.idx = img.dataset.idx;
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

function refreshEffectBlocks() {
  const parentElement = EL.blockselection;
  parentElement.innerHTML = '';
  let sorted = Object.values(ALL_EFFECTS);
  sorted = sorted.sort(function(a, b) {
    return a.displayname.toLowerCase().localeCompare(b.displayname.toLowerCase());
  });
  const custom = [];
  const high = [];
  const normal = [];
  for (const effect of sorted) {
    if (effect.sort === 'custom') {
      custom.push(buildEffectBlock(effect));
    } else if (effect.sort === 'high') {
      high.push(buildEffectBlock(effect));
    } else if (effect.sort !== 'hidden') {
      normal.push(buildEffectBlock(effect));
    }
  }
  appendChildren(parentElement, custom);
  appendChildren(parentElement, high);
  appendChildren(parentElement, normal);
  enableTriggers(EL.blockselection);
}

addInitializer('toolbox', () => {
  refreshLibrary();
  refreshEffectBlocks();
});
