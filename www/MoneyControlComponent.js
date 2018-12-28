const MoneyControlComponent = {
  template: '#MCMessages',
  data: function () {
    return {
      totalAmount: null,
      odometerReading: null,
      messages: null
    }
  },
  created: function () {
    var that = this
    axios.get('/moneycontrol/messages')
      .then((res) => {
        that.messages = res.data
        console.log(res)
      })
      .catch(function (err) {
        console.log(err)
      })
  },
  methods: {
  }
}

export default MoneyControlComponent