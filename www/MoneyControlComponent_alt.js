const MoneyControlComponent = {
  template: '#MCMessages',
  data: function () {
    return {
      totalAmount: null,
      odometerReading: null,
      messages: [],
      loadedPage: 1,
      topicId: 1642,
      cmp: 0,
      compid: 'BPL',
      priceChange: 0,
      symbol: null,
      transactions: null,
      userMarkedSpan: {}
    }
  },
  created: function () {
    let query = this.$route.query
    // console.log(query)
    if (query && query.topicid) {
      this.topicId = query.topicid
      this.compid = query.compid
      this.symbol = query.symbol
    }
    this.getMessages(1)
    this.getCMP()
  },
  methods: {
    getTransactions: function () {
      let that = this
      if (!this.transactions) {
        axios.get(`/portfolio/transactionsBySymbol?symbol=${this.symbol}`).then(res => {
          that.transactions = res.data
          that.transactions.forEach(tx => {
            tx.date_edited = tx.date.slice(0, 10)
          })
        }).catch(err => {
          console.log(err)
        })
      }
    },
    getMoreMessages: function () {
      this.loadedPage++
      this.getMessages(this.loadedPage)
    },
    getMessages: function (pgno) {
      const that = this
      axios.get(`/moneycontrol/messages_alt?pgno=${pgno}&lmid=&topicid=${this.topicId}`).then((resp) => {
        that.messages = that.messages.concat(resp.data)
      }).catch(err => {
        console.log(err)
      })
    },
    refreshCMP: function () {
      this.getCMP()
    },
    getCMP: function () {
      let that = this
      axios.get(`https://priceapi-aws.moneycontrol.com/pricefeed/nse/equitycash/${this.compid}`).then(res => {
        let scripData = res.data.data
        that.cmp = scripData.pricecurrent
        that.priceChange = Number(scripData.pricechange).toFixed(2)
      })
    },
    openChart: function () {
      this.$router.push({ path: '/charts', query: { symbol: this.symbol } })
    },
    repostUser: function (msg) {
      let that = this
      axios.post('moneycontrol/reportUser', { nick_name: msg.nick_name, user_id: msg.user_id }).then(resp => {
        that.userMarkedSpan[msg.nick_name] = true
        console.log(success)
      }).catch(err => {
        console.log(err)
      })
    }
  }
}

export default MoneyControlComponent