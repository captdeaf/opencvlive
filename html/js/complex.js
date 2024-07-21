// complex.js
//
// UI and more management for the 'complex' boxes: Edit json arrays, etc.
//

var JSEditor;

addInitializer(() => {
  JSEditor = new JSONEditor(EL.editor, {
    mode: 'code',
    format: 'compact',
  });

  // Which node is currently editing its code?
  JSEditor.editing = undefined;

  JSEditor.edit = function(el) {
    JSEditor.set(el.blockData.code);
  };

  JSEditor.save = function(el) {
    el.blockData.code = JSEditor.get();
    saveChart();
  };
});

// Add an event for whenever something else needs us to redraw the lines.
// e.g: window resize or drag+drop move.
addTrigger('editElementJSON', (el) => {
  const pel = findParent(el, '[data-type]');
  if (JSEditor.editing === pel.blockData) {
    EL.editDialog.style.display = 'block';
    return;
  }
  function startEditing() {
    JSEditor.editing = pel.blockData;
    JSEditor.set(pel.blockData.json);
    EL.editDialog.style.display = 'block';
  }
  if (JSEditor.editing !== undefined) {
    JSEditor.editing = undefined;
    JSEditor.set('');
    EL.editor.style.display = 'none';
    setTimeout(() => {
      startEditing();
    }, 300);
  } else {
    startEditing();
  }
});

addTrigger('saveEditor', () => {
  JSEditor.editing.json = JSEditor.get();
  saveChart();
  JSEditor.editing = undefined;
  EL.editDialog.style.display = 'none';
});

addTrigger('stopEditor', () => {
  JSEditor.editing = undefined;
  JSEditor.set('');
  EL.editDialog.style.display = 'none';
});
