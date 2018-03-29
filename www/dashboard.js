const fuelRefillComponent = {
  template: '#fuelRefill',
  data: function () {
    return {
      totalAmount: null,
      odometerReading: null
    }
  },
  methods: {
    saveReading: function () {
      const date = new Date()
      axios.post('/fuelRefilling', { totalAmount: this.totalAmount, odometerReading: odometerReading, dateTIme: date.toString() }).then(function (resp) {
        console.log(resp)
      }).catch(function (err) {
        console.log(err)
      })
    }
  }
}

const dashboardComponent = {
  // el: '#app',
  template: '#dashboard',
  data: function () {
    return {
      newItem: '',
      items: []
    }
  },
  methods: {
    addItem: function (item) {
      var vm = this
      axios.post('/addItem', { item: item })
        .then(function (response) {
          console.log(response)
          vm.items.push(item)
        })
        .catch(function (err) {
          console.log(err)
        })
      return false
    }
  },
  created: function () {
    var that = this
    axios.get('/getItems')
      .then((res) => {
        that.items = res.data.response.items
        console.log(res)
      })
      .catch(function (err) {
        console.log(err)
      })
  }
}

Vue.component('dashboard', dashboardComponent)

const routes = [
  { path: '/', component: dashboardComponent },
  { path: '/dashboard', component: dashboardComponent },
  { path: '/fuelRefill', component: fuelRefillComponent }
]

const router = new VueRouter({
  routes // short for `routes: routes`
})

const app = new Vue({
  router
}).$mount('#app')