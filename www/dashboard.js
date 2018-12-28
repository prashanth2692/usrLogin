import MoneyControlComponent from './MoneyControlComponent.js' 

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
      var form_data = new FormData()
      form_data.append('totalAmount', this.totalAmount)
      form_data.append('odometerReading', this.odometerReading)
      form_data.append('file', this.$refs.billReceipt.files[0])
      form_data.append('dateTime', (new Date()).toString())

      axios.post('/fuelRefilling', form_data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }).then(function (resp) {
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
    },
    uploadFile: function () {
      var file = document.getElementById('fileUpload').files[0]
      var form_data = new FormData()
      form_data.append('file', file)
      axios.post('/fileUpload', form_data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }).then(function (success) {
        console.log(success.data)
      }).catch(function (err) {
        console.log(err)
      })
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
  { path: '/fuelRefill', component: fuelRefillComponent },
  {path: '/messages', component: MoneyControlComponent}
]

const router = new VueRouter({
  routes // short for `routes: routes`
})

Vue.component('app-header', {
  template: '#appHeader', //'<div id="app-header">{{header}}</div>',
  data: function () {
    return {
      header: 'Header'
    }
  }
})

const app = new Vue({
  router
}).$mount('#app')