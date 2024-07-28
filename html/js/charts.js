// charts.js
//
// Managing charts - multiple charts, save, load, view raw, etc.
//
////////////////////////////////////

const SAVEKEYS = ENUM("SAVEKEYS", {
  chart: 'chartkey',
  selected: 'chartselected',
});

const CHART_DEMO = {
  "blocks": {
    "44fe1accdc4384cfaf38581e265fc15d": {
      "uuid": "44fe1accdc4384cfaf38581e265fc15d",
      "effectName": "useImage",
      "params": {
        "imgPath": {
          "cname": "imagepath",
          "name": "imgPath",
          "value": "uploads/demo_sunset.png",
          "test": "hi"
        }
      },
      "outputs": [],
      "layout": {
        "pos": {
          "x": 75.88336181640625,
          "y": 50.33332824707031
        }
      },
      "name": "demo_sunset"
    },
    "407a7cb51f83516b08677c8a90d2ceaf": {
      "uuid": "407a7cb51f83516b08677c8a90d2ceaf",
      "effectName": "useImage",
      "params": {
        "imgPath": {
          "cname": "imagepath",
          "name": "imgPath",
          "value": "uploads/demo_landscape.png",
          "test": "hi"
        }
      },
      "outputs": [],
      "layout": {
        "pos": {
          "x": 74.88336181640625,
          "y": 243.34999084472656
        }
      },
      "name": "demo_landscape"
    },
    "9595fb063b2a869fcac392848a5f9881": {
      "uuid": "9595fb063b2a869fcac392848a5f9881",
      "effectName": "blend",
      "params": {
        "imageA": {
          "cname": "image",
          "type": "ANY",
          "required": true,
          "name": "imageA",
          "source": {
            "uuid": "44fe1accdc4384cfaf38581e265fc15d",
            "idx": "0",
            "path": "cached/6201521eba409c7bd862880fa9061952.0.png",
            "color": "purple"
          }
        },
        "imageB": {
          "cname": "image",
          "type": "ANY",
          "required": true,
          "name": "imageB",
          "source": {
            "uuid": "407a7cb51f83516b08677c8a90d2ceaf",
            "idx": "0",
            "path": "cached/fc049b697a1cd22183f76784d5d560a1.0.png",
            "color": "black"
          }
        },
        "weightA": {
          "cname": "percent",
          "min": 0,
          "max": 1,
          "value": 0.26,
          "name": "weightA"
        },
        "weightB": {
          "cname": "percent",
          "min": 0,
          "max": 1,
          "value": 0.82,
          "name": "weightB"
        },
        "gamma": {
          "min": 0,
          "max": 255,
          "cname": "int",
          "value": 0,
          "name": "gamma"
        }},
      "outputs": [],
      "layout": {
        "pos": {
          "x": 395.6000213623047,
          "y": 173.3333282470703
        }
      },
      "name": "blend"
    }
  },
  "name": "New Chart"
};

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
  cleanupSources(chart);
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
    RAWCHART = deepCopy(CHART_DEMO);
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
