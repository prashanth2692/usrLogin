//@ts-check
import MoneyControlComponent from './MoneyControlComponent.js'
import MoneyControlComponent_alt from './MoneyControlComponent_alt.js'
import holdings from './holdingsComponent.js'
import charts from './chartComponent.js'
import investmentTrendComponent from './components/investmnetTrendComponent.js';
import uploadConponent from './components/uploadComponent.js'
import SymbolSearchComponent from './components/SymbolSearchComponent.js'
import universitiesListConponent from './components/universitiesListConponent.js'
import universityNotes from './components/universityNotesComponent.js'

// Add a response interceptor
axios.interceptors.response.use(function (response) {
  // Do something with response data
  console.log(response.status)
  return response;
}, function (error) {
  // Do something with response error

  // This is obsolete as redirect is handled on iniital browser call
  console.log(error.response.status)
  if (error.response.status == 401 || error.response.status == 403) {
    window.location.href = error.response.data ? error.response.data.location : '/login.html'
  }
  return error;
});

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
  { path: '/investmentTrend', component: investmentTrendComponent },
  { path: '/upload', component: uploadConponent },
  { path: '/symbol', component: SymbolSearchComponent },
  { path: '/universities', component: universitiesListConponent },
  { path: '/universityNotes', component: universityNotes }
]

const router = new VueRouter({
  routes, // short for `routes: routes`
  // https://router.vuejs.org/guide/advanced/scroll-behavior.html
  scrollBehavior(to, from, savedPosition) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (savedPosition) {
          resolve(savedPosition)
        } else {
          resolve({ x: 0, y: 0 })
        }
      }, 1500);// timeout hack to wait will data load, may not work always
    })
  }
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
        // {
        //   name: 'Fuel Refill',
        //   link: '/fuelRefill'
        // },
        // {
        //   name: 'Messages',
        //   link: '/messages_depricated'
        // },
        // Hiding direct messages link
        // {
        //   name: 'Direct messages',
        //   link: '/messages'
        // },
        {
          name: 'Holdings',
          link: '/holdings'
        },
        // {
        //   name: 'charts',
        //   link: '/charts'
        // }, 
        {
          name: 'investment trend',
          link: '/investmentTrend'
        }, {
          name: 'Upload',
          link: '/upload'
        }, {
          name: 'Symbol',
          link: '/symbol'
        }, {
          name: 'Universities',
          link: '/universities'
        }
      ]
    }
  }
})

const app = new Vue({
  router
}).$mount('#app')