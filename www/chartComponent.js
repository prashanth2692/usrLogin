// import FusionCharts from 'fusioncharts/core';
// import TimeSeries from 'fusioncharts/viz/timeseries';
// import DataStore from 'fusioncharts/datastore';

// import data from './data';
// import schema from './schema';

const chartComponent = {
  template: '#chart',
  data: function () {
    return {
      holdings: null,
      transactions: null,
      symbol: 'BPL'
    }
  },
  created: function () {
    let that = this

    let query = this.$route.query
    if (query && query.symbol) {
      this.symbol = query.symbol
    }

    //candle stick chart from historical data
    axios.get(`/charts/${this.symbol}`)
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

        let chartConfig = {
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
              text: that.symbol
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
              // referenceLine: [{
              //   label: 'Controlled Temperature',
              //   value: '10',
              //   style: {
              //     fill: '#142FC8'
              //   }
              // }],
            }],
          }
        }

        // fusionChart.render('chartcontainer');
        let fusionChart = new FusionCharts(chartConfig)
        fusionChart.render('chartcontainer');
        chartConfig.dataSource.yAxis[0].referenceLine = []
        chartConfig.dataSource.dataMarker = []
        // [{
        //   seriesName: "Interest Rate",
        //   time: "Mar-1980",
        //   identifier: "H",
        //   timeFormat: "%b-%Y",
        //   tooltext: "As a part of credit control program, under the leadership of Paul Volcker, the Fed tightened the money supply, allowing the federal fund rates to approach 20 percent."
        // }]
        let dataMarkers = chartConfig.dataSource.dataMarker
        let refLineObj = chartConfig.dataSource.yAxis[0].referenceLine
        // [{
        //   label: 'Controlled Temperature',
        //   value: '10',
        //   style: {
        //     fill: '#142FC8'
        //   }
        // }]



        //get transactions
        axios.get(`/portfolio/transactionsBySymbol?symbol=${that.symbol}&top=5`).then(res => {
          that.transactions = res.data
          that.transactions.forEach(tx => {
            // tx.date_edited = tx.date.slice(0, 10)
            refLineObj.push({
              label: tx.date,
              value: tx.price,
              style: {
                fill: tx.type == 'buy' ? '#142FC8' : 'red'
              }
            })

            dataMarkers.push({
              time: tx.date.slice(0, 10),
              identifier: tx.type == 'buy' ? 'B' : 'S',
              seriesName: 'Value',
              timeFormat: 'YYYY-MM-DD'
            })
          })

          fusionChart = new FusionCharts(chartConfig)
          fusionChart.render('chartcontainer');
        }).catch(err => {
          console.log(err)
        })


      })
      .catch(function (err) {
        console.log(err)
      })

    // line chart for days data
    axios.get(`/charts/day/${this.symbol}`)
      .then((resp) => {
        var data = resp.data
        var schema = [{
          "name": "Time",
          "type": "date",
          "format": "%H:%M:%S" //timeformat: 13:02:01 13 hours 2 min 1 sec
        }, {
          "name": "Price",
          "type": "number"
        }, {
          name: 'Volume',
          type: 'number'
        }];

        var dataStore = new FusionCharts.DataStore();

        new FusionCharts({
          type: 'timeseries',
          renderAt: 'day-chart-container',
          width: '100%',
          height: '500',
          dataSource: {
            caption: {
              text: that.symbol
            },
            subcaption: {
              text: (new Date()).toISOString().slice(0, 10)
            },
            yAxis: [{
              plot: [{
                value: 'Price',
                type: 'line'
              }],
              title: 'Price'
            }, {
              plot: [{
                value: 'Volume',
                type: 'column'
              }],
              title: 'Volume'
            }],
            data: dataStore.createDataTable(data, schema)
          }
        }).render();
      })

    // });


  },
  methods: {}
}

export default chartComponent