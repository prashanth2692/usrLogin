const MoneyControlComponent = {
  template: '#MCMessages',
  data: function () {
    return {
      totalAmount: null,
      odometerReading: null,
      messages: [],
      loadedPage: 1
    }
  },
  created: function () {
    var that = this

    // const messageBoardURL = new URL('https://mmb.moneycontrol.com/index.php')
    // // const MCMBCollection = 'MoneyControlMessages'

    // const messageBoardQueryParams = new URLSearchParams({
    //   q: 'topic/ajax_call',
    //   section: 'get_messages',
    //   is_topic_page: 1,
    //   offset: 0,
    //   lmid: null,
    //   isp: 0,
    //   gmt: 'tp_lm',
    //   tid: 1642,
    //   pgno: 1
    // })

    // messageBoardURL.search = messageBoardQueryParams

    // axios.get('/moneycontrol/messages_alt?pgno=1&lmid=&topicid=1642').then((resp) => {
    //   console.log(resp)
    //   that.messages = resp.data
    // }).catch(err => {
    //   console.log(err)
    // })

    this.getMessages(1)
  },
  methods: {
    getMoreMessages: function () {
      this.loadedPage++
      this.getMessages(this.loadedPage)
    },
    getMessages: function (pgno) {
      const that = this
      axios.get('/moneycontrol/messages_alt?pgno=' + pgno + '&lmid=&topicid=1642').then((resp) => {
        console.log(resp)
        that.messages = that.messages.concat(resp.data)
      }).catch(err => {
        console.log(err)
      })
    }
  }
}

export default MoneyControlComponent