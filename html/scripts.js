// scripts.js
//
// UI management and server interaction for OpenCVLive
//
// Using highlight.js for the python code.

function resetMain() {
  templateReplace(get('#main'), 'main');
}

async function easyFetch(path, opts, cbs) {
  let promise = fetch(path, opts);
  promise = promise.then((resp) => resp.json())
  if (cbs.complete)
    promise = promise.then(cbs.complete);

  await promise;
}

async function uploadAsync(path, formData, cb) {
  let promise = fetch(path, {
    method: "POST",
    body: formData
  });
  if (cb)
    promise = promise.then(cb);

  await promise;
}

addTrigger('submitUpload', function(el, evt) {
  let form = findParent(el, '[data-upload]')
  if (!form) return;

  let formData = new FormData();
  const allInputs = form.querySelectorAll('input');

  let hasFile = false;

  for (const input of allInputs) {
    if (input.type == 'file') {
      for (const file of input.files) {
        hasFile = true;
        formData.append("file", file);
      }
    } else {
      formData.append(input.name, input.value)
    }
  }

  if (!hasFile) {
    alertUser("No file provided?");
    return;
  }

  uploadAsync(form.dataset.upload, formData, () => {
    deleteParent(form);
  });
});

function rebuildLibrary(paths) {
  const library = get('#library');
  console.log(paths);
  for (const path of paths) {
    const pane = template('library-image', (tpl) => {
      const img = get('img', tpl);
      const span = get('span', tpl);

      img.src = path;
      span.innerText = basename(path);
    });
    appendChildren(library, pane);
  }
}

function refreshLibrary() {
  easyFetch("/uploads", {}, {
    complete: (resp) => {
      rebuildLibrary(resp);
    }
  });
}

addTrigger('showUploadDialog', (el, evt) => {
  showFloater('Upload an Image', 'upload');
});

addInitializer(() => {
  resetMain();
  refreshLibrary();
});
