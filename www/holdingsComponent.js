const holdingsComponent = {
  template: '#holdings',
  data: function () {
    return {
      holdings: null,
      holdingSymbols: [],
      cmpObj: {}
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
          console.log(res.data)
          let data = res.data
          if (data && data.length > 0) {
            data.forEach(d => {
              axios.get(`https://priceapi-aws.moneycontrol.com/pricefeed/nse/equitycash/${d.compid_imp}`).then(res => {
                // for view update, using $set 
                this.$set(that.cmpObj, d.symbol, res.data.data)
              })
            });
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
    }
  }
}

export default holdingsComponent