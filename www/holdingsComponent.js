const holdingsComponent = {
  template: '#holdings',
  data: function () {
    return {
      holdings: null
    }
  },
  created: function () {
    var that = this
    axios.get('/holdings/holdings')
      .then((res) => {
        that.holdings = res.data
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