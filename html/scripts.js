// scripts.js
//
// UI management and server interaction for OpenCVLive
//
// Using highlight.js for the python code.

function resetMain() {
  templateReplace(get('#main'), 'main');
}

async function easyFetch(path, opts, cbs) {
  // Request
  let request = fetch(path, opts);
  if (cbs.request) cbs.request(request);

  // Response
  let resp = await(request)
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
  for (const path of paths) {
    const pane = template('library-image', (tpl) => {
      const img = get('img', tpl);
      const span = get('span', tpl);
      const name = basename(path);

      img.src = path;
      img.dataset.onclick = 'showLargeImage';
      img.dataset.displayName = name;
      span.innerText = name;
    });
    appendChildren(library, pane);
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

addTrigger('uploadFileChange', (el, evt) => {
  const uploadDiv = findParent(el, '[data-upload]')
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
      formData.append(input.name, input.value)
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
  )
});

addTrigger('showLargeImage', function(img) {
  showFloater(img.dataset.displayName, 'large-image', (el) => {
    get('img', el).src = img.src;
  });
})

addInitializer(() => {
  resetMain();
  refreshLibrary();
});
