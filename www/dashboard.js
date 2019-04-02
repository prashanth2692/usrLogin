import MoneyControlComponent from './MoneyControlComponent.js'
import MoneyControlComponent_alt from './MoneyControlComponent_alt.js'
import holdings from './holdingsComponent.js'
import charts from './chartComponent.js'
import investmentTrendComponent from './components/investmnetTrendComponent.js';


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
          vm.newItem = ''
          vm.items.push(response.data)
        })
        .catch(function (err) {
          console.log(err)
        })
      return false
    },
    removeItem: function (id) {
      let vm = this
      axios.delete('/deleteItem/' + id).then(resp => {
        vm.getItems()
      }).catch(err => {
        console.log(err)
      })
    },
    getItems: function () {
      var that = this
      axios.get('/getItems')
        .then((res) => {
          that.items = res.data
          console.log(res)
        })
        .catch(function (err) {
          console.log(err)
        })
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
    this.getItems()
  }
}

Vue.component('dashboard', dashboardComponent)

const routes = [
  { path: '/', component: dashboardComponent },
  { path: '/dashboard', component: dashboardComponent },
  { path: '/fuelRefill', component: fuelRefillComponent },
  { path: '/messages_depricated', component: MoneyControlComponent },
  { path: '/messages', component: MoneyControlComponent_alt },
  { path: '/holdings', component: holdings },
  { path: '/charts', component: charts },
  { path: '/investmentTrend', component: investmentTrendComponent }
]

const router = new VueRouter({
  routes // short for `routes: routes`
})

Vue.component('app-header', {
  template: '#appHeader', //'<div id="app-header">{{header}}</div>',
  data: function () {
    return {
      header: 'Header',
      links: [
        {
          name: 'Dashboard',
          link: '/dashboard'
        },
        {
          name: 'Fuel Refill',
          link: '/fuelRefill'
        },
        // {
        //   name: 'Messages',
        //   link: '/messages_depricated'
        // },
        {
          name: 'Direct messages',
          link: '/messages'
        },
        {
          name: 'Holdings',
          link: '/holdings'
        },
        {
          name: 'charts',
          link: '/charts'
        },{
          name: 'investment trend',
          link: '/investmentTrend'
        }
      ]
    }
  }
})

const app = new Vue({
  router
}).$mount('#app')