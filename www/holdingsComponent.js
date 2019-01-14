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
  }
}

export default holdingsComponent