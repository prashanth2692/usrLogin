const holdingsComponent = {
  template: '#holdings',
  data: function () {
    return {
      showPastHoldings: false,
      holdings: null,
      holdingSymbols: [],
      cmpObj: {},
      compareOn: 'symbol',
      sortAscending: true,
      symbols: [],
      symbolsData: [],
      totalChange: 0,
      totalPercentChange: 0,
      showDynamic: true,
      toggleColumns: true,
      investedValue: 0, //total invesed amount
      currentValue: 0, //total value at market value
      investedValueDisp: 0, //total invesed amount for display
      currentValueDisp: 0 //total value at market value for display
    }
  },
  created: function () {
    let query = this.$route.query
    if (query && query.past) {
      this.showPastHoldings = true
    }
    this.setupData()
  },
  methods: {
    setupData: function () {
      var that = this
      let url = ''
      if (this.showPastHoldings) {
        url = 'holdings/pastHoldings'
      } else {
        url = this.showDynamic ? '/holdings/dynamic-holdings_v2' : '/holdings/holdings'
      }
      if (window.stockHoldings && !this.showPastHoldings) {
        this.setUpHoldigsData(window.stockHoldings)
      } else {
        axios.get(url)
          .then((res) => {
            if (res && res.data && res.data.length > 0) {
              res.data.forEach(h => {
                h.investedValue = (h.allocated_quantity * Number(h.avgPrice))
                h.investedValueDisp = h.investedValue.toLocaleString('en-IN', {
                  maximumFractionDigits: 2,
                  // style: 'currency',
                  // currency: 'INR'
                })
                that.investedValue += h.investedValue
              })
              that.investedValueDisp = that.investedValue.toLocaleString('en-IN', {
                maximumFractionDigits: 2,
              })
            }
            if (!this.showPastHoldings) {
              window.stockHoldings = res.data
            }
            that.setUpHoldigsData(res.data)
          })
          .catch(function (err) {
            console.log(err)
          })
      }
    },
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

    // Get live data from MoneyControl API
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
        that.currentValue = 0
        let yesterdaysValue = 0
        let todaysValue = 0

        that.holdings.forEach(h => {
          let symbolData = that.cmpObj[h.symbol]


          if (symbolData) {
            let l52 = Number(symbolData['52L'])
            let h52 = Number(symbolData['52H'])

            h.low52wDiff = (symbolData.pricechange - l52) * 100 / l52
            h.high52wDiff = (symbolData.pricechange - h52) * 100 / h52
            h.currentValue = h.allocated_quantity * Number(symbolData.pricecurrent)
            h.currentValueDisp = h.currentValue.toLocaleString('en-IN', {
              maximumFractionDigits: 2,
            })
            that.currentValue += h.currentValue

            that.totalChange += symbolData.pricechange * h.allocated_quantity
            h.percentChange = (symbolData.pricechange * 100) / (symbolData.pricecurrent - symbolData.pricechange)

            //convert string to number
            h.avgPrice = Number(h.avgPrice)
            h.overallChange = Number(((symbolData.pricecurrent - h.avgPrice) * h.allocated_quantity).toFixed(2))
            h.overallPercentChange = (symbolData.pricecurrent - h.avgPrice) * 100 / h.avgPrice

            yesterdaysValue += (symbolData.pricecurrent - symbolData.pricechange) * h.allocated_quantity
            todaysValue += (symbolData.pricecurrent) * h.allocated_quantity
          }

        })

        that.currentValueDisp = that.currentValue.toLocaleString('en-IN', {
          maximumFractionDigits: 2,
        })

        that.totalPercentChange = ((todaysValue - yesterdaysValue) * 100 / yesterdaysValue).toFixed(2)
      })
    },
    openChart: function (symbol) {
      this.$router.push({ path: '/charts', query: { symbol } })
    },
  },
  computed: {
    overallChange: function () {
      let retval = this.currentValue - this.investedValue
      if (retval) {
        return retval.toLocaleString('en-IN', {
          maximumFractionDigits: 2,
        })
      } else {
        return 0
      }
    },
    overallPercentchange: function () {
      let retval = (this.currentValue - this.investedValue) * 100 / this.investedValue
      if (retval) {
        return retval.toFixed(2)
      } else {
        return 0
      }
    }
  }
}

export default holdingsComponent