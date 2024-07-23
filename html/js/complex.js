// complex.js
//
// UI and more management for the 'complex' boxes: Edit json arrays, etc.
//

addInitializer(() => {
  const JSEditor = new JSONEditor(EL.editor, {
    mode: 'code',
    indentation: 2,
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

  addTrigger('editElementJSON', (el) => {
    const pel = findParent(el, '[data-type]');
    if (JSEditor.editing === pel.blockData) {
      EL.editDialog.style.display = 'block';
      return;
    }
    function startEditing() {
      get('#json-editing').innerText = pel.blockData.name;
      JSEditor.editing = pel.blockData;
      JSEditor.set(pel.blockData.json);
      EL.editDialog.style.display = 'block';
    }
    if (JSEditor.editing !== undefined) {
      JSEditor.editing = undefined;
      JSEditor.set('');
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
    refreshOutputs();
    JSEditor.editing = undefined;
    EL.editDialog.style.display = 'none';
  });

  addTrigger('cancelEditor', () => {
    JSEditor.editing = undefined;
    JSEditor.set('');
    EL.editDialog.style.display = 'none';
  });
});
