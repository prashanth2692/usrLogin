const holdingsComponent = {
  template: '#holdings',
  data: function () {
    return {
      holdings: null,
      holdingSymbols: [],
      cmpObj: {},
      compareOn: 'symbol',
      sortAscending: true
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
        let symbols = holdingSymbols.join(',')
        axios.get(`/moneycontrol/getTopicIDForSymbol?symbols=${symbols}`).then((res) => {
          let data = res.data
          if (data && data.length > 0) {
            let promises = []
            data.forEach(d => {
              let promise = axios.get(`https://priceapi-aws.moneycontrol.com/pricefeed/nse/equitycash/${d.compid_imp}`).then(res => {
                // for view update, using $set 
                this.$set(that.cmpObj, d.symbol, res.data.data)
              })
              promises.push(promise)
            });

            axios.all(promises).then(resps => {
              that.holdings.forEach(h => {
                if (that.cmpObj[h.symbol]) {
                  h.low52wDiff = that.cmpObj[h.symbol].pricechange - Number(that.cmpObj[h.symbol]['52L'])
                  h.high52wDiff = that.cmpObj[h.symbol].pricechange - Number(that.cmpObj[h.symbol]['52H'])
                }
              })
            })
          }
        })

      })
      .catch(function (err) {
        console.log(err)
      })
  },
  methods: {
    getTopicId: function (symbol) {
      let that = this
      axios.get('/moneycontrol/getTopicIDForSymbol?symbol=' + symbol).then((response) => {
        console.log(response.data)
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
    sortData: function (compareOn) {
      this.sortAscending = !this.sortAscending
      this.compareOn = compareOn

      this.holdings.sort(this.comparator)
    }
  }
}

export default holdingsComponent