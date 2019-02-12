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
      totalPercentChange: 0,
      showDynamic: true
    }
  },
  created: function () {
    var that = this
    let url = this.showDynamic ? '/holdings/dynamic-holdings_v2' : '/holdings/holdings'
    if (window.stockHoldings) {
      this.setUpHoldigsData(window.stockHoldings)
    } else {
      axios.get(url)
        .then((res) => {
          window.stockHoldings = res.data
          that.setUpHoldigsData(res.data)
        })
        .catch(function (err) {
          console.log(err)
        })
    }
  },
  methods: {
    setUpHoldigsData: function (holdings) {
      this.holdings = holdings
      let holdingSymbols = []
      if (this.holdings && this.holdings.length > 0) {
        holdingSymbols = this.holdings.map(holding => holding.symbol);
      }
      this.symbols = holdingSymbols.join(',')
      this.getSymbolsData()
    },
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

            //convert string to number
            h.avgPrice = Number(h.avgPrice)
            h.overallPercentChange = (symbolData.pricecurrent - h.avgPrice) * 100 / h.avgPrice

            yesterdaysValue += (symbolData.pricecurrent - symbolData.pricechange) * h.allocated_quantity
            todaysValue += (symbolData.pricecurrent) * h.allocated_quantity
          }

        })

        that.totalPercentChange = ((todaysValue - yesterdaysValue) * 100 / yesterdaysValue).toFixed(2)
      })
    },
    openChart: function (symbol) {
      this.$router.push({ path: '/charts', query: { symbol } })
    },
  }
}

export default holdingsComponent