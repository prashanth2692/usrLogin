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
    this.getDaiyValue().then(res => {
      let data = []
      for (let date in res.data) {
        data.push([date, res.data[date]])
      }

      let resData = res.data

      let sortedDates = Object.keys(res.data).sort()
      let filledData = []
      for (let i = 0; i < sortedDates.length; i++) {
        let currDate = sortedDates[i]
        let currValue = resData[currDate]

        filledData.push([currDate, currValue])

        if (i < sortedDates.length - 1) {
          let nextDate = getNextDate(currDate)
          while (nextDate < sortedDates[i + 1]) {
            filledData.push([nextDate, currValue])
            nextDate = getNextDate(nextDate)
          }
        }
      }

      data = filledData

      let schema = [{
        "name": "Date",
        "type": "date",
        "format": "%Y-%m-%d"
      }, {
        "name": "invested value",
        "type": "number"
      }
      ]

      const dataStore = new FusionCharts.DataStore();
      const dataSource = {
        "chart": {},
        "caption": {
          "text": "Sales Analysis"
        },
        "subcaption": {
          "text": "Grocery"
        },
        "yaxis": [
          {
            "plot": {
              "value": "invested value",
              'type': 'line',
              "connectnulldata": true
            },
            "title": "Sale Value"
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
    }
  },
  computed: {
  }
}

export default investmentTrendComponent