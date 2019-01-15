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
    // working example
    // https://www.fusioncharts.com/fusiontime/examples/interactive-candlestick-chart
    // Promise.all([
    //   loadData('https://s3.eu-central-1.amazonaws.com/fusion.store/ft/data/candlestick-chart-data.json'),
    //   loadData('https://s3.eu-central-1.amazonaws.com/fusion.store/ft/schema/candlestick-chart-schema.json')
    // ]).then(res => {

    //   var data = res[0];
    //   var schema = res[1];

    //   var dataStore = new FusionCharts.DataStore();


    //   new FusionCharts({
    //     type: 'timeseries',
    //     renderAt: 'chart-container',
    //     width: '100%',
    //     height: '500',
    //     dataSource: {
    //       caption: {
    //         text: 'Apple Inc. Stock Price'
    //       },
    //       yAxis: [{
    //         plot: {
    //           open: 'Open',
    //           high: 'High',
    //           low: 'Low',
    //           close: 'Close',
    //           type: 'candlestick'
    //         },
    //         title: 'Value'
    //       }],
    //       data: dataStore.createDataTable(data, schema)
    //     }
    //   }).render();
    // });

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
        let fusionDataStore = new DataStore();
        let dataStore = fusionDataStore.createDataTable(res.data, schema);

        //attempt 1

        new FusionCharts({
          type: 'timeseries',
          renderAt: 'container',
          width: '95%',
          height: 450,
          dataSource: {
            data: dataStore,
            chart: {
              showVolumeChart: 0
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
  methods: {
    loadData: function (url) {
      const option = {
        method: 'GET',
        headers: new Headers(),
        mode: 'cors',
        cache: 'default',
      };

      return fetch(url, option)
        .then(this.fetchCheckStatus)
        .then(resp => {
          const contentType = resp.headers.get('Content-Type');
          if (contentType && contentType.indexOf('application/json') !== -1) {
            return resp.json();
          }
          return resp.text();
        })
        .then(data => data)
        .catch(() => {
          console.log('Something went wrong! Please check data/schema files');
        });
    },
    fetchCheckStatus: function (response) {
      if (response.status >= 200 && response.status < 300) {
        return response;
      }
      const error = new Error(response.statusText);
      error.response = response;
      throw error;
    }
  }
}

export default chartComponent