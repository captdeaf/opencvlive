// complex.js
//
// UI and more management for the 'complex' boxes: Edit json arrays, etc.
//

addInitializer('complex editor', () => {
  const JSEditor = new JSONEditor(EL.editor, {
    mode: 'code',
    indentation: 2,
  });

  // Which node is currently editing its code?
  JSEditor.editing = undefined;

  JSEditor.edit = function(el) {
    JSEditor.set(el.param.value);
  };

  JSEditor.save = function(el) {
    el.param.value = JSEditor.get();
    saveChart();
  };

  addTrigger('editElementJSON', (el) => {
    const pel = findParent(el, '[data-name]');
    if (JSEditor.editing === pel.param) {
      EL.editDialog.style.display = 'block';
      return;
    }
    function startEditing() {
      get('#json-editing').innerText = pel.param.name;
      JSEditor.editing = pel.param;
      JSEditor.set(pel.param.value);
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
    JSEditor.editing.value = JSEditor.get();
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
