const investmentTrendComponent = {
  template: '#investmentTrend',
  data: function () {
    return {
      test: 'test'
    }
  },
  created: function () {
    function getNextDate(currDate) {
      return moment(currDate).add(1, 'd').format('YYYY-MM-DD')
    }

    Promise.all([this.getDailyMarketValue(),
    this.getDaiyValue()]).then(res => {
      let [marketValueResponse, investedValueResponse] = res
      let investedValueData = investedValueResponse.data
      let marketValueData = marketValueResponse.data

      let data = []
      // for (let date in investedValueData) {
      //   data.push([date, investedValueData[date]])
      // }

      for (let date in marketValueData) {
        data.push([date, 'market', marketValueData[date]])
      }

      // let resData = investedValueData

      let sortedDates = Object.keys(investedValueData).sort()
      // let filledData = []
      for (let i = 0; i < sortedDates.length; i++) {
        let currDate = sortedDates[i]
        let currValue = investedValueData[currDate]

        data.push([currDate, 'invested', currValue])

        if (i < sortedDates.length - 1) {
          let nextDate = getNextDate(currDate)
          while (nextDate < sortedDates[i + 1]) {
            data.push([nextDate, 'invested', currValue])
            nextDate = getNextDate(nextDate)
          }
        }
      }

      // fill invested value data till current date
      let lastTradeDay = sortedDates[sortedDates.length - 1]
      let currDate = getNextDate(lastTradeDay)
      let today = moment().format('YYYY-MM-DD')
      while (currDate < today) {
        data.push([currDate, 'invested', investedValueData[lastTradeDay]])
        currDate = getNextDate(currDate)
      }

      // data = filledData

      let schema = [{
        "name": "Date",
        "type": "date",
        "format": "%Y-%m-%d"
      }, {
        "name": "type",
        "type": "string",
      }, {
        "name": "value",
        "type": "number"
      }
      ]

      const dataStore = new FusionCharts.DataStore();
      const dataSource = {
        "chart": {},
        "caption": {
          "text": "Portfolio value"
        },
        "subcaption": {
          "text": "Market Vs Invested"
        },
        series: "type",
        "yaxis": [
          {
            "plot": {
              "value": "value",
              'type': 'line',
              "connectnulldata": true
            },
            "title": "Invested Vs Market Value"
          }
        ]
      };
      dataSource.data = dataStore.createDataTable(data, schema);

      new FusionCharts({
        type: "timeseries",
        renderAt: "investmentTrendChart",
        width: "100%",
        height: "500",
        dataSource
      }).render();
    })
  },
  methods: {
    getDaiyValue: function () {
      return axios.get('/investment/dailyValue')
    },
    getDailyMarketValue: function () {
      return axios.get('/investment/dailyMarketValue')
    }
  },
  computed: {
  }
}

export default investmentTrendComponent