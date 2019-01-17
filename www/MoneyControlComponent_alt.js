const MoneyControlComponent = {
  template: '#MCMessages',
  data: function () {
    return {
      totalAmount: null,
      odometerReading: null,
      messages: [],
      loadedPage: 1,
      topicId: 1642
    }
  },
  created: function () {
    let query = this.$route.query
    // console.log(query)
    if (query && query.topicid) {
      this.topicId = query.topicid
    }
    this.getMessages(1)
  },
  methods: {
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
    }
  }
}

export default MoneyControlComponent