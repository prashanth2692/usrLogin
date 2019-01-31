// import FusionCharts from 'fusioncharts/core';
// import TimeSeries from 'fusioncharts/viz/timeseries';
// import DataStore from 'fusioncharts/datastore';

// import data from './data';
// import schema from './schema';




const chartComponent = {
  template: '#chart',
  data: function () {
    return {
      holdings: null
    }
  },
  created: function () {
    var that = this
    axios.get('/charts/bpl')
      .then((res) => {
        // FusionCharts.addDep(TimeSeries);
        let schema = [{
          "name": "Date",
          "type": "date",
          "format": "%Y-%m-%d"
        }, {
          "name": "Open",
          "type": "number"
        }, {
          "name": "High",
          "type": "number"
        }, {
          "name": "Low",
          "type": "number"
        }, {
          "name": "Close",
          "type": "number"
        }, {
          "name": "Volume",
          "type": "number"
        }]
        let fusionDataStore = new FusionCharts.DataStore();
        let dataStore = fusionDataStore.createDataTable(res.data, schema);

        //attempt 1

        new FusionCharts({
          type: 'timeseries',
          renderAt: 'container',
          width: '95%',
          height: 450,
          // theme: 'fusion',
          dataSource: {
            data: dataStore,

            // trendlines: [{
            //   lines: [{
            //     "startValue": "80",
            //     "startvalue": "80",
            //     // "endValue": "80",
            //     "color": 'red', //"#5D62B5",
            //     "displayValue": "purchase",
            //     "showOnTop": "0"
            //   }]
            // }]
            "trendlines": [{
              "lines": [{
                "startvalue": "100",
                "color": "#1aaf5d",
                "valueOnRight": "1",
                "displayvalue": "Monthly Target"
              }]
            }],
            "vtrendlines": [
              {
                "line": [
                  {
                    "startvalue": "28",
                    "color": "#5D62B5",
                    "displayvalue": "$0.63<br>Dividend",
                    "showontop": "0"
                  },
                  {
                    "startvalue": "91",
                    "color": "#5D62B5",
                    "displayvalue": "$0.73<br>Dividend",
                    "showontop": "0"
                  }
                ]
              }
            ],
            chart: {
              // showVolumeChart: 0
              theme: 'fusion',
              //Attributes to configure Trend Values
              "trendValueFont": "Arial",
              "trendValueFontSize": "12",
              "trendValueFontBold": "1",
              "trendValueFontItalic": "1",
              "trendValueAlpha": "80"
            },
            caption: {
              text: 'Apple Inc. Stock Price'
            },
            yAxis: [{
              plot: {
                open: 'Open',
                high: 'High',
                low: 'Low',
                close: 'Close',
                type: 'candlestick'
              },
              title: 'Value',
              referenceLine: [{
                label: 'Controlled Temperature',
                value: '10',
                style: {
                  fill: '#142FC8'
                }
              }],
            }],
          }
        }).render('chartcontainer');
      })
      .catch(function (err) {
        console.log(err)
      })
  },
  methods: {}
}

export default chartComponent