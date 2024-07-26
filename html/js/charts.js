// charts.js
//
// Managing charts - multiple charts, save, load, view raw, etc.
//
////////////////////////////////////

const SAVEKEYS = ENUM("SAVEKEYS", {
  charts: 'chartkey',
  selected: 'chartselected',
});

let CHART;
let CHARTS = {};

function newChart(name) {
  const ret = {
    blocks: {},
    name: name,
    uuid: makeUUID(),
  };
  CHARTS[ret.uuid] = ret;
  return ret;
}

function clearChart(chart) {
  CHART = deepCopy(EMPTY_CHART);
  saveChart();
}

function selectChart(uuid) {
  CHART = CHARTS[uuid];
  setSaved(SAVEKEYS.selected, uuid);
}

function saveChart() {
  setSaved(SAVEKEYS.charts, CHARTS);
}

function loadChart() {
  EL.flowchart.innerHTML = '';
  for (const blockjs of Object.values(CHART.blocks)) {
    loadBlock(blockjs);
  }
}

// Load the charts on init. If we have a selected one saved,
// use that one. If we don't match a selected uuid, then
// use the first uuid we find. If we don't have any, then
// start afresh.
function startCharts() {
  CHARTS = getSaved(SAVEKEYS.charts, {});
  let chartUUID = getSaved(SAVEKEYS.selected, 'default');

  if (chartUUID in CHARTS) {
    CHART = CHARTS[chartUUID];
    return;
  }

  const chartUUIDs = Object.keys(CHARTS);

  if (chartUUIDs.length > 0 && chartUUIDs[0] in CHARTS) {
    chartUUID = chartUUIDs[0];
    CHART = CHARTS[chartUUID];
    setSaved(SAVEKEYS.selected, chartUUID);
    return;
  }

  const myChart = newChart('New Chart');
  CHARTS[newChart.uuid] = myChart;
  CHART = myChart;
  setSaved(SAVEKEYS.selected, myChart.uuid);
  saveChart();
  return;
}

addInitializer(() => {
  startCharts();
  loadChart();
}, 100);
