// charts.js
//
// Managing charts - multiple charts, save, load, view raw, etc.
//
////////////////////////////////////

const SAVEKEYS = ENUM("SAVEKEYS", {
  chart: 'chartkey',
  selected: 'chartselected',
});

const CHART_EMPTY = {
  blocks: {},
  name: 'New Chart',
};

let RAWCHART;
let CHART;

function newChart(name) {
  const ret = {
    blocks: {},
    name: name,
    uuid: makeUUID(),
  };
  return ret;
}

function setChart(chart) {
  RAWCHART = chart;
  setSaved(SAVEKEYS.chart, chart);
  loadChart();
}

function saveChart() {
  setSaved(SAVEKEYS.chart, RAWCHART);
}

function loadChart() {
  RAWCHART = getSaved(SAVEKEYS.chart);
  if (!RAWCHART) {
    RAWCHART = deepCopy(CHART_EMPTY);
    setSaved(SAVEKEYS.chart, RAWCHART);
  }
  if (!('blocks' in RAWCHART)) {
    RAWCHART.blocks = {};
    setSaved(SAVEKEYS.chart, RAWCHART);
  }
  CHART = nestedProxy(RAWCHART);
  redrawChart();
}

function redrawChart() {
  EL.flowchart.innerHTML = '';
  for (const blockjs of Object.values(CHART.blocks)) {
    loadBlock(blockjs);
  }
  refreshOutputs();
}

addInitializer('charts', () => {
  loadChart();
}, 100);
