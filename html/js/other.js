// other.js
//
/////////////////////////////////////
//
// Miscellaneous calls that don't really fit elsewhere.
//
/////////////////////////////////////

// Update the cache size in the UI, this expects an integer
function updateCacheSize(count) {
  EL.cacheCount.innerText = count;
}

addTrigger('clearCache', () => {
  easyFetch('/cv/clearCache', {method: 'POST'}, {
    json: true,
    success: (js) => {
      updateCacheSize(js.cachesize);
    }
  });
});

addInitializer('jschart editor', () => {
  const JSChartEditor = new JSONEditor(EL.chartEditor, {
    mode: 'code',
    indentation: 2,
  });

  addTrigger("editChartJSON", () => {
    JSChartEditor.set(CHART);
    EL.chartDialog.style.display = 'block';
  });

  addTrigger('saveChartEditor', () => {
      const json = JSChartEditor.get();
      if (JSON.parse(JSON.stringify(json))) {
        RAWCHART = json;
        cleanupSources(RAWCHART);
        CHART = nestedProxy(RAWCHART);
        saveChart();
        loadChart();
        EL.chartDialog.style.display = 'none';
      }
  });

  addTrigger('wipeChartEditor', () => {
    const chart = deepCopy(CHART_EMPTY);
    chart.uuid = makeUUID();
    JSChartEditor.set(chart);
  });

  addTrigger('cancelChartEditor', () => {
    EL.chartDialog.style.display = 'none';
  });
});

// View the JS for the page without images. For sharing.
addTrigger("viewImagelessJSON", () => {
  const copy = deepCopy(CHART);
  /*
  for (const [uuid, block] of Object.entries(copy.blocks)) {
    if (block.effectName === 'useImage') {
      delete copy.blocks[uuid];
    }
  }
  */
  showJSONFloater("Chart JSON without images", copy);
});

function showJSONFloater(name, json) {
  showFloater(name, 'json-viewer', (el) => {
    const jsonviewer = get('.jsonviewer', el);
    const jveditor = new JSONEditor(jsonviewer, {
      mode: 'code',
      indentation: 2,
      mainMenuBar: false,
      navigationBar: false,
      onEditable: () => false,
    });
    jveditor.set(json);
  });
}
