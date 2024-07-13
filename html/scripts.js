// scripts.js
//
// UI management and server interaction for OpenCVLive
//
// Using highlight.js for the python code.

function resetMain() {
  templateReplace(get('#main'), 'main');
}

async function uploadAsync(path, formData, cb) {
  await fetch(path, {
    method: "POST",
    body: formData
  });
  if (cb) {
    cb();
  }
}

addTrigger('submitUpload', function(el, evt) {
  let form = getParentWith(el, '[data-upload]')
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

addTrigger('showUploadDialog', function(el, evt) {
  showFloater('Upload an Image', 'upload');
});

function setupUI() {
  callInitializers();
  resetMain();
}
