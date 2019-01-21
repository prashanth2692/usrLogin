const holdingsComponent = {
  template: '#holdings',
  data: function () {
    return {
      holdings: null,
      holdingSymbols: [],
      cmpObj: {},
      compareOn: 'symbol',
      sortAscending: true,
      symbols: [],
      symbolsData: [],
      totalChange: 0,
      totalPercentChange: 0
    }
  },
  created: function () {
    var that = this
    axios.get('/holdings/holdings')
      .then((res) => {
        that.holdings = res.data

        let holdingSymbols = []
        if (that.holdings && that.holdings.length > 0) {
          holdingSymbols = that.holdings.map(holding => holding.symbol);
        }
        that.symbols = holdingSymbols.join(',')
        that.getSymbolsData()
      })
      .catch(function (err) {
        console.log(err)
      })
  },
  methods: {
    // about to be depricated
    getTopicId: function (symbol) {
      let that = this
      axios.get('/moneycontrol/getTopicIDForSymbol?symbol=' + symbol).then((response) => {
        if (response.data && response.data.topicid) {
          this.$router.push({ path: '/messages', query: response.data })

        }
      })
    },
    comparator: function (a, b) {
      if (a[this.compareOn] < b[this.compareOn])
        return this.sortAscending ? -1 : 1;
      if (a[this.compareOn] > b[this.compareOn])
        return this.sortAscending ? 1 : -1;
      return 0;
    },

    // sort the data
    sortData: function (compareOn) {
      this.sortAscending = !this.sortAscending
      this.compareOn = compareOn

      this.holdings.sort(this.comparator)
    },

    // Refresh the live data
    refresh: function () {
      this.getMCCMPData(this.symbolsData)
    },

    // Get symber data for use of MoneyControl API query
    getSymbolsData: function () {
      let that = this
      axios.get(`/moneycontrol/getTopicIDForSymbol?symbols=${this.symbols}`).then((res) => {
        let data = res.data
        if (data && data.length > 0) {
          that.symbolsData = data
          this.getMCCMPData(data)
        }
      })
    },

    // Get live data from MoneyCOntrol API
    getMCCMPData: function (data) {
      let promises = []
      let that = this

      //get live data from Moneycontrol api
      data.forEach(d => {
        let promise = axios.get(`https://priceapi-aws.moneycontrol.com/pricefeed/nse/equitycash/${d.compid_imp}`).then(res => {
          // for view update, using $set 
          that.$set(that.cmpObj, d.symbol, res.data.data)
        })
        promises.push(promise)
      });


      // update the data with this.holdings object for display
      axios.all(promises).then(resps => {
        that.totalChange = 0
        that.totalPercentChange = 0
        let yesterdaysValue = 0
        let todaysValue = 0

        that.holdings.forEach(h => {
          let symbolData = that.cmpObj[h.symbol]


          if (symbolData) {
            let l52 = Number(symbolData['52L'])
            let h52 = Number(symbolData['52H'])

            h.low52wDiff = (symbolData.pricechange - l52) * 100 / l52
            h.high52wDiff = (symbolData.pricechange - h52) * 100 / h52

            that.totalChange += symbolData.pricechange * h.allocated_quantity
            h.percentChange = (symbolData.pricechange * 100) / (symbolData.pricecurrent - symbolData.pricechange)

            yesterdaysValue += (symbolData.pricecurrent - symbolData.pricechange) * h.allocated_quantity
            todaysValue += (symbolData.pricecurrent) * h.allocated_quantity
          }

        })

        that.totalPercentChange = ((todaysValue - yesterdaysValue) * 100 / yesterdaysValue).toFixed(2)
      })
    }
  }
}

export default holdingsComponent