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
          theme: 'fusion',
          dataSource: {
            data: dataStore,
            chart: {
              // showVolumeChart: 0
              theme: 'fusion'
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
              title: 'Value'
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