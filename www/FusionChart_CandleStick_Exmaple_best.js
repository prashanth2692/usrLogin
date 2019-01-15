function loadData(url) {
  const option = {
    method: 'GET',
    headers: new Headers(),
    mode: 'cors',
    cache: 'default',
  };

  return fetch(url, option)
    .then(this.fetchCheckStatus)
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


function fetchCheckStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  const error = new Error(response.statusText);
  error.response = response;
  throw error;
}

// https://www.fusioncharts.com/fusiontime/examples/interactive-candlestick-chart
Promise.all([
  loadData('https://s3.eu-central-1.amazonaws.com/fusion.store/ft/data/candlestick-chart-data.json'),
  loadData('https://s3.eu-central-1.amazonaws.com/fusion.store/ft/schema/candlestick-chart-schema.json')
]).then(res => {

  var data = res[0];
  var schema = res[1];

  var dataStore = new FusionCharts.DataStore();


  new FusionCharts({
    type: 'timeseries',
    renderAt: 'chart-container',
    width: '100%',
    height: '500',
    dataSource: {
      caption: {
        text: 'Apple Inc. Stock Price'
      },
      yAxis: [{
        plot: {
          open: 'Open',
          high: 'High',
          low: 'Low',
          close: 'Close',
          type: 'candlestick'
        },
        title: 'Value'
      }],
      data: dataStore.createDataTable(data, schema)
    }
  }).render();
});