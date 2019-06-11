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
      userMarkedSpam: {},
      groupedTransactions: [], // grouped by orderID, a order can be executed through multiple trades, each trade has its own record (mostly applicable for zerodha)
      txGroupByDate: {}
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
        that.$set(that.userMarkedSpam, msg.nick_name, true)
        console.log(success)
      }).catch(err => {
        console.log(err)
      })
    }
  },
  watch: {
    transactions: function () {
      this.groupedTransactions = []
      if (this.transactions && this.transactions.length > 0) {
        let orderIdsMap = new Map() // Map retains the order of insertion so can be converted to array without loosing original ordering
        this.transactions.forEach(transaction => {
          if (orderIdsMap.has(transaction.orderId)) {
            let tx = orderIdsMap.get(transaction.orderId)
            tx.quantity += transaction.quantity
          } else {
            orderIdsMap.set(transaction.orderId, transaction)
          }
        })

        let outputOrderArray = [...orderIdsMap.values()]
        console.log(outputOrderArray)
        this.groupedTransactions = outputOrderArray
      }
    },
    groupedTransactions: function () {
      this.txGroupByDate = []
      let txGroupByDate = {}
      let groupedTransactions = this.groupedTransactions
      if (groupedTransactions && groupedTransactions.length > 0) {
        groupedTransactions.forEach(tx => {
          if (txGroupByDate[tx.trade_date]) {
            txGroupByDate[tx.trade_date].push(tx)
          } else {
            txGroupByDate[tx.trade_date] = [tx]
          }
        })

        let dates = Object.keys(txGroupByDate)
        dates = dates.sort((d1, d2) => d1 > d2)
        dates.forEach(d => {
          this.txGroupByDate.push({
            date: d,
            transactions: txGroupByDate[d]
          })
        })
      }
    }
  }
}

export default MoneyControlComponent