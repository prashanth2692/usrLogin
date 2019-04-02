const investmentTrendComponent = {
  template: '#investmentTrend',
  data: function () {
    return {
      test: 'test'
    }
  },
  created: function () {
    function fetchCheckStatus(response) {
      if (response.status >= 200 && response.status < 300) {
        return response;
      }
      const error = new Error(response.statusText);
      error.response = response;
      throw error;
    }

    function loadData(url) {
      const option = {
        method: 'GET',
        headers: new Headers(),
        mode: 'cors',
        cache: 'default',
      };

      return fetch(url, option)
        .then(fetchCheckStatus)
        .then(resp => {
          const contentType = resp.headers.get('Content-Type');
          if (contentType && contentType.indexOf('application/json') !== -1) {
            return resp.json();
          }
          return resp.text();
        })
        .then(data => data)
        .catch(() => {
          console.log('Something went wrong! Please check data/schema files');
        });
    }

    Promise.all([
      loadData('https://s3.eu-central-1.amazonaws.com/fusion.store/ft/data/plotting-multiple-series-on-time-axis-data.json'),
      loadData('https://s3.eu-central-1.amazonaws.com/fusion.store/ft/schema/plotting-multiple-series-on-time-axis-schema.json')
    ]).then(res => {
      const [data, schema] = res;

      const dataStore = new FusionCharts.DataStore();
      const dataSource = {
        "chart": {},
        "caption": {
          "text": "Sales Analysis"
        },
        "subcaption": {
          "text": "Grocery & Footwear"
        },
        "series": "Type",
        "yaxis": [
          {
            "plot": "Sales Value",
            "title": "Sale Value",
            "format": {
              "prefix": "$"
            }
          }
        ]
      };
      dataSource.data = dataStore.createDataTable(data, schema);

      new FusionCharts({
        type: "timeseries",
        renderAt: "investmentTrendChart",
        width: "100%",
        height: "500",
        dataSource
      }).render();

    });
  },
  methods: {
  },
  computed: {
  }
}

export default investmentTrendComponent